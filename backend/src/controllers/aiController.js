/**
 * AI Recommendations Controller
 * Endpoints for Gemini-powered features
 */
import * as geminiService from '../services/geminiService.js';
import AIRecommendation from '../models/AIRecommendation.js';

export const getCalorieMacro = async (req, res, next) => {
  try {
    const result = await geminiService.getCalorieMacroRecommendation(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getFoodSuggestions = async (req, res, next) => {
  try {
    const suggestions = await geminiService.getFoodSuggestions(req.user.id);
    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
};

export const getMotivation = async (req, res, next) => {
  try {
    const message = await geminiService.getMotivationMessage(req.user.id);
    res.json({ success: true, data: { message } });
  } catch (error) {
    next(error);
  }
};

export const getDietPlan = async (req, res, next) => {
  try {
    const customCalories = req.query.calories ? Number(req.query.calories) : null;
    const result = await geminiService.getDietPlanByRegion(req.user.id, customCalories);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPlateauCheck = async (req, res, next) => {
  try {
    const result = await geminiService.detectPlateau(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getRecommendationHistory = async (req, res, next) => {
  try {
    const { type, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (type) query.type = type;

    const recommendations = await AIRecommendation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .select('-context -content.rawResponse')
      .lean();

    res.json({ success: true, data: { recommendations } });
  } catch (error) {
    next(error);
  }
};
