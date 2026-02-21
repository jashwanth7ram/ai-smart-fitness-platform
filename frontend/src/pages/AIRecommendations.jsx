import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MACRO_KCAL = { protein: 4, carbs: 4, fat: 9 };

export default function AIRecommendations() {
  const { user, updateUser } = useAuth();
  const [calorieMacro, setCalorieMacro] = useState(null);
  const [editingMacros, setEditingMacros] = useState(false);
  const [editForm, setEditForm] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [motivation, setMotivation] = useState('');
  const [plateau, setPlateau] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [dietCalories, setDietCalories] = useState('');
  const [loading, setLoading] = useState({ calorie: false, food: false, motivation: false, plateau: false, dietPlan: false, saveMacros: false });

  const calcMacroCals = (p, c, f) => p * MACRO_KCAL.protein + c * MACRO_KCAL.carbs + f * MACRO_KCAL.fat;

  const loadMacros = async () => {
    try {
      const { data } = await api.get('/users/macros');
      const m = data.data.macros;
      setCalorieMacro({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, rationale: m.rationale || '' });
      setEditForm({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat });
      setDietCalories(String(m.calories));
    } catch {
      setCalorieMacro(null);
    }
  };

  useEffect(() => {
    if (user?.customMacros?.calories) {
      const m = user.customMacros;
      setCalorieMacro({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, rationale: 'Your saved custom macros' });
      setEditForm({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat });
      setDietCalories(String(m.calories));
    } else {
      loadMacros();
    }
  }, [user?.customMacros]);

  const fetchCalorieMacro = async () => {
    setLoading((l) => ({ ...l, calorie: true }));
    try {
      const { data } = await api.get('/ai/calorie-macro');
      setCalorieMacro(data.data);
      setEditForm({ calories: data.data.calories, protein: data.data.protein, carbs: data.data.carbs, fat: data.data.fat });
      setDietCalories(String(data.data.calories));
    } catch {
      toast.error('Could not fetch. Check your profile is complete.');
      loadMacros();
    } finally {
      setLoading((l) => ({ ...l, calorie: false }));
    }
  };

  const handleEditMacroChange = (field, value) => {
    const v = value === '' ? '' : Number(value);
    setEditForm((f) => ({ ...f, [field]: v }));
  };

  const derivedCalories = (() => {
    const p = Number(editForm.protein) || 0;
    const c = Number(editForm.carbs) || 0;
    const f = Number(editForm.fat) || 0;
    return calcMacroCals(p, c, f);
  })();

  const targetCalories = Number(editForm.calories) || 0;
  const macroMatch = Math.abs(derivedCalories - targetCalories) < 5;

  const saveCustomMacros = async () => {
    const cals = Number(editForm.calories) || 0;
    const p = Number(editForm.protein) || 0;
    const c = Number(editForm.carbs) || 0;
    const f = Number(editForm.fat) || 0;
    if (!cals || !p || !c || !f) {
      toast.error('All fields required');
      return;
    }
    setLoading((l) => ({ ...l, saveMacros: true }));
    try {
      const { data } = await api.put('/users/macros', { calories: cals, protein: p, carbs: c, fat: f });
      const m = data.data.macros;
      setCalorieMacro({ ...m, rationale: 'Your saved custom macros' });
      setEditForm({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat });
      setEditingMacros(false);
      if (user && updateUser) updateUser({ ...user, customMacros: m });
      setDietCalories(String(cals));
      toast.success('Macros saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading((l) => ({ ...l, saveMacros: false }));
    }
  };

  const fetchFoodSuggestions = async () => {
    setLoading((l) => ({ ...l, food: true }));
    try {
      const { data } = await api.get('/ai/food-suggestions');
      setFoodSuggestions(data.data.suggestions || []);
    } catch {
      toast.error('Could not fetch suggestions');
      setFoodSuggestions([]);
    } finally {
      setLoading((l) => ({ ...l, food: false }));
    }
  };

  const fetchMotivation = async () => {
    setLoading((l) => ({ ...l, motivation: true }));
    try {
      const { data } = await api.get('/ai/motivation');
      setMotivation(data.data.message || '');
    } catch {
      setMotivation('Stay consistent. Progress is progress!');
    } finally {
      setLoading((l) => ({ ...l, motivation: false }));
    }
  };

  const fetchDietPlan = async () => {
    setLoading((l) => ({ ...l, dietPlan: true }));
    try {
      const cal = dietCalories ? Number(dietCalories) : null;
      const url = cal ? `/ai/diet-plan?calories=${cal}` : '/ai/diet-plan';
      const { data } = await api.get(url);
      setDietPlan(data.data);
    } catch {
      toast.error('Could not fetch diet plan');
      setDietPlan(null);
    } finally {
      setLoading((l) => ({ ...l, dietPlan: false }));
    }
  };

  const fetchPlateau = async () => {
    setLoading((l) => ({ ...l, plateau: true }));
    try {
      const { data } = await api.get('/ai/plateau-check');
      setPlateau(data.data);
    } catch {
      setPlateau({ plateauDetected: false, message: 'Analysis unavailable.' });
    } finally {
      setLoading((l) => ({ ...l, plateau: false }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">AI Recommendations</h1>
        <p className="text-slate-400 mt-1">Personalized advice powered by Gemini AI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Calorie & macro targets</h3>
            <div className="flex gap-2">
              {!calorieMacro ? (
                <button onClick={fetchCalorieMacro} disabled={loading.calorie} className="btn-secondary text-sm py-1.5">
                  {loading.calorie ? 'Loading...' : 'Load from AI'}
                </button>
              ) : (
                <>
                  <button onClick={() => setEditingMacros(!editingMacros)} className="btn-secondary text-sm py-1.5">
                    {editingMacros ? 'Cancel' : 'Edit'}
                  </button>
                  <button onClick={fetchCalorieMacro} disabled={loading.calorie} className="btn-secondary text-sm py-1.5">
                    {loading.calorie ? '...' : 'Refresh AI'}
                  </button>
                </>
              )}
            </div>
          </div>

          {!calorieMacro && !loading.calorie ? (
            <p className="text-slate-500 text-sm">Click &quot;Load from AI&quot; to get macro targets based on your profile.</p>
          ) : editingMacros ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Calories</label>
                  <input type="number" value={editForm.calories} onChange={(e) => handleEditMacroChange('calories', e.target.value)} className="input-field" min="1000" max="5000" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Protein (g)</label>
                  <input type="number" value={editForm.protein} onChange={(e) => handleEditMacroChange('protein', e.target.value)} className="input-field" min="20" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Carbs (g)</label>
                  <input type="number" value={editForm.carbs} onChange={(e) => handleEditMacroChange('carbs', e.target.value)} className="input-field" min="50" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Fat (g)</label>
                  <input type="number" value={editForm.fat} onChange={(e) => handleEditMacroChange('fat', e.target.value)} className="input-field" min="20" />
                </div>
              </div>
              <p className={`text-sm ${macroMatch ? 'text-brand-400' : 'text-amber-400'}`}>
                Macro calories: {derivedCalories} kcal {macroMatch ? '✓' : `(target: ${targetCalories})`}
              </p>
              <button onClick={saveCustomMacros} disabled={loading.saveMacros} className="btn-primary">
                {loading.saveMacros ? 'Saving...' : 'Save macros'}
              </button>
            </div>
          ) : calorieMacro ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Calories</p>
                  <p className="text-xl font-bold text-brand-400">{calorieMacro.calories}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Protein</p>
                  <p className="text-xl font-bold">{calorieMacro.protein}g</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Carbs</p>
                  <p className="text-xl font-bold">{calorieMacro.carbs}g</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Fat</p>
                  <p className="text-xl font-bold">{calorieMacro.fat}g</p>
                </div>
              </div>
              {calorieMacro.rationale && <p className="text-sm text-slate-400">{calorieMacro.rationale}</p>}
            </div>
          ) : null}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Food suggestions</h3>
            <button onClick={fetchFoodSuggestions} disabled={loading.food} className="btn-secondary text-sm py-1.5">
              {loading.food ? 'Loading...' : 'Get suggestions'}
            </button>
          </div>
          {foodSuggestions.length > 0 ? (
            <ul className="space-y-2">
              {foodSuggestions.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-300">
                  <span className="text-brand-400">•</span> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">Click &quot;Get suggestions&quot; for AI-powered food ideas.</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Motivation</h3>
            <button onClick={fetchMotivation} disabled={loading.motivation} className="btn-secondary text-sm py-1.5">
              {loading.motivation ? '...' : 'New message'}
            </button>
          </div>
          <p className="text-brand-300 italic">&ldquo;{motivation || 'Click for a motivational message.'}&rdquo;</p>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="font-semibold text-slate-200">Diet plan (by region & macros)</h3>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Calories for diet"
                value={dietCalories}
                onChange={(e) => setDietCalories(e.target.value)}
                className="input-field w-32"
                min="1000"
              />
              <button onClick={fetchDietPlan} disabled={loading.dietPlan} className="btn-secondary text-sm py-1.5">
                {loading.dietPlan ? 'Generating...' : 'Get diet plan'}
              </button>
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-2">Enter calories to customize, or leave blank to use your target. Gemini will generate a meal plan for that calorie goal.</p>
          {dietPlan?.meals?.length > 0 ? (
            <div className="space-y-4">
              {dietPlan.meals.map((m, i) => (
                <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="font-medium text-brand-400 capitalize">{m.meal}</p>
                  <p className="text-slate-300 text-sm mt-1">{m.foods?.join(', ') || m.food}</p>
                  <p className="text-xs text-slate-500 mt-1">{m.calories} kcal · P:{m.protein || 0}g C:{m.carbs || 0}g F:{m.fat || 0}g</p>
                </div>
              ))}
              <p className="text-sm text-slate-400">Total: {dietPlan.totalCalories} kcal · {dietPlan.rationale}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Complete your profile (region) and click &quot;Get diet plan&quot;. Optionally set calories first.</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Plateau detection</h3>
            <button onClick={fetchPlateau} disabled={loading.plateau} className="btn-secondary text-sm py-1.5">
              {loading.plateau ? 'Analyzing...' : 'Check plateau'}
            </button>
          </div>
          {plateau ? (
            <div>
              <p className="text-slate-300 mb-2">{plateau.message}</p>
              {plateau.plateauDetected && plateau.suggestion && (
                <p className="text-sm text-brand-400">Tip: {plateau.suggestion}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Log weight over 2+ weeks for plateau analysis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
