import React, { useState } from 'react';
import WorldCanvas from './components/WorldCanvas';
import ThreeWorldCanvas from './components/ThreeWorldCanvas';
import HeaderBar from './components/HeaderBar';
import BottomToolbar from './components/BottomToolbar';
import InspectorDrawer from './components/InspectorDrawer';
import CameraControls from './components/CameraControls';
import SimulationEngine from './components/SimulationEngine';
import HelpModal from './components/HelpModal';
import EventTicker from './components/EventTicker';
import OnboardingModal from './components/OnboardingModal';
import { useWorldStore, worldStore } from './store/useWorldStore';
import { VIEW_MODES } from './types/world';

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { showOnboarding, viewMode } = useWorldStore();

  const is3D = viewMode === VIEW_MODES.WALK_3D;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#5ec7f8] via-[#bde9ff] to-[#fff5ea] font-outfit text-slate-800 select-none">
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

      {/* Aesthetic Glassmorphic Onboarding & 3D Avatar Customizer Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => worldStore.closeOnboarding()}
      />
    </main>
  );
}
