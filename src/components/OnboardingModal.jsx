import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import AvatarCanvas from './AvatarCanvas';
import {
  PRIMARY_GAME_MODES,
  GAME_MODES,
  THEMES,
  PRONOUNS,
  BODY_FORMS,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  TOPS,
  BOTTOMS,
  SHOES,
  ACCESSORIES,
  WARDROBE_PALETTES,
  ALL_WARDROBE_COLORS,
} from '../types/avatar';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  User,
  Settings,
  Shirt,
  Dice5,
  Check,
  Feather,
  Flame,
  Shield,
  X,
  ArrowRight,
  Palette,
  Shuffle,
  Eye,
  CheckCircle2,
  Compass,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Ruler,
  Ghost,
  Layers,
} from 'lucide-react';

const MODE_ICON_MAP = {
  Feather,
  Flame,
  ShieldAlert,
  Compass,
  HeartHandshake,
  Eye,
  Ruler,
  Ghost,
  Layers,
};

const RANDOM_NAMES = [
  'BuilderVivi',
  'NovaCrafter',
  'SunnyLego',
  'CosmoBrick',
  'PixelPiper',
  'MossyMason',
  'VelvetVoxel',
  'AuraArtisan',
  'CloverCraft',
  'LoomWanderer',
];

export default function OnboardingModal({ isOpen, onClose }) {
  const { avatarConfig } = useWorldStore();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'body', 'wardrobe'
  const [wardrobeCategory, setWardrobeCategory] = useState('top'); // 'top', 'bottom', 'shoes', 'accessories'
  const [showExtraModes, setShowExtraModes] = useState(false);
  const [config, setConfig] = useState(avatarConfig || {});
  const [isEntering, setIsEntering] = useState(false);

  // Sync state if store updates
  useEffect(() => {
    if (avatarConfig) {
      setConfig(avatarConfig);
    }
  }, [avatarConfig]);

  if (!isOpen) return null;

  // Active theme tokens
  const currentTheme = THEMES.find((t) => t.id === config.theme) || THEMES[0];
  const modalTheme = currentTheme.modalTheme;

  const handleUpdate = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    soundManager.playClick();
  };

  const handleRandomizeName = (e) => {
    e.stopPropagation();
    const randName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    handleUpdate('username', randName);
  };

  const handleRandomizeAvatar = () => {
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randomForm = BODY_FORMS[Math.floor(Math.random() * BODY_FORMS.length)].id;
    const randomTop = TOPS[Math.floor(Math.random() * TOPS.length)].id;
    const randomTopColor = ALL_WARDROBE_COLORS[Math.floor(Math.random() * ALL_WARDROBE_COLORS.length)];
    const randomBottom = BOTTOMS[Math.floor(Math.random() * BOTTOMS.length)].id;
    const randomBottomColor = ALL_WARDROBE_COLORS[Math.floor(Math.random() * ALL_WARDROBE_COLORS.length)];
    const randomShoe = SHOES[Math.floor(Math.random() * SHOES.length)].id;
    const randomShoeColor = ALL_WARDROBE_COLORS[Math.floor(Math.random() * ALL_WARDROBE_COLORS.length)];
    const randomAcc = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;

    setConfig((prev) => ({
      ...prev,
      skinTone: randomSkin,
      hairStyle: randomHairStyle,
      hairColor: randomHairColor,
      bodyForm: randomForm,
      topStyle: randomTop,
      topColor: randomTopColor,
      bottomStyle: randomBottom,
      bottomColor: randomBottomColor,
      shoeStyle: randomShoe,
      shoeColor: randomShoeColor,
      accessory: randomAcc,
    }));

    soundManager.playPlaceTile('meadow');

    confetti({
      particleCount: 28,
      spread: 60,
      origin: { x: 0.35, y: 0.55 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9', '#2ec4b6', '#d8bbff'],
    });
  };

  const handleSaveAndEnter = () => {
    setIsEntering(true);
    soundManager.playPlaceTile('crystal');

    confetti({
      particleCount: 75,
      spread: 85,
      origin: { y: 0.45 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9', '#2ec4b6', '#9d4edd'],
    });

    setTimeout(() => {
      worldStore.saveAndEnterWorld(config);
      if (onClose) onClose();
      setIsEntering(false);
    }, 420);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSaveAndEnter();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 transition-colors duration-500 select-none ${modalTheme.overlay} ${
        isEntering ? 'opacity-0 scale-95 transition-all duration-300 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Glassmorphic Card Container */}
      <div
        className={`w-full max-w-5xl h-[92vh] max-h-[820px] rounded-3xl backdrop-blur-2xl border transition-all duration-500 overflow-hidden flex flex-col md:flex-row relative ${modalTheme.container}`}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 transition"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ==================================================== */}
        {/* LEFT COLUMN: 3D LEGO MANNEQUIN PREVIEW STUDIO */}
        {/* ==================================================== */}
        <div className="w-full md:w-5/12 p-5 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/20 relative overflow-hidden bg-gradient-to-b from-white/10 via-transparent to-black/10">
          {/* Studio Header */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md transition-colors duration-300"
                style={{ backgroundColor: modalTheme.accentColor }}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-fredoka text-base font-bold tracking-wide block leading-none">
                  Avatar Studio
                </span>
                <span className="text-[10px] opacity-70 uppercase tracking-widest font-semibold">
                  3D Lego Mannequin
                </span>
              </div>
            </div>

            {/* Randomize Outfit Button */}
            <button
              onClick={handleRandomizeAvatar}
              className="px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-800 text-xs font-bold shadow-sm flex items-center space-x-1.5 border border-white/80 hover:scale-105 active:scale-95 transition"
              title="Randomize Appearance & Style"
            >
              <Dice5 className="w-4 h-4 text-tropical-coral" />
              <span>Randomize</span>
            </button>
          </div>

          {/* Interactive 3D Lego Mannequin Canvas */}
          <div className="flex-1 flex items-center justify-center w-full my-1 relative min-h-[300px]">
            <AvatarCanvas config={config} width={320} height={390} />
          </div>

          {/* Quick Stats Pill Summary */}
          <div className="w-full flex items-center justify-center space-x-2 text-[11px] font-semibold py-2 px-3 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/30 shadow-sm z-10">
            <span className="capitalize">{config.bodyForm} Form</span>
            <span className="opacity-40">•</span>
            <span className="capitalize">{HAIR_STYLES.find((h) => h.id === config.hairStyle)?.name}</span>
            <span className="opacity-40">•</span>
            <span className="capitalize">{ACCESSORIES.find((a) => a.id === config.accessory)?.name || config.accessory}</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: TABBED CUSTOMIZATION STUDIO */}
        {/* ==================================================== */}
        <div className="w-full md:w-7/12 flex flex-col h-full overflow-hidden relative">
          {/* Top Tabs */}
          <div className="flex items-center space-x-2 p-3 sm:p-4 border-b border-white/15 bg-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                setActiveTab('settings');
                soundManager.playClick();
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'settings'
                  ? `${modalTheme.tabActive} scale-102`
                  : `${modalTheme.tabInactive}`
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Game & Settings</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('body');
                soundManager.playClick();
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'body'
                  ? `${modalTheme.tabActive} scale-102`
                  : `${modalTheme.tabInactive}`
              }`}
            >
              <User className="w-4 h-4" />
              <span>Body & Identity</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('wardrobe');
                soundManager.playClick();
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'wardrobe'
                  ? `${modalTheme.tabActive} scale-102`
                  : `${modalTheme.tabInactive}`
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Wardrobe & Style</span>
            </button>
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ==================================================== */}
            {/* TAB 1: LOGIN & GAME SETTINGS */}
            {/* ==================================================== */}
            {activeTab === 'settings' && (
              <div className="space-y-5 animate-fade-in">
                {/* 1. Username Input & Pronouns */}
                <div className={`p-4 rounded-2xl border ${modalTheme.card} space-y-3.5`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Builder Identity
                    </label>
                    <span className="text-[11px] opacity-60">Lego Universe Passport</span>
                  </div>

                  {/* Username Field with Randomize Button */}
                  <div>
                    <span className="text-[11px] opacity-75 font-medium mb-1.5 block">
                      Builder Username
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={24}
                        value={config.username || ''}
                        onChange={(e) => handleUpdate('username', e.target.value)}
                        placeholder="Enter your builder nickname..."
                        className="w-full bg-white/70 dark:bg-black/30 border border-white/60 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 ring-tropical-coral/60 transition"
                      />
                      <button
                        onClick={handleRandomizeName}
                        title="Randomize Nickname"
                        className="absolute right-2 px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 text-xs font-semibold flex items-center space-x-1 opacity-80 hover:opacity-100 transition"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Dice</span>
                      </button>
                    </div>
                  </div>

                  {/* Pronoun Selector */}
                  <div>
                    <span className="text-[11px] opacity-75 font-medium mb-1.5 block">
                      Pronouns
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRONOUNS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleUpdate('pronouns', p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            config.pronouns === p.id
                              ? 'bg-tropical-coral text-white shadow-coral-glow scale-105'
                              : 'bg-white/50 dark:bg-white/10 opacity-80 hover:opacity-100 hover:bg-white/80'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Pronoun Input expansion */}
                    {config.pronouns === 'custom' && (
                      <input
                        type="text"
                        value={config.customPronoun || ''}
                        onChange={(e) => handleUpdate('customPronoun', e.target.value)}
                        placeholder="Type custom pronouns (e.g., ze/zir, fae/faer)..."
                        className="mt-2.5 w-full bg-white/70 dark:bg-black/30 border border-white/60 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 ring-tropical-coral/60 transition"
                      />
                    )}
                  </div>
                </div>

                {/* 2. Game Mode Selector (All 7 Distinct Modes) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                        Game Mode Selection
                      </label>
                      <span className="text-[11px] opacity-60">
                        Choose your world simulation rules • 7 Specialized Modes
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border shadow-sm"
                      style={{
                        backgroundColor: `${(PRIMARY_GAME_MODES[config.gameMode] || GAME_MODES[config.gameMode])?.color || '#ff6b8b'}20`,
                        color: (PRIMARY_GAME_MODES[config.gameMode] || GAME_MODES[config.gameMode])?.color || '#ff6b8b',
                        borderColor: `${(PRIMARY_GAME_MODES[config.gameMode] || GAME_MODES[config.gameMode])?.color || '#ff6b8b'}40`,
                      }}
                    >
                      {(PRIMARY_GAME_MODES[config.gameMode] || GAME_MODES[config.gameMode])?.name || 'Mode'}
                    </span>
                  </div>

                  {/* All 7 Game Mode Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {Object.values(PRIMARY_GAME_MODES).map((mode) => {
                      const isSelected =
                        config.gameMode === mode.id ||
                        (mode.id === 'creative' && config.gameMode === 'dreamweaver') ||
                        (mode.id === 'survival' && config.gameMode === 'hearthkeeper') ||
                        (mode.id === 'hardcore' && config.gameMode === 'iron_thread') ||
                        (mode.id === 'adventure' && config.gameMode === 'wayfarer') ||
                        (mode.id === 'peaceful' && config.gameMode === 'zen') ||
                        (mode.id === 'spectator' && config.gameMode === 'chronicler') ||
                        (mode.id === 'architect' && config.gameMode === 'blueprint');

                      const IconComponent = MODE_ICON_MAP[mode.icon] || Feather;

                      return (
                        <div
                          key={mode.id}
                          onClick={() => handleUpdate('gameMode', mode.id)}
                          className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all relative flex flex-col justify-between group ${
                            isSelected
                              ? `${mode.borderClass} ${mode.accentBg} shadow-md scale-[1.01] ring-2 ${mode.ringClass}`
                              : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white/60 dark:bg-white/5 hover:bg-white/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2.5">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                                  style={{
                                    backgroundColor: `${mode.color}22`,
                                    color: mode.color,
                                  }}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-fredoka text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
                                    {mode.name}
                                  </h4>
                                  <span
                                    className="text-[10px] font-semibold uppercase tracking-wide"
                                    style={{ color: mode.color }}
                                  >
                                    {mode.subtitle}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <div
                                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-sm shrink-0"
                                  style={{ backgroundColor: mode.color }}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            <p className="text-[11px] opacity-80 leading-relaxed mb-2.5 line-clamp-2">
                              {mode.description}
                            </p>

                            {/* Feature Badges */}
                            <div className="space-y-1 text-[10px]">
                              {mode.perks.map((perk, i) => (
                                <div key={i} className="flex items-center space-x-1.5 opacity-90">
                                  <CheckCircle2
                                    className="w-3 h-3 shrink-0"
                                    style={{ color: mode.color }}
                                  />
                                  <span className="leading-tight">{perk}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Theme Preview Picker */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                        World Theme & Lighting
                      </label>
                      <span className="text-[11px] opacity-60">
                        Select an atmospheric visual aesthetic
                      </span>
                    </div>
                    <span className="text-xs font-bold opacity-80 capitalize">
                      {currentTheme.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {THEMES.map((theme) => {
                      const isSelected = config.theme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleUpdate('theme', theme.id)}
                          className={`p-3 rounded-2xl text-left border-2 transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-tropical-coral bg-white/90 dark:bg-white/15 shadow-coral-glow/30 scale-102 ring-1 ring-tropical-coral/50'
                              : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
                          }`}
                        >
                          <div>
                            {/* Color preview circles */}
                            <div className="flex space-x-1.5 mb-2">
                              {theme.preview.map((col, idx) => (
                                <span
                                  key={idx}
                                  className="w-4 h-4 rounded-full shadow-sm border border-black/10"
                                  style={{ backgroundColor: col }}
                                />
                              ))}
                            </div>
                            <div className="font-fredoka text-xs font-bold leading-tight">
                              {theme.name}
                            </div>
                            <div className="text-[10px] opacity-65 mt-0.5 leading-snug">
                              {theme.subtitle}
                            </div>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-tropical-coral text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: BODY & IDENTITY */}
            {/* ==================================================== */}
            {activeTab === 'body' && (
              <div className="space-y-5 animate-fade-in">
                {/* 1. Base Form Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Base Form Presets
                    </label>
                    <span className="text-[11px] opacity-60">
                      Modifies torso, shoulder & limb proportions
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BODY_FORMS.map((form) => (
                      <button
                        key={form.id}
                        onClick={() => handleUpdate('bodyForm', form.id)}
                        className={`p-3 rounded-2xl text-left border-2 transition-all relative ${
                          config.bodyForm === form.id
                            ? 'border-tropical-aqua bg-cyan-50/50 dark:bg-cyan-950/40 shadow-aqua-glow scale-102'
                            : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{form.name}</span>
                          {config.bodyForm === form.id && (
                            <Check className="w-3.5 h-3.5 text-tropical-aqua" />
                          )}
                        </div>
                        <div className="text-[10px] opacity-60 leading-tight mt-1">{form.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Skin Tone Palette (Inclusive + Fantasy + Custom) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Skin Tone Palette
                    </label>
                    <span className="text-[11px] opacity-60">Natural spectrum & fantasy pastels</span>
                  </div>

                  {/* Natural Inclusive Palette */}
                  <div>
                    <span className="text-[10.5px] opacity-70 block mb-1 font-semibold">Natural Spectrum</span>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TONES.filter((s) => s.type === 'natural').map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => handleUpdate('skinTone', tone.hex)}
                          className={`w-8 h-8 rounded-xl shadow-sm relative transition hover:scale-110 active:scale-95 ${
                            config.skinTone === tone.hex
                              ? 'ring-2 ring-tropical-coral ring-offset-2 scale-110'
                              : 'border border-black/10'
                          }`}
                          style={{ backgroundColor: tone.hex }}
                          title={tone.name}
                        >
                          {config.skinTone === tone.hex && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fantasy Tones & Custom Picker */}
                  <div className="pt-1">
                    <span className="text-[10.5px] opacity-70 block mb-1 font-semibold">Fantasy Pastel Tones</span>
                    <div className="flex items-center flex-wrap gap-2">
                      {SKIN_TONES.filter((s) => s.type === 'fantasy').map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => handleUpdate('skinTone', tone.hex)}
                          className={`w-8 h-8 rounded-xl shadow-sm relative transition hover:scale-110 active:scale-95 ${
                            config.skinTone === tone.hex
                              ? 'ring-2 ring-tropical-coral ring-offset-2 scale-110'
                              : 'border border-black/10'
                          }`}
                          style={{ backgroundColor: tone.hex }}
                          title={tone.name}
                        >
                          {config.skinTone === tone.hex && (
                            <Check className="w-3.5 h-3.5 text-slate-800 drop-shadow mx-auto" />
                          )}
                        </button>
                      ))}

                      {/* Custom Hex Color Picker input */}
                      <label
                        className="w-8 h-8 rounded-xl border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:scale-110 transition bg-white/40"
                        title="Pick Custom Skin Tone"
                      >
                        <input
                          type="color"
                          value={config.skinTone || '#e0ac69'}
                          onChange={(e) => handleUpdate('skinTone', e.target.value)}
                          className="w-0 h-0 opacity-0 absolute"
                        />
                        <Palette className="w-4 h-4 opacity-70" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Hair Styles & Colors */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Hair Style
                    </label>
                    <span className="text-[11px] opacity-60">
                      {HAIR_STYLES.find((h) => h.id === config.hairStyle)?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HAIR_STYLES.map((hs) => (
                      <button
                        key={hs.id}
                        onClick={() => handleUpdate('hairStyle', hs.id)}
                        className={`p-2.5 rounded-2xl text-left border-2 transition-all ${
                          config.hairStyle === hs.id
                            ? 'border-tropical-coral bg-pink-50/50 dark:bg-pink-950/40 shadow-sm scale-102'
                            : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{hs.name}</div>
                        <div className="text-[10px] opacity-60 truncate mt-0.5">{hs.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Hair Color Palette */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] opacity-75 font-semibold">Hair Color Palette</span>
                      <span className="text-[10px] opacity-60 uppercase">{config.hairColor}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      {HAIR_COLORS.map((hc) => (
                        <button
                          key={hc.id}
                          onClick={() => handleUpdate('hairColor', hc.hex)}
                          className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 active:scale-95 ${
                            config.hairColor === hc.hex
                              ? 'ring-2 ring-tropical-coral ring-offset-2 scale-110'
                              : 'border border-black/10'
                          }`}
                          style={{ backgroundColor: hc.hex }}
                          title={hc.name}
                        />
                      ))}

                      {/* Custom Hair Color Picker */}
                      <label
                        className="w-7 h-7 rounded-xl border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:scale-110 transition bg-white/40"
                        title="Pick Custom Hair Color"
                      >
                        <input
                          type="color"
                          value={config.hairColor || '#3e2723'}
                          onChange={(e) => handleUpdate('hairColor', e.target.value)}
                          className="w-0 h-0 opacity-0 absolute"
                        />
                        <Palette className="w-3.5 h-3.5 opacity-70" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 3: WARDROBE & STYLE */}
            {/* ==================================================== */}
            {activeTab === 'wardrobe' && (
              <div className="space-y-4 animate-fade-in">
                {/* Category Pills: Tops / Bottoms / Shoes / Accessories */}
                <div className="flex space-x-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/20">
                  {[
                    { id: 'top', label: 'Tops' },
                    { id: 'bottom', label: 'Bottoms' },
                    { id: 'shoes', label: 'Footwear' },
                    { id: 'accessories', label: 'Hats & Glasses' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setWardrobeCategory(cat.id);
                        soundManager.playClick();
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        wardrobeCategory === cat.id
                          ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm scale-102'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 1. Tops Customizer */}
                {wardrobeCategory === 'top' && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Tops & Shirts
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TOPS.map((top) => (
                        <button
                          key={top.id}
                          onClick={() => handleUpdate('topStyle', top.id)}
                          className={`p-3 rounded-2xl text-left border-2 transition ${
                            config.topStyle === top.id
                              ? 'border-tropical-coral bg-pink-50/50 dark:bg-pink-950/40 shadow-sm scale-102'
                              : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10'
                          }`}
                        >
                          <div className="text-xs font-bold">{top.name}</div>
                        </button>
                      ))}
                    </div>

                    {/* Top Color Swatches */}
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] opacity-75 block font-semibold">Top Color</span>
                      <div className="flex items-center flex-wrap gap-2">
                        {WARDROBE_PALETTES.pastels.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleUpdate('topColor', col)}
                            className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                              config.topColor === col ? 'ring-2 ring-tropical-coral ring-offset-2 scale-110' : 'border border-black/10'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        {WARDROBE_PALETTES.darkAndBold.map((col, idx) => (
                          <button
                            key={'dark-' + idx}
                            onClick={() => handleUpdate('topColor', col)}
                            className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                              config.topColor === col ? 'ring-2 ring-tropical-coral ring-offset-2 scale-110' : 'border border-black/10'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        <label
                          className="w-7 h-7 rounded-xl border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:scale-110 transition bg-white/40"
                          title="Pick Custom Color"
                        >
                          <input
                            type="color"
                            value={config.topColor || '#ff8da1'}
                            onChange={(e) => handleUpdate('topColor', e.target.value)}
                            className="w-0 h-0 opacity-0 absolute"
                          />
                          <Palette className="w-3.5 h-3.5 opacity-70" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Bottoms Customizer */}
                {wardrobeCategory === 'bottom' && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Bottoms & Pants
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BOTTOMS.map((bot) => (
                        <button
                          key={bot.id}
                          onClick={() => handleUpdate('bottomStyle', bot.id)}
                          className={`p-3 rounded-2xl text-left border-2 transition ${
                            config.bottomStyle === bot.id
                              ? 'border-tropical-aqua bg-cyan-50/50 dark:bg-cyan-950/40 shadow-sm scale-102'
                              : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10'
                          }`}
                        >
                          <div className="text-xs font-bold">{bot.name}</div>
                        </button>
                      ))}
                    </div>

                    {/* Bottom Color Swatches */}
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] opacity-75 block font-semibold">Pants / Skirt Color</span>
                      <div className="flex items-center flex-wrap gap-2">
                        {WARDROBE_PALETTES.pastels.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleUpdate('bottomColor', col)}
                            className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                              config.bottomColor === col ? 'ring-2 ring-tropical-aqua ring-offset-2 scale-110' : 'border border-black/10'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        {WARDROBE_PALETTES.darkAndBold.map((col, idx) => (
                          <button
                            key={'dark-' + idx}
                            onClick={() => handleUpdate('bottomColor', col)}
                            className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                              config.bottomColor === col ? 'ring-2 ring-tropical-aqua ring-offset-2 scale-110' : 'border border-black/10'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        <label
                          className="w-7 h-7 rounded-xl border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:scale-110 transition bg-white/40"
                          title="Pick Custom Color"
                        >
                          <input
                            type="color"
                            value={config.bottomColor || '#ffffff'}
                            onChange={(e) => handleUpdate('bottomColor', e.target.value)}
                            className="w-0 h-0 opacity-0 absolute"
                          />
                          <Palette className="w-3.5 h-3.5 opacity-70" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Footwear Customizer */}
                {wardrobeCategory === 'shoes' && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Footwear & Shoes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SHOES.map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => handleUpdate('shoeStyle', sh.id)}
                          className={`p-3 rounded-2xl text-left border-2 transition ${
                            config.shoeStyle === sh.id
                              ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/40 shadow-sm scale-102'
                              : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10'
                          }`}
                        >
                          <div className="text-xs font-bold">{sh.name}</div>
                        </button>
                      ))}
                    </div>

                    {/* Shoe Color Swatches */}
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] opacity-75 block font-semibold">Shoe Color</span>
                      <div className="flex items-center flex-wrap gap-2">
                        {WARDROBE_PALETTES.pastels.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleUpdate('shoeColor', col)}
                            className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                              config.shoeColor === col ? 'ring-2 ring-amber-400 ring-offset-2 scale-110' : 'border border-black/10'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        {WARDROBE_PALETTES.darkAndBold.map((col, idx) => (
                          <button
                            key={'dark-' + idx}
                            onClick={() => handleUpdate('shoeColor', col)}
                            className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                              config.shoeColor === col ? 'ring-2 ring-amber-400 ring-offset-2 scale-110' : 'border border-black/10'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        <label
                          className="w-7 h-7 rounded-xl border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:scale-110 transition bg-white/40"
                          title="Pick Custom Color"
                        >
                          <input
                            type="color"
                            value={config.shoeColor || '#ffd166'}
                            onChange={(e) => handleUpdate('shoeColor', e.target.value)}
                            className="w-0 h-0 opacity-0 absolute"
                          />
                          <Palette className="w-3.5 h-3.5 opacity-70" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Accessories & Headwear */}
                {wardrobeCategory === 'accessories' && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Hats & Eyewear
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ACCESSORIES.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => handleUpdate('accessory', acc.id)}
                          className={`p-3 rounded-2xl text-left border-2 transition ${
                            config.accessory === acc.id
                              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 shadow-sm scale-102'
                              : 'border-transparent bg-white/50 dark:bg-white/5 hover:border-black/10'
                          }`}
                        >
                          <div className="text-xs font-bold">{acc.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* BOTTOM ACTION BAR */}
          {/* ==================================================== */}
          <div className="p-4 sm:p-5 border-t border-white/15 bg-white/10 backdrop-blur-md flex items-center justify-between">
            <div className="hidden sm:block">
              <span className="text-xs font-semibold block leading-tight">
                Welcome to Wildergrid, {config.username || 'Builder'}!
              </span>
              <span className="text-[10.5px] opacity-60">
                Mode: {(PRIMARY_GAME_MODES[config.gameMode] || GAME_MODES[config.gameMode])?.name || 'Creative'} • Theme: {currentTheme.name}
              </span>
            </div>

            <button
              onClick={handleSaveAndEnter}
              disabled={isEntering}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-fredoka font-bold text-sm tracking-wide ${modalTheme.primaryBtn} hover:scale-105 active:scale-98 transition-all flex items-center justify-center space-x-2.5 cursor-pointer`}
            >
              <span>{isEntering ? 'Entering World...' : 'Save & Enter World'}</span>
              <ArrowRight className="w-4 h-4 animate-bounce-x" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
