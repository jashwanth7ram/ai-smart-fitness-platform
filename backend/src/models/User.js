/**
 * User Model — MongoDB Schema
 * Handles authentication, roles, and profile data
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    role: {
      type: String,
      enum: ['user', 'premium', 'admin'],
      default: 'user',
    },
    fitnessGoal: {
      type: String,
      enum: ['weight_loss', 'fat_loss', 'muscle_building', 'maintenance', 'general_fitness'],
      default: 'general_fitness',
    },
    profile: {
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      heightCm: Number,
      weightKg: Number,
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      },
      targetWeightKg: Number,
      dietaryPreferences: [String],
      region: { type: String, trim: true },
      profileComplete: { type: Boolean, default: false },
    },
    customMacros: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      updatedAt: Date,
    },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: Date,
    refreshToken: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance (email index created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
