/**
 * MobileControlsDrawer — renders streaming controls as a bottom Drawer on mobile.
 * Separate from the chat drawer so controls are always one tap away.
 */
import { memo } from 'react';
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerBackdrop,
} from '@/components/ui/drawer';
import HomeAITuberPanel from '../homeaituber/HomeAITuberPanel';

interface MobileControlsDrawerProps {
  open: boolean;
  onClose: () => void;
}

function MobileControlsDrawer({ open, onClose }: MobileControlsDrawerProps): JSX.Element {
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
        <DrawerBody overflowY="auto" px="3" pb="6">
          <HomeAITuberPanel />
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default memo(MobileControlsDrawer);
