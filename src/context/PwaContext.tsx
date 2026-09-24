/**
 * PWA Context & Hook — handles installation prompt state, iOS detection,
 * standalone mode detection, and install actions for both the banner and Settings.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextValue {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  showBanner: boolean;
  showIOSModal: boolean;
  promptInstall: () => Promise<void>;
  dismissBanner: () => void;
  setShowIOSModal: (show: boolean) => void;
}

const PwaContext = createContext<PwaContextValue | null>(null);

const DISMISS_KEY = 'streakly_pwa_install_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check standalone mode (PWA already running installed)
    const isStandalone =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://'));

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Check dismissal history
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    const isDismissedRecently =
      dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;

    // 4. Capture beforeinstallprompt for Chromium/Android/Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      if (!isDismissedRecently) {
        // Show banner after 2.5s initial visit
        const timer = setTimeout(() => setShowBanner(true), 2500);
        return () => clearTimeout(timer);
      }
    };

    // 5. Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS users who haven't dismissed recently, show the install banner after 4s
    if (isIOSDevice && !isDismissedRecently && !isStandalone) {
      const iosTimer = setTimeout(() => setShowBanner(true), 4000);
      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    setShowBanner(false);
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('Error invoking install prompt:', err);
      } finally {
        setDeferredPrompt(null);
      }
    } else {
      setShowIOSModal(true);
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        isInstallable: !!deferredPrompt || (isIOS && !isInstalled),
        isIOS,
        showBanner,
        showIOSModal,
        promptInstall,
        dismissBanner,
        setShowIOSModal
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa(): PwaContextValue {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return ctx;
}
