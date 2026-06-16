/**
 * Hook for HomeAITuber radio WebSocket connection.
 * Connects to /radio-ws endpoint and manages radio segment state.
 * Features: exponential backoff reconnect (1s→30s cap), visibilitychange reconnect.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export interface RadioSegment {
  segment_id: string;
  en: string;
  jp: string;
  en_repeat: string;
  phrase: string;
  note: string;
  topic: string;
  mood: string;
  extra?: string;
  segments?: { en: string; jp: string }[];
  story_segment?: string;
  timestamp: string;
}

export interface RadioState {
  mode: string;       // 'chat' | 'radio' | 'radio-chat'
  language: string;   // 'en' | 'jp' | 'en-jp' | 'en-jp-note' | 'mixed'
  engine_running: boolean;
}

export function useRadioWs(baseUrl: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const backoffRef = useRef(1000);
  const [connected, setConnected] = useState(false);
  const [segments, setSegments] = useState<RadioSegment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [state, setState] = useState<RadioState>({
    mode: 'radio',
    language: 'en-jp',
    engine_running: false,
  });

  const connect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = undefined;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/radio-ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        backoffRef.current = 1000; // Reset backoff on successful connect
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'radio-segment' && msg.segment) {
            setSegments(prev => [msg.segment, ...prev].slice(0, 10));
            setGenerating(false); // Clear generating on successful segment
          } else if (msg.type === 'state-sync') {
            setState(prev => ({
              ...prev,
              ...(msg.mode && { mode: msg.mode }),
              ...(msg.language && { language: msg.language }),
              ...(msg.engine_running !== undefined && { engine_running: msg.engine_running }),
            }));
          } else if (msg.type === 'mode-changed') {
            setState(prev => ({ ...prev, mode: msg.mode }));
          } else if (msg.type === 'language-changed') {
            setState(prev => ({ ...prev, language: msg.language }));
          } else if (msg.type === 'pong') {
            // keepalive
          }
        } catch (_) { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(backoffRef.current, 30000);
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (_) {
      const delay = Math.min(backoffRef.current, 30000);
      backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      reconnectTimerRef.current = setTimeout(connect, delay);
    }
  }, []);

  useEffect(() => {
    connect();

    // visibilitychange: reconnect immediately when tab becomes visible
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const isStale = !wsRef.current
        || wsRef.current.readyState === WebSocket.CLOSED
        || wsRef.current.readyState === WebSocket.CLOSING;
      if (isStale) {
        backoffRef.current = 1000; // Reset backoff so reconnect is immediate
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [connect]);

  const sendCommand = useCallback((cmd: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  const setMode = useCallback((mode: string) => {
    // Optimistic update: show selected state immediately
    setState(prev => ({ ...prev, mode: mode as RadioState['mode'] }));
    sendCommand({ type: 'set-mode', mode });
  }, [sendCommand]);

  const setLanguage = useCallback((language: string) => {
    // Optimistic update: show selected state immediately
    setState(prev => ({ ...prev, language: language as RadioState['language'] }));
    sendCommand({ type: 'set-language', language });
  }, [sendCommand]);

  const fireRadio = useCallback((mood?: string) => {
    // Set generating flag for UI feedback
    setGenerating(true);
    sendCommand({ type: 'request-radio', mood: mood || null });
    // Auto-clear generating after 20s (safety net if no response)
    setTimeout(() => setGenerating(false), 20000);
  }, [sendCommand]);

  return {
    connected,
    segments,
    generating,
    state,
    setMode,
    setLanguage,
    fireRadio,
    sendCommand,
  };
}
