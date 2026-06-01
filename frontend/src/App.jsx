import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/about';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import Manual from './pages/Manual';
import LandlordJoinRequest from './pages/LandlordJoinRequest';
import LandlordEmailVerify from './pages/LandlordEmailVerify';
import TenantReservations from './pages/TenantReservations';

const defaultRouteForRole = (role) => (role === 'tenant' ? '/properties' : '/dashboard');

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={defaultRouteForRole(user.role)} />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/properties" element={<Properties />} />
      <Route path="/properties/:id" element={<PropertyDetail />} />
      <Route path="/manual" element={<Manual />} />
      <Route path="/about" element={<About />} />
      <Route path="/become-landlord" element={<LandlordJoinRequest />} />
      <Route path="/verify-landlord" element={<LandlordEmailVerify />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['landlord', 'admin', 'agent']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/tenant/queue" element={
        <ProtectedRoute roles={['tenant']}>
          <TenantReservations mode="queue" />
        </ProtectedRoute>
      } />

      <Route path="/tenant/rentals" element={
        <ProtectedRoute roles={['tenant']}>
          <TenantReservations mode="rentals" />
        </ProtectedRoute>
      } />
      
      <Route path="/properties/new" element={
        <ProtectedRoute roles={['admin', 'agent']}>
          <PropertyForm />
        </ProtectedRoute>
      } />
      
      <Route path="/properties/:id/edit" element={
        <ProtectedRoute roles={['landlord', 'admin', 'agent']}>
          <PropertyForm />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isManual = location.pathname.startsWith('/manual');
  
  return (
    <div className="flex flex-col min-h-screen">
      {!isDashboard && !isManual && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isDashboard && !isManual && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <LayoutWrapper>
          <AnimatePresence mode="wait">
            <AppRoutes />
          </AnimatePresence>
        </LayoutWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;
