/**
 * AIRecommendation Model — Stores Gemini-generated suggestions
 */
import mongoose from 'mongoose';

const aiRecommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['calorie_macro', 'food_suggestion', 'motivation', 'plateau_alert', 'diet_plan', 'general'],
      required: true,
    },
    content: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      suggestions: [String],
      message: String,
      plateauDetected: Boolean,
      rawResponse: mongoose.Schema.Types.Mixed,
    },
    context: {
      recentLogs: mongoose.Schema.Types.Mixed,
      userProfile: mongoose.Schema.Types.Mixed,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

aiRecommendationSchema.index({ user: 1, type: 1, createdAt: -1 });

export default mongoose.model('AIRecommendation', aiRecommendationSchema);
