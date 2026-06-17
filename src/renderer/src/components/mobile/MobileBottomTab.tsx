/**
 * MobileBottomTab — bottom tab bar for mobile view.
 * Replaces MobileFloatingControls (FAB stack).
 *
 * 5 items:
 *   💬 Chat   → opens MobileSidebarDrawer
 *   🎛 Ctrl   → opens MobileControlsDrawer
 *   ⚙ Sett    → opens MobileSettingsDrawer
 *   🖼 Live2D  → toggle graphics (inline)
 *   🎤 Mic     → toggle mic (inline, currently no-op)
 *
 * Hidden on desktop (md+).
 */
import { Flex, IconButton, Text } from '@chakra-ui/react';
import { memo } from 'react';
import { BsMicFill, BsMicMuteFill } from 'react-icons/bs';
import { FiSettings } from 'react-icons/fi';
import { CgToolbox } from 'react-icons/cg';
import { useGraphics } from '@/context/graphics-context';
import { useUiMode } from '@/context/ui-mode-context';

export type TabId = 'chat' | 'controls' | 'settings';

interface MobileBottomTabProps {
  activeTab: TabId | null;
  onTabChange: (tab: TabId) => void;
  micOn: boolean;
  onMicToggle: () => void;
}

const TAB_CONFIG = [
  {
    id: 'chat' as TabId,
    icon: <Text fontSize="22px" lineHeight="1.2">💬</Text>,
    label: 'Chat',
    activeColor: 'blue.300',
    inactiveColor: 'whiteAlpha.600',
    labelActiveColor: 'blue.300',
  },
  {
    id: 'controls' as TabId,
    icon: <CgToolbox size="20" />,
    label: 'Ctrl',
    activeColor: 'teal.300',
    inactiveColor: 'whiteAlpha.600',
    labelActiveColor: 'teal.300',
  },
  {
    id: 'settings' as TabId,
    icon: <FiSettings size="18" />,
    label: 'Sett',
    activeColor: 'white',
    inactiveColor: 'whiteAlpha.600',
    labelActiveColor: 'white',
  },
];

function MobileBottomTab({
  activeTab,
  onTabChange,
  micOn,
  onMicToggle,
}: MobileBottomTabProps): JSX.Element {
  const { enabled: graphicsEnabled, toggle: toggleGraphics } = useGraphics();
  const { effectiveMode } = useUiMode();
  const isMobile = effectiveMode === 'mobile';

  return (
    <Flex
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex={100}
      bg="gray.900"
      borderTop="1px solid"
      borderColor="whiteAlpha.200"
      display={isMobile ? 'flex' : 'none'}
      height="56px"
      align="center"
      justify="space-around"
      px="1"
      pb="env(safe-area-inset-bottom, 4px)"
      css={{
        '& button': {
          WebkitTapHighlightColor: 'transparent',
        },
      }}
    >
      {/* ── Tab items (trigger drawers) ── */}
      {TAB_CONFIG.map((tab) => (
        <IconButton
          key={tab.id}
          aria-label={tab.label}
          variant="ghost"
          color={activeTab === tab.id ? tab.activeColor : tab.inactiveColor}
          onClick={() => onTabChange(tab.id)}
          flex="1"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="1px"
          h="full"
          borderRadius="0"
          _hover={{ bg: 'whiteAlpha.50' }}
          _active={{ transform: 'scale(0.88)', opacity: '0.8' }}
        >
          {tab.icon}
          <Text
            fontSize="9px"
            lineHeight="1"
            color={activeTab === tab.id ? tab.labelActiveColor : 'whiteAlpha.500'}
          >
            {tab.label}
          </Text>
        </IconButton>
      ))}

      {/* ── Graphics toggle ── */}
      <IconButton
        aria-label="Toggle Live2D"
        variant="ghost"
        color={graphicsEnabled ? 'green.300' : 'whiteAlpha.400'}
        onClick={toggleGraphics}
        flex="1"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="1px"
        h="full"
        borderRadius="0"
        _hover={{ bg: 'whiteAlpha.50' }}
        _active={{ transform: 'scale(0.88)', opacity: '0.8' }}
      >
        <Text fontSize="20px" lineHeight="1.2">🖼</Text>
        <Text
          fontSize="9px"
          lineHeight="1"
          color={graphicsEnabled ? 'green.300' : 'whiteAlpha.500'}
        >
          Live2D
        </Text>
      </IconButton>

      {/* ── Mic toggle ── */}
      <IconButton
        aria-label="Toggle Mic"
        variant="ghost"
        color={micOn ? 'green.300' : 'red.300'}
        onClick={onMicToggle}
        flex="1"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="1px"
        h="full"
        borderRadius="0"
        _hover={{ bg: 'whiteAlpha.50' }}
        _active={{ transform: 'scale(0.88)', opacity: '0.8' }}
      >
        {micOn ? <BsMicFill size="18" /> : <BsMicMuteFill size="18" />}
        <Text
          fontSize="9px"
          lineHeight="1"
          color={micOn ? 'green.300' : 'red.300'}
        >
          Mic
        </Text>
      </IconButton>
    </Flex>
  );
}

export default memo(MobileBottomTab);
