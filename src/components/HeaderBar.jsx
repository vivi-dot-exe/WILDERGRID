import React, { useState } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS } from '../types/world';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Palmtree,
  Home,
  RotateCcw,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Download,
  Upload,
  HelpCircle,
  Camera,
  Key,
  Shuffle
} from 'lucide-react';

export default function HeaderBar({ onOpenHelp }) {
  const {
    activeDomain,
    exteriorGrid,
    interiorGrid,
    soundMuted,
    history,
    redoStack,
    seed,
    avatarConfig,
  } = useWorldStore();

  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [seedInput, setSeedInput] = useState(seed);

  const isExterior = activeDomain === DOMAINS.EXTERIOR;
  const currentGrid = isExterior ? exteriorGrid : interiorGrid;

  let propCount = 0;
  currentGrid.forEach(row => {
    row.forEach(t => {
      if (t.prop) propCount++;
    });
  });

  const handleResetVilla = () => {
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.15 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9', '#2ec4b6']
    });
    worldStore.loadFromSeed(seed);
  };

  const handleExport = () => {
    const json = worldStore.exportWorldJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wildergrid-${seed}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (worldStore.importWorldJSON(jsonInput)) {
      setShowJsonModal(false);
      setJsonInput('');
    } else {
      alert('Invalid world data. Please check JSON format.');
    }
  };

  const handleApplySeed = () => {
    if (seedInput) {
      worldStore.loadFromSeed(seedInput);
      setShowSeedModal(false);
    }
  };

  const handleRandomSeed = () => {
    const randomSeeds = [
      'sunny-lagoon-99', 'coral-citadel-7', 'azure-haven-42',
      'whispering-palms-12', 'starlight-solaria-88', 'breezy-terrace-23'
    ];
    const picked = randomSeeds[Math.floor(Math.random() * randomSeeds.length)];
    setSeedInput(picked);
    worldStore.loadFromSeed(picked);
    setShowSeedModal(false);
  };

  // Phase 4: Snapshot Mode - Clean canvas screenshot download
  const handleTakeSnapshot = () => {
    const canvas = document.getElementById('wildergrid-canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `wildergrid-snapshot-${seed}-${Date.now()}.png`;
      a.click();

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.2 },
        colors: ['#ffd166', '#ff6b8b', '#00bbf9']
      });
    } catch (e) {
      console.error('Failed to capture snapshot:', e);
    }
  };

  return (
    <>
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Logo & Title */}
        <div className="tropical-glass px-4 py-2.5 rounded-2xl flex items-center space-x-3 pointer-events-auto border border-white/80 shadow-tropical-md">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff6b8b] via-[#ffd166] to-[#00bbf9] flex items-center justify-center shadow-coral-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-fredoka text-lg font-bold tracking-wide text-slate-800">
                Wildergrid
              </h1>
              <button
                onClick={() => { setSeedInput(seed); setShowSeedModal(true); }}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-tropical-coral/15 text-tropical-coral border border-tropical-coral/30 hover:bg-tropical-coral hover:text-white transition"
                title="Change Procedural Seed"
              >
                Seed: {seed}
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isExterior ? 'Exterior City & Resort' : 'Interior Floorplan & Decor'} • {propCount} Placed Structures
            </p>
          </div>
        </div>

        {/* Domain Switcher: Exterior City ↔ Room Interior */}
        <div className="tropical-glass p-1.5 rounded-2xl flex items-center space-x-1 pointer-events-auto border border-white/80 shadow-tropical-md">
          <button
            onClick={() => worldStore.setDomain(DOMAINS.EXTERIOR)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              isExterior
                ? 'bg-gradient-to-r from-[#ff6b8b] to-[#ffd166] text-white shadow-coral-glow scale-105'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
          >
            <Palmtree className="w-4 h-4" />
            <span>City Exterior</span>
          </button>

          <button
            onClick={() => worldStore.setDomain(DOMAINS.INTERIOR)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              !isExterior
                ? 'bg-gradient-to-r from-[#00bbf9] to-[#2ec4b6] text-white shadow-aqua-glow scale-105'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Room Interior</span>
          </button>
        </div>

        {/* Player Avatar Profile Pill */}
        <button
          onClick={() => worldStore.openOnboarding()}
          className="tropical-glass px-3 py-1.5 rounded-2xl flex items-center space-x-2 pointer-events-auto border border-white/80 shadow-tropical-md hover:scale-105 transition"
          title="Customize Avatar & Game Settings"
        >
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm border border-white/90"
            style={{ backgroundColor: avatarConfig?.topColor || '#ff6b8b' }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: avatarConfig?.skinTone || '#ffd166' }}
            />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {avatarConfig?.username || 'Builder'}
            </div>
            <div className="text-[9px] uppercase font-bold text-tropical-coral tracking-wider">
              {avatarConfig?.gameMode || 'Creative'}
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="tropical-glass p-1.5 rounded-2xl flex items-center space-x-1 pointer-events-auto border border-white/80 shadow-tropical-md">
          {/* Snapshot Camera Mode */}
          <button
            onClick={handleTakeSnapshot}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/70 hover:bg-white text-slate-700 shadow-sm transition hover:scale-105"
            title="Snapshot Mode: Download high-res canvas photo"
          >
            <Camera className="w-3.5 h-3.5 text-tropical-coral" />
            <span className="hidden xl:inline">Snapshot</span>
          </button>

          {/* Seed Generator Modal */}
          <button
            onClick={() => { setSeedInput(seed); setShowSeedModal(true); }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title="Procedural Seed Generator"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          {/* Reset Seed */}
          <button
            onClick={handleResetVilla}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title="Re-synthesize World from Seed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-black/10 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={() => worldStore.undo()}
            disabled={history.length === 0}
            className={`p-2 rounded-xl transition-all ${
              history.length === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => worldStore.redo()}
            disabled={redoStack.length === 0}
            className={`p-2 rounded-xl transition-all ${
              redoStack.length === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-black/10 mx-1" />

          {/* Export / Import */}
          <button
            onClick={handleExport}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title="Export World State JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowJsonModal(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title="Import World State JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => worldStore.toggleSound()}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-tropical-coral" />}
          </button>

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title="How to Build"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Seed Generator Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="tropical-glass p-6 rounded-3xl w-full max-w-sm border border-white/80 shadow-2xl">
            <h3 className="font-fredoka text-lg text-slate-800 mb-1">Procedural Seed</h3>
            <p className="text-xs text-slate-600 mb-4">
              Enter any word or number to deterministically generate a unique island layout.
            </p>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                className="flex-1 tropical-input rounded-2xl px-3 py-2 text-xs font-mono outline-none focus:border-tropical-coral"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="e.g. sunny-haven-42"
              />
              <button
                onClick={handleRandomSeed}
                className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-700 shadow-sm"
                title="Random Seed"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSeedModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySeed}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-tropical-coral text-white shadow-coral-glow"
              >
                Generate World
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="tropical-glass p-6 rounded-3xl w-full max-w-md border border-white/80 shadow-2xl">
            <h3 className="font-fredoka text-lg text-slate-800 mb-2">Import World State</h3>
            <p className="text-xs text-slate-600 mb-4">
              Paste your exported JSON state below to restore terrain, architecture, and interior decor.
            </p>
            <textarea
              className="w-full h-40 tropical-input rounded-2xl p-3 text-xs font-mono outline-none resize-none focus:border-tropical-coral"
              placeholder="Paste JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-tropical-coral text-white shadow-coral-glow"
              >
                Load State
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
