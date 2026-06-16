/**
 * HomeAITuber Control Panel
 * Integrated into the sidebar — streaming controls, mood, language, fire button.
 *
 * Audio/Live2D now go through the main /client-ws (normal chat pipeline),
 * not through /radio-ws. This panel is purely a control interface.
 */
import {
  Box, Button, Flex, Text, Badge, Separator,
} from '@chakra-ui/react';
import {
  memo, useCallback, useState, useEffect,
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

// ── Main ──

function HomeAITuberPanel(): JSX.Element {
  const {
    connected, state,
    setMode, setLanguage, setMood, fireRadio,
  } = useRadioWs('');

  const [localMood, setLocalMood] = useState('brisk');
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
    fireRadio(localMood);
  }, [fireRadio, setMood, localMood]);

  const handleMoodChange = useCallback((id: string) => {
    setLocalMood(id);
    setMood(id);
  }, [setMood]);

  const isStreaming = state.mode === 'streaming';

  return (
    <Box>
      {/* Status */}
      <Flex align="center" gap="2" mb="3" px="1">
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
        <FiRadio /> 📻 Fire now
      </Button>

      <Separator mb="3" borderColor="whiteAlpha.200" />

      {/* Info */}
      <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">
        {isStreaming
          ? 'Auto-streaming active — Live2D works through main channel'
          : 'Streaming paused — press ▶️ to resume'}
      </Text>
    </Box>
  );
}

export default memo(HomeAITuberPanel);
