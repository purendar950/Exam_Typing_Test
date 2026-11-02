import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [showBanner, setShowBanner] = useState<boolean>(true);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // If already installed and online, hide
  if (!isOffline && (isInstalled || !deferredPrompt || !showBanner)) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9998,
        maxWidth: '380px',
        width: 'calc(100% - 32px)',
        background: isOffline ? '#064e3b' : '#0f172a',
        color: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        border: `1.5px solid ${isOffline ? '#10b981' : '#0284c7'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.4rem' }}>{isOffline ? '⚡' : '📲'}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
            {isOffline ? 'Offline Mode Active' : 'Install UP Typing App'}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
            {isOffline
              ? 'Practicing without internet. All passages cached.'
              : 'Install on your phone or PC for instant offline typing.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {!isOffline && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '1rem',
            cursor: 'pointer',
            padding: '2px 6px'
          }}
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
