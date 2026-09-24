import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import History from './pages/History';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import HabitDetail from './pages/HabitDetail';
import ManageHabits from './pages/ManageHabits';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import InstallPrompt from './components/InstallPrompt';
import { PwaProvider } from './context/PwaContext';
import type { TabName, Habit } from './types';

function AppShell() {
  const { user, loading: authLoading } = useAuth();
  const { loading: appLoading, error: appError, refresh } = useApp();
  const [authView, setAuthView] = useState<'login' | 'signup' | 'landing'>('login');
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showManageHabits, setShowManageHabits] = useState(false);

  // 1. Initial auth loading
  if (authLoading) {
    return (
      <div className="loading-screen" role="status" aria-label="Loading authentication">
        <div className="loading-icon">🔥</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Habit Streak Tracker...</p>
      </div>
    );
  }

  // 2. Unauthenticated: show Landing / Login / Create Account
  if (!user) {
    if (authView === 'landing') {
      return (
        <Landing
          onGetStarted={() => setAuthView('signup')}
          onLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <Auth
        mode={authView === 'signup' ? 'signup' : 'login'}
        onToggleMode={() => setAuthView(v => (v === 'login' ? 'signup' : 'login'))}
        onBack={() => setAuthView('landing')}
      />
    );
  }

  // 3. User authenticated, loading habits/completions
  if (appLoading) {
    return (
      <div className="loading-screen" role="status" aria-label="Loading your habits">
        <div className="loading-icon">🔥</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your habits...</p>
      </div>
    );
  }

  // 4. Data loading error state with retry
  if (appError) {
    return (
      <div className="loading-screen" style={{ padding: 24, textAlign: 'center' }}>
        <div className="loading-icon" style={{ animation: 'none' }}>⚠️</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Unable to load your habits</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '8px 0 20px', maxWidth: 320 }}>
          {appError}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => refresh()}
          id="retry-load-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 5. Sub-pages: Habit Detail overlay
  if (selectedHabit) {
    return (
      <div className="app-shell">
        <HabitDetail
          habit={selectedHabit}
          onBack={() => setSelectedHabit(null)}
        />
        <BottomNav active={activeTab} onChange={tab => {
          setSelectedHabit(null);
          setShowManageHabits(false);
          setActiveTab(tab);
        }} />
      </div>
    );
  }

  // 6. Sub-pages: Manage Habits overlay
  if (showManageHabits) {
    return (
      <div className="app-shell">
        <ManageHabits onBack={() => setShowManageHabits(false)} />
        <BottomNav active={activeTab} onChange={tab => {
          setSelectedHabit(null);
          setShowManageHabits(false);
          setActiveTab(tab);
        }} />
      </div>
    );
  }

  const handleTabChange = (tab: TabName) => {
    setSelectedHabit(null);
    setShowManageHabits(false);
    setActiveTab(tab);
  };

  // 7. Main tabs
  return (
    <div className="app-shell">
      {activeTab === 'home' && (
        <Home onOpenDetail={habit => setSelectedHabit(habit)} />
      )}
      {activeTab === 'history' && <History />}
      {activeTab === 'stats' && <Stats />}
      {activeTab === 'settings' && (
        <Settings onManageHabits={() => setShowManageHabits(true)} />
      )}

      <BottomNav active={activeTab} onChange={handleTabChange} />
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <PwaProvider>
          <AppShell />
        </PwaProvider>
      </AppProvider>
    </AuthProvider>
  );
}
