import React, { useState } from 'react';
import WorldCanvas from './components/WorldCanvas';
import HeaderBar from './components/HeaderBar';
import BottomToolbar from './components/BottomToolbar';
import InspectorDrawer from './components/InspectorDrawer';
import CameraControls from './components/CameraControls';
import SimulationEngine from './components/SimulationEngine';
import HelpModal from './components/HelpModal';

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#5ec7f8] via-[#bde9ff] to-[#fff5ea] font-outfit text-slate-800 select-none">
      {/* Simulation Loop Engine */}
      <SimulationEngine />

      {/* Top Header Navigation */}
      <HeaderBar onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Interactive Canvas Grid (Isometric 2.5D & Top-down) */}
      <WorldCanvas />

      {/* Bottom Dock / Brushes & Tools Palette */}
      <BottomToolbar />

      {/* Right Floating Inspection Drawer */}
      <InspectorDrawer />

      {/* Bottom Left Camera Zoom & Navigation Controls */}
      <CameraControls />

      {/* Controls & Lore Guide Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  );
}
