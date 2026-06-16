/**
 * Hook for HomeAITuber streaming control WebSocket connection.
 * Connects to /radio-ws endpoint (now purely a control channel).
 *
 * Audio, Live2D expressions, and lipsync no longer go through this
 * channel — they come through the main /client-ws WebSocket via the
 * normal chat pipeline (process_single_conversation).
 *
 * Features: exponential backoff reconnect (1s→30s cap),
 *           visibilitychange reconnect, keepalive pings, singleton connection.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface RadioState {
  mode: string;       // 'streaming' | 'idle'
  language: string;   // 'en' | 'jp' | 'en-jp' | 'en-jp-note' | 'mixed'
  scheduler_running: boolean;
}

// ── Singleton: one control WebSocket, refs shared across all instances ──

let singletonWs: WebSocket | null = null;
let singletonConnectCount = 0;
let singletonReconnectTimer: ReturnType<typeof setTimeout> | undefined;
let singletonBackoff = 1000;
let singletonConnected = false;
let singletonState: RadioState = {
  mode: 'streaming',
  language: 'en-jp',
  scheduler_running: false,
};
let singletonListeners: Set<() => void> = new Set();
let singletonPingTimer: ReturnType<typeof setInterval> | undefined;

function notifyListeners() {
  singletonListeners.forEach(fn => fn());
}

function singletonConnect() {
  if (singletonReconnectTimer) {
    clearTimeout(singletonReconnectTimer);
    singletonReconnectTimer = undefined;
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${proto}//${window.location.host}/radio-ws`;

  try {
    const ws = new WebSocket(wsUrl);
    singletonWs = ws;

    ws.onopen = () => {
      singletonConnected = true;
      singletonBackoff = 1000;
      notifyListeners();

      if (singletonPingTimer) clearInterval(singletonPingTimer);
      singletonPingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state-sync') {
          singletonState = {
            ...singletonState,
            ...(msg.mode && { mode: msg.mode }),
            ...(msg.language && { language: msg.language }),
            ...(msg.scheduler_running !== undefined && { scheduler_running: msg.scheduler_running }),
          };
          notifyListeners();
        } else if (msg.type === 'mode-changed') {
          singletonState = { ...singletonState, mode: msg.mode };
          notifyListeners();
        } else if (msg.type === 'language-changed') {
          singletonState = { ...singletonState, language: msg.language };
          notifyListeners();
        } else if (msg.type === 'mood-changed' || msg.type === 'request-ack' || msg.type === 'pong') {
          // acknowledged — no UI state to update
        }
      } catch (_) { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      singletonConnected = false;
      singletonWs = null;
      if (singletonPingTimer) {
        clearInterval(singletonPingTimer);
        singletonPingTimer = undefined;
      }
      notifyListeners();

      if (singletonListeners.size > 0) {
        const delay = Math.min(singletonBackoff, 30000);
        singletonBackoff = Math.min(singletonBackoff * 2, 30000);
        singletonReconnectTimer = setTimeout(singletonConnect, delay);
      }
    };

    ws.onerror = () => { ws.close(); };
  } catch (_) {
    if (singletonListeners.size > 0) {
      const delay = Math.min(singletonBackoff, 30000);
      singletonBackoff = Math.min(singletonBackoff * 2, 30000);
      singletonReconnectTimer = setTimeout(singletonConnect, delay);
    }
  }
}

function singletonDisconnect() {
  singletonListeners.clear();
  if (singletonPingTimer) {
    clearInterval(singletonPingTimer);
    singletonPingTimer = undefined;
  }
  if (singletonReconnectTimer) {
    clearTimeout(singletonReconnectTimer);
    singletonReconnectTimer = undefined;
  }
  if (singletonWs) {
    singletonWs.close();
    singletonWs = null;
  }
  singletonConnected = false;
}

function singletonSend(cmd: Record<string, unknown>) {
  if (singletonWs?.readyState === WebSocket.OPEN) {
    singletonWs.send(JSON.stringify(cmd));
  }
}

// ── React hook ──

export function useRadioWs(_baseUrl: string) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    singletonListeners.add(listener);

    singletonConnectCount++;
    if (!singletonWs) {
      singletonConnect();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const isStale = !singletonWs
        || singletonWs.readyState === WebSocket.CLOSED
        || singletonWs.readyState === WebSocket.CLOSING;
      if (isStale) {
        singletonBackoff = 1000;
        singletonConnect();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      singletonListeners.delete(listener);
      singletonConnectCount--;
      if (singletonConnectCount <= 0) {
        singletonDisconnect();
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const sendCommand = useCallback((cmd: Record<string, unknown>) => {
    singletonSend(cmd);
  }, []);

  const setMode = useCallback((mode: string) => {
    singletonState = { ...singletonState, mode: mode as RadioState['mode'] };
    notifyListeners();
    singletonSend({ type: 'set-mode', mode });
  }, []);

  const setLanguage = useCallback((language: string) => {
    singletonState = { ...singletonState, language: language as RadioState['language'] };
    notifyListeners();
    singletonSend({ type: 'set-language', language });
  }, []);

  const setMood = useCallback((mood: string) => {
    singletonSend({ type: 'set-mood', mood });
  }, []);

  const fireRadio = useCallback((mood?: string) => {
    singletonSend({ type: 'request-radio', mood: mood || null });
  }, []);

  return {
    connected: singletonConnected,
    state: singletonState,
    setMode,
    setLanguage,
    setMood,
    fireRadio,
    sendCommand,
  };
}
