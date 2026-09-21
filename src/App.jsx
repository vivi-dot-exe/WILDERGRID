import React, { useState, useEffect } from 'react';
import WorldCanvas from './components/WorldCanvas';
import ThreeWorldCanvas from './components/ThreeWorldCanvas';
import HeaderBar from './components/HeaderBar';
import BottomToolbar from './components/BottomToolbar';
import InspectorDrawer from './components/InspectorDrawer';
import CameraControls from './components/CameraControls';
import SimulationEngine from './components/SimulationEngine';
import HelpModal from './components/HelpModal';
import EventTicker from './components/EventTicker';
import LoginWorldModal from './components/LoginWorldModal';
import WorldLoadingScreen from './components/WorldLoadingScreen';
import AvatarStudioModal from './components/AvatarStudioModal';
import MultiplayerModal from './components/MultiplayerModal';
import SaveLoadModal from './components/SaveLoadModal';
import SettingsModal from './components/SettingsModal';
import { useWorldStore, worldStore } from './store/useWorldStore';
import { VIEW_MODES } from './types/world';
import { THEMES, getThemeById } from './types/avatar';

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const {
    showLoginModal,
    showLoadingScreen,
    showAvatarStudio,
    showMultiplayerModal,
    showSaveLoadModal,
    showSettingsModal,
    viewMode,
    avatarConfig,
  } = useWorldStore();

  // Auto-open multiplayer modal if ?room= URL parameter is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      worldStore.toggleMultiplayerModal(true);
    }
  }, []);

  // Dedicated Avatar Studio Shortcut Key ('C')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyC') {
        worldStore.toggleAvatarStudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const is3D = viewMode === VIEW_MODES.WALK_3D;
  const currentTheme = getThemeById(avatarConfig?.theme);
  const bgGradient = currentTheme?.bgGradient || 'from-[#5ec7f8] via-[#bde9ff] to-[#fff5ea]';

  return (
    <main className={`relative w-screen h-screen overflow-hidden bg-gradient-to-b ${bgGradient} font-outfit text-slate-800 select-none transition-colors duration-700`}>
      {/* Simulation Loop Engine */}
      <SimulationEngine />

      {/* Top Header Navigation */}
      <HeaderBar onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Real-time Weather & Narrative Activity Ticker (2D overview) */}
      {!is3D && <EventTicker />}

      {/* Primary Canvas: 3D Three.js Engine or 2.5D Canvas Grid */}
      {is3D ? (
        <ThreeWorldCanvas />
      ) : (
        <WorldCanvas />
      )}

      {/* Bottom Dock / Brushes & Tools Palette (2D mode) */}
      {!is3D && <BottomToolbar />}

      {/* Right Floating Inspection Drawer (2D mode) */}
      {!is3D && <InspectorDrawer />}

      {/* Bottom Left Camera Zoom & Navigation Controls (2D mode) */}
      {!is3D && <CameraControls />}

      {/* Controls & Lore Guide Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 1. Initial Login & World Launcher Modal (Before Loading) */}
      <LoginWorldModal isOpen={showLoginModal} />

      {/* 2. Minecraft-Style Procedural Loading Screen */}
      <WorldLoadingScreen isOpen={showLoadingScreen} />

      {/* 3. Dedicated ("Alag Se") 3D Avatar Studio Modal */}
      <AvatarStudioModal
        isOpen={showAvatarStudio}
        onClose={() => worldStore.closeAvatarStudio()}
      />

      {/* Real-time Multiplayer WebRTC Co-Op Lobby Modal */}
      <MultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => worldStore.toggleMultiplayerModal(false)}
      />

      {/* World Persistence, Local Export & Supabase Cloud Save Modal */}
      <SaveLoadModal
        isOpen={showSaveLoadModal}
        onClose={() => worldStore.toggleSaveLoadModal(false)}
      />

      {/* Game Settings Modal: Sound, Sensitivity, and Controls */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => worldStore.closeSettingsModal()}
      />
    </main>
  );
}
