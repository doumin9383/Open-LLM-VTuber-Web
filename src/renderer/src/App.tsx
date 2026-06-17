/* eslint-disable no-shadow */
// import { StrictMode } from 'react';
import { Box, Flex, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useRef } from "react";
// import Canvas from './components/canvas/canvas'; // Likely unused now
import Sidebar from "./components/sidebar/sidebar";
import Footer from "./components/footer/footer";
import { AiStateProvider } from "./context/ai-state-context";
import { Live2DConfigProvider } from "./context/live2d-config-context";
import { SubtitleProvider } from "./context/subtitle-context";
import { BgUrlProvider } from "./context/bgurl-context";
import { layoutStyles } from "./layout";
import WebSocketHandler from "./services/websocket-handler";
import { CameraProvider } from "./context/camera-context";
import { ChatHistoryProvider } from "./context/chat-history-context";
import { CharacterConfigProvider } from "./context/character-config-context";
import { Toaster } from "./components/ui/toaster";
import { VADProvider } from "./context/vad-context";
import { Live2D } from "./components/canvas/live2d";
import TitleBar from "./components/electron/title-bar";
import { InputSubtitle } from "./components/electron/input-subtitle";
import { ProactiveSpeakProvider } from "./context/proactive-speak-context";
import { ScreenCaptureProvider } from "./context/screen-capture-context";
import { GroupProvider } from "./context/group-context";
import { BrowserProvider } from "./context/browser-context";
// eslint-disable-next-line import/no-extraneous-dependencies, import/newline-after-import
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Background from "./components/canvas/background";
import WebSocketStatus from './components/canvas/ws-status';
import Subtitle from "./components/canvas/subtitle";
import { ModeProvider, useMode } from "./context/mode-context";
import { GraphicsProvider, useGraphics } from "./context/graphics-context";
import MobileSidebarDrawer from "./components/mobile/MobileSidebarDrawer";
import MobileControlsDrawer from "./components/mobile/MobileControlsDrawer";
import MobileSettingsDrawer from "./components/mobile/MobileSettingsDrawer";
import MobileBottomTab, { type TabId } from "./components/mobile/MobileBottomTab";
import { StreamingStatusProvider } from "./components/homeaituber/RadioSegmentToast";
import { UiModeProvider, useUiMode } from "./context/ui-mode-context";

function AppContent(): JSX.Element {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const { mode } = useMode();
  const isElectron = window.api !== undefined;
  const live2dContainerRef = useRef<HTMLDivElement>(null);
  const { enabled: graphicsEnabled } = useGraphics();
  const { effectiveMode } = useUiMode();
  const isMobile = effectiveMode === 'mobile';

  // Derive drawer open states from activeTab
  const mobileSidebarOpen = activeTab === 'chat';
  const mobileControlsOpen = activeTab === 'controls';
  const mobileSettingsOpen = activeTab === 'settings';

  const handleTabChange = (tab: TabId) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const handleDrawerClose = () => {
    setActiveTab(null);
  };

  // CSS-based overflow: hidden (avoid JS position:fixed which breaks mobile viewport)
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Define base style properties shared across modes/breakpoints
  const live2dBaseStyle = {
    position: "absolute" as const,
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
    pointerEvents: "auto" as const,
    visibility: graphicsEnabled ? ("visible" as const) : ("hidden" as const),
  };

  // Define styles specifically for the "window" mode, using responsive syntax
  const getResponsiveLive2DWindowStyle = (sidebarVisible: boolean) => ({
    ...live2dBaseStyle,
    top: isElectron ? "30px" : "0px",
    height: `calc(100% - ${isElectron ? "30px" : "0px"})`,
    zIndex: 5,
    left: {
      base: "0px",
      md: sidebarVisible ? "440px" : "24px",
    },
    width: {
      base: "100%",
      md: `calc(100% - ${sidebarVisible ? "440px" : "24px"})`,
    },
  });

  // Define styles specifically for the "pet" mode
  const live2dPetStyle = {
    ...live2dBaseStyle,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 15,
  };

  return (
    <>
      <Box
        ref={live2dContainerRef}
        {...(mode === "window"
          ? getResponsiveLive2DWindowStyle(showSidebar)
          : live2dPetStyle)}
      >
        <Live2D />
      </Box>

      {/* Conditional Rendering of Window UI */}
      {mode === "window" && (
        <>
          {isElectron && <TitleBar />}

          {/* ═══════ DESKTOP LAYOUT (768px+) ═══════ */}
          {/* zIndex: 6 — above Live2D (zIndex: 5) so controls are clickable */}
          <Flex
            {...layoutStyles.appContainer}
            display={isMobile ? 'none' : 'flex'}
            position="relative"
            zIndex={6}
          >
            <Box
              {...layoutStyles.sidebar}
              {...(!showSidebar && { width: "24px" })}
            >
              <Sidebar
                isCollapsed={!showSidebar}
                onToggle={() => setShowSidebar(!showSidebar)}
              />
            </Box>
            <Box {...layoutStyles.mainContent}>
              <Background />
              <Box position="absolute" top="20px" left="20px" zIndex={10}>
                <WebSocketStatus />
              </Box>
              <Box
                position="absolute"
                bottom={isFooterCollapsed ? "39px" : "135px"}
                left="50%"
                transform="translateX(-50%)"
                zIndex={10}
                width="60%"
              >
                <Subtitle />
              </Box>
              <Box
                {...layoutStyles.footer}
                zIndex={10}
                {...(isFooterCollapsed && layoutStyles.collapsedFooter)}
              >
                <Footer
                  isCollapsed={isFooterCollapsed}
                  onToggle={() => setIsFooterCollapsed(!isFooterCollapsed)}
                />
              </Box>
            </Box>
          </Flex>

          {/* ═══════ MOBILE LAYOUT (<768px) ═══════ */}
          {/* zIndex: 6 — above Live2D (zIndex: 5) so controls are clickable */}
          <Box
            display={isMobile ? 'block' : 'none'}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={6}
            overflow="hidden"
            pointerEvents="auto"
          >
            {/* Footer overlay — sits above the 56px bottom tab bar */}
            <Box
              position="absolute"
              bottom="56px"
              left={0}
              right={0}
              zIndex={10}
              pointerEvents="auto"
            >
              <Box
                {...layoutStyles.footer}
                {...(isFooterCollapsed && layoutStyles.collapsedFooter)}
              >
                <Footer
                  isCollapsed={isFooterCollapsed}
                  onToggle={() => setIsFooterCollapsed(!isFooterCollapsed)}
                />
              </Box>
            </Box>

            {/* WebSocket status indicator */}
            <Box position="absolute" top="20px" left="20px" zIndex={10} pointerEvents="auto">
              <WebSocketStatus />
            </Box>

            {/* Subtitle */}
            <Box
              position="absolute"
              bottom={isFooterCollapsed ? "125px" : "175px"}
              left="50%"
              transform="translateX(-50%)"
              zIndex={10}
              width="80%"
              pointerEvents="auto"
            >
              <Subtitle />
            </Box>
          </Box>

          {/* ═══════ MOBILE BOTTOM TAB BAR (<768px) ═══════ */}
          {/* Replaces the old FAB stack with a proper bottom navigation */}
          <MobileBottomTab
            activeTab={activeTab}
            onTabChange={handleTabChange}
            micOn={false}
            onMicToggle={() => {}}
          />

          {/* ═══════ MOBILE DRAWERS (<768px) ═══════ */}
          {/* Chat drawer */}
          <MobileSidebarDrawer
            open={mobileSidebarOpen}
            onClose={handleDrawerClose}
          />

          {/* Controls drawer */}
          <MobileControlsDrawer
            open={mobileControlsOpen}
            onClose={handleDrawerClose}
          />

          {/* Settings drawer (bottom, tabs + save/cancel) */}
          <MobileSettingsDrawer
            open={mobileSettingsOpen}
            onClose={handleDrawerClose}
          />

          {/* Streaming status indicator */}
          <StreamingStatusProvider />
        </>
      )}

      {/* Conditional Rendering of Pet Mode UI */}
      {mode === "pet" && <InputSubtitle />}
    </>
  );
}

function App(): JSX.Element {
  return (
    <ChakraProvider value={defaultSystem}>
      <UiModeProvider>
        <ModeProvider>
        <AppWithGlobalStyles />
      </ModeProvider>
      </UiModeProvider>
    </ChakraProvider>
  );
}

function AppWithGlobalStyles(): JSX.Element {
  return (
    <>
      <CameraProvider>
        <ScreenCaptureProvider>
          <CharacterConfigProvider>
            <ChatHistoryProvider>
              <AiStateProvider>
                <ProactiveSpeakProvider>
                  <Live2DConfigProvider>
                    <SubtitleProvider>
                      <VADProvider>
                        <BgUrlProvider>
                          <GroupProvider>
                            <BrowserProvider>
                              <GraphicsProvider>
                                <WebSocketHandler>
                                  <Toaster />
                                  <AppContent />
                                </WebSocketHandler>
                              </GraphicsProvider>
                            </BrowserProvider>
                          </GroupProvider>
                        </BgUrlProvider>
                      </VADProvider>
                    </SubtitleProvider>
                  </Live2DConfigProvider>
                </ProactiveSpeakProvider>
              </AiStateProvider>
            </ChatHistoryProvider>
          </CharacterConfigProvider>
        </ScreenCaptureProvider>
      </CameraProvider>
    </>
  );
}

export default App;
