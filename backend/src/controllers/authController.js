/**
 * Authentication Controller
 * Register, login, token refresh
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, fitnessGoal } = req.validated;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      fitnessGoal: fitnessGoal || 'general_fitness',
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          fitnessGoal: user.fitnessGoal,
          profile: user.profile,
          customMacros: user.customMacros,
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const token = generateToken(user._id);
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          fitnessGoal: user.fitnessGoal,
          profile: user.profile,
          customMacros: user.customMacros,
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
