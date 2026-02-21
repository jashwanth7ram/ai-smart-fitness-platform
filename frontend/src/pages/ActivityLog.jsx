import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { format } from 'date-fns';

const INTENSITIES = ['low', 'moderate', 'high', 'very_high'];

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [form, setForm] = useState({
    activityType: '',
    durationMinutes: '',
    caloriesBurned: '',
    intensity: 'moderate',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/logs?type=activity&startDate=${date}&endDate=${date}`);
      const dayLog = data.data.logs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === date);
      setLogs(dayLog?.activity || []);
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dayLog = await api.get(`/logs?type=activity&startDate=${date}&endDate=${date}`).then((r) => r.data.data.logs[0]);
      const payload = {
        date: new Date(date).toISOString(),
        type: 'activity',
        activity: [
          ...(dayLog?.activity || []),
          {
            activityType: form.activityType,
            durationMinutes: Number(form.durationMinutes),
            caloriesBurned: form.caloriesBurned ? Number(form.caloriesBurned) : undefined,
            intensity: form.intensity,
            notes: form.notes || undefined,
          },
        ],
      };

      if (dayLog) {
        await api.patch(`/logs/${dayLog._id}`, payload);
      } else {
        await api.post('/logs', payload);
      }
      toast.success('Activity logged!');
      setForm({ activityType: '', durationMinutes: '', caloriesBurned: '', intensity: 'moderate', notes: '' });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log');
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = logs.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  const totalBurned = logs.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Activity Log</h1>
        <p className="text-slate-400 mt-1">Track workouts and exercise</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-slate-200 mb-4">Log activity</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Activity type</label>
                <input
                  value={form.activityType}
                  onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Running, Weights"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Calories burned (optional)</label>
                <input
                  type="number"
                  value={form.caloriesBurned}
                  onChange={(e) => setForm({ ...form, caloriesBurned: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Intensity</label>
                <select
                  value={form.intensity}
                  onChange={(e) => setForm({ ...form, intensity: e.target.value })}
                  className="input-field"
                >
                  {INTENSITIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input-field"
                placeholder="Optional"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">Log activity</button>
          </form>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-slate-200">Entries</h4>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field w-40" />
            </div>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-sm">No activity logged for this date.</p>
              ) : (
                logs.map((a, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-slate-700/50 text-sm">
                    <span>{a.activityType} · {a.durationMinutes} min ({a.intensity})</span>
                    <span>{a.caloriesBurned || '—'} kcal</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Today&apos;s totals</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-slate-400">Total time</span><span className="font-mono text-brand-400">{totalMinutes} min</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Calories burned</span><span className="font-mono">{totalBurned || '—'} kcal</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
