import React from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import {
  Heart,
  Zap,
  Box,
  Armchair,
  Coffee,
  Flame,
  Flower2,
  BookOpen,
  Sparkles,
  Feather,
  Package,
  Bed,
  Lamp,
  ShieldAlert,
  Compass,
  HeartHandshake,
  Eye,
  Ruler,
  Ghost,
} from 'lucide-react';
import { isCreativeMode } from '../types/avatar';

const ICON_MAP = {
  Box,
  Armchair,
  Coffee,
  Flame,
  Flower2,
  BookOpen,
  Sparkles,
  Bed,
  Lamp,
};

export default function HotbarHUD() {
  const {
    hotbarSlots,
    selectedHotbarIndex,
    avatarConfig,
    playerHealth,
    playerStamina,
    isFlying,
  } = useWorldStore();

  const isCreative = isCreativeMode(avatarConfig?.gameMode);

  // Render 10 Hearts for Survival
  const renderHearts = () => {
    const hearts = [];
    const fullHearts = Math.floor(playerHealth / 2);
    const hasHalf = playerHealth % 2 === 1;

    for (let i = 0; i < 10; i++) {
      if (i < fullHearts) {
        hearts.push(
          <Heart
            key={i}
            className="w-4 h-4 text-rose-500 fill-rose-500 filter drop-shadow-sm animate-pulse"
          />
        );
      } else if (i === fullHearts && hasHalf) {
        hearts.push(
          <div key={i} className="relative w-4 h-4">
            <Heart className="w-4 h-4 text-rose-300 fill-rose-200" />
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 absolute top-0 left-0 clip-path-half" />
          </div>
        );
      } else {
        hearts.push(
          <Heart key={i} className="w-4 h-4 text-slate-300 fill-black/10" />
        );
      }
    }
    return hearts;
  };

  // Render 10 Stamina Bubbles
  const renderStamina = () => {
    const stamina = [];
    const fullUnits = Math.floor(playerStamina / 2);

    for (let i = 0; i < 10; i++) {
      if (i < fullUnits) {
        stamina.push(
          <Zap
            key={i}
            className="w-3.5 h-3.5 text-amber-400 fill-amber-400 filter drop-shadow-sm"
          />
        );
      } else {
        stamina.push(
          <Zap key={i} className="w-3.5 h-3.5 text-slate-300 fill-black/10" />
        );
      }
    }
    return stamina;
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center space-y-2 select-none">
      {/* Vitals Bar or Specialized Mode Status Badge */}
      {(() => {
        const mode = avatarConfig?.gameMode || 'creative';

        if (mode === 'survival' || mode === 'hearthkeeper') {
          return (
            <div className="flex items-center justify-between w-full max-w-[480px] px-3 py-1 bg-black/50 backdrop-blur-md rounded-2xl border border-orange-400/50 shadow-lg text-white">
              <div className="flex items-center space-x-0.5" title={`Health: ${playerHealth}/20`}>
                {renderHearts()}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-300 px-2 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-orange-400 inline mr-0.5" />
                <span>Survival Vitals</span>
              </span>
              <div className="flex items-center space-x-0.5" title={`Stamina: ${Math.round(playerStamina)}/20`}>
                {renderStamina()}
              </div>
            </div>
          );
        }

        if (mode === 'hardcore' || mode === 'iron_thread') {
          return (
            <div className="flex items-center justify-between w-full max-w-[480px] px-3 py-1 bg-black/65 backdrop-blur-md rounded-2xl border border-rose-500/60 shadow-[0_0_15px_rgba(225,29,72,0.35)] text-white">
              <div className="flex items-center space-x-0.5" title={`Iron Thread Health: ${playerHealth}/20 (Permadeath)`}>
                {renderHearts()}
              </div>
              <span className="text-[9.5px] uppercase font-black tracking-widest text-rose-300 px-2 flex items-center space-x-1 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 inline mr-0.5" />
                <span>Iron-Thread (Permadeath)</span>
              </span>
              <div className="flex items-center space-x-0.5" title={`Stamina: ${Math.round(playerStamina)}/20`}>
                {renderStamina()}
              </div>
            </div>
          );
        }

        if (mode === 'adventure' || mode === 'wayfarer') {
          return (
            <div className="flex items-center justify-between w-full max-w-[480px] px-3 py-1 bg-black/50 backdrop-blur-md rounded-2xl border border-purple-400/50 shadow-lg text-white">
              <div className="flex items-center space-x-0.5" title={`Health: ${playerHealth}/20`}>
                {renderHearts()}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300 px-2 flex items-center space-x-1">
                <Compass className="w-3 h-3 text-purple-400 inline mr-0.5" />
                <span>Wayfarer Quest Vitals</span>
              </span>
              <div className="flex items-center space-x-0.5" title={`Stamina: ${Math.round(playerStamina)}/20`}>
                {renderStamina()}
              </div>
            </div>
          );
        }

        if (mode === 'peaceful' || mode === 'zen') {
          return (
            <div className="flex items-center space-x-2">
              <div className="px-3.5 py-1 bg-emerald-600/85 backdrop-blur-md rounded-full border border-emerald-300/60 shadow-lg text-white text-xs font-bold flex items-center space-x-1.5 shadow-emerald-500/20">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-200" />
                <span>Zen Sanctuary • Infinite Peace & Stamina</span>
              </div>
              {isFlying && (
                <div className="px-3 py-1 bg-cyan-500/85 backdrop-blur-md rounded-full border border-white/60 shadow-lg text-white text-xs font-bold flex items-center space-x-1.5">
                  <Feather className="w-3.5 h-3.5" />
                  <span>Flight Active</span>
                </div>
              )}
            </div>
          );
        }

        if (mode === 'spectator' || mode === 'chronicler') {
          return (
            <div className="px-3.5 py-1 bg-indigo-600/90 backdrop-blur-md rounded-full border border-indigo-300/60 shadow-lg text-white text-xs font-bold flex items-center space-x-1.5 shadow-indigo-500/30 animate-pulse">
              <Eye className="w-3.5 h-3.5 text-indigo-200" />
              <span>Chronicler Ghost • No-Clip Flight Active</span>
            </div>
          );
        }

        if (mode === 'architect' || mode === 'blueprint') {
          return (
            <div className="flex items-center space-x-2">
              <div className="px-3.5 py-1 bg-amber-500/90 backdrop-blur-md rounded-full border border-amber-300/60 shadow-lg text-white text-xs font-bold flex items-center space-x-1.5 shadow-amber-500/30">
                <Ruler className="w-3.5 h-3.5 text-amber-100" />
                <span>Architect Blueprint • Precision Grid Active</span>
              </div>
              {isFlying && (
                <div className="px-3 py-1 bg-cyan-500/85 backdrop-blur-md rounded-full border border-white/60 shadow-lg text-white text-xs font-bold flex items-center space-x-1.5">
                  <Feather className="w-3.5 h-3.5" />
                  <span>1.6× Speed Flight</span>
                </div>
              )}
            </div>
          );
        }

        // Default Creative Mode
        return (
          <div className="flex items-center space-x-2">
            {isFlying ? (
              <div className="px-3.5 py-1 bg-cyan-500/85 backdrop-blur-md rounded-full border border-white/60 shadow-lg text-white text-xs font-bold flex items-center space-x-1.5 animate-bounce">
                <Feather className="w-3.5 h-3.5" />
                <span>Flight Active (Double-Tap Space to Land)</span>
              </div>
            ) : (
              <div className="px-3 py-0.5 bg-cyan-600/70 backdrop-blur-md rounded-full border border-cyan-300/40 text-white text-[11px] font-semibold flex items-center space-x-1.5">
                <Feather className="w-3 h-3 text-cyan-200" />
                <span>Creative Builder (Double-Tap Space to Fly)</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* 9-Slot Minecraft-Style Hotbar Dock */}
      <div className="tropical-glass p-2 rounded-3xl border-2 border-white/90 shadow-2xl flex items-center space-x-2">
        {hotbarSlots.map((slot, idx) => {
          const isSelected = selectedHotbarIndex === idx;
          const IconComponent = ICON_MAP[slot.icon] || Box;

          return (
            <div
              key={idx}
              onClick={() => worldStore.setSelectedHotbarIndex(idx)}
              className={`relative w-12 h-12 rounded-2xl cursor-pointer transition-all duration-150 flex items-center justify-center group ${
                isSelected
                  ? 'bg-white shadow-coral-glow scale-110 ring-4 ring-tropical-coral z-10'
                  : 'bg-white/70 hover:bg-white/90 hover:scale-105 border border-white/80'
              }`}
              title={`${slot.name} (Key: ${idx + 1})`}
            >
              {/* Slot Number Badge */}
              <span className="absolute top-0.5 left-1.5 text-[9px] font-black text-slate-400 group-hover:text-slate-700">
                {idx + 1}
              </span>

              {/* 3D-styled Visual Block Preview */}
              <div
                className="w-6 h-6 rounded-lg shadow-sm border border-black/10 flex items-center justify-center relative overflow-hidden transition-transform duration-100 group-hover:rotate-6"
                style={{ backgroundColor: slot.color }}
              >
                {/* Top stud cylinder simulation */}
                <div className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-inner" />
                {slot.type === 'prop' && (
                  <IconComponent className="w-3.5 h-3.5 text-slate-800 absolute drop-shadow-sm" />
                )}
              </div>

              {/* Count Badge (∞ in Creative, number in Survival) */}
              <span
                className={`absolute bottom-0.5 right-1.5 text-[10px] font-black leading-none ${
                  isCreative
                    ? 'text-cyan-600 font-bold text-xs'
                    : slot.count === 0
                    ? 'text-rose-500'
                    : 'text-slate-800'
                }`}
              >
                {isCreative ? '∞' : slot.count}
              </span>
            </div>
          );
        })}

        {/* Full Inventory Trigger Button ('E') */}
        <div className="pl-1 border-l border-slate-300/80">
          <button
            onClick={() => worldStore.toggleInventory(true)}
            className="w-10 h-12 rounded-2xl bg-gradient-to-tr from-tropical-coral to-tropical-yellow text-white shadow-sm flex flex-col items-center justify-center space-y-0.5 hover:scale-105 transition"
            title="Open Full Inventory Catalog (Key: E)"
          >
            <Package className="w-4 h-4" />
            <kbd className="font-mono text-[9px] font-bold bg-white/30 px-1 rounded">
              E
            </kbd>
          </button>
        </div>
      </div>

      {/* Quick Keybinding Help Ribbon */}
      <div className="text-[11px] font-bold text-slate-700 bg-white/80 backdrop-blur-sm px-3.5 py-1 rounded-full border border-white/80 shadow-sm flex items-center space-x-2">
        <span><kbd className="bg-slate-100 px-1 rounded font-mono text-[10px]">1–9</kbd> Hotbar</span>
        <span className="opacity-40">•</span>
        <span><kbd className="bg-slate-100 px-1 rounded font-mono text-[10px]">Scroll</kbd> Cycle</span>
        <span className="opacity-40">•</span>
        <span><kbd className="bg-slate-100 px-1 rounded font-mono text-[10px]">E</kbd> Inventory</span>
        {isCreative ? (
          <>
            <span className="opacity-40">•</span>
            <span><kbd className="bg-slate-100 px-1 rounded font-mono text-[10px]">Space ×2</kbd> Fly</span>
          </>
        ) : (
          <>
            <span className="opacity-40">•</span>
            <span><kbd className="bg-slate-100 px-1 rounded font-mono text-[10px]">Hold Right-Click</kbd> Mine</span>
          </>
        )}
      </div>
    </div>
  );
}
