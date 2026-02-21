import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NutritionLog from './pages/NutritionLog';
import ActivityLog from './pages/ActivityLog';
import SleepLog from './pages/SleepLog';
import AIRecommendations from './pages/AIRecommendations';
import Reports from './pages/Reports';
import Onboarding from './pages/Onboarding';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const needsOnboarding = !user?.profile?.profileComplete;
  if (needsOnboarding && !window.location.pathname.includes('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 opacity-20 blur-3xl rounded-full animate-pulse"></div>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="nutrition" element={<PrivateRoute><NutritionLog /></PrivateRoute>} />
            <Route path="activity" element={<PrivateRoute><ActivityLog /></PrivateRoute>} />
            <Route path="sleep" element={<PrivateRoute><SleepLog /></PrivateRoute>} />
            <Route path="ai-recommendations" element={<PrivateRoute><AIRecommendations /></PrivateRoute>} />
            <Route path="reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
