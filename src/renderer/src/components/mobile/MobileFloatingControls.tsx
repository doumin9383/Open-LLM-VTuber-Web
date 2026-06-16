/**
 * MobileFloatingControls — floating action buttons for mobile view.
 * Shown on small screens, hidden on desktop.
 *
 * v2: Separated chat open and controls open. Added controls toggle button.
 */
import { Box, IconButton } from '@chakra-ui/react';
import { memo, useCallback } from 'react';
import { BsMicFill, BsMicMuteFill } from 'react-icons/bs';
import { FiRadio } from 'react-icons/fi';
import { CgToolbox } from 'react-icons/cg';
import { useGraphics } from '@/context/graphics-context';
import { useRadioWs } from '@/hooks/homeaituber/use-radio-ws';

interface MobileFloatingControlsProps {
  onOpenChat: () => void;
  onOpenControls: () => void;
  micOn: boolean;
  onMicToggle: () => void;
}

function MobileFloatingControls({
  onOpenChat,
  onOpenControls,
  micOn,
  onMicToggle,
}: MobileFloatingControlsProps): JSX.Element {
  const { enabled: graphicsEnabled, toggle: toggleGraphics } = useGraphics();
  const { fireRadio } = useRadioWs('');

  const handleFire = useCallback(() => {
    fireRadio();
  }, [fireRadio]);

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="16px"
      zIndex={9999}
      display={{ base: 'flex', md: 'none' }}
      flexDirection="column"
      gap="10px"
      css={{
        '& button:active': {
          transform: 'scale(0.88)',
          opacity: '0.8',
          transition: 'transform 0.08s, opacity 0.08s',
        },
        '& button': {
          transition: 'transform 0.15s, opacity 0.15s',
          WebkitTapHighlightColor: 'transparent',
        },
      }}
    >
      {/* Fire streaming tick */}
      <IconButton
        aria-label="Fire streaming"
        size="lg"
        colorPalette="pink"
        variant="solid"
        borderRadius="full"
        boxShadow="0 2px 12px rgba(0,0,0,0.3)"
        w="52px" h="52px"
        onClick={handleFire}
        _active={{ transform: 'scale(0.88)', bg: 'pink.600' }}
      >
        <FiRadio size="22" />
      </IconButton>

      {/* Controls (interval, topics, mood, language) */}
      <IconButton
        aria-label="Streaming controls"
        size="lg"
        colorPalette="teal"
        variant="solid"
        borderRadius="full"
        boxShadow="0 2px 12px rgba(0,0,0,0.3)"
        w="52px" h="52px"
        onClick={onOpenControls}
        _active={{ transform: 'scale(0.88)', bg: 'teal.600' }}
      >
        <CgToolbox size="22" />
      </IconButton>

      {/* Mic toggle */}
      <IconButton
        aria-label="Toggle Mic"
        size="lg"
        colorPalette={micOn ? 'green' : 'red'}
        variant="solid"
        borderRadius="full"
        boxShadow="0 2px 12px rgba(0,0,0,0.3)"
        w="52px" h="52px"
        onClick={onMicToggle}
      >
        {micOn ? <BsMicFill size="22" /> : <BsMicMuteFill size="22" />}
      </IconButton>

      {/* Graphics toggle */}
      <IconButton
        aria-label="Toggle Live2D"
        size="lg"
        colorPalette={graphicsEnabled ? 'green' : 'gray'}
        variant="solid"
        borderRadius="full"
        boxShadow="0 2px 12px rgba(0,0,0,0.3)"
        w="52px" h="52px"
        onClick={toggleGraphics}
      >
        <Box as="span" fontSize="22px" lineHeight="1">
          {graphicsEnabled ? '🖼️' : '🎧'}
        </Box>
      </IconButton>

      {/* Chat open (moved to bottom — most frequently used) */}
      <IconButton
        aria-label="Open Chat"
        size="lg"
        colorPalette="blue"
        variant="solid"
        borderRadius="full"
        boxShadow="0 2px 12px rgba(0,0,0,0.3)"
        w="52px" h="52px"
        onClick={onOpenChat}
      >
        💬
      </IconButton>
    </Box>
  );
}

export default memo(MobileFloatingControls);
