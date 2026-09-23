import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import History from './pages/History';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import HabitDetail from './pages/HabitDetail';
import ManageHabits from './pages/ManageHabits';
import type { TabName, Habit } from './types';

function AppShell() {
  const { loading } = useApp();
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showManageHabits, setShowManageHabits] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon">🔥</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Streakly...</p>
      </div>
    );
  }

  // Sub-pages that overlay the main tabs
  if (selectedHabit) {
    return (
      <div className="app-shell">
        <HabitDetail
          habit={selectedHabit}
          onBack={() => setSelectedHabit(null)}
        />
      </div>
    );
  }

  if (showManageHabits) {
    return (
      <div className="app-shell">
        <ManageHabits onBack={() => setShowManageHabits(false)} />
      </div>
    );
  }

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

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
