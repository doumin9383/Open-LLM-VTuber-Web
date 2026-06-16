/**
 * MobileSidebarDrawer — renders sidebar content as a bottom Drawer on mobile.
 * Triggered by the floating chat button.
 */
import { memo } from 'react';
import { Separator } from '@chakra-ui/react';
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerBackdrop,
} from '@/components/ui/drawer';
import SettingUI from '../sidebar/setting/setting-ui';
import ChatHistoryPanel from '../sidebar/chat-history-panel';
import BottomTab from '../sidebar/bottom-tab';
import HomeAITuberPanel from '../homeaituber/HomeAITuberPanel';
import { useSidebar } from '@/hooks/sidebar/use-sidebar';

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

function MobileSidebarDrawer({ open, onClose }: MobileSidebarDrawerProps): JSX.Element {
  const {
    settingsOpen,
    onSettingsOpen,
    onSettingsClose,
    createNewHistory,
    setMode,
    currentMode,
    isElectron,
  } = useSidebar();

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e: { open: boolean }) => { if (!e.open) onClose(); }}
      placement="bottom"
      size="full"
    >
      <DrawerBackdrop />
      <DrawerContent
        css={{
          maxH: '80dvh',
          borderTopRadius: 'xl',
          bg: 'gray.900',
        }}
      >
        <DrawerHeader pt="3" pb="0">
          <DrawerCloseTrigger />
        </DrawerHeader>
        <DrawerBody overflowY="auto" px="3" pb="4">
          {settingsOpen ? (
            <SettingUI
              open={settingsOpen}
              onClose={onSettingsClose}
              onToggle={() => {}}
            />
          ) : (
            <>
              <ChatHistoryPanel />
              <Separator borderColor="whiteAlpha.200" mt="3" mb="3" />
              <HomeAITuberPanel />
              <Separator borderColor="whiteAlpha.200" mt="3" mb="3" />
              <BottomTab />
            </>
          )}
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default memo(MobileSidebarDrawer);
