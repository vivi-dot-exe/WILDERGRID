import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import AvatarCanvas from './AvatarCanvas';
import {
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
  Shirt,
  X,
  Check,
  Palette,
  Shuffle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function AvatarStudioModal({ isOpen, onClose }) {
  const { avatarConfig } = useWorldStore();
  const [activeTab, setActiveTab] = useState('body'); // 'body' | 'wardrobe'
  const [wardrobeCategory, setWardrobeCategory] = useState('top'); // 'top', 'bottom', 'shoes', 'accessories'
  const [config, setConfig] = useState(avatarConfig || {});

  useEffect(() => {
    if (avatarConfig) {
      setConfig(avatarConfig);
    }
  }, [avatarConfig]);

  if (!isOpen) return null;

  const currentTheme = THEMES.find((t) => t.id === config.theme) || THEMES[0];
  const modalTheme = currentTheme.modalTheme;

  const handleUpdate = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    soundManager.playClick();
  };

  const handleRandomizeAll = () => {
    soundManager.playClick();
    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const randomized = {
      ...config,
      bodyForm: randomItem(BODY_FORMS).id,
      pronouns: randomItem(PRONOUNS).id,
      skinTone: randomItem(SKIN_TONES).color,
      hairStyle: randomItem(HAIR_STYLES).id,
      hairColor: randomItem(HAIR_COLORS).color,
      topStyle: randomItem(TOPS).id,
      topColor: randomItem(ALL_WARDROBE_COLORS),
      bottomStyle: randomItem(BOTTOMS).id,
      bottomColor: randomItem(ALL_WARDROBE_COLORS),
      shoeStyle: randomItem(SHOES).id,
      shoeColor: randomItem(ALL_WARDROBE_COLORS),
      accessory: randomItem(ACCESSORIES).id,
    };

    setConfig(randomized);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#ff6b8b', '#ffd166', '#00bbf9'],
    });
  };

  const handleSaveAvatar = () => {
    soundManager.playPlaceTile('meadow');
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#ff6b8b', '#ffd166', '#2ec4b6'],
    });
    worldStore.saveAvatarConfig(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[740px] flex flex-col md:flex-row bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* ==================================================== */}
        {/* LEFT PANEL: 3D LIVE LEGO MANNEQUIN PREVIEW */}
        {/* ==================================================== */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative bg-slate-50/70 dark:bg-slate-900/90 flex flex-col justify-between p-4 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/10">
          
          {/* Header Tag & Quick Randomize */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-fredoka text-sm font-bold block leading-tight">
                  Avatar Studio
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  3D Lego Mannequin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRandomizeAll}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold hover:bg-tropical-coral hover:text-white transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              title="Randomize Outfit & Features"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Randomize</span>
            </button>
          </div>

          {/* 3D Mannequin Canvas */}
          <div className="absolute inset-0 pt-12 pb-16">
            <AvatarCanvas
              avatarConfig={config}
              pedestalColor={modalTheme?.pedestalColor || '#ff8da1'}
              ambientColor={modalTheme?.ambientColor || 0xfff5ea}
            />
          </div>

          {/* Bottom helper text */}
          <div className="z-10 text-center space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Eye className="w-3.5 h-3.5 text-tropical-coral" />
              <span>Drag to rotate 360°</span>
            </div>
            <div className="text-[10px] opacity-60 capitalize font-medium">
              {config.bodyForm} Form • {config.hairStyle} • {config.accessory || 'No accessory'}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT PANEL: CUSTOMIZATION CONTROLS */}
        {/* ==================================================== */}
        <div className="w-full md:w-7/12 flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Top Bar with Tabs and Close Button */}
          <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('body');
                  soundManager.playClick();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                  activeTab === 'body'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Body & Identity</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('wardrobe');
                  soundManager.playClick();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                  activeTab === 'wardrobe'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'
                }`}
              >
                <Shirt className="w-4 h-4" />
                <span>Wardrobe & Style</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            
            {/* ==================================================== */}
            {/* TAB 1: BODY & IDENTITY */}
            {/* ==================================================== */}
            {activeTab === 'body' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Base Form Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                    Base Body Form
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {BODY_FORMS.map((form) => (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => handleUpdate('bodyForm', form.id)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          config.bodyForm === form.id
                            ? 'border-tropical-coral bg-pink-50/60 dark:bg-pink-950/40 text-tropical-coral font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold capitalize">{form.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pronouns */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                    Pronouns
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRONOUNS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleUpdate('pronouns', p.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                          config.pronouns === p.id
                            ? 'border-tropical-coral bg-tropical-coral text-white shadow-coral-glow'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Tones */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                      Skin Tone Palette
                    </label>
                    <span className="text-[10px] opacity-60">Includes diverse + pastel fantasy</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => handleUpdate('skinTone', tone.color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          config.skinTone === tone.color
                            ? 'border-tropical-coral scale-110 ring-2 ring-tropical-coral shadow-md'
                            : 'border-white/80 hover:scale-105'
                        }`}
                        style={{ backgroundColor: tone.color }}
                        title={tone.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Hair Style */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                    Hair Styles
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HAIR_STYLES.map((hair) => (
                      <button
                        key={hair.id}
                        type="button"
                        onClick={() => handleUpdate('hairStyle', hair.id)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          config.hairStyle === hair.id
                            ? 'border-tropical-coral bg-pink-50/60 dark:bg-pink-950/40 text-tropical-coral font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{hair.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                    Hair Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.id}
                        type="button"
                        onClick={() => handleUpdate('hairColor', hc.color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          config.hairColor === hc.color
                            ? 'border-tropical-coral scale-110 ring-2 ring-tropical-coral shadow-md'
                            : 'border-white/80 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hc.color }}
                        title={hc.name}
                      />
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: WARDROBE & STYLE */}
            {/* ==================================================== */}
            {activeTab === 'wardrobe' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Category Pills */}
                <div className="flex space-x-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
                  {['top', 'bottom', 'shoes', 'accessories'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setWardrobeCategory(cat)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                        wardrobeCategory === cat
                          ? 'bg-white dark:bg-slate-800 text-tropical-coral shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Top Styles */}
                {wardrobeCategory === 'top' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TOPS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleUpdate('topStyle', t.id)}
                          className={`p-3 rounded-xl border text-left transition ${
                            config.topStyle === t.id
                              ? 'border-tropical-coral bg-pink-50/60 dark:bg-pink-950/40 text-tropical-coral font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold">{t.name}</div>
                        </button>
                      ))}
                    </div>

                    {/* Top Color Swatches */}
                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1.5">
                        Top Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_WARDROBE_COLORS.map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleUpdate('topColor', col)}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              config.topColor === col
                                ? 'border-tropical-coral scale-110 ring-2 ring-tropical-coral shadow-sm'
                                : 'border-white/80 hover:scale-105'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Styles */}
                {wardrobeCategory === 'bottom' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BOTTOMS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleUpdate('bottomStyle', b.id)}
                          className={`p-3 rounded-xl border text-left transition ${
                            config.bottomStyle === b.id
                              ? 'border-tropical-coral bg-pink-50/60 dark:bg-pink-950/40 text-tropical-coral font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold">{b.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1.5">
                        Bottom Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_WARDROBE_COLORS.map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleUpdate('bottomColor', col)}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              config.bottomColor === col
                                ? 'border-tropical-coral scale-110 ring-2 ring-tropical-coral shadow-sm'
                                : 'border-white/80 hover:scale-105'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shoes Styles */}
                {wardrobeCategory === 'shoes' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SHOES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleUpdate('shoeStyle', s.id)}
                          className={`p-3 rounded-xl border text-left transition ${
                            config.shoeStyle === s.id
                              ? 'border-tropical-coral bg-pink-50/60 dark:bg-pink-950/40 text-tropical-coral font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold">{s.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1.5">
                        Shoe Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_WARDROBE_COLORS.map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleUpdate('shoeColor', col)}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              config.shoeColor === col
                                ? 'border-tropical-coral scale-110 ring-2 ring-tropical-coral shadow-sm'
                                : 'border-white/80 hover:scale-105'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessories */}
                {wardrobeCategory === 'accessories' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ACCESSORIES.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleUpdate('accessory', a.id)}
                          className={`p-3 rounded-xl border text-left transition ${
                            config.accessory === a.id
                              ? 'border-tropical-coral bg-pink-50/60 dark:bg-pink-950/40 text-tropical-coral font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold">{a.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">
                {config.username || 'Builder'}'s Mannequin
              </span>
              <span className="text-[10px] opacity-60">
                Press [C] in-game to reopen Avatar Studio
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveAvatar}
              className="px-6 py-2.5 rounded-xl font-fredoka font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-98 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply Avatar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
