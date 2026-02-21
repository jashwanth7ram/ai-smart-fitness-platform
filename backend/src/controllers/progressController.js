/**
 * Progress Controller
 * Aggregated metrics and weekly reports
 */
import HealthLog from '../models/HealthLog.js';
import Progress from '../models/Progress.js';

const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();
  if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'month') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return { start, end };
};

export const getWeightTrend = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days, 10));

    const logs = await HealthLog.find({
      user: req.user.id,
      type: 'weight',
      date: { $gte: start },
    })
      .sort({ date: 1 })
      .select('date weightKg')
      .lean();

    res.json({ success: true, data: { trend: logs } });
  } catch (error) {
    next(error);
  }
};

export const getWeeklyProgress = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    const { start, end } = getDateRange(period);

    const logs = await HealthLog.find({
      user: req.user.id,
      date: { $gte: start, $lte: end },
    }).lean();

    const aggregated = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalSleepHours: 0,
      totalActivityMinutes: 0,
      totalCaloriesBurned: 0,
      weightEntries: [],
    };

    logs.forEach((log) => {
      if (log.type === 'nutrition' && log.nutrition?.length) {
        log.nutrition.forEach((n) => {
          aggregated.totalCalories += n.calories || 0;
          aggregated.totalProtein += n.protein || 0;
          aggregated.totalCarbs += n.carbs || 0;
          aggregated.totalFat += n.fat || 0;
        });
      }
      if (log.type === 'activity' && log.activity?.length) {
        log.activity.forEach((a) => {
          aggregated.totalActivityMinutes += a.durationMinutes || 0;
          aggregated.totalCaloriesBurned += a.caloriesBurned || 0;
        });
      }
      if (log.type === 'sleep' && log.sleep) {
        aggregated.totalSleepHours += log.sleep.sleepDurationHours || 0;
      }
      if (log.type === 'weight') {
        aggregated.weightEntries.push({ date: log.date, weightKg: log.weightKg });
      }
    });

    const daysWithData = new Set(logs.map((l) => l.date?.toISOString().split('T')[0])).size;
    res.json({
      success: true,
      data: {
        period: { start, end },
        metrics: aggregated,
        daysWithData,
      },
    });
  } catch (error) {
    next(error);
  }
};
