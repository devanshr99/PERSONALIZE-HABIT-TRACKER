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
import Auth from './pages/Auth';
import InstallPrompt from './components/InstallPrompt';
import type { TabName, Habit } from './types';

function AppShell() {
  const { user, loading: authLoading } = useAuth();
  const { loading: appLoading, error: appError, refresh } = useApp();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showManageHabits, setShowManageHabits] = useState(false);

  // 1. Initial auth loading
  if (authLoading) {
    return (
      <div className="loading-screen" role="status" aria-label="Loading authentication">
        <div className="loading-icon">🔥</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Streakly...</p>
      </div>
    );
  }

  // 2. Unauthenticated: show Login / Signup screen
  if (!user) {
    return (
      <Auth
        mode={authMode}
        onToggleMode={() => setAuthMode(m => (m === 'login' ? 'signup' : 'login'))}
        onBack={() => setAuthMode('login')}
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
        <AppShell />
      </AppProvider>
    </AuthProvider>
  );
}
