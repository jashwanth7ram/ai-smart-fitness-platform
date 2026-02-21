import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { format, isToday, addDays } from 'date-fns';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionLog() {
  const [logs, setLogs] = useState([]);
  const [dayLogId, setDayLogId] = useState(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recentFoods, setRecentFoods] = useState([]);
  const [targetMacros, setTargetMacros] = useState(null);
  const [form, setForm] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'snack',
  });
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/logs?type=nutrition&startDate=${date}&endDate=${date}`);
      const dayLog = data.data.logs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === date);
      setLogs(dayLog?.nutrition || []);
      setDayLogId(dayLog?._id || null);
    } catch {
      setLogs([]);
      setDayLogId(null);
    }
  };

  const fetchRecentFoods = async () => {
    try {
      const end = new Date();
      const start = addDays(end, -14);
      const { data } = await api.get(`/logs?type=nutrition&startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}&limit=50`);
      const seen = new Set();
      const foods = [];
      (data.data.logs || []).forEach((log) => {
        (log.nutrition || []).forEach((n) => {
          const key = `${n.foodName}-${n.calories}-${n.mealType}`;
          if (!seen.has(key)) {
            seen.add(key);
            foods.push(n);
          }
        });
      });
      setRecentFoods(foods.slice(-20).reverse());
    } catch {
      setRecentFoods([]);
    }
  };

  const fetchTargetMacros = async () => {
    try {
      const { data } = await api.get('/users/macros');
      setTargetMacros(data.data.macros);
    } catch {
      setTargetMacros(null);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [date]);

  useEffect(() => {
    fetchRecentFoods();
    if (isToday(new Date(date))) fetchTargetMacros();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get(`/logs?type=nutrition&startDate=${date}&endDate=${date}`);
      const dayLog = data.data.logs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === date);
      const payload = {
        date: new Date(date).toISOString(),
        type: 'nutrition',
        nutrition: [
          ...(dayLog?.nutrition || []),
          {
            foodName: form.foodName,
            calories: Number(form.calories),
            protein: Number(form.protein) || 0,
            carbs: Number(form.carbs) || 0,
            fat: Number(form.fat) || 0,
            mealType: form.mealType,
          },
        ],
      };

      if (dayLog) {
        await api.patch(`/logs/${dayLog._id}`, payload);
        setDayLogId(dayLog._id);
      } else {
        const { data: created } = await api.post('/logs', payload);
        setDayLogId(created.data.log._id);
      }
      toast.success('Food logged!');
      setForm({ foodName: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'snack' });
      fetchLogs();
      fetchRecentFoods();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log');
    } finally {
      setLoading(false);
    }
  };

  const handleReAdd = (n) => {
    setForm({
      foodName: n.foodName,
      calories: n.calories,
      protein: n.protein || '',
      carbs: n.carbs || '',
      fat: n.fat || '',
      mealType: n.mealType || 'snack',
    });
  };

  const handleDelete = async (index) => {
    if (!dayLogId) return;
    const updated = logs.filter((_, i) => i !== index);
    if (updated.length === 0) {
      try {
        await api.delete(`/logs/${dayLogId}`);
        setLogs([]);
        setDayLogId(null);
        toast.success('Entry removed');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete');
      }
      return;
    }
    try {
      await api.patch(`/logs/${dayLogId}`, {
        date: new Date(date).toISOString(),
        type: 'nutrition',
        nutrition: updated,
      });
      setLogs(updated);
      toast.success('Entry removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const total = logs.reduce(
    (acc, n) => ({
      calories: acc.calories + (n.calories || 0),
      protein: acc.protein + (n.protein || 0),
      carbs: acc.carbs + (n.carbs || 0),
      fat: acc.fat + (n.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = targetMacros && isToday(new Date(date))
    ? {
        calories: Math.max(0, (targetMacros.calories || 0) - total.calories),
        protein: Math.max(0, (targetMacros.protein || 0) - total.protein),
        carbs: Math.max(0, (targetMacros.carbs || 0) - total.carbs),
        fat: Math.max(0, (targetMacros.fat || 0) - total.fat),
      }
    : null;

  const dateLabel = (() => {
    const d = new Date(date);
    if (isToday(d)) return "Today's entries";
    const yesterday = addDays(new Date(), -1);
    if (format(d, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return "Yesterday's entries";
    return `Entries for ${format(d, 'MMM d, yyyy')}`;
  })();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Nutrition Log</h1>
        <p className="text-slate-400 mt-1">Track your meals and macros. Log for any date.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-slate-200 mb-4">Add food</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm text-slate-400 mb-1">Food name</label>
                <input
                  value={form.foodName}
                  onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Grilled chicken"
                  required
                />
              </div>
              <div className="w-24">
                <label className="block text-sm text-slate-400 mb-1">Calories</label>
                <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input-field" required />
              </div>
              <div className="w-20">
                <label className="block text-sm text-slate-400 mb-1">Protein</label>
                <input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className="input-field" />
              </div>
              <div className="w-20">
                <label className="block text-sm text-slate-400 mb-1">Carbs</label>
                <input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="input-field" />
              </div>
              <div className="w-20">
                <label className="block text-sm text-slate-400 mb-1">Fat</label>
                <input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} className="input-field" />
              </div>
              <div className="w-32">
                <label className="block text-sm text-slate-400 mb-1">Meal</label>
                <select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })} className="input-field">
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">Add</button>
            </div>
          </form>

          {recentFoods.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Quick add from previous logs</h4>
              <div className="flex flex-wrap gap-2">
                {recentFoods.slice(0, 10).map((n, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleReAdd(n)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300"
                  >
                    {n.foodName} ({n.calories} kcal)
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-slate-200">{dateLabel}</h4>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field w-44" title="Select any date" />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-sm">No entries for this date.</p>
              ) : (
                logs.map((n, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 text-sm group">
                    <span className="capitalize">{n.foodName} ({n.mealType})</span>
                    <div className="flex items-center gap-2">
                      <span>{n.calories} kcal · P:{n.protein || 0} C:{n.carbs || 0} F:{n.fat || 0}</span>
                      <button type="button" onClick={() => handleDelete(i)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition text-xs px-1.5 py-0.5" title="Delete entry">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-slate-200 mb-4">Daily totals</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-slate-400">Calories</span><span className="font-mono text-brand-400">{total.calories} kcal</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Protein</span><span className="font-mono">{total.protein} g</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Carbs</span><span className="font-mono">{total.carbs} g</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Fat</span><span className="font-mono">{total.fat} g</span></div>
            </div>
          </div>

          {remaining && targetMacros && (
            <div className="card border-brand-500/30">
              <h3 className="font-semibold text-slate-200 mb-4">Remaining today</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Calories</span><span className={`font-mono ${remaining.calories > 0 ? 'text-brand-400' : 'text-slate-400'}`}>{remaining.calories} / {targetMacros.calories} kcal</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Protein</span><span className="font-mono">{remaining.protein} / {targetMacros.protein} g</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Carbs</span><span className="font-mono">{remaining.carbs} / {targetMacros.carbs} g</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Fat</span><span className="font-mono">{remaining.fat} / {targetMacros.fat} g</span></div>
              </div>
            </div>
          )}

          <Link to="/ai-recommendations" className="btn-secondary w-full block text-center">Get macro recommendations →</Link>
        </div>
      </div>
    </div>
  );
}
