import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { format } from 'date-fns';

export default function SleepLog() {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [form, setForm] = useState({
    sleepDurationHours: '',
    quality: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/logs?type=sleep&startDate=${date}&endDate=${date}`);
      const dayLog = data.data.logs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === date);
      setLogs(dayLog ? [dayLog.sleep] : []);
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
      const payload = {
        date: new Date(date).toISOString(),
        type: 'sleep',
        sleep: {
          sleepDurationHours: Number(form.sleepDurationHours),
          quality: form.quality ? Number(form.quality) : undefined,
          notes: form.notes || undefined,
        },
      };

      const { data } = await api.get(`/logs?type=sleep&startDate=${date}&endDate=${date}`);
      const existing = data.data.logs[0];

      if (existing) {
        await api.patch(`/logs/${existing._id}`, payload);
      } else {
        await api.post('/logs', payload);
      }
      toast.success('Sleep logged!');
      setForm({ sleepDurationHours: '', quality: '', notes: '' });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log');
    } finally {
      setLoading(false);
    }
  };

  const avgSleep = logs.length ? logs.reduce((a, s) => a + (s?.sleepDurationHours || 0), 0) / logs.length : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Sleep Log</h1>
        <p className="text-slate-400 mt-1">Track sleep duration and quality</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-slate-200 mb-4">Log sleep</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Sleep duration (hours)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={form.sleepDurationHours}
                onChange={(e) => setForm({ ...form, sleepDurationHours: e.target.value })}
                className="input-field"
                placeholder="e.g. 7.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quality (1-10, optional)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.quality}
                onChange={(e) => setForm({ ...form, quality: e.target.value })}
                className="input-field"
              />
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
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-48"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">Log sleep</button>
          </form>

          <div className="mt-6">
            <h4 className="font-medium text-slate-200 mb-2">Logged entries</h4>
            {logs.length === 0 ? (
              <p className="text-slate-500 text-sm">No sleep logged for this date.</p>
            ) : (
              logs.map((s, i) => (
                <div key={i} className="py-2 border-b border-slate-700/50 text-sm">
                  {s?.sleepDurationHours} hrs {s?.quality ? `· Quality: ${s.quality}/10` : ''}
                  {s?.notes && <span className="text-slate-500"> · {s.notes}</span>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Sleep summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Logged for date</span>
              <span className="font-mono text-brand-400">{logs.length ? `${avgSleep.toFixed(1)} hrs` : '—'}</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Aim for 7–9 hours of quality sleep for optimal recovery.
          </p>
        </div>
      </div>
    </div>
  );
}
