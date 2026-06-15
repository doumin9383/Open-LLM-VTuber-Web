/**
 * HomeAITuber Control Panel
 * Integrated into the sidebar — mode, language, mood, fire, history.
 */
import {
  Box, Button, Flex, Text, Badge, Separator,
} from '@chakra-ui/react';
import {
  memo, useCallback, useState, useEffect,
} from 'react';
import { FiRadio } from 'react-icons/fi';
import { useRadioWs, RadioSegment } from '@/hooks/homeaituber/use-radio-ws';

const MODES = [
  { id: 'chat', label: '💬 Chat' },
  { id: 'radio', label: '📻 Radio' },
  { id: 'radio-chat', label: '🎙️ Radio+Chat' },
] as const;

const LANGS = [
  { id: 'en', label: '🇬🇧 EN' },
  { id: 'jp', label: '🇯🇵 JP' },
  { id: 'en-jp', label: '🔁 EN→JP' },
  { id: 'en-jp-note', label: '📖 解説' },
  { id: 'mixed', label: '🎲 Mix' },
] as const;

const MOODS = [
  { id: '', label: '🎭 auto' },
  { id: 'chaotic', label: '🤪 chaotic' },
  { id: 'chill', label: '😌 chill' },
  { id: 'brisk', label: '⚡ brisk' },
  { id: 'thoughtful', label: '🤔 thoughtful' },
] as const;

// ── Sub-components ──

function SegmentItem({ segment }: { segment: RadioSegment }) {
  const moodPalette = segment.mood === 'chaotic' ? 'red'
    : segment.mood === 'chill' ? 'blue'
      : segment.mood === 'brisk' ? 'green'
        : 'yellow';
  return (
    <Box
      p="6px 8px"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      fontSize="xs"
    >
      <Flex justify="space-between" align="center" mb="1">
        <Text color="green.300" fontWeight="medium" fontSize="11px" truncate maxW="75%">
          {segment.en?.substring(0, 50)}{(segment.en?.length ?? 0) > 50 ? '…' : ''}
        </Text>
        <Badge size="xs" variant="subtle" colorPalette={moodPalette}>
          {segment.mood || '?'}
        </Badge>
      </Flex>
      <Text color="yellow.300" fontSize="10px">
        {segment.jp?.substring(0, 60)}
      </Text>
    </Box>
  );
}

// ── Main ──

function HomeAITuberPanel(): JSX.Element {
  const {
    connected, segments, state,
    setMode, setLanguage, fireRadio,
  } = useRadioWs('');

  const [mood, setMoodState] = useState('');

  // Persist
  useEffect(() => {
    localStorage.setItem('ha-mode', state.mode);
    localStorage.setItem('ha-language', state.language);
    localStorage.setItem('ha-mood', mood);
  }, [state.mode, state.language, mood]);

  // Load saved mood
  useEffect(() => {
    const saved = localStorage.getItem('ha-mood');
    if (saved !== null) setMoodState(saved);
  }, []);

  const handleFire = useCallback(() => {
    fireRadio(mood || undefined);
  }, [fireRadio, mood]);

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
          {connected ? 'Radio connected' : 'Radio disconnected'}
        </Text>
      </Flex>

      {/* Mode */}
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
            variant={mood === m.id ? 'solid' : 'outline'}
            colorPalette={mood === m.id ? 'green' : 'gray'}
            onClick={() => setMoodState(m.id)}
            flex="1"
            minW="0"
            fontSize="10px"
          >
            {m.label}
          </Button>
        ))}
      </Flex>

      {/* Fire */}
      <Button
        size="sm"
        colorPalette="pink"
        variant="solid"
        width="100%"
        mb="3"
        onClick={handleFire}
      >
        <FiRadio /> 📻 Fire Radio
      </Button>

      <Separator mb="3" borderColor="whiteAlpha.200" />

      {/* Recent */}
      <Text fontSize="xs" color="whiteAlpha.500" mb="2" fontWeight="medium">📜 Recent Radio</Text>
      <Box maxH="200px" overflowY="auto" borderRadius="md" bg="whiteAlpha.50">
        {segments.length === 0 ? (
          <Text fontSize="xs" color="whiteAlpha.400" p="3" textAlign="center">
            No segments yet — press 📻
          </Text>
        ) : (
          segments.map(seg => (
            <SegmentItem key={seg.segment_id} segment={seg} />
          ))
        )}
      </Box>
    </Box>
  );
}

export default memo(HomeAITuberPanel);
