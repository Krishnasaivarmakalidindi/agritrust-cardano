import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { WalletPage } from './pages/Wallet';
import { Explorer } from './pages/Explorer';
import { Verify } from './pages/Verify';
import { Roadmap } from './pages/Roadmap';
import './App.css';

// Root layout shell selector
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold mt-2">Loading Decentralized Identity...</p>
        </div>
      </div>
    );
  }

  const isFullWidthPage = location.pathname === '/' || location.pathname === '/onboarding' || location.pathname.startsWith('/verify');

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar />
      
      {isFullWidthPage ? (
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-slate-950">
            <Routes>
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/onboarding" replace />} />
              <Route path="/wallet" element={user ? <WalletPage /> : <Navigate to="/onboarding" replace />} />
              <Route path="/explorer" element={user ? <Explorer /> : <Navigate to="/onboarding" replace />} />
              <Route path="/roadmap" element={user ? <Roadmap /> : <Navigate to="/onboarding" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};
export default App;
