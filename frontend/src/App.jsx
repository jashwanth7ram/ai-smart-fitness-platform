import { Routes, Route, Navigate } from 'react-router-dom';
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
  return (
    <Routes>
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
  );
}
