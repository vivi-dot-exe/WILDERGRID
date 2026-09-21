import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { PRIMARY_GAME_MODES, getThemeById } from '../types/avatar';
import { Sparkles, Box, TreePine, Flame, Heart, Compass, CheckCircle2 } from 'lucide-react';

const LOADING_PHASES = [
  { at: 0, text: 'Allocating Voxel Chunks & Terrain Matrix...' },
  { at: 18, text: 'Carving Procedural Green Meadows & Rolling Hills...' },
  { at: 38, text: 'Planting Lego Oak & Palm Trees with Harvestable Wood Logs...' },
  { at: 58, text: 'Populating Pastures with 3D Voxel Cows & Roaming Calves...' },
  { at: 78, text: 'Synthesizing Atmospheric Fog, Skybox & Theme Lighting...' },
  { at: 92, text: 'Finalizing Voxel Colliders & Calibrating 3D Camera...' },
  { at: 100, text: 'Welcome to Wildergrid! Spawning Player...' },
];

export default function WorldLoadingScreen({ isOpen }) {
  const { avatarConfig, seed } = useWorldStore();
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState(LOADING_PHASES[0].text);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    setProgress(4);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            worldStore.completeWorldLoading();
          }, 350);
          return 100;
        }

        // Random increment to simulate procedural generation chunks
        const jump = Math.floor(Math.random() * 12) + 6;
        const next = Math.min(100, prev + jump);

        // Find matching status text
        for (let i = LOADING_PHASES.length - 1; i >= 0; i--) {
          if (next >= LOADING_PHASES[i].at) {
            setCurrentStepText(LOADING_PHASES[i].text);
            break;
          }
        }

        return next;
      });
    }, 140);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const mode = PRIMARY_GAME_MODES[avatarConfig?.gameMode] || PRIMARY_GAME_MODES.creative;
  const themeObj = getThemeById(avatarConfig?.theme);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl text-white select-none animate-fade-in">
      
      {/* Background ambient glow matching theme */}
      <div
        className="absolute w-96 h-96 rounded-full blur-[140px] opacity-30 pointer-events-none"
        style={{ backgroundColor: mode.color }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-6">
        
        {/* Animated 3D Voxel Stud / Block */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center animate-spin-slow border-2 border-white/60 relative"
            style={{
              backgroundColor: mode.color,
              boxShadow: `0 0 35px ${mode.color}80`,
              animationDuration: '6s',
            }}
          >
            {/* Stud Cylinders Simulation */}
            <div className="w-6 h-6 rounded-full bg-white/40 shadow-inner" />
          </div>
          <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-ping" />
        </div>

        {/* Title & Subtitle */}
        <div>
          <h2 className="font-fredoka text-2xl sm:text-3xl font-bold tracking-wide text-white drop-shadow-md">
            Building Terrain & Chunks
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Procedural Minecraft-style world generation in progress
          </p>
        </div>

        {/* Active Metadata Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
          <span
            className="px-2.5 py-1 rounded-full border shadow-sm flex items-center space-x-1"
            style={{
              backgroundColor: `${mode.color}25`,
              color: mode.color,
              borderColor: `${mode.color}50`,
            }}
          >
            <span>{mode.name} Mode</span>
          </span>

          <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
            Theme: {themeObj?.name || 'Pastel Dream'}
          </span>

          <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-slate-300 font-mono">
            Seed: {seed}
          </span>
        </div>

        {/* Minecraft-Style Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold px-1">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] truncate max-w-[280px]">{currentStepText}</span>
            </span>
            <span className="text-emerald-400">{progress}%</span>
          </div>

          {/* Track */}
          <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/20 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-150 ease-out bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Feature Highlights Ticker */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-[11px] flex items-center space-x-3 w-full text-left">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TreePine className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-white block">Minecraft Voxel World</span>
            <span className="text-[10px] text-slate-400">
              Trees drop Wood Logs when mined • 3D cows roam the meadow pastures
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
