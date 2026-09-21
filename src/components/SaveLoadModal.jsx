import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { cloudSaveService } from '../services/cloudSaveService';
import { soundManager } from '../utils/sound';
import { THEMES, getThemeById } from '../types/avatar';
import confetti from 'canvas-confetti';
import {
  Cloud,
  HardDrive,
  Download,
  Upload,
  Save,
  Trash2,
  FileCode,
  Sparkles,
  Check,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  Box,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function SaveLoadModal({ isOpen, onClose }) {
  const { seed, legoBricks, avatarConfig, playerHealth, playerStamina, isFlying } = useWorldStore();
  const [activeTab, setActiveTab] = useState('cloud'); // 'cloud' | 'file'
  const [worldNameInput, setWorldNameInput] = useState('');
  const [cloudWorlds, setCloudWorlds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importError, setImportError] = useState(null);

  const activeTheme = getThemeById(avatarConfig?.theme);

  useEffect(() => {
    if (isOpen) {
      setWorldNameInput(`Wildergrid ${activeTheme?.name || 'Haven'} (${seed})`);
      fetchCloudList();
      setImportError(null);
    }
  }, [isOpen, seed, avatarConfig?.theme]);

  const fetchCloudList = async () => {
    setLoading(true);
    try {
      const list = await cloudSaveService.listCloudWorlds();
      setCloudWorlds(list);
    } catch (e) {
      console.warn('Failed to load cloud worlds', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveToCloud = async (e) => {
    e?.preventDefault();
    const finalName = worldNameInput.trim() || `World-${seed}`;
    setLoading(true);
    try {
      const worldData = worldStore.exportWorldData(finalName);
      await cloudSaveService.saveWorldToCloud(finalName, worldData);
      setSaveSuccess(true);
      soundManager.playPlaceTile('crystal');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.35 },
        colors: ['#00f5d4', '#ffd166', '#ff6b8b'],
      });
      setTimeout(() => setSaveSuccess(false), 2400);
      await fetchCloudList();
    } catch (err) {
      console.error('Failed to save to cloud', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromCloud = async (worldId) => {
    setLoading(true);
    try {
      const worldData = await cloudSaveService.loadCloudWorld(worldId);
      if (worldData) {
        worldStore.loadWorldData(worldData);
        onClose();
      }
    } catch (err) {
      console.error('Failed to load world', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromCloud = async (worldId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this cloud world?')) return;
    setLoading(true);
    try {
      await cloudSaveService.deleteCloudWorld(worldId);
      soundManager.playErase();
      await fetchCloudList();
    } catch (err) {
      console.error('Failed to delete cloud world', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFile = () => {
    const worldName = worldNameInput.trim() || `wildergrid-${seed}`;
    const json = worldStore.exportWorldJSON(worldName);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${worldName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playPop();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const ok = worldStore.importWorldJSON(content);
        if (ok) {
          confetti({ particleCount: 35, spread: 60 });
          onClose();
        } else {
          setImportError('Invalid JSON world structure. Please select a valid Wildergrid export file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportJsonSubmit = (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;
    const ok = worldStore.importWorldJSON(jsonInput);
    if (ok) {
      confetti({ particleCount: 35, spread: 60 });
      onClose();
    } else {
      setImportError('Failed to parse or validate JSON data.');
    }
  };

  const isLiveCloud = cloudSaveService.isLiveCloudConnected();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-2xl transition-all">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2ec4b6] via-[#00bbf9] to-[#9d4edd] flex items-center justify-center shadow-aqua-glow">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-fredoka text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <span>World Persistence Vault</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  v4.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cloud save to Supabase/PostgreSQL & exportable JSON backups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-black/5 dark:border-white/5">
            <button
              onClick={() => setActiveTab('cloud')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'cloud'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-4 h-4 text-cyan-500" />
              <span>Cloud Saves (Supabase)</span>
            </button>

            <button
              onClick={() => setActiveTab('file')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4 text-tropical-coral" />
              <span>File Export / Import</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* TAB 1: CLOUD SAVES */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              {/* Cloud Status Pill */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {isLiveCloud ? 'Supabase Database Connected' : 'Local Cloud Vault Active'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {legoBricks.length} Placed Bricks
                </span>
              </div>

              {/* Save Current World Section */}
              <form onSubmit={handleSaveToCloud} className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-transparent border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Save Active World Snapshot
                  </label>
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved to Cloud!</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={worldNameInput}
                    onChange={(e) => setWorldNameInput(e.target.value)}
                    placeholder="Enter World Name..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 bg-gradient-to-r from-[#2ec4b6] to-[#00bbf9] text-white shadow-aqua-glow hover:opacity-95 transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </form>

              {/* Saved Cloud Worlds Catalog */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <span>Saved Worlds ({cloudWorlds.length})</span>
                  <button
                    onClick={fetchCloudList}
                    className="hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {cloudWorlds.map((w) => {
                    const themeObj = getThemeById(w.theme);
                    const formattedDate = new Date(w.updated_at || w.created_at).toLocaleDateString();

                    return (
                      <div
                        key={w.id}
                        onClick={() => handleLoadFromCloud(w.id)}
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400 hover:shadow-md transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-xs"
                            style={{ backgroundColor: themeObj.preview?.[0] || '#ff6b8b' }}
                          >
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                              {w.world_name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                              <span>{themeObj.name}</span>
                              <span>•</span>
                              <span>{w.brick_count || 0} blocks</span>
                              <span>•</span>
                              <span className="flex items-center space-x-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{formattedDate}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleLoadFromCloud(w.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition"
                          >
                            Load
                          </button>
                          <button
                            onClick={(e) => handleDeleteFromCloud(w.id, e)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                            title="Delete World"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {cloudWorlds.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 italic bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                      No saved cloud worlds yet. Save your current world above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILE EXPORT & IMPORT */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Error Notice */}
              {importError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Single-Click Export Button */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Export World File (.json)
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">v4.0 Compact Schema</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Download your entire world structure, player position, theme, and Lego creations as a portable JSON file to share or restore anytime.
                </p>
                <button
                  onClick={handleExportFile}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white shadow-sm transition"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download World JSON</span>
                </button>
              </div>

              {/* Import File Button */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Import World File (.json)
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex-1 py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-tropical-coral text-center cursor-pointer transition text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4 text-tropical-coral" />
                    <span>Choose .json File to Load</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer font-medium hover:text-slate-600 transition">
                    Or Paste Raw JSON String
                  </summary>
                  <form onSubmit={handleImportJsonSubmit} className="mt-2 space-y-2">
                    <textarea
                      rows={3}
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='Paste JSON data here e.g. {"version":"4.0", ...}'
                      className="w-full p-2.5 rounded-xl font-mono text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-tropical-coral"
                    />
                    <button
                      type="submit"
                      disabled={!jsonInput.trim()}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-tropical-coral text-white hover:opacity-95 transition"
                    >
                      Load Parsed JSON
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
