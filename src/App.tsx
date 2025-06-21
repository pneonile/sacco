import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MemberDashboard } from './pages/member/MemberDashboard';
import { MembersPage } from './pages/admin/MembersPage';
import { DepositsPage } from './pages/admin/DepositsPage';
import { LoansPage } from './pages/admin/LoansPage';
import { TransactionsPage } from './pages/admin/TransactionsPage';
import { OnboardingPage } from './pages/admin/OnboardingPage';
import { FinesPage } from './pages/admin/FinesPage';
import { MobileMoneyPage } from './pages/admin/MobileMoneyPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/member'} replace />;
  }

  return <Layout>{children}</Layout>;
};

/**
 * Temporary placeholder component for routes that are
 * not yet implemented.  This prevents build-time errors
 * while allowing us to register all required paths.
 * Replace each usage with the actual page component
 * as it gets developed.
 */
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-secondary-900 mb-2">{title}</h1>
    <p className="text-secondary-600">This feature is coming soon.</p>
  </div>
);

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ---------- Admin Extended Modules ---------- */}
      <Route
        path="/admin/onboarding"
        element={
          <ProtectedRoute requiredRole="admin">
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fines"
        element={
          <ProtectedRoute requiredRole="admin">
            <FinesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/checkoffs"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Payroll Check-offs" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/e-wallets"
        element={
          <ProtectedRoute requiredRole="admin">
            <MobileMoneyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/statements"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Statements Viewer" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/communications"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Communications & Notifications" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/investments"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="SACCO Investment Tracker" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/income-expense"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Income & Expense Management" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* ---------- Member Extended Modules ---------- */}
      <Route
        path="/member/deposits"
        element={
          <ProtectedRoute requiredRole="member">
            <PlaceholderPage title="My Deposits" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/statements"
        element={
          <ProtectedRoute requiredRole="member">
            <PlaceholderPage title="My Statements" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/communications"
        element={
          <ProtectedRoute requiredRole="member">
            <PlaceholderPage title="Messages & Notifications" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/e-wallet"
        element={
          <ProtectedRoute requiredRole="member">
            <PlaceholderPage title="My E-Wallet" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute requiredRole="admin">
            <MembersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deposits"
        element={
          <ProtectedRoute requiredRole="admin">
            <DepositsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/loans"
        element={
          <ProtectedRoute requiredRole="admin">
            <LoansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute requiredRole="admin">
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member"
        element={
          <ProtectedRoute requiredRole="member">
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/member'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;