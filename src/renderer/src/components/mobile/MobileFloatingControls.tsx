/**
 * MobileFloatingControls — floating action buttons for mobile view.
 * Shown on small screens, hidden on desktop.
 * Provides: chat open, mic toggle, radio fire, graphics toggle.
 */
import { Box, Button, Flex, IconButton } from '@chakra-ui/react';
import { memo, useCallback } from 'react';
import { BsMicFill, BsMicMuteFill } from 'react-icons/bs';
import { FiRadio } from 'react-icons/fi';
import { useGraphics } from '@/context/graphics-context';
import { useRadioWs } from '@/hooks/homeaituber/use-radio-ws';

interface MobileFloatingControlsProps {
  onOpenChat: () => void;
  micOn: boolean;
  onMicToggle: () => void;
}

function MobileFloatingControls({
  onOpenChat,
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
    >
      {/* Radio fire */}
      <IconButton
        aria-label="Fire Radio"
        size="lg"
        colorPalette="pink"
        variant="solid"
        borderRadius="full"
        boxShadow="0 2px 12px rgba(0,0,0,0.3)"
        w="52px" h="52px"
        onClick={handleFire}
      >
        <FiRadio size="22" />
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

      {/* Chat open */}
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
