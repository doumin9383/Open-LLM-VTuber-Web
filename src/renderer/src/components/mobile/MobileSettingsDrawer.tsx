/**
 * MobileSettingsDrawer — renders settings as a bottom Drawer on mobile.
 * Triggered by the Settings tab in MobileBottomTab.
 * Shares SettingsTabsPanel content with the desktop SettingUI (left drawer).
 */
import { useState, useCallback } from 'react';
import { Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseTrigger,
  DrawerBackdrop,
} from '@/components/ui/drawer';
import SettingsTabsPanel from '../sidebar/setting/SettingsTabsPanel';

interface MobileSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

function MobileSettingsDrawer({ open, onClose }: MobileSettingsDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const [saveHandlers, setSaveHandlers] = useState<(() => void)[]>([]);
  const [cancelHandlers, setCancelHandlers] = useState<(() => void)[]>([]);

  const handleSaveCallback = useCallback((handler: () => void) => {
    setSaveHandlers((prev) => [...prev, handler]);
    return (): void => {
      setSaveHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleCancelCallback = useCallback((handler: () => void) => {
    setCancelHandlers((prev) => [...prev, handler]);
    return (): void => {
      setCancelHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleSave = useCallback((): void => {
    saveHandlers.forEach((handler) => handler());
    onClose();
  }, [saveHandlers, onClose]);

  const handleCancel = useCallback((): void => {
    cancelHandlers.forEach((handler) => handler());
    onClose();
  }, [cancelHandlers, onClose]);

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
          maxH: '85dvh',
          borderTopRadius: 'xl',
          bg: 'gray.900',
        }}
      >
        <DrawerHeader pt="3" pb="0">
          <DrawerCloseTrigger />
        </DrawerHeader>
        <DrawerBody overflowY="auto" px="0" pb="2">
          <SettingsTabsPanel onSave={handleSaveCallback} onCancel={handleCancelCallback} />
        </DrawerBody>
        <DrawerFooter>
          <Button colorPalette="red" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button colorPalette="blue" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default MobileSettingsDrawer;
