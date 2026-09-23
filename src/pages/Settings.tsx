import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { AppSettings } from '../types';
import {
  requestNotificationPermission,
  getNotificationPermission
} from '../services/notifications';

interface SettingsProps {
  onManageHabits: () => void;
}

export default function Settings({ onManageHabits }: SettingsProps) {
  const { settings, updateSettings, exportData, importData, resetData } =
    useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeChange = async (theme: AppSettings['theme']) => {
    await updateSettings({ ...settings, theme });
  };

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert(
          'Notifications are blocked. Please allow notifications in your browser settings.'
        );
        return;
      }
    }
    await updateSettings({
      ...settings,
      notificationsEnabled: !settings.notificationsEnabled
    });
  };

  const handleTimeChange = async (time: string) => {
    await updateSettings({ ...settings, notificationTime: time });
  };

  const handleExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streakly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    try {
      const text = await file.text();
      await importData(text);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Import failed'
      );
    }

    // Reset input
    e.target.value = '';
  };

  const handleReset = async () => {
    await resetData();
    setShowResetConfirm(false);
  };

  const notifPermission = getNotificationPermission();

  return (
    <>
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
          </div>

          {/* Habits */}
          <div className="section-title" style={{ marginBottom: 8 }}>Habits</div>
          <div className="settings-section" style={{ marginBottom: 20 }}>
            <div
              className="settings-row"
              onClick={onManageHabits}
              role="button"
              tabIndex={0}
              id="settings-manage-habits"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onManageHabits();
              }}
            >
              <span className="settings-row-icon">🎯</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Manage Habits</div>
                <div className="settings-row-subtitle">Add, edit, reorder, or deactivate habits</div>
              </div>
              <span className="settings-row-right">›</span>
            </div>
          </div>

          {/* Appearance */}
          <div className="section-title" style={{ marginBottom: 8 }}>Appearance</div>
          <div className="settings-section" style={{ marginBottom: 20 }}>
            {(['system', 'light', 'dark'] as AppSettings['theme'][]).map(theme => (
              <div
                key={theme}
                className="settings-row"
                onClick={() => handleThemeChange(theme)}
                role="button"
                tabIndex={0}
                id={`theme-${theme}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleThemeChange(theme);
                }}
              >
                <span className="settings-row-icon">
                  {theme === 'system' ? '🖥️' : theme === 'light' ? '☀️' : '🌙'}
                </span>
                <div className="settings-row-content">
                  <div className="settings-row-title" style={{ textTransform: 'capitalize' }}>{theme}</div>
                </div>
                {settings.theme === theme && (
                  <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Notifications */}
          <div className="section-title" style={{ marginBottom: 8 }}>Notifications</div>
          <div className="settings-section" style={{ marginBottom: 20 }}>
            <div className="settings-row">
              <span className="settings-row-icon">🔔</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Daily Reminder</div>
                <div className="settings-row-subtitle">
                  {notifPermission === 'unsupported'
                    ? 'Not supported in this browser'
                    : notifPermission === 'denied'
                    ? 'Blocked — allow in browser settings'
                    : "Don't break your streak 🔥"}
                </div>
              </div>
              <label className="toggle" aria-label="Toggle daily reminder">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={handleNotificationToggle}
                  disabled={notifPermission === 'unsupported' || notifPermission === 'denied'}
                  id="notifications-toggle"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {settings.notificationsEnabled && (
              <div className="settings-row">
                <span className="settings-row-icon">⏰</span>
                <div className="settings-row-content">
                  <div className="settings-row-title">Reminder Time</div>
                </div>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={e => handleTimeChange(e.target.value)}
                  style={{
                    width: 'auto',
                    padding: '6px 10px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1.5px solid var(--surface-border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text-primary)'
                  }}
                  id="notification-time-input"
                />
              </div>
            )}
          </div>

          {/* Data */}
          <div className="section-title" style={{ marginBottom: 8 }}>Data</div>
          <div className="settings-section" style={{ marginBottom: 20 }}>
            <div
              className="settings-row"
              onClick={handleExport}
              role="button"
              tabIndex={0}
              id="settings-export"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') handleExport();
              }}
            >
              <span className="settings-row-icon">📤</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Export Data</div>
                <div className="settings-row-subtitle">Download your habits and history as JSON</div>
              </div>
              <span className="settings-row-right">›</span>
            </div>

            <div
              className="settings-row"
              onClick={handleImportClick}
              role="button"
              tabIndex={0}
              id="settings-import"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') handleImportClick();
              }}
            >
              <span className="settings-row-icon">📥</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Import Data</div>
                <div className="settings-row-subtitle">
                  {importSuccess
                    ? '✓ Imported successfully!'
                    : importError
                    ? `Error: ${importError}`
                    : 'Restore from a backup JSON file'}
                </div>
              </div>
              <span className="settings-row-right">›</span>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section" style={{ marginBottom: 20 }}>
            <div
              className="settings-row settings-row-danger"
              onClick={() => setShowResetConfirm(true)}
              role="button"
              tabIndex={0}
              id="settings-reset"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setShowResetConfirm(true);
              }}
            >
              <span className="settings-row-icon">⚠️</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Reset All Data</div>
                <div className="settings-row-subtitle">Permanently delete everything</div>
              </div>
              <span className="settings-row-right" style={{ color: 'var(--danger)' }}>›</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Streakly v1.0 · Local-first · No account needed
          </p>

          <div style={{ height: 16 }} />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label="Import data file"
      />

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Reset All Data?</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              This will permanently delete ALL your habits, streaks, and completion history. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowResetConfirm(false)}
                id="reset-cancel-btn"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-full"
                onClick={handleReset}
                id="reset-confirm-btn"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
