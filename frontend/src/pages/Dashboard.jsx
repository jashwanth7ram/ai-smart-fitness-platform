import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">{greeting}</h1>
        <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {motivation && (
        <div className="card border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-transparent">
          <p className="text-brand-300 italic">&ldquo;{motivation}&rdquo;</p>
          <span className="text-xs text-slate-500 mt-2 block">— AI Coach</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Calories this week', value: Math.round(metrics.totalCalories || 0), unit: 'kcal', icon: '🔥' },
          { label: 'Protein', value: Math.round(metrics.totalProtein || 0), unit: 'g', icon: '💪' },
          { label: 'Activity', value: Math.round(metrics.totalActivityMinutes || 0), unit: 'min', icon: '🏃' },
          { label: 'Sleep', value: (metrics.totalSleepHours || 0).toFixed(1), unit: 'hrs', icon: '😴' },
        ].map((m) => (
          <div key={m.label} className="card">
            <span className="text-2xl mb-2 block">{m.icon}</span>
            <p className="text-slate-400 text-sm">{m.label}</p>
            <p className="text-2xl font-bold text-brand-400 mt-1">
              {loading ? '—' : `${m.value} ${m.unit}`}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Quick Actions</h3>
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
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition border border-slate-700/50"
              >
                <span className="text-xl">{a.icon}</span>
                <span className="font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Log weight</h3>
          <form onSubmit={logWeight} className="flex gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="kg"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">Log</button>
          </form>
          <p className="text-slate-400 capitalize mt-4">Goal: {user?.fitnessGoal?.replace('_', ' ') || 'General fitness'}</p>
          <p className="text-sm text-slate-500 mt-2">
            Track nutrition, activity, and sleep for personalized AI recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
