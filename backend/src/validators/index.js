/**
 * Joi Validation Schemas
 */
import Joi from 'joi';

export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    fitnessGoal: Joi.string().valid('weight_loss', 'fat_loss', 'muscle_building', 'maintenance', 'general_fitness').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const healthLogSchemas = {
  create: Joi.object({
    date: Joi.date().required(),
    type: Joi.string().valid('nutrition', 'activity', 'sleep', 'weight').required(),
    nutrition: Joi.array().items(
      Joi.object({
        foodName: Joi.string().required(),
        calories: Joi.number().required(),
        protein: Joi.number().optional(),
        carbs: Joi.number().optional(),
        fat: Joi.number().optional(),
        mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').optional(),
      })
    ).optional(),
    activity: Joi.array().items(
      Joi.object({
        activityType: Joi.string().required(),
        durationMinutes: Joi.number().required(),
        caloriesBurned: Joi.number().optional(),
        intensity: Joi.string().valid('low', 'moderate', 'high', 'very_high').optional(),
      })
    ).optional(),
    sleep: Joi.object({
      sleepDurationHours: Joi.number().required(),
      quality: Joi.number().min(1).max(10).optional(),
    }).optional(),
    weightKg: Joi.number().optional(),
    notes: Joi.string().optional(),
  }),

  query: Joi.object({
    type: Joi.string().valid('nutrition', 'activity', 'sleep', 'weight').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().min(1).max(100).optional(),
    page: Joi.number().min(1).optional(),
  }),
};
