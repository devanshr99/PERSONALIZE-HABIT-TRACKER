/**
 * PWA Install Prompt & iOS Instruction Modal
 * Renders an elegant custom banner when installable, plus an iOS instruction sheet.
 */
import React from 'react';
import { usePwa } from '../context/PwaContext';

export default function InstallPrompt() {
  const {
    showBanner,
    showIOSModal,
    isIOS,
    promptInstall,
    dismissBanner,
    setShowIOSModal
  } = usePwa();

  return (
    <>
      {/* ─── Custom Floating Install Banner ─── */}
      {showBanner && (
        <div
          className="install-prompt-overlay"
          role="dialog"
          aria-label="Install Habit Tracker app"
        >
          <div className="install-prompt-card">
            <div className="install-prompt-top">
              <div className="install-prompt-badge">
                <span className="install-prompt-fire" aria-hidden="true">🔥</span>
              </div>
              <div className="install-prompt-text">
                <h2 className="install-prompt-title">Install Habit Tracker</h2>
                <p className="install-prompt-desc">
                  Get quick access to your habits from your home screen.
                </p>
              </div>
              <button
                type="button"
                className="install-prompt-close"
                onClick={dismissBanner}
                aria-label="Dismiss install prompt"
              >
                ✕
              </button>
            </div>

            <div className="install-prompt-actions">
              <button
                type="button"
                className="btn btn-primary install-action-btn"
                onClick={promptInstall}
                id="pwa-install-btn"
              >
                Install App
              </button>
              <button
                type="button"
                className="btn btn-ghost install-dismiss-btn"
                onClick={dismissBanner}
                id="pwa-dismiss-btn"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Installation Instruction Sheet ─── */}
      {showIOSModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowIOSModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-sheet-title"
        >
          <div className="modal-sheet ios-install-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="ios-install-icon">📱</div>
              <h2 id="install-sheet-title" style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>
                Install Habit Tracker
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                {isIOS
                  ? 'Add to your home screen for the full app experience'
                  : 'Install on your device for quick access anytime'}
              </p>
            </div>

            {isIOS ? (
              <div className="ios-steps">
                <div className="ios-step-item">
                  <div className="ios-step-num">1</div>
                  <div className="ios-step-content">
                    <span className="ios-step-title">Tap Share</span>
                    <span className="ios-step-subtitle">
                      In the Safari toolbar at the bottom of the screen:
                      <span className="ios-share-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share
                      </span>
                    </span>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="ios-step-num">2</div>
                  <div className="ios-step-content">
                    <span className="ios-step-title">Choose "Add to Home Screen"</span>
                    <span className="ios-step-subtitle">
                      Scroll down in the share sheet and tap:
                      <span className="ios-share-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Add to Home Screen
                      </span>
                    </span>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="ios-step-num">3</div>
                  <div className="ios-step-content">
                    <span className="ios-step-title">Tap "Add" in top-right</span>
                    <span className="ios-step-subtitle">
                      Habit Tracker will appear as a standalone app on your home screen!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ios-steps">
                <div className="ios-step-item">
                  <div className="ios-step-num">1</div>
                  <div className="ios-step-content">
                    <span className="ios-step-title">Open Browser Menu or Address Bar</span>
                    <span className="ios-step-subtitle">
                      Look for the Install icon (⊕ / ⬇) in your address bar or browser menu (⋮).
                    </span>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="ios-step-num">2</div>
                  <div className="ios-step-content">
                    <span className="ios-step-title">Click "Install Habit Tracker"</span>
                    <span className="ios-step-subtitle">
                      Confirm installation to pin Habit Tracker directly to your desktop or apps.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-full"
              style={{ marginTop: 24 }}
              onClick={() => setShowIOSModal(false)}
              id="ios-install-got-it"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
