/**
 * UiModeContext — controls Desktop vs Mobile layout preference.
 *
 * User picks: auto (default), desktop, or mobile.
 * - auto: effective mode is derived from CSS `pointer: coarse` (touch → mobile)
 * - desktop/mobile: explicit override
 *
 * Stored in localStorage under `ui-mode`.
 */
import React, {
  createContext, useContext, useState, useMemo, useCallback, useEffect,
} from 'react';

const STORAGE_KEY = 'ui-mode';

export type UiMode = 'auto' | 'desktop' | 'mobile';

interface UiModeState {
  /** The user's preference setting */
  uiMode: UiMode;
  /** The resolved effective mode (always 'desktop' or 'mobile') */
  effectiveMode: 'desktop' | 'mobile';
  setUiMode: (mode: UiMode) => void;
}

const UiModeContext = createContext<UiModeState | null>(null);

function getInitialUiMode(): UiMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'desktop' || stored === 'mobile') return stored;
  } catch { /* ignore */ }
  return 'auto';
}

function detectEffectiveMode(): 'desktop' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
}

export function UiModeProvider({ children }: { children: React.ReactNode }) {
  const [uiMode, setUiModeState] = useState<UiMode>(getInitialUiMode);
  const [effectiveMode, setEffectiveMode] = useState<'desktop' | 'mobile'>(
    () => uiMode === 'auto' ? detectEffectiveMode() : uiMode,
  );

  const setUiMode = useCallback((mode: UiMode) => {
    setUiModeState(mode);
    try {
      if (mode === 'auto') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch { /* ignore */ }
  }, []);

  // Re-evaluate effective mode when uiMode changes or pointer media query changes
  useEffect(() => {
    if (uiMode !== 'auto') {
      setEffectiveMode(uiMode);
      return;
    }

    const update = () => setEffectiveMode(detectEffectiveMode());
    update();

    const mq = window.matchMedia('(pointer: coarse)');
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    return undefined;
  }, [uiMode]);

  const value = useMemo(
    () => ({ uiMode, effectiveMode, setUiMode }),
    [uiMode, effectiveMode, setUiMode],
  );

  return (
    <UiModeContext.Provider value={value}>
      {children}
    </UiModeContext.Provider>
  );
}

export function useUiMode(): UiModeState {
  const ctx = useContext(UiModeContext);
  if (!ctx) throw new Error('useUiMode must be used within UiModeProvider');
  return ctx;
}
