/**
 * User Profile Controller
 */
import User from '../models/User.js';
import * as geminiService from '../services/geminiService.js';

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'fitnessGoal', 'profile', 'customMacros'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (updates.customMacros) {
      updates.customMacros.updatedAt = new Date();
    }

    if (updates.fitnessGoal) {
      updates.$unset = { customMacros: 1 };
      delete updates.customMacros;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken');

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

export const saveMacros = async (req, res, next) => {
  try {
    const { calories, protein, carbs, fat } = req.body;
    if (!calories || protein == null || carbs == null || fat == null) {
      return res.status(400).json({ success: false, error: 'calories, protein, carbs, fat required' });
    }
    const cals = Number(calories);
    const p = Number(protein);
    const c = Number(carbs);
    const f = Number(fat);
    const macroCals = p * 4 + c * 4 + f * 9;
    let payload = { calories: cals, protein: p, carbs: c, fat: f };
    if (Math.abs(macroCals - cals) > 50) {
      payload = geminiService.normalizeMacrosToCalories(cals, p, c, f);
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { customMacros: { ...payload, updatedAt: new Date() } },
      { new: true }
    ).select('customMacros');
    res.json({ success: true, data: { macros: user.customMacros } });
  } catch (error) {
    next(error);
  }
};

export const getMacros = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('profile fitnessGoal customMacros').lean();
    if (user.customMacros?.calories) {
      return res.json({ success: true, data: { macros: user.customMacros, source: 'custom' } });
    }
    const calculated = geminiService.calculateMacrosFromProfile(user);
    res.json({ success: true, data: { macros: calculated, source: 'calculated' } });
  } catch (error) {
    next(error);
  }
};
