/**
 * Context for Live2D graphics visibility (on/off toggle).
 * Used by HomeAITuberPanel toggle button and Live2D component.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface GraphicsContextValue {
  enabled: boolean;
  toggle: () => void;
}

const GraphicsContext = createContext<GraphicsContextValue>({
  enabled: true,
  toggle: () => {},
});

export function GraphicsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('ha-graphics');
      return saved !== 'off';
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('ha-graphics', next ? 'on' : 'off'); } catch {}
      return next;
    });
  }, []);

  return (
    <GraphicsContext.Provider value={{ enabled, toggle }}>
      {children}
    </GraphicsContext.Provider>
  );
}

export function useGraphics() {
  return useContext(GraphicsContext);
}
