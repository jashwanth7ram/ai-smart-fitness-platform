/**
 * HealthLog Model — Consolidated health entries
 * Nutrition, Activity, Sleep in single polymorphic schema
 */
import mongoose from 'mongoose';

const nutritionEntrySchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  servingSize: String,
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
}, { _id: false });

const activityEntrySchema = new mongoose.Schema({
  activityType: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  caloriesBurned: Number,
  intensity: { type: String, enum: ['low', 'moderate', 'high', 'very_high'] },
  notes: String,
}, { _id: false });

const sleepEntrySchema = new mongoose.Schema({
  sleepDurationHours: { type: Number, required: true },
  quality: { type: Number, min: 1, max: 10 },
  bedtime: Date,
  wakeTime: Date,
  notes: String,
}, { _id: false });

const healthLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['nutrition', 'activity', 'sleep', 'weight'],
      required: true,
    },
    // Type-specific data
    nutrition: [nutritionEntrySchema],
    activity: [activityEntrySchema],
    sleep: sleepEntrySchema,
    weightKg: Number,
    bodyFatPercent: Number,
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

healthLogSchema.index({ user: 1, date: -1 });
healthLogSchema.index({ user: 1, type: 1, date: -1 });

export default mongoose.model('HealthLog', healthLogSchema);
