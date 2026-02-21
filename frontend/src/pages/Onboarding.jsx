import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Intense daily exercise' },
];

const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'muscle_building', label: 'Muscle Building' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'general_fitness', label: 'General Fitness' },
];

const REGIONS = [
  'India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan',
  'China', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'UAE', 'Singapore',
  'Philippines', 'Indonesia', 'Pakistan', 'Bangladesh', 'Other',
];

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    dateOfBirth: user?.profile?.dateOfBirth || '',
    gender: user?.profile?.gender || '',
    heightCm: user?.profile?.heightCm || '',
    weightKg: user?.profile?.weightKg || '',
    activityLevel: user?.profile?.activityLevel || 'moderate',
    targetWeightKg: user?.profile?.targetWeightKg || '',
    region: user?.profile?.region || '',
    fitnessGoal: user?.fitnessGoal || 'general_fitness',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = {
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        activityLevel: form.activityLevel || undefined,
        targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : undefined,
        region: form.region || undefined,
        profileComplete: true,
      };

      const { data } = await api.patch('/users/profile', { profile, fitnessGoal: form.fitnessGoal });
      updateUser(data.data.user);
      toast.success('Profile saved! We\'ll personalize your experience.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const age = form.dateOfBirth
    ? Math.floor((new Date() - new Date(form.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950/30 p-4">
      <div className="card w-full max-w-2xl animate-fade-in">
        <h1 className="text-2xl font-bold text-brand-400 mb-2">Complete your profile</h1>
        <p className="text-slate-400 text-sm mb-6">
          We need a few details to calculate your macros and personalize diet plans. This is similar to a calorie calculator.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Date of birth</label>
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="input-field"
                required
              />
              {age != null && <p className="text-xs text-slate-500 mt-1">Age: {age} years</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field" required>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Height (cm)</label>
              <input
                name="heightCm"
                type="number"
                min="100"
                max="250"
                value={form.heightCm}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 170"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Current weight (kg)</label>
              <input
                name="weightKg"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={form.weightKg}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 70"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Target weight (kg)</label>
            <input
              name="targetWeightKg"
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={form.targetWeightKg}
              onChange={handleChange}
              className="input-field max-w-xs"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Activity level</label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((a) => (
                <label key={a.value} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:border-brand-500/50 transition">
                  <input
                    type="radio"
                    name="activityLevel"
                    value={a.value}
                    checked={form.activityLevel === a.value}
                    onChange={handleChange}
                    className="text-brand-500"
                  />
                  <div>
                    <span className="font-medium text-slate-200">{a.label}</span>
                    <span className="text-slate-500 text-sm ml-2">— {a.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Fitness goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FITNESS_GOALS.map((g) => (
                <label key={g.value} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:border-brand-500/50">
                  <input type="radio" name="fitnessGoal" value={g.value} checked={form.fitnessGoal === g.value} onChange={handleChange} className="text-brand-500" />
                  <span className="text-sm">{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Region / Country</label>
            <select name="region" value={form.region} onChange={handleChange} className="input-field" required>
              <option value="">Select your region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Used for region-specific diet plans and food suggestions</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Saving...' : 'Save & continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
