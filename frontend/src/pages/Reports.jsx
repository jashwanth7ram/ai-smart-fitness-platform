import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

export default function Reports() {
  const [weightTrend, setWeightTrend] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [wt, w] = await Promise.all([
          api.get(`/progress/weight-trend?days=${days}`),
          api.get('/progress/weekly?period=week'),
        ]);
        setWeightTrend(wt.data.data.trend || []);
        setWeekly(w.data.data);
      } catch {
        setWeightTrend([]);
        setWeekly(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [days]);

  const weightChartData = weightTrend.map((t) => ({
    date: format(new Date(t.date), 'MM/dd'),
    weight: t.weightKg,
  }));

  const weeklyChartData = weekly?.metrics
    ? [
        { name: 'Calories', consumed: Math.round(weekly.metrics.totalCalories || 0), burned: Math.round(weekly.metrics.totalCaloriesBurned || 0) },
        { name: 'Activity (min)', value: Math.round(weekly.metrics.totalActivityMinutes || 0) },
        { name: 'Sleep (hrs)', value: (weekly.metrics.totalSleepHours || 0).toFixed(1) },
      ]
    : [];

  const macroData = weekly?.metrics
    ? [
        { name: 'Protein', value: Math.round(weekly.metrics.totalProtein || 0), fill: '#22c55e' },
        { name: 'Carbs', value: Math.round(weekly.metrics.totalCarbs || 0), fill: '#3b82f6' },
        { name: 'Fat', value: Math.round(weekly.metrics.totalFat || 0), fill: '#f59e0b' },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Reports</h1>
          <p className="text-slate-400 mt-1">Weight trends and weekly progress</p>
        </div>
        <div>
          <label className="text-sm text-slate-400 mr-2">Trend period:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input-field w-32"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4">Weight trend</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
        ) : weightChartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            Log weight entries to see your trend. Go to Nutrition or add weight logs.
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Weekly summary</h3>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : weekly ? (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-slate-400">Calories consumed</span><span className="font-mono text-brand-400">{Math.round(weekly.metrics?.totalCalories || 0)} kcal</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Calories burned</span><span className="font-mono">{Math.round(weekly.metrics?.totalCaloriesBurned || 0)} kcal</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Activity</span><span className="font-mono">{Math.round(weekly.metrics?.totalActivityMinutes || 0)} min</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Sleep</span><span className="font-mono">{(weekly.metrics?.totalSleepHours || 0).toFixed(1)} hrs</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Days with data</span><span className="font-mono">{weekly.daysWithData || 0}</span></div>
            </div>
          ) : (
            <p className="text-slate-500">No data for this week.</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Macros this week</h3>
          {macroData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Bar dataKey="value" name="grams" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500">Log nutrition to see macros.</p>
          )}
        </div>
      </div>
    </div>
  );
}
