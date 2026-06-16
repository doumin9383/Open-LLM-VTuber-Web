/**
 * StreamingStatusProvider — minimal status indicator for streaming mode.
 * Shows a small badge when the streaming scheduler is active.
 */
import { Box, Badge } from '@chakra-ui/react';
import { memo } from 'react';
import { useRadioWs } from '@/hooks/homeaituber/use-radio-ws';

export function StreamingStatusProvider(): JSX.Element {
  const { connected, state } = useRadioWs('');

  if (!connected || !state.scheduler_running) return <></>;

  return (
    <Box
      position="fixed"
      bottom={{ base: '140px', md: '70px' }}
      right="16px"
      zIndex={9998}
      display={{ base: 'none', md: 'block' }}
    >
      <Badge
        colorPalette="green"
        variant="subtle"
        size="sm"
        boxShadow="0 2px 8px rgba(0,0,0,0.3)"
      >
        ▶️ Streaming · {state.language}
      </Badge>
    </Box>
  );
}

export default memo(StreamingStatusProvider);
