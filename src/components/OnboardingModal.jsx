import React, { useState } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import AvatarCanvas from './AvatarCanvas';
import {
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
} from '../types/avatar';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  User,
  Settings,
  Palette,
  Shirt,
  Dice5,
  Check,
  Feather,
  Shield,
  X,
  ArrowRight,
  Flame,
  ShieldAlert,
  Compass,
  Ghost,
  Users,
  Sprout,
} from 'lucide-react';

const MODE_ICONS = {
  Flame,
  Feather,
  ShieldAlert,
  Compass,
  Ghost,
  Users,
  Sprout,
};

export default function OnboardingModal({ isOpen, onClose }) {
  const { avatarConfig } = useWorldStore();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'body', 'wardrobe'
  const [config, setConfig] = useState(avatarConfig);

  if (!isOpen) return null;

  const handleUpdate = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleRandomize = () => {
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randomForm = BODY_FORMS[Math.floor(Math.random() * BODY_FORMS.length)].id;
    const randomTop = TOPS[Math.floor(Math.random() * TOPS.length)].id;
    const randomTopColor = WARDROBE_PALETTES[Math.floor(Math.random() * WARDROBE_PALETTES.length)];
    const randomBottom = BOTTOMS[Math.floor(Math.random() * BOTTOMS.length)].id;
    const randomBottomColor = WARDROBE_PALETTES[Math.floor(Math.random() * WARDROBE_PALETTES.length)];
    const randomShoe = SHOES[Math.floor(Math.random() * SHOES.length)].id;
    const randomShoeColor = WARDROBE_PALETTES[Math.floor(Math.random() * WARDROBE_PALETTES.length)];
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

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { x: 0.35, y: 0.6 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9', '#2ec4b6'],
    });
  };

  const handleSaveAndEnter = () => {
    worldStore.saveAndEnterWorld(config);
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9', '#2ec4b6'],
    });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-md animate-fade-in select-none">
      <div className="tropical-glass w-full max-w-5xl h-[92vh] max-h-[760px] rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col md:flex-row relative">

        {/* Close Button (if reopening) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-black/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ==================================================== */}
        {/* LEFT COLUMN: 3D AVATAR MANNEQUIN CANVAS */}
        {/* ==================================================== */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-white/40 via-white/20 to-pink-50/40 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/60 relative">
          {/* Header Title */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-tropical-coral to-tropical-yellow flex items-center justify-center text-white shadow-coral-glow">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-fredoka text-base font-bold text-slate-800">
                Avatar Preview
              </span>
            </div>

            {/* Randomize Outfit Dice */}
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-slate-700 shadow-sm flex items-center space-x-1.5 border border-white/90 hover:scale-105 transition"
              title="Randomize Appearance & Wardrobe"
            >
              <Dice5 className="w-4 h-4 text-tropical-coral" />
              <span>Randomize</span>
            </button>
          </div>

          {/* Interactive 3D Mannequin Canvas */}
          <div className="flex-1 flex items-center justify-center w-full my-1">
            <AvatarCanvas config={config} width={300} height={380} />
          </div>

          {/* Quick stats / summary pill */}
          <div className="w-full flex items-center justify-center space-x-2 text-[11px] font-semibold text-slate-600 bg-white/70 py-1.5 px-3 rounded-2xl border border-white/80 shadow-sm">
            <span className="capitalize">{config.bodyForm} Form</span>
            <span className="opacity-40">•</span>
            <span className="capitalize">{HAIR_STYLES.find(h => h.id === config.hairStyle)?.name}</span>
            <span className="opacity-40">•</span>
            <span className="capitalize">{config.accessory}</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: TABBED CUSTOMIZATION PANEL */}
        {/* ==================================================== */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-white/70 overflow-hidden">

          {/* Top Tabs */}
          <div className="flex items-center space-x-2 p-4 border-b border-black/5 bg-white/50">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-tropical-coral to-tropical-yellow text-white shadow-coral-glow scale-102'
                  : 'text-slate-600 hover:bg-black/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Game & Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('body')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
                activeTab === 'body'
                  ? 'bg-gradient-to-r from-tropical-aqua to-tropical-mint text-white shadow-aqua-glow scale-102'
                  : 'text-slate-600 hover:bg-black/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Body & Identity</span>
            </button>

            <button
              onClick={() => setActiveTab('wardrobe')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
                activeTab === 'wardrobe'
                  ? 'bg-gradient-to-r from-[#9d4edd] to-[#ff6b8b] text-white shadow-sm scale-102'
                  : 'text-slate-600 hover:bg-black/5'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Wardrobe & Style</span>
            </button>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* TAB 1: GAME SETTINGS & PROFILE */}
            {activeTab === 'settings' && (
              <div className="space-y-4 animate-fade-in">
                {/* Username & Pronouns */}
                <div className="tropical-card p-4 rounded-2xl space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Player Identity
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <span className="text-[11px] text-slate-500 mb-1 block font-medium">Username</span>
                      <input
                        type="text"
                        value={config.username}
                        onChange={(e) => handleUpdate('username', e.target.value)}
                        className="w-full tropical-input rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-tropical-coral/50"
                        placeholder="Choose your builder name..."
                      />
                    </div>
                  </div>

                  {/* Pronouns */}
                  <div>
                    <span className="text-[11px] text-slate-500 mb-1.5 block font-medium">Pronouns</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRONOUNS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleUpdate('pronouns', p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            config.pronouns === p.id
                              ? 'bg-tropical-coral text-white shadow-sm'
                              : 'bg-white/80 text-slate-700 hover:bg-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {config.pronouns === 'custom' && (
                      <input
                        type="text"
                        value={config.customPronoun || ''}
                        onChange={(e) => handleUpdate('customPronoun', e.target.value)}
                        placeholder="Enter custom pronouns (e.g. ze/zir)..."
                        className="mt-2 w-full tropical-input rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* The 7 Whimsical Game Modes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      The 7 Whimsical Game Modes
                    </label>
                    <span className="text-[10px] text-tropical-coral font-semibold">
                      {GAME_MODES[config.gameMode]?.name || 'Select Mode'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {Object.values(GAME_MODES).map((mode) => {
                      const IconComponent = MODE_ICONS[mode.icon] || Sparkles;
                      const isSelected = config.gameMode === mode.id;

                      return (
                        <div
                          key={mode.id}
                          onClick={() => handleUpdate('gameMode', mode.id)}
                          className={`cursor-pointer tropical-card p-3 rounded-2xl border-2 transition-all relative ${
                            isSelected
                              ? `${mode.borderClass} bg-white shadow-tropical-md scale-101 ring-1 ring-black/5`
                              : 'border-transparent hover:border-black/10 bg-white/70'
                          }`}
                        >
                          {/* Header: Icon + Name + Subtitle */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm"
                                style={{
                                  backgroundColor: `${mode.color}20`,
                                  color: mode.color,
                                }}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-fredoka text-xs font-bold text-slate-800 leading-tight">
                                  {mode.name}
                                </h4>
                                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                                  {mode.subtitle}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: mode.color }}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          {/* 2-3 Keyword Tagline (Prominent & Clean!) */}
                          <div className="mt-2">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm border border-black/5 inline-flex items-center space-x-1"
                              style={{
                                backgroundColor: isSelected ? `${mode.color}15` : 'rgba(255, 255, 255, 0.95)',
                                color: isSelected ? mode.color : '#334155',
                              }}
                            >
                              <span>✨</span>
                              <span>{mode.shortKeywords}</span>
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-slate-600 leading-snug mt-1.5 line-clamp-2">
                            {mode.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    World Theme Palette
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleUpdate('theme', theme.id)}
                        className={`tropical-card p-3 rounded-2xl text-left border-2 transition ${
                          config.theme === theme.id
                            ? 'border-tropical-coral shadow-sm scale-102'
                            : 'border-transparent hover:border-black/10'
                        }`}
                      >
                        <div className="flex space-x-1 mb-1.5">
                          {theme.preview.map((col, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full shadow-sm"
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                        <div className="font-fredoka text-xs font-bold text-slate-800">
                          {theme.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {theme.subtitle}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BODY & IDENTITY */}
            {activeTab === 'body' && (
              <div className="space-y-4 animate-fade-in">
                {/* Base Form Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Base Body Form
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BODY_FORMS.map((form) => (
                      <button
                        key={form.id}
                        onClick={() => handleUpdate('bodyForm', form.id)}
                        className={`p-3 rounded-2xl text-left tropical-card border-2 transition ${
                          config.bodyForm === form.id
                            ? 'border-tropical-aqua bg-cyan-50/50 shadow-aqua-glow'
                            : 'border-transparent hover:border-black/10'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-800">{form.name}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{form.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Tones Spectrum */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Skin Tone Palette
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => handleUpdate('skinTone', tone.hex)}
                        className={`w-9 h-9 rounded-2xl shadow-sm relative transition hover:scale-110 ${
                          config.skinTone === tone.hex ? 'ring-2 ring-tropical-coral ring-offset-2 scale-110' : ''
                        }`}
                        style={{ backgroundColor: tone.hex }}
                        title={tone.name}
                      >
                        {config.skinTone === tone.hex && (
                          <Check className="w-4 h-4 text-white drop-shadow mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Style & Color */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hair Styles
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HAIR_STYLES.map((hs) => (
                      <button
                        key={hs.id}
                        onClick={() => handleUpdate('hairStyle', hs.id)}
                        className={`p-2.5 rounded-2xl text-left tropical-card border-2 transition ${
                          config.hairStyle === hs.id
                            ? 'border-tropical-coral bg-pink-50/40 shadow-sm'
                            : 'border-transparent hover:border-black/10'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-800">{hs.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{hs.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Hair Color Palette */}
                  <span className="text-[11px] text-slate-500 block pt-1 font-medium">Hair Color</span>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.id}
                        onClick={() => handleUpdate('hairColor', hc.hex)}
                        className={`w-7 h-7 rounded-xl shadow-sm transition hover:scale-110 ${
                          config.hairColor === hc.hex ? 'ring-2 ring-tropical-coral ring-offset-1 scale-110' : ''
                        }`}
                        style={{ backgroundColor: hc.hex }}
                        title={hc.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WARDROBE & STYLE */}
            {activeTab === 'wardrobe' && (
              <div className="space-y-4 animate-fade-in">
                {/* Tops Customizer */}
                <div className="tropical-card p-3.5 rounded-2xl space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tops & Shirts
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPS.map((top) => (
                      <button
                        key={top.id}
                        onClick={() => handleUpdate('topStyle', top.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition text-left ${
                          config.topStyle === top.id
                            ? 'bg-tropical-coral text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-white/80'
                        }`}
                      >
                        {top.name}
                      </button>
                    ))}
                  </div>
                  {/* Top Color Palette */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {WARDROBE_PALETTES.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUpdate('topColor', col)}
                        className={`w-6 h-6 rounded-lg shadow-sm transition hover:scale-110 ${
                          config.topColor === col ? 'ring-2 ring-tropical-coral ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottoms Customizer */}
                <div className="tropical-card p-3.5 rounded-2xl space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Bottoms & Pants
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BOTTOMS.map((bot) => (
                      <button
                        key={bot.id}
                        onClick={() => handleUpdate('bottomStyle', bot.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition text-left ${
                          config.bottomStyle === bot.id
                            ? 'bg-tropical-aqua text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-white/80'
                        }`}
                      >
                        {bot.name}
                      </button>
                    ))}
                  </div>
                  {/* Bottom Color Palette */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {WARDROBE_PALETTES.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUpdate('bottomColor', col)}
                        className={`w-6 h-6 rounded-lg shadow-sm transition hover:scale-110 ${
                          config.bottomColor === col ? 'ring-2 ring-tropical-aqua ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Shoes & Accessories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Footwear */}
                  <div className="tropical-card p-3 rounded-2xl space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-600">Footwear</label>
                    <div className="space-y-1">
                      {SHOES.map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => handleUpdate('shoeStyle', sh.id)}
                          className={`w-full p-1.5 rounded-xl text-xs font-bold text-left px-2 transition ${
                            config.shoeStyle === sh.id ? 'bg-amber-400 text-slate-900' : 'hover:bg-white/60 text-slate-700'
                          }`}
                        >
                          {sh.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accessories */}
                  <div className="tropical-card p-3 rounded-2xl space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-600">Headwear & Glasses</label>
                    <div className="space-y-1">
                      {ACCESSORIES.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => handleUpdate('accessory', acc.id)}
                          className={`w-full p-1.5 rounded-xl text-xs font-bold text-left px-2 transition ${
                            config.accessory === acc.id ? 'bg-purple-500 text-white' : 'hover:bg-white/60 text-slate-700'
                          }`}
                        >
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 border-t border-black/5 bg-white/60 flex items-center justify-between">
            <div className="text-xs text-slate-500 hidden sm:block">
              Ready to construct whimsical 3D creations in Wildergrid!
            </div>
            <button
              onClick={handleSaveAndEnter}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl font-fredoka font-bold text-sm bg-gradient-to-r from-tropical-coral via-tropical-yellow to-tropical-aqua text-white shadow-coral-glow hover:scale-105 transition flex items-center justify-center space-x-2"
            >
              <span>Save & Enter World</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
