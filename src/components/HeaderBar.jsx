import React, { useState } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, ALL_ITEMS } from '../types/world';
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
  LayoutGrid
} from 'lucide-react';

export default function HeaderBar({ onOpenHelp }) {
  const {
    activeDomain,
    exteriorGrid,
    interiorGrid,
    soundMuted,
    history,
    redoStack,
  } = useWorldStore();

  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const isExterior = activeDomain === DOMAINS.EXTERIOR;
  const currentGrid = isExterior ? exteriorGrid : interiorGrid;

  // Count placed objects
  let propCount = 0;
  let terrainCount = 0;
  currentGrid.forEach(row => {
    row.forEach(t => {
      if (t.prop) propCount++;
      if (t.base) terrainCount++;
    });
  });

  const handleResetVilla = () => {
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.15 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9', '#2ec4b6']
    });
    worldStore.loadPreset('villa');
  };

  const handleExport = () => {
    const json = worldStore.exportWorldJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tropical-city-${activeDomain}-${Date.now()}.json`;
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
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-tropical-coral/15 text-tropical-coral border border-tropical-coral/30">
                Tropical Resort & City
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isExterior ? 'Exterior City & Architecture' : 'Interior Floorplan & Decor'} • {propCount} Placed Items
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

        {/* Action Controls */}
        <div className="tropical-glass p-1.5 rounded-2xl flex items-center space-x-1 pointer-events-auto border border-white/80 shadow-tropical-md">
          {/* Reset to Tropical Villa */}
          <button
            onClick={handleResetVilla}
            className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 hover:bg-black/5 text-slate-700 transition-all"
            title="Reset to Tropical Villa & Penthouse"
          >
            <RotateCcw className="w-3.5 h-3.5 text-tropical-coral" />
            <span className="hidden lg:inline">Resort Preset</span>
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
            title="Export World JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowJsonModal(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/5 transition"
            title="Import World JSON"
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

      {/* JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="tropical-glass p-6 rounded-3xl w-full max-w-md border border-white/80 shadow-2xl">
            <h3 className="font-fredoka text-lg text-slate-800 mb-2">Import City / Room Design</h3>
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
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-black/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-tropical-coral hover:bg-tropical-coralLight text-white shadow-coral-glow transition"
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
