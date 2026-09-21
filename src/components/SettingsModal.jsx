import React, { useState } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { soundManager } from '../utils/sound';
import {
  Volume2,
  VolumeX,
  Sliders,
  Settings,
  MousePointer,
  Eye,
  Sparkles,
  X,
  Check,
  Footprints,
  Layers,
  Compass,
} from 'lucide-react';
import { THEMES, getThemeById } from '../types/avatar';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    soundMuted,
    soundVolume,
    mouseSensitivity,
    cameraSmoothing,
    headBobbing,
    avatarConfig,
  } = useWorldStore();

  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'controls' | 'camera'

  if (!isOpen) return null;

  const currentTheme = getThemeById(avatarConfig?.theme);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="tropical-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/90 relative flex flex-col max-h-[90vh] bg-white/95 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-fredoka text-xl font-bold text-slate-800 dark:text-white">
                Game Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tune sound, cursor sensitivity, and camera controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl my-4">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Sound & Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'controls'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>Cursor & Pad</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Camera & View</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-slate-700 dark:text-slate-200">
          {/* TAB 1: AUDIO SETTINGS */}
          {activeTab === 'audio' && (
            <div className="space-y-4 animate-fade-in">
              {/* Master Sound Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 border border-emerald-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${soundMuted ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      {soundMuted ? 'Game Sound Muted' : 'Game Sound Enabled'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {soundMuted ? 'All footsteps, block sounds, and ambient audio are muted' : 'Audio plays for footsteps, block placement, and zooming'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => worldStore.toggleSound()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                    soundMuted
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-glow'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-glow'
                  }`}
                >
                  {soundMuted ? 'Turn Sound ON' : 'Mute Sound'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Master Audio Volume</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    {Math.round((soundVolume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume ?? 0.8}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    worldStore.setSoundVolume(v);
                    soundManager.playClick();
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Individual Audio Toggles */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Footprints className="w-4 h-4 text-emerald-600" />
                    <span>Footsteps Sound</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={!soundMuted}
                    onChange={() => worldStore.toggleSound()}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Block & Wood Sounds</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={!soundMuted}
                    onChange={() => worldStore.toggleSound()}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURSOR & CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-4 animate-fade-in">
              {/* Mouse & Trackpad Sensitivity Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center space-x-1.5">
                    <MousePointer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cursor & Trackpad Sensitivity</span>
                  </span>
                  <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    {(mouseSensitivity ?? 1.0).toFixed(1)}x
                  </span>
                </div>

                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={mouseSensitivity ?? 1.0}
                  onChange={(e) => worldStore.setMouseSensitivity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                {/* Preset Sensitivity Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => worldStore.setMouseSensitivity(0.6)}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      mouseSensitivity === 0.6
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Slow (0.6x)
                  </button>
                  <button
                    onClick={() => worldStore.setMouseSensitivity(1.0)}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      mouseSensitivity === 1.0
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Normal (1.0x)
                  </button>
                  <button
                    onClick={() => worldStore.setMouseSensitivity(1.8)}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      mouseSensitivity === 1.8
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Fast (1.8x)
                  </button>
                </div>
              </div>

              {/* Butter-Smooth Camera Damping Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Smooth Camera Damping</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Eliminates cursor twitching & jitter for silky-smooth cinematic aiming
                  </div>
                </div>

                <button
                  onClick={() => worldStore.setCameraSmoothing(!cameraSmoothing)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    cameraSmoothing
                      ? 'bg-emerald-500 text-white shadow-emerald-glow'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}
                >
                  {cameraSmoothing ? 'Smooth ON' : 'Raw Input'}
                </button>
              </div>

              {/* Navigation Modes Guide */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1 text-xs">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  Dual Pad & Mouse Controls:
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  • <b>Laptop Trackpad:</b> Drag anywhere across canvas to look around smoothly without locking pointer. Pinch or 2-finger scroll to zoom.<br />
                  • <b>Mouse:</b> Click canvas or press the Lock button for classic FPS reticle aiming. Scroll wheel zooms in and out.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMERA & VIEW */}
          {activeTab === 'camera' && (
            <div className="space-y-4 animate-fade-in">
              {/* Head-Bobbing Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center space-x-1.5">
                    <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Walking Head-Bobbing Effect</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Realistic camera sway synchronized with player footfalls
                  </div>
                </div>

                <button
                  onClick={() => worldStore.setHeadBobbing(!headBobbing)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    headBobbing
                      ? 'bg-emerald-500 text-white shadow-emerald-glow'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}
                >
                  {headBobbing ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Atmosphere & Theme Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>World Atmosphere Theme</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => worldStore.setTheme(th.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center space-y-1 ${
                        avatarConfig?.theme === th.id
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center -space-x-1">
                        {th.preview?.map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                        {th.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Settings saved automatically
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-emerald-glow transition hover:scale-105 active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
