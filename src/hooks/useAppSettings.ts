import { useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, getAppSettings } from '../services/settingsService';

/** Prices and rules from the admin Settings page (defaults until loaded). */
export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    getAppSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { settings, loaded };
};
