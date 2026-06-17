/**
 * UiModeToggle — switches between auto/desktop/mobile layout.
 * Renders three small buttons (Auto / Desktop / Mobile).
 * Placed in the controls drawer for easy access.
 */
import { Flex, Button, Text } from '@chakra-ui/react';
import { memo } from 'react';
import { useUiMode } from '@/context/ui-mode-context';

const btnActive = { transform: 'scale(0.95)', transition: 'transform 0.08s' };

const MODES = [
  { id: 'auto' as const, label: '🔄 Auto' },
  { id: 'desktop' as const, label: '🖥️ Desktop' },
  { id: 'mobile' as const, label: '📱 Mobile' },
];

function UiModeToggle(): JSX.Element {
  const { uiMode, effectiveMode, setUiMode } = useUiMode();

  return (
    <Flex direction="column" gap="1" mb="3">
      <Text fontSize="xs" color="whiteAlpha.500" fontWeight="medium">
        📐 Layout: {effectiveMode === 'mobile' ? 'Mobile' : 'Desktop'}
        {uiMode === 'auto' && <Text as="span" color="whiteAlpha.400" fontSize="2xs"> (auto)</Text>}
      </Text>
      <Flex gap="1" wrap="wrap">
        {MODES.map((m) => (
          <Button
            key={m.id}
            size="xs"
            variant={uiMode === m.id ? 'solid' : 'outline'}
            colorPalette={uiMode === m.id ? 'blue' : 'gray'}
            onClick={() => setUiMode(m.id)}
            flex="1"
            minW="0"
            fontSize="10px"
            _active={btnActive}
          >
            {m.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}

export default memo(UiModeToggle);
