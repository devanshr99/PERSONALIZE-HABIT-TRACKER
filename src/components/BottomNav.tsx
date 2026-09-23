import React from 'react';
import type { TabName } from '../types';

interface BottomNavProps {
  active: TabName;
  onChange: (tab: TabName) => void;
}

const TABS: Array<{ id: TabName; icon: string; label: string }> = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'history', icon: '📅', label: 'History' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'settings', icon: '⚙️', label: 'Settings' }
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-items">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`nav-item ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
            aria-label={tab.label}
            aria-current={active === tab.id ? 'page' : undefined}
            id={`nav-${tab.id}`}
          >
            <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
