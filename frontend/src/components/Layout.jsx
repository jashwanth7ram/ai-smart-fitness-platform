import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/nutrition', label: 'Nutrition', icon: '🥗' },
  { to: '/activity', label: 'Activity', icon: '🏃' },
  { to: '/sleep', label: 'Sleep', icon: '😴' },
  { to: '/ai-recommendations', label: 'AI Recommendations', icon: '🤖' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/onboarding', label: 'Edit profile', icon: '⚙️' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900/90 border-r border-slate-700/50 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-xl font-bold text-brand-400">AI Fitness</h1>
          <p className="text-xs text-slate-500 mt-0.5">Smart Health Companion</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          {user && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 truncate">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm text-slate-500 hover:text-red-400 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
