import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

export default function Dashboard() {
  const { user } = useAuth();
  const [weekly, setWeekly] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState(true);

  const logWeight = async (e) => {
    e?.preventDefault();
    if (!weightInput) return;
    try {
      await api.post('/logs', {
        date: new Date().toISOString(),
        type: 'weight',
        weightKg: Number(weightInput),
      });
      toast.success('Weight logged!');
      setWeightInput('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log');
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/progress/weekly?period=week');
        setWeekly(data.data);
      } catch {
        setWeekly(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const motivation = 'Every small step brings you closer to your goals. Stay consistent!';
  const metrics = weekly?.metrics || {};
  const greeting = `Welcome back, ${user?.firstName || 'Athlete'}!`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold text-white">{greeting}</h1>
        <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Motivation Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
        <p className="text-purple-300 italic">&ldquo;{motivation}&rdquo;</p>
        <span className="text-xs text-slate-400 mt-2 block">— AI Coach</span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Calories this week', value: Math.round(metrics.totalCalories || 0), unit: 'kcal', icon: '🔥' },
          { label: 'Protein', value: Math.round(metrics.totalProtein || 0), unit: 'g', icon: '💪' },
          { label: 'Activity', value: Math.round(metrics.totalActivityMinutes || 0), unit: 'min', icon: '🏃' },
          { label: 'Sleep', value: Number((metrics.totalSleepHours || 0).toFixed(1)), unit: 'hrs', icon: '😴' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30"
          >
            <span className="text-3xl mb-3 block">{m.icon}</span>
            <p className="text-slate-400 text-sm">{m.label}</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {loading ? '—' : (
                <>
                  <CountUp end={m.value} duration={1.5} />
                  <span className="text-lg ml-1">{m.unit}</span>
                </>
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions + Log Weight */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/nutrition', label: 'Log food', icon: '🥗' },
              { to: '/activity', label: 'Log workout', icon: '🏃' },
              { to: '/sleep', label: 'Log sleep', icon: '😴' },
              { to: '/ai-recommendations', label: 'Get AI tips', icon: '🤖' },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-purple-600/20 transition-all duration-300 hover:scale-105"
              >
                <span className="text-xl">{a.icon}</span>
                <span className="font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Log Weight */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-white mb-4">Log weight</h3>
          <form onSubmit={logWeight} className="flex gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="kg"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 transition-all duration-300 hover:scale-105 rounded-xl px-4 py-2 font-semibold"
            >
              Log
            </button>
          </form>

          <p className="text-slate-400 capitalize mt-4">
            Goal: {user?.fitnessGoal?.replace('_', ' ') || 'General fitness'}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Track nutrition, activity, and sleep for personalized AI recommendations.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
