/**
 * PWA Install Prompt — shows a tasteful bottom card for installing Streakly.
 * 
 * - Captures the `beforeinstallprompt` event on supported browsers
 * - Shows iOS manual install instructions when native prompt is unavailable
 * - Remembers dismissal so it doesn't annoy users
 * - Never re-shows after successful install
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already dismissed recently or already installed
    const dismissed = localStorage.getItem('streakly-install-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Don't show again for 7 days after dismissal
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }

    // Listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Show our custom UI after a small delay
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setShow(false);
      deferredPrompt.current = null;
      localStorage.setItem('streakly-install-dismissed', String(Date.now()));
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    
    if (outcome === 'accepted') {
      setShow(false);
    }
    
    deferredPrompt.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem('streakly-install-dismissed', String(Date.now()));
  }, []);

  if (!show) return null;

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Streakly">
      <div className="install-prompt-content">
        <div className="install-prompt-left">
          <div className="install-prompt-icon">📱</div>
          <div>
            <div className="install-prompt-title">Install Streakly</div>
            <div className="install-prompt-sub">
              {isIOS
                ? 'Tap Share → Add to Home Screen'
                : 'Keep your streaks one tap away.'}
            </div>
          </div>
        </div>
        <div className="install-prompt-actions">
          {!isIOS && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleInstall}
              id="install-btn"
            >
              Install
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDismiss}
            id="install-dismiss-btn"
          >
            {isIOS ? 'Got it' : 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
}
