import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import type { AppSettings } from '../types';
import {
  requestNotificationPermission,
  getNotificationPermission
} from '../services/notifications';

const COMMON_ICONS = [
  '🧘', '💻', '💧', '🏋️', '📚', '🏃', '🧠', '🗣️', '😴',
  '🎸', '✍️', '🥗', '🌿', '🎯', '💪', '🍎', '🌙', '☀️'
];

interface SettingsProps {
  onManageHabits: () => void;
}

export default function Settings({ onManageHabits }: SettingsProps) {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, addHabit, exportData, importData, resetData } = useApp();
  const { isInstalled, isInstallable, isIOS, promptInstall, setShowIOSModal } = usePwa();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✨');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleAddHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    await addHabit({
      name: newHabitName.trim(),
      icon: newHabitIcon,
      active: true,
    });
    setNewHabitName('');
    setNewHabitIcon('✨');
    setShowAddModal(false);
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

    e.target.value = '';
  };

  const handleReset = async () => {
    await resetData();
    setShowResetConfirm(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const notifPermission = getNotificationPermission();

  return (
    <>
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
          </div>

          {/* Account Profile Section */}
          {user && (
            <div className="card card-padded" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                  aria-hidden="true"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name || 'Streakly Member'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Habits Management */}
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
                <div className="settings-row-subtitle">Edit, delete, reorder, or toggle active</div>
              </div>
              <span className="settings-row-right">›</span>
            </div>

            <div
              className="settings-row"
              onClick={() => setShowAddModal(true)}
              role="button"
              tabIndex={0}
              id="settings-add-habit"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setShowAddModal(true);
              }}
            >
              <span className="settings-row-icon">➕</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Add New Habit</div>
                <div className="settings-row-subtitle">Create a new habit to track daily</div>
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

          {/* App / PWA Installation */}
          <div className="section-title" style={{ marginBottom: 8 }}>App</div>
          <div className="settings-section" style={{ marginBottom: 20 }}>
            <div className="settings-row" id="settings-install-row">
              <span className="settings-row-icon">📱</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Install Habit Tracker</div>
                <div className="settings-row-subtitle">
                  {isInstalled
                    ? 'App is installed on your device'
                    : isIOS
                    ? 'Add to iPhone or iPad Home Screen'
                    : 'Install the app on your device for quick access'}
                </div>
              </div>
              {isInstalled ? (
                <span className="installed-badge" id="app-installed-badge">
                  App Installed ✓
                </span>
              ) : isInstallable ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={promptInstall}
                  id="settings-install-btn"
                >
                  Install
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowIOSModal(true)}
                  id="settings-install-help-btn"
                >
                  Instructions
                </button>
              )}
            </div>
          </div>

          {/* Data Export / Import */}
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

          {/* Account Actions / Logout */}
          <div className="section-title" style={{ marginBottom: 8 }}>Account</div>
          <div className="settings-section" style={{ marginBottom: 20 }}>
            <div
              className="settings-row"
              onClick={() => setShowLogoutConfirm(true)}
              role="button"
              tabIndex={0}
              id="settings-logout"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setShowLogoutConfirm(true);
              }}
            >
              <span className="settings-row-icon">🚪</span>
              <div className="settings-row-content">
                <div className="settings-row-title">Log Out</div>
                <div className="settings-row-subtitle">Sign out of your Streakly account</div>
              </div>
              <span className="settings-row-right">›</span>
            </div>

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
                <div className="settings-row-subtitle">Permanently delete your habits and history</div>
              </div>
              <span className="settings-row-right" style={{ color: 'var(--danger)' }}>›</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Streakly · Habit Streak Tracker
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

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">New Habit</div>

            <form onSubmit={handleAddHabitSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="settings-new-habit-name">Habit Name</label>
                <input
                  id="settings-new-habit-name"
                  type="text"
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  placeholder="e.g. Read 20 mins"
                  autoFocus
                  maxLength={40}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Icon</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowIconPicker(p => !p)}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                  id="settings-icon-picker-btn"
                >
                  <span style={{ fontSize: 22 }}>{newHabitIcon}</span>
                  <span>Choose icon</span>
                </button>

                {showIconPicker && (
                  <div className="icon-grid" style={{ marginTop: 8 }}>
                    {COMMON_ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        className={`icon-option ${ic === newHabitIcon ? 'selected' : ''}`}
                        onClick={() => { setNewHabitIcon(ic); setShowIconPicker(false); }}
                        aria-label={`Select icon ${ic}`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => setShowAddModal(false)}
                  id="settings-add-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={!newHabitName.trim()}
                  id="settings-add-save"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Log Out?</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => setShowLogoutConfirm(false)}
                id="logout-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-full"
                onClick={handleLogout}
                disabled={loggingOut}
                id="logout-confirm-btn"
              >
                {loggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => setShowResetConfirm(false)}
                id="reset-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
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
