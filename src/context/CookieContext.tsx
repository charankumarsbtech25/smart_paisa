import React, { createContext, useContext, useState, useEffect } from 'react';
import { CookiePreferences } from '@/types/privacy';
import { LocalStore } from '@/lib/storage';

interface CookieContextType {
  preferences: CookiePreferences | null;
  bannerVisible: boolean;
  customizeModalOpen: boolean;
  setCustomizeModalOpen: (open: boolean) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveCustomPreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
  withdrawConsent: () => void;
  openPreferences: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const saved = LocalStore.getCookiePreferences();
    if (saved) {
      setPreferences(saved);
      setBannerVisible(false);
    } else {
      // First visit: show cookie banner
      setBannerVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const newPrefs: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    LocalStore.saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
    setBannerVisible(false);
    setCustomizeModalOpen(false);
  };

  const rejectOptional = () => {
    const newPrefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    LocalStore.saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
    setBannerVisible(false);
    setCustomizeModalOpen(false);
  };

  const saveCustomPreferences = (custom: { analytics: boolean; marketing: boolean }) => {
    const newPrefs: CookiePreferences = {
      essential: true,
      analytics: custom.analytics,
      marketing: custom.marketing,
      timestamp: new Date().toISOString(),
    };
    LocalStore.saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
    setBannerVisible(false);
    setCustomizeModalOpen(false);
  };

  const withdrawConsent = () => {
    const newPrefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    LocalStore.saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  const openPreferences = () => {
    setCustomizeModalOpen(true);
  };

  return (
    <CookieContext.Provider
      value={{
        preferences,
        bannerVisible,
        customizeModalOpen,
        setCustomizeModalOpen,
        acceptAll,
        rejectOptional,
        saveCustomPreferences,
        withdrawConsent,
        openPreferences,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
};

export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
}
