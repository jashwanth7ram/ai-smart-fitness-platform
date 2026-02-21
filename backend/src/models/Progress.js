/**
 * Progress Model — Aggregated metrics for reporting
 * Weekly/monthly summaries and trend data
 */
import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    periodType: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    metrics: {
      totalCaloriesConsumed: Number,
      totalCaloriesBurned: Number,
      avgProtein: Number,
      avgCarbs: Number,
      avgFat: Number,
      avgSleepHours: Number,
      avgWeightKg: Number,
      totalActivityMinutes: Number,
      workoutCount: Number,
    },
    summary: String,
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, periodType: 1, periodStart: -1 });
progressSchema.index({ user: 1, periodEnd: -1 });

export default mongoose.model('Progress', progressSchema);
