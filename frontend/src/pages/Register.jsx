import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    fitnessGoal: 'general_fitness',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.data.token, data.data.user);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950/30">
      <div className="card w-full max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold text-brand-400 mb-6">Create your account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">First name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Last name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password (min 8 chars)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Fitness goal</label>
            <select name="fitnessGoal" value={form.fitnessGoal} onChange={handleChange} className="input-field">
              <option value="general_fitness">General fitness</option>
              <option value="weight_loss">Weight loss</option>
              <option value="fat_loss">Fat loss</option>
              <option value="muscle_building">Muscle building</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
