/**
 * Hook for HomeAITuber radio WebSocket connection.
 * Connects to /radio-ws endpoint and manages radio segment state.
 * Features: exponential backoff reconnect (1s→30s cap), visibilitychange reconnect,
 *           audio playback, keepalive pings, singleton connection.
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

// ── Singleton: one WebSocket, one audio element, refs shared across all instances ──

let singletonWs: WebSocket | null = null;
let singletonConnectCount = 0;
let singletonReconnectTimer: ReturnType<typeof setTimeout> | undefined;
let singletonBackoff = 1000;
let singletonConnected = false;
let singletonGenerating = false;
let singletonSegments: RadioSegment[] = [];
let singletonState: RadioState = {
  mode: 'radio',
  language: 'en-jp',
  engine_running: false,
};
let singletonLastMood = '';
let singletonListeners: Set<() => void> = new Set();
let singletonPingTimer: ReturnType<typeof setInterval> | undefined;

// Call all listeners to trigger React re-renders
function notifyListeners() {
  singletonListeners.forEach(fn => fn());
}

// Audio queue for sequential playback
interface AudioQueueEntry {
  url: string;
  base64: string;
  mood?: string;
}

let audioQueue: AudioQueueEntry[] = [];
let audioPlaying = false;

function playNextInQueue() {
  if (audioPlaying || audioQueue.length === 0) return;
  audioPlaying = true;
  const entry = audioQueue.shift()!;
  const audio = new Audio(entry.url);

  // Start Live2D lip sync for radio audio
  if ((window as any).startRadioLipSync) {
    (window as any).startRadioLipSync(entry.base64, entry.mood);
  }

  audio.play().catch(e => {
    console.warn('[HA Radio] Audio play failed:', e);
    URL.revokeObjectURL(entry.url);
    audioPlaying = false;
    setTimeout(playNextInQueue, 200);
  });
  audio.onended = () => {
    URL.revokeObjectURL(entry.url);
    audioPlaying = false;
    setTimeout(playNextInQueue, 200);
  };
}

function playAudio(base64Data: string, mood?: string) {
  try {
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    audioQueue.push({ url, base64: base64Data, mood });
    playNextInQueue();
  } catch (e) {
    console.warn('[HA Radio] Audio decode failed:', e);
  }
}

function singletonConnect() {
  // Clear any pending reconnect
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

      // Start keepalive pings every 30s
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
        if (msg.type === 'radio-segment' && msg.segment) {
          singletonSegments = [msg.segment, ...singletonSegments].slice(0, 10);
          singletonGenerating = false;
          // Update subtitle from radio segment
          const segment = msg.segment as RadioSegment;
          if ((window as any).setRadioSubtitle) {
            const subtitleText = segment.jp || segment.en || segment.en_repeat || '';
            if (subtitleText) {
              (window as any).setRadioSubtitle(subtitleText);
            }
          }
          // Store mood for upcoming audio messages
          singletonLastMood = segment.mood || '';
          notifyListeners();
        } else if (msg.type === 'state-sync') {
          singletonState = {
            ...singletonState,
            ...(msg.mode && { mode: msg.mode }),
            ...(msg.language && { language: msg.language }),
            ...(msg.engine_running !== undefined && { engine_running: msg.engine_running }),
          };
          notifyListeners();
        } else if (msg.type === 'mode-changed') {
          singletonState = { ...singletonState, mode: msg.mode };
          notifyListeners();
        } else if (msg.type === 'language-changed') {
          singletonState = { ...singletonState, language: msg.language };
          notifyListeners();
        } else if (msg.type === 'audio' && msg.audio) {
          // Radio TTS audio playback with lip sync (mood from last segment)
          playAudio(msg.audio, singletonLastMood);
        } else if (msg.type === 'pong') {
          // keepalive response received
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

      // Only reconnect if there are active subscribers
      if (singletonListeners.size > 0) {
        const delay = Math.min(singletonBackoff, 30000);
        singletonBackoff = Math.min(singletonBackoff * 2, 30000);
        singletonReconnectTimer = setTimeout(singletonConnect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
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
  const listenerRef = useRef<() => void>();

  // Subscribe/unsubscribe to singleton state changes
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listenerRef.current = listener;
    singletonListeners.add(listener);

    // First subscriber triggers connection
    singletonConnectCount++;
    if (!singletonWs) {
      singletonConnect();
    }

    // Visibility change: reconnect immediately when tab becomes visible
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
    // Optimistic update
    singletonState = { ...singletonState, mode: mode as RadioState['mode'] };
    notifyListeners();
    singletonSend({ type: 'set-mode', mode });
  }, []);

  const setLanguage = useCallback((language: string) => {
    // Optimistic update
    singletonState = { ...singletonState, language: language as RadioState['language'] };
    notifyListeners();
    singletonSend({ type: 'set-language', language });
  }, []);

  const fireRadio = useCallback((mood?: string) => {
    singletonGenerating = true;
    notifyListeners();
    singletonSend({ type: 'request-radio', mood: mood || null });
    setTimeout(() => {
      singletonGenerating = false;
      notifyListeners();
    }, 20000);
  }, []);

  return {
    connected: singletonConnected,
    segments: singletonSegments,
    generating: singletonGenerating,
    state: singletonState,
    setMode,
    setLanguage,
    fireRadio,
    sendCommand,
  };
}
