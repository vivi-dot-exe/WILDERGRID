import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, ALL_ITEMS } from '../types/world';
import { generateLoreForSector } from '../utils/chroniclerAI';
import {
  X,
  MapPin,
  Mountain,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Home,
  Bot,
  RefreshCw,
  HeartHandshake,
  AlertCircle,
  BookOpen
} from 'lucide-react';

export default function InspectorDrawer() {
  const { inspectedTile, activeDomain, exteriorGrid, interiorGrid, chronicledLore } = useWorldStore();
  const [lore, setLore] = useState(null);
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);

  const isExterior = inspectedTile?.domain === DOMAINS.EXTERIOR;
  const grid = isExterior ? exteriorGrid : interiorGrid;
  const tile = inspectedTile ? grid[inspectedTile.y]?.[inspectedTile.x] : null;

  const coordKey = inspectedTile ? `[${inspectedTile.x}, ${inspectedTile.y}]` : null;

  // Generate / Load chronicled lore on tile change
  useEffect(() => {
    if (!inspectedTile || !tile) {
      setLore(null);
      return;
    }

    if (chronicledLore[coordKey]) {
      setLore(chronicledLore[coordKey]);
    } else {
      handleFetchLore();
    }
  }, [coordKey, inspectedTile?.domain]);

  const handleFetchLore = async () => {
    if (!tile) return;
    setIsGeneratingLore(true);
    try {
      const generated = await generateLoreForSector(tile, activeDomain);
      setLore(generated);
      worldStore.setChronicledLore(coordKey, generated);
    } catch (e) {
      console.error('Error chronicling lore:', e);
    } finally {
      setIsGeneratingLore(false);
    }
  };

  if (!inspectedTile || !tile) return null;

  const { x, y } = inspectedTile;
  const baseItem = ALL_ITEMS[tile.base] || ALL_ITEMS['ground_sand'];
  const propItem = tile.prop ? ALL_ITEMS[tile.prop] : null;

  const handleElevationChange = (delta) => {
    const newElev = Math.max(0, Math.min(5, (tile.elevation || 0) + delta));
    worldStore.updateTileProperty(x, y, 'elevation', newElev);
  };

  const handleRemoveProp = () => {
    worldStore.updateTileProperty(x, y, 'prop', null);
  };

  return (
    <aside className="absolute right-4 top-20 bottom-28 w-88 z-20 pointer-events-none animate-float-slow">
      <div className="tropical-glass w-full h-full rounded-3xl p-5 pointer-events-auto border border-white/80 shadow-tropical-lg flex flex-col justify-between overflow-y-auto backdrop-blur-xl">

        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-tropical-coral flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Sector [{x}, {y}]</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/5 text-slate-600">
                {isExterior ? 'Exterior' : 'Interior'}
              </span>
            </div>
            <button
              onClick={() => worldStore.closeInspector()}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-black/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ==================================================== */}
          {/* Phase 2: World Chronicler AI Lore Panel */}
          {/* ==================================================== */}
          <div className="tropical-card p-3.5 rounded-2xl mb-4 border border-tropical-coral/30 bg-gradient-to-br from-white via-white to-pink-50/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-tropical-coral">
                <Bot className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">World Chronicler AI</span>
              </div>
              <button
                onClick={handleFetchLore}
                disabled={isGeneratingLore}
                className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-tropical-coral transition disabled:opacity-50"
                title="Re-chronicle Sector"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingLore ? 'animate-spin text-tropical-coral' : ''}`} />
              </button>
            </div>

            {lore ? (
              <div className="space-y-2 text-xs">
                {/* Island / Sector Name */}
                <h3 className="font-fredoka text-sm font-bold text-slate-800 leading-snug">
                  "{lore.islandName}"
                </h3>

                {/* Micro-Narrative */}
                <div className="bg-white/80 p-2.5 rounded-xl border border-black/5 text-[11px] text-slate-600 italic leading-relaxed">
                  <BookOpen className="w-3 h-3 text-tropical-coral inline mr-1 -mt-0.5" />
                  {lore.narrative}
                </div>

                {/* Inhabitant Species */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Inhabitant Species:</div>
                  <div className="flex flex-wrap gap-1">
                    {lore.species.map((sp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-tropical-aqua/15 text-slate-700 font-medium border border-tropical-aqua/30"
                        title={sp.trait}
                      >
                        {sp.name} <span className="opacity-60">({sp.type})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Environmental Synergy */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-600 flex items-center space-x-1">
                    <HeartHandshake className="w-3 h-3" />
                    <span>Environmental Synergy</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    {lore.synergy}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400 animate-pulse">Chronicling whimsical lore...</p>
              </div>
            )}
          </div>

          {/* Placed Architecture / Prop Card */}
          {propItem && (
            <div className="tropical-card p-3 rounded-2xl mb-3 border border-white/90">
              <span className="text-[10px] uppercase font-bold text-tropical-coral tracking-wider">
                Placed Structure / Prop
              </span>
              <h2 className="font-fredoka text-sm font-bold text-slate-800 mt-0.5">
                {propItem.name}
              </h2>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {propItem.description}
              </p>

              {propItem.hasInterior && isExterior && (
                <button
                  onClick={() => worldStore.setDomain(DOMAINS.INTERIOR)}
                  className="mt-2.5 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-tropical-aqua to-tropical-mint text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-aqua-glow transition hover:opacity-95"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Step Inside Villa Room</span>
                </button>
              )}

              <button
                onClick={handleRemoveProp}
                className="mt-2 w-full py-1 px-3 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 border border-rose-200/60 flex items-center justify-center space-x-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Item</span>
              </button>
            </div>
          )}

          {/* Base Terrain Card */}
          <div className="tropical-card p-3 rounded-2xl mb-3 border border-white/90">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isExterior ? 'Base Ground' : 'Floor Surface'}
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className="w-3.5 h-3.5 rounded-lg shadow-sm"
                style={{ backgroundColor: baseItem.colors?.top || '#fff6ed' }}
              />
              <span className="text-xs font-bold text-slate-800">
                {baseItem.name}
              </span>
            </div>
          </div>

          {/* Elevation Controls */}
          <div className="tropical-card p-2.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Mountain className="w-3.5 h-3.5 text-tropical-coral" />
              <span>Elevation Tier</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-800">
                Tier {tile.elevation || 0}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleElevationChange(1)}
                  disabled={(tile.elevation || 0) >= 5}
                  className="p-1 rounded-lg bg-black/5 hover:bg-black/10 text-slate-700 disabled:opacity-30"
                  title="Raise height"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleElevationChange(-1)}
                  disabled={(tile.elevation || 0) <= 0}
                  className="p-1 rounded-lg bg-black/5 hover:bg-black/10 text-slate-700 disabled:opacity-30"
                  title="Lower height"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Switch Button */}
        <div className="pt-2 border-t border-black/5 mt-2">
          <button
            onClick={() => worldStore.setDomain(isExterior ? DOMAINS.INTERIOR : DOMAINS.EXTERIOR)}
            className="w-full py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 bg-gradient-to-r from-tropical-coral to-tropical-yellow text-white shadow-coral-glow transition hover:opacity-95"
          >
            {isExterior ? <span>Switch to Room Interior</span> : <span>Switch to City Exterior</span>}
          </button>
        </div>

      </div>
    </aside>
  );
}
