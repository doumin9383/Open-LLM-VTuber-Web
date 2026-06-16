/**
 * HomeAITuber Control Panel
 * Integrated into the sidebar — multi-agent streaming controls.
 *
 * v2: Added topic list management, interval slider, agent status.
 */

import {
  Box, Button, Flex, Text, Badge, Separator, Input, Select, createListCollection,
} from '@chakra-ui/react';
import {
  memo, useCallback, useState, useEffect, useRef,
} from 'react';
import { FiRadio } from 'react-icons/fi';
import { useRadioWs } from '@/hooks/homeaituber/use-radio-ws';
import { useGraphics } from '@/context/graphics-context';

const btnActive = { transform: 'scale(0.95)', transition: 'transform 0.08s' };

const LANGS = [
  { id: 'en', label: '🇬🇧 EN' },
  { id: 'jp', label: '🇯🇵 JP' },
  { id: 'en-jp', label: '🔁 EN→JP' },
  { id: 'en-jp-note', label: '📖 解説' },
  { id: 'mixed', label: '🎲 Mix' },
] as const;

const MOODS = [
  { id: 'brisk', label: '⚡ brisk' },
  { id: 'chaotic', label: '🤪 chaotic' },
  { id: 'chill', label: '😌 chill' },
  { id: 'thoughtful', label: '🤔 thoughtful' },
] as const;

const MODES = [
  { id: 'streaming', label: '▶️ Streaming' },
  { id: 'idle', label: '⏸️ Idle' },
] as const;

const INTERVAL_PRESETS = [
  { value: 60, label: '1m' },
  { value: 300, label: '5m' },
  { value: 600, label: '10m' },
  { value: 1800, label: '30m' },
] as const;

const AGENT_TYPE_LABEL: Record<string, string> = {
  main: '🎤',
  guest: '🎙️',
  director: '🎯',
};

// ── Topic input component ──

function TopicInput({ onAdd }: { onAdd: (t: string) => void }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
      inputRef.current?.focus();
    }
  }, [value, onAdd]);

  return (
    <Flex gap="1" mt="1">
      <Input
        ref={inputRef}
        size="xs"
        placeholder="Add topic..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        flex="1"
        minW="0"
      />
      <Button
        size="xs"
        colorPalette="green"
        variant="solid"
        onClick={handleSubmit}
        _active={btnActive}
        disabled={!value.trim()}
      >
        +
      </Button>
    </Flex>
  );
}

// ── Main panel ──

function HomeAITuberPanel(): JSX.Element {
  const {
    connected, state,
    setMode, setLanguage, setMood, fireRadio,
    setInterval, addTopic, removeTopic,
  } = useRadioWs('');

  const [localMood, setLocalMood] = useState('brisk');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const { enabled: graphicsEnabled, toggle: toggleGraphics } = useGraphics();

  useEffect(() => {
    localStorage.setItem('ha-mode', state.mode);
    localStorage.setItem('ha-language', state.language);
    localStorage.setItem('ha-mood', localMood);
  }, [state.mode, state.language, localMood]);

  useEffect(() => {
    const saved = localStorage.getItem('ha-mood');
    if (saved !== null) setLocalMood(saved);
  }, []);

  const handleFire = useCallback(() => {
    setMood(localMood);
    fireRadio(localMood, undefined, selectedSpeaker || undefined);
  }, [fireRadio, setMood, localMood, selectedSpeaker]);

  const handleMoodChange = useCallback((id: string) => {
    setLocalMood(id);
    setMood(id);
  }, [setMood]);

  const handleIntervalChange = useCallback((seconds: number) => {
    setInterval(seconds);
  }, [setInterval]);

  const handleAddTopic = useCallback((topic: string) => {
    addTopic(topic);
  }, [addTopic]);

  const isStreaming = state.mode === 'streaming';

  const isDirectorActive = state.agents.some(a => a.type === 'director');

  // Agent list with visual grouping
  const speakingAgents = state.agents.filter(a => a.type !== 'director');
  const directorAgent = state.agents.find(a => a.type === 'director');

  return (
    <Box>
      {/* Status */}
      <Flex align="center" gap="2" mb="3" px="1" wrap="wrap">
        <Box
          w="8px" h="8px" borderRadius="full"
          bg={connected ? 'green.400' : 'red.400'}
          boxShadow={connected ? '0 0 6px rgba(72,199,142,0.5)' : undefined}
        />
        <Text fontSize="xs" color="whiteAlpha.600">
          {connected ? 'Streaming control connected' : 'Disconnected'}
        </Text>
        {state.scheduler_running && (
          <Badge size="xs" variant="subtle" colorPalette="green">auto</Badge>
        )}
        {isDirectorActive && (
          <Badge size="xs" variant="subtle" colorPalette="purple">🎯 Director</Badge>
        )}
      </Flex>

      {/* Interval preset */}
      <Text fontSize="xs" color="whiteAlpha.500" mb="1" fontWeight="medium">⏱️ Tick interval</Text>
      <Flex gap="1" mb="3" wrap="wrap">
        {INTERVAL_PRESETS.map(p => (
          <Button
            key={p.value}
            size="xs"
            variant={state.interval === p.value ? 'solid' : 'outline'}
            colorPalette={state.interval === p.value ? 'green' : 'gray'}
            onClick={() => handleIntervalChange(p.value)}
            flex="1"
            minW="0"
            _active={btnActive}
          >
            {p.label}
          </Button>
        ))}
      </Flex>

      {/* Agents */}
      <Text fontSize="xs" color="whiteAlpha.500" mb="1" fontWeight="medium">👥 Agents</Text>
      <Flex gap="1" mb="3" wrap="wrap">
        {state.agents.map(a => {
          const icon = AGENT_TYPE_LABEL[a.type] || '❓';
          const isSelected = selectedSpeaker === a.name;
          const color = a.type === 'main' ? 'green'
            : a.type === 'director' ? 'purple'
            : 'blue';
          return (
            <Button
              key={a.name}
              size="xs"
              variant={isSelected ? 'solid' : 'outline'}
              colorPalette={isSelected ? color : 'gray'}
              onClick={() => setSelectedSpeaker(isSelected ? null : a.name)}
              flex="1"
              minW="0"
              fontSize="11px"
              _active={btnActive}
            >
              {icon} {a.name}
            </Button>
          );
        })}
      </Flex>

      {/* Graphics toggle */}
      <Flex align="center" justify="space-between" mb="3" px="1">
        <Text fontSize="xs" color="whiteAlpha.500" fontWeight="medium">🖼️ Live2D</Text>
        <Button
          size="xs"
          variant={graphicsEnabled ? 'solid' : 'outline'}
          colorPalette={graphicsEnabled ? 'green' : 'gray'}
          onClick={toggleGraphics}
          _active={btnActive}
        >
          {graphicsEnabled ? 'ON' : 'OFF'}
        </Button>
      </Flex>

      {/* Mode toggle */}
      <Text fontSize="xs" color="whiteAlpha.500" mb="1" fontWeight="medium">📋 Mode</Text>
      <Flex gap="1" mb="3" wrap="wrap">
        {MODES.map(m => (
          <Button
            key={m.id}
            size="xs"
            variant={state.mode === m.id ? 'solid' : 'outline'}
            colorPalette={state.mode === m.id ? 'green' : 'gray'}
            onClick={() => setMode(m.id)}
            flex="1"
            minW="0"
            _active={btnActive}
          >
            {m.label}
          </Button>
        ))}
      </Flex>

      {/* Language */}
      <Text fontSize="xs" color="whiteAlpha.500" mb="1" fontWeight="medium">🌐 Language</Text>
      <Flex gap="1" mb="3" wrap="wrap">
        {LANGS.map(l => (
          <Button
            key={l.id}
            size="xs"
            variant={state.language === l.id ? 'solid' : 'outline'}
            colorPalette={state.language === l.id ? 'green' : 'gray'}
            onClick={() => setLanguage(l.id)}
            flex="1"
            minW="0"
            fontSize="11px"
            _active={btnActive}
          >
            {l.label}
          </Button>
        ))}
      </Flex>

      {/* Mood */}
      <Text fontSize="xs" color="whiteAlpha.500" mb="1" fontWeight="medium">🎭 Mood</Text>
      <Flex gap="1" mb="3" wrap="wrap">
        {MOODS.map(m => (
          <Button
            key={m.id}
            size="xs"
            variant={localMood === m.id ? 'solid' : 'outline'}
            colorPalette={localMood === m.id ? 'green' : 'gray'}
            onClick={() => handleMoodChange(m.id)}
            flex="1"
            minW="0"
            fontSize="10px"
            _active={btnActive}
          >
            {m.label}
          </Button>
        ))}
      </Flex>

      {/* Fire now */}
      <Button
        size="sm"
        colorPalette="pink"
        variant="solid"
        width="100%"
        mb="3"
        onClick={handleFire}
        _active={{ transform: 'scale(0.96)' }}
      >
        <FiRadio /> {selectedSpeaker ? `🎤 ${selectedSpeaker}` : '📻'} Fire now
      </Button>

      {/* Topic list */}
      {state.topics.length > 0 && (
        <>
          <Text fontSize="xs" color="whiteAlpha.500" mb="1" fontWeight="medium">📋 Topics</Text>
          <Flex gap="1" mb="2" wrap="wrap">
            {state.topics.map(t => (
              <Badge
                key={t}
                size="sm"
                variant="subtle"
                colorPalette="teal"
                cursor="pointer"
                onClick={() => removeTopic(t)}
                title="Click to remove"
                _hover={{ opacity: 0.7 }}
              >
                {t} ✕
              </Badge>
            ))}
          </Flex>
        </>
      )}

      <TopicInput onAdd={handleAddTopic} />

      <Separator mb="3" mt="3" borderColor="whiteAlpha.200" />

      {/* Info */}
      <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">
        {isStreaming
          ? `Auto-streaming every ${state.interval}s ${isDirectorActive ? '🎯 Director active' : ''}`
          : 'Streaming paused — press ▶️ to resume'}
      </Text>
    </Box>
  );
}

export default memo(HomeAITuberPanel);
