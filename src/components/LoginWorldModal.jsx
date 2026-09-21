import React, { useState } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import {
  PRIMARY_GAME_MODES,
  THEMES,
  getThemeById,
} from '../types/avatar';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Dice5,
  Check,
  Feather,
  Flame,
  ShieldAlert,
  Compass,
  HeartHandshake,
  Eye,
  Ruler,
  ArrowRight,
  Palette,
  Globe,
  Shuffle,
  Shield,
  CheckCircle2,
  TreePine,
} from 'lucide-react';

const MODE_ICONS = {
  Feather,
  Flame,
  ShieldAlert,
  Compass,
  HeartHandshake,
  Eye,
  Ruler,
};

const RANDOM_USERNAMES = [
  'BuilderSteve',
  'AlexVoxel',
  'NovaCrafter',
  'SunnyLego',
  'CosmoBrick',
  'PixelPiper',
  'MossyMason',
  'VelvetVoxel',
  'AuraArtisan',
  'BuilderVivi',
];

const PROCEDURAL_SEEDS = [
  'emerald-pasture-77',
  'cow-meadow-haven',
  'whispering-pines-99',
  'sunlit-archipelago-42',
  'golden-horizon-18',
  'neon-cyber-peak-04',
];

export default function LoginWorldModal({ isOpen }) {
  const { avatarConfig, seed: currentSeed } = useWorldStore();

  const [username, setUsername] = useState(avatarConfig?.username || 'BuilderVivi');
  const [gameMode, setGameMode] = useState(avatarConfig?.gameMode || 'survival');
  const [theme, setTheme] = useState(avatarConfig?.theme || 'pastel_dream');
  const [seed, setSeed] = useState(currentSeed || 'cow-meadow-haven');

  if (!isOpen) return null;

  const currentThemeObj = getThemeById(theme) || THEMES[0];
  const modalTheme = currentThemeObj.modalTheme;

  const handleRandomUsername = () => {
    soundManager.playClick();
    const picked = RANDOM_USERNAMES[Math.floor(Math.random() * RANDOM_USERNAMES.length)];
    setUsername(picked);
  };

  const handleRandomSeed = () => {
    soundManager.playClick();
    const picked = PROCEDURAL_SEEDS[Math.floor(Math.random() * PROCEDURAL_SEEDS.length)];
    setSeed(picked);
  };

  const handleLaunchWorld = () => {
    soundManager.playClick();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6'],
    });

    worldStore.startWorldGeneration({
      username: username.trim() || 'Builder',
      gameMode,
      theme,
      seed: seed.trim() || 'wildergrid-seed',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header Ribbon */}
        <div className="p-5 pb-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-fredoka text-xl font-bold tracking-wide">
                  Wildergrid Voxel Launcher
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  Minecraft Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup your builder identity, game mode, theme & world generation
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* 1. Builder Identity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Builder Login & Handle
              </label>
              <button
                type="button"
                onClick={handleRandomUsername}
                className="text-[11px] font-bold text-tropical-coral hover:opacity-80 flex items-center space-x-1"
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span>Random Name</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                placeholder="Enter builder username..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-tropical-coral shadow-sm"
              />
            </div>
          </div>

          {/* 2. Game Mode Selection (All 7 Modes) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Game Mode Selection • 7 Modes
              </label>
              <span
                className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border shadow-sm"
                style={{
                  backgroundColor: `${PRIMARY_GAME_MODES[gameMode]?.color}20`,
                  color: PRIMARY_GAME_MODES[gameMode]?.color,
                  borderColor: `${PRIMARY_GAME_MODES[gameMode]?.color}40`,
                }}
              >
                {PRIMARY_GAME_MODES[gameMode]?.name} ({PRIMARY_GAME_MODES[gameMode]?.subtitle})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1.5 custom-scrollbar">
              {Object.values(PRIMARY_GAME_MODES).map((mode) => {
                const isSelected = gameMode === mode.id;
                const IconComp = MODE_ICONS[mode.icon] || Feather;

                return (
                  <div
                    key={mode.id}
                    onClick={() => {
                      setGameMode(mode.id);
                      soundManager.playClick();
                    }}
                    className={`cursor-pointer p-3 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? `${mode.borderClass} ${mode.accentBg} shadow-md scale-[1.01] ring-2 ${mode.ringClass}`
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                            style={{ backgroundColor: `${mode.color}22`, color: mode.color }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-fredoka text-sm font-bold leading-tight">
                              {mode.name}
                            </h4>
                            <span
                              className="text-[9.5px] font-semibold uppercase tracking-wide block"
                              style={{ color: mode.color }}
                            >
                              {mode.subtitle}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full text-white flex items-center justify-center shadow-sm shrink-0"
                            style={{ backgroundColor: mode.color }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-[10.5px] opacity-75 line-clamp-2 leading-tight mb-2">
                        {mode.description}
                      </p>

                      <div className="space-y-0.5 text-[9.5px]">
                        {mode.perks.slice(0, 2).map((perk, i) => (
                          <div key={i} className="flex items-center space-x-1.5 opacity-90">
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: mode.color }} />
                            <span className="truncate">{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Theme & Atmosphere */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              3. World Theme & Lighting Atmosphere
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      soundManager.playClick();
                    }}
                    className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-lg shadow-emerald-500/20 scale-102 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex space-x-1.5 mb-2">
                        {t.preview.map((c, idx) => (
                          <span
                            key={idx}
                            className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/60"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="font-fredoka text-xs font-bold leading-tight">{t.name}</div>
                      <div className="text-[9.5px] opacity-65 leading-tight mt-0.5">{t.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. World Seed & Generation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4. Procedural Voxel World Seed
              </label>
              <button
                type="button"
                onClick={handleRandomSeed}
                className="text-[11px] font-bold text-tropical-aqua hover:opacity-80 flex items-center space-x-1"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>New Random Seed</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Enter custom seed or random word..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-tropical-aqua shadow-sm"
                />
              </div>
            </div>

            {/* Quick World Seed Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['cow-meadow-haven', 'whispering-pines', 'sunlit-archipelago', 'emerald-valley'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeed(s)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition ${
                    seed === s
                      ? 'bg-tropical-aqua/20 border-tropical-aqua text-tropical-aqua font-bold'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-black/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="hidden sm:block">
            <span className="text-xs font-bold block leading-tight">
              Ready to explore, {username || 'Builder'}!
            </span>
            <span className="text-[10.5px] opacity-65">
              Spawns with 3D cows, harvestable wood trees & {PRIMARY_GAME_MODES[gameMode]?.name} mode
            </span>
          </div>

          <button
            type="button"
            onClick={handleLaunchWorld}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl font-fredoka font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Create & Enter World</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
