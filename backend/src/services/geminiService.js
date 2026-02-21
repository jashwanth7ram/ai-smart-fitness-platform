/**
 * Gemini AI Service
 * Calorie/macro recommendations, food suggestions, motivation, plateau detection
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import AIRecommendation from '../models/AIRecommendation.js';
import HealthLog from '../models/HealthLog.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const buildContext = async (userId, days = 7) => {
  const start = new Date();
  start.setDate(start.getDate() - days);

  const [user, logs] = await Promise.all([
    User.findById(userId).select('profile fitnessGoal').lean(),
    HealthLog.find({ user: userId, date: { $gte: start } }).sort({ date: -1 }).limit(50).lean(),
  ]);

  return { user, logs };
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const CACHE_HOURS = 24;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
};

/** Ensure protein*4 + carbs*4 + fat*9 = calories. Adjust carbs to match. Exported for userController. */
export const normalizeMacrosToCalories = (calories, protein, carbs, fat) => {
  const cals = Math.max(1200, Math.round(calories));
  const p = Math.max(20, Math.round(protein));
  const f = Math.max(20, Math.round(fat));
  const remaining = cals - p * 4 - f * 9;
  const c = Math.max(50, Math.round(remaining / 4));
  return { calories: cals, protein: p, carbs: c, fat: f };
};

/** Mifflin-St Jeor BMR + activity. Goals: weight_loss -400, fat_loss -300, muscle_building +300, maintenance 0, general_fitness 0 */
export const calculateMacrosFromProfile = (user) => {
  const p = user?.profile || {};
  const weight = p.weightKg || 70;
  const height = p.heightCm || 170;
  const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
  const age = dob ? Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
  const gender = p.gender || 'male';
  const activity = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[p.activityLevel] || 1.55;
  let bmr = gender === 'female' ? 10 * weight + 6.25 * height - 5 * age - 161 : 10 * weight + 6.25 * height - 5 * age + 5;
  let tdee = Math.round(bmr * activity);
  const goal = user?.fitnessGoal || 'general_fitness';
  if (goal === 'weight_loss') tdee -= 400;
  else if (goal === 'fat_loss') tdee -= 300;
  else if (goal === 'muscle_building') tdee += 300;
  const protein = Math.round(weight * 2);
  const fat = Math.round((tdee * 0.25) / 9);
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);
  const out = normalizeMacrosToCalories(Math.max(1200, tdee), protein, carbs, fat);
  out.rationale = 'Calculated from your profile (AI quota may be exceeded—try again in a few minutes).';
  return out;
};

const callWithRetry = async (fn, maxRetries = 2) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.message?.includes('429');
      if (is429 && i < maxRetries) {
        await sleep(65000);
        logger.warn('Gemini 429 — retrying after 65s');
      } else throw err;
    }
  }
};

/**
 * Get calorie and macro recommendations based on user profile and goals
 */
export const getCalorieMacroRecommendation = async (userId) => {
  try {
    const { user, logs } = await buildContext(userId);

    const cacheCutoff = new Date();
    cacheCutoff.setHours(cacheCutoff.getHours() - CACHE_HOURS);
    const cached = await AIRecommendation.findOne({
      user: userId,
      type: 'calorie_macro',
      createdAt: { $gte: cacheCutoff },
    }).sort({ createdAt: -1 }).lean();
    if (cached?.content?.calories) {
      return {
        calories: cached.content.calories,
        protein: cached.content.protein,
        carbs: cached.content.carbs,
        fat: cached.content.fat,
        rationale: (cached.content.rationale || '') + ' (from cache)',
      };
    }
    const p = user?.profile || {};
    const age = p.dateOfBirth ? Math.floor((new Date() - new Date(p.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    const prompt = `You are a fitness nutrition expert. Use this data to calculate daily calorie and macro targets.

Profile: Age ${age || 'unknown'}, Height ${p.heightCm || 'unknown'}cm, Weight ${p.weightKg || 'unknown'}kg, Gender ${p.gender || 'unknown'}, Goal: ${user?.fitnessGoal || 'general_fitness'}, Activity: ${p.activityLevel || 'moderate'}

Rules: Protein=4 kcal/g, Carbs=4 kcal/g, Fat=9 kcal/g. Total calories MUST equal protein*4 + carbs*4 + fat*9.

Respond ONLY with valid JSON (no markdown):
{"calories": number, "protein": number, "carbs": number, "fat": number, "rationale": "brief explanation"}`;

    let parsed = await callWithRetry(async () => {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { calories: 2000, protein: 150, carbs: 250, fat: 65, rationale: 'Default' };
    });

    const norm = normalizeMacrosToCalories(parsed.calories, parsed.protein, parsed.carbs, parsed.fat);
    parsed = { ...norm, rationale: parsed.rationale || 'AI recommendation (macros normalized to match calories).' };

    await AIRecommendation.create({
      user: userId,
      type: 'calorie_macro',
      content: { ...parsed },
      context: { user, logs: logs.slice(0, 10) },
    });

    return parsed;
  } catch (error) {
    logger.error('Gemini calorie/macro error:', error);
    const { user } = await buildContext(userId);
    return calculateMacrosFromProfile(user);
  }
};

/**
 * Get food suggestions based on remaining macros and preferences
 */
export const getFoodSuggestions = async (userId) => {
  try {
    const { user, logs } = await buildContext(userId, 1);
    const prompt = `You are a dietitian. Suggest 5 healthy food options for the user based on their profile and today's intake. Focus on variety and nutrition.

User profile: ${JSON.stringify(user)}
Today's logs: ${JSON.stringify(logs.filter((l) => l.date?.toISOString?.().startsWith(new Date().toISOString().split('T')[0])))} 

Respond ONLY with valid JSON array of strings:
["food 1", "food 2", "food 3", "food 4", "food 5"]`;

    const suggestions = await callWithRetry(async () => {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : ['Grilled chicken', 'Greek yogurt', 'Brown rice', 'Broccoli', 'Almonds'];
    });

    await AIRecommendation.create({
      user: userId,
      type: 'food_suggestion',
      content: { suggestions },
      context: { logs: logs.slice(0, 5) },
    });

    return suggestions;
  } catch (error) {
    logger.error('Gemini food suggestion error:', error);
    const { user } = await buildContext(userId, 1);
    const region = user?.profile?.region;
    if (region === 'India') return ['Dal & rice', 'Paneer curry', 'Roti with sabzi', 'Curd', 'Mixed nuts'];
    return ['Grilled chicken', 'Greek yogurt', 'Brown rice', 'Broccoli', 'Almonds'];
  }
};

/**
 * Get motivational message
 */
export const getMotivationMessage = async (userId) => {
  try {
    const { user, logs } = await buildContext(userId);
    const prompt = `Write a short (1-2 sentences), uplifting fitness motivation message for someone with goal: ${user?.fitnessGoal}. Reference their recent activity if relevant. Be encouraging, not generic.

Recent activity summary: ${JSON.stringify(logs.slice(0, 5).map((l) => ({ type: l.type, date: l.date })))}

Respond with ONLY the message text, no quotes or JSON.`;

    const message = await callWithRetry(async () => {
      const model = getModel();
      const result = await model.generateContent(prompt);
      return result.response.text().trim() || 'Keep pushing—every rep counts!';
    });

    await AIRecommendation.create({
      user: userId,
      type: 'motivation',
      content: { message },
    });

    return message;
  } catch (error) {
    logger.error('Gemini motivation error:', error);
    return 'Stay consistent. Progress is progress!';
  }
};

/**
 * Plateau detection based on weight/performance trends
 */
export const detectPlateau = async (userId) => {
  try {
    const { user, logs } = await buildContext(userId, 21);
    const weightLogs = logs.filter((l) => l.type === 'weight' && l.weightKg).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (weightLogs.length < 7) {
      return { plateauDetected: false, message: 'Insufficient weight data for plateau analysis.' };
    }

    const prompt = `Analyze this weight trend for plateau. User goal: ${user?.fitnessGoal}. Consider 2+ weeks with minimal change as plateau.

Weight data (date, kg): ${JSON.stringify(weightLogs.map((l) => ({ date: l.date, weight: l.weightKg })))}

Respond ONLY with valid JSON:
{"plateauDetected": boolean, "message": "brief analysis", "suggestion": "one actionable tip"}`;

    const parsed = await callWithRetry(async () => {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { plateauDetected: false, message: 'Continue monitoring.', suggestion: '' };
    });

    await AIRecommendation.create({
      user: userId,
      type: 'plateau_alert',
      content: parsed,
      context: { weightLogs },
    });

    return parsed;
  } catch (error) {
    logger.error('Gemini plateau detection error:', error);
    return { plateauDetected: false, message: 'Analysis unavailable.', suggestion: '' };
  }
};

/**
 * Get personalized diet plan by region and macros. Optionally use customCalories.
 */
export const getDietPlanByRegion = async (userId, customCalories = null) => {
  try {
    const { user, logs } = await buildContext(userId);
    const region = user?.profile?.region || 'General';
    const profile = user?.profile || {};
    const fullUser = await User.findById(userId).select('customMacros').lean();
    const targetCal = customCalories ?? fullUser?.customMacros?.calories ?? calculateMacrosFromProfile(user).calories;

    const prompt = `You are a dietitian creating a personalized diet plan. The user is from ${region}.
Daily calorie target: ${targetCal} kcal (user-specified).

User profile: ${JSON.stringify(profile)}
Fitness goal: ${user?.fitnessGoal}
Recent logs: ${JSON.stringify(logs.slice(0, 10))}

Create a 1-day sample diet plan (breakfast, lunch, dinner, 2 snacks) with TOTAL calories = ${targetCal}:
1. Region-specific foods commonly available in ${region}
2. Calorie and macro breakdown per meal
3. Practical, affordable options

Respond ONLY with valid JSON in this exact structure (no markdown):
{
  "meals": [
    {"meal": "breakfast", "foods": ["item1", "item2"], "calories": number, "protein": number, "carbs": number, "fat": number},
    {"meal": "lunch", ...},
    {"meal": "dinner", ...},
    {"meal": "snack1", ...},
    {"meal": "snack2", ...}
  ],
  "totalCalories": ${targetCal},
  "rationale": "brief note on why these foods for ${region}"
}`;

    const parsed = await callWithRetry(async () => {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { meals: [], totalCalories: 0, rationale: 'Default plan' };
    });

    await AIRecommendation.create({
      user: userId,
      type: 'diet_plan',
      content: parsed,
      context: { user: profile, region },
    });

    return parsed;
  } catch (error) {
    logger.error('Gemini diet plan error:', error);
    const { user } = await buildContext(userId);
    const macros = calculateMacrosFromProfile(user);
    const region = user?.profile?.region || 'General';
    const defaultMeals = region === 'India'
      ? [
          { meal: 'breakfast', foods: ['Idli, sambar, chutney'], calories: 350, protein: 12, carbs: 55, fat: 6 },
          { meal: 'lunch', foods: ['Dal, rice, sabzi, roti'], calories: 550, protein: 18, carbs: 75, fat: 15 },
          { meal: 'dinner', foods: ['Chicken curry, rice, salad'], calories: 500, protein: 35, carbs: 45, fat: 18 },
          { meal: 'snack1', foods: ['Fruit, nuts'], calories: 200, protein: 5, carbs: 25, fat: 10 },
          { meal: 'snack2', foods: ['Curd or buttermilk'], calories: 150, protein: 8, carbs: 15, fat: 6 },
        ]
      : [
          { meal: 'breakfast', foods: ['Oatmeal, banana, nuts'], calories: 400, protein: 12, carbs: 55, fat: 12 },
          { meal: 'lunch', foods: ['Grilled chicken, rice, vegetables'], calories: 550, protein: 40, carbs: 50, fat: 18 },
          { meal: 'dinner', foods: ['Salmon, quinoa, salad'], calories: 500, protein: 35, carbs: 40, fat: 20 },
          { meal: 'snack1', foods: ['Greek yogurt, berries'], calories: 200, protein: 15, carbs: 25, fat: 5 },
          { meal: 'snack2', foods: ['Almonds, apple'], calories: 200, protein: 6, carbs: 25, fat: 12 },
        ];
    return {
      meals: defaultMeals,
      totalCalories: macros.calories,
      rationale: 'Sample plan (AI quota exceeded). Complete your profile and try again later for personalized plans.',
    };
  }
};
