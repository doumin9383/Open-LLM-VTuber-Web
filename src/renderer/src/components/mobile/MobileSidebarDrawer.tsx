/**
 * MobileSidebarDrawer — renders sidebar content as a bottom Drawer on mobile.
 * Triggered by the Chat tab in MobileBottomTab.
 *
 * Shows chat history + bottom tabs only.
 * Streaming controls → MobileControlsDrawer.
 * Settings → MobileSettingsDrawer.
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
import ChatHistoryPanel from '../sidebar/chat-history-panel';
import BottomTab from '../sidebar/bottom-tab';
import HomeAITuberPanel from '../homeaituber/HomeAITuberPanel';

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

function MobileSidebarDrawer({ open, onClose }: MobileSidebarDrawerProps): JSX.Element {
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
          <ChatHistoryPanel />
          <Separator borderColor="whiteAlpha.200" mt="3" mb="3" />
          <HomeAITuberPanel />
          <Separator borderColor="whiteAlpha.200" mt="3" mb="3" />
          <BottomTab />
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default memo(MobileSidebarDrawer);
