/**
 * RadioSegmentToast — floating notification for radio segment arrival.
 * Slides in from bottom-right, auto-dismisses after 30s.
 */
import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { memo, useEffect, useState, useCallback } from 'react';
import { RadioSegment } from '@/hooks/homeaituber/use-radio-ws';

interface RadioSegmentToastProps {
  segment: RadioSegment | null;
  onDismiss: () => void;
}

function RadioSegmentToastInner({ segment, onDismiss }: RadioSegmentToastProps): JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!segment) {
      setVisible(false);
      return;
    }

    // Small delay for entrance animation
    const showTimer = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 30s
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500); // Wait for fade-out
    }, 30000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [segment, onDismiss]);

  if (!segment) return null;

  const moodPalette =
    segment.mood === 'chaotic' ? 'red'
    : segment.mood === 'chill' ? 'blue'
    : segment.mood === 'brisk' ? 'green'
    : segment.mood === 'thoughtful' ? 'yellow'
    : 'gray';

  return (
    <Box
      position="fixed"
      bottom={{ base: '160px', md: '80px' }}
      right="16px"
      zIndex={9998}
      opacity={visible ? 1 : 0}
      transform={visible ? 'translateY(0)' : 'translateY(20px)'}
      transition="all 0.3s ease"
      maxW={{ base: '90vw', md: '400px' }}
      display={{ base: 'none', md: 'block' }}
    >
      <Box
        bg="#16213e"
        border="2px solid"
        borderColor={segment.mood ? `${moodPalette}.400` : 'green.400'}
        borderRadius="12px"
        p="12px 16px"
        boxShadow="0 4px 20px rgba(0,0,0,0.5)"
      >
        <Flex justify="space-between" align="center" mb="6px">
          <Text color={`${moodPalette}.400`} fontWeight="bold" fontSize="11px" textTransform="uppercase">
            📻 Radio · {segment.mood || 'brisk'}
          </Text>
          <Text color="whiteAlpha.600" fontSize="10px">
            {new Date(segment.timestamp || Date.now()).toLocaleTimeString()}
          </Text>
        </Flex>
        <Text color="green.300" fontSize="14px" mb="4px">
          {segment.en || ''}
        </Text>
        <Text color="yellow.300" fontSize="13px" mb="4px">
          {segment.jp || ''}
        </Text>
        {segment.en_repeat && (
          <Text color="blue.200" fontSize="12px" fontStyle="italic" mb="4px">
            {segment.en_repeat}
          </Text>
        )}
        {segment.phrase && (
          <Flex mt="6px" pt="6px" borderTop="1px solid" borderColor="whiteAlpha.200">
            <Badge colorPalette="pink" size="xs" mr="2">💡</Badge>
            <Text color="pink.300" fontSize="12px">
              {segment.phrase} — {segment.note || ''}
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

/**
 * Hook-based RadioSegmentToast that reads from useRadioWs directly.
 */
import { useRadioWs } from '@/hooks/homeaituber/use-radio-ws';

export function RadioSegmentToastProvider(): JSX.Element {
  const { segments } = useRadioWs('');
  const [currentSegment, setCurrentSegment] = useState<RadioSegment | null>(null);

  // Show the most recent segment (newest first)
  useEffect(() => {
    if (segments.length > 0) {
      const latest = segments[0];
      if (latest.segment_id !== currentSegment?.segment_id) {
        setCurrentSegment(latest);
      }
    }
  }, [segments, currentSegment]);

  const handleDismiss = useCallback(() => {
    setCurrentSegment(null);
  }, []);

  return <RadioSegmentToastInner segment={currentSegment} onDismiss={handleDismiss} />;
}

export default memo(RadioSegmentToastInner);
