/**
 * Hook for HomeAITuber radio WebSocket connection.
 * Connects to /radio-ws endpoint and manages radio segment state.
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
  const [connected, setConnected] = useState(false);
  const [segments, setSegments] = useState<RadioSegment[]>([]);
  const [state, setState] = useState<RadioState>({
    mode: 'radio',
    language: 'en-jp',
    engine_running: false,
  });

  const connect = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/radio-ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'radio-segment' && msg.segment) {
            setSegments(prev => [msg.segment, ...prev].slice(0, 10));
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
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (_) {
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendCommand = useCallback((cmd: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  const setMode = useCallback((mode: string) => {
    sendCommand({ type: 'set-mode', mode });
  }, [sendCommand]);

  const setLanguage = useCallback((language: string) => {
    sendCommand({ type: 'set-language', language });
  }, [sendCommand]);

  const fireRadio = useCallback((mood?: string) => {
    sendCommand({ type: 'request-radio', mood: mood || null });
  }, [sendCommand]);

  return {
    connected,
    segments,
    state,
    setMode,
    setLanguage,
    fireRadio,
    sendCommand,
  };
}
