import React from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, ALL_ITEMS } from '../types/world';
import {
  X,
  MapPin,
  Mountain,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Home,
  Palmtree
} from 'lucide-react';

export default function InspectorDrawer() {
  const { inspectedTile, activeDomain, exteriorGrid, interiorGrid } = useWorldStore();

  if (!inspectedTile) return null;

  const { x, y, domain } = inspectedTile;
  const isExterior = domain === DOMAINS.EXTERIOR;
  const grid = isExterior ? exteriorGrid : interiorGrid;
  const tile = grid[y]?.[x];

  if (!tile) return null;

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
    <aside className="absolute right-4 top-20 bottom-28 w-80 z-20 pointer-events-none animate-float-slow">
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

          {/* Placed Architecture / Prop Card */}
          {propItem ? (
            <div className="tropical-card p-3.5 rounded-2xl mb-4 border border-white/90 relative overflow-hidden">
              <div
                className="w-3 h-3 rounded-full absolute top-3.5 right-3.5"
                style={{ backgroundColor: propItem.colors?.top || propItem.colors?.main || '#ff6b8b' }}
              />
              <span className="text-[10px] uppercase font-bold text-tropical-coral tracking-wider">
                Placed Structure / Prop
              </span>
              <h2 className="font-fredoka text-base font-bold text-slate-800 mt-0.5">
                {propItem.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {propItem.description}
              </p>

              {/* Step Inside Room button if building */}
              {propItem.hasInterior && isExterior && (
                <button
                  onClick={() => worldStore.setDomain(DOMAINS.INTERIOR)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-tropical-aqua to-tropical-mint text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-aqua-glow transition hover:opacity-95"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Step Inside Villa Room</span>
                </button>
              )}

              <button
                onClick={handleRemoveProp}
                className="mt-2.5 w-full py-1.5 px-3 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 border border-rose-200/60 flex items-center justify-center space-x-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Item</span>
              </button>
            </div>
          ) : (
            <div className="tropical-card p-3 rounded-2xl mb-4 text-center">
              <p className="text-xs text-slate-400 italic">No structure placed on this sector.</p>
            </div>
          )}

          {/* Base Terrain / Flooring Card */}
          <div className="tropical-card p-3.5 rounded-2xl mb-4 border border-white/90">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isExterior ? 'Base Ground' : 'Floor Surface'}
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className="w-4 h-4 rounded-lg shadow-sm"
                style={{ backgroundColor: baseItem.colors?.top || '#fff6ed' }}
              />
              <span className="text-sm font-bold text-slate-800">
                {baseItem.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {baseItem.description}
            </p>
          </div>

          {/* Elevation Level Controls */}
          <div className="tropical-card p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Mountain className="w-4 h-4 text-tropical-coral" />
              <span>Elevation Level</span>
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

        {/* Quick Mode Switch shortcut */}
        <div className="pt-3 border-t border-black/5 mt-3">
          <button
            onClick={() => worldStore.setDomain(isExterior ? DOMAINS.INTERIOR : DOMAINS.EXTERIOR)}
            className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 bg-gradient-to-r from-tropical-coral to-tropical-yellow text-white shadow-coral-glow transition hover:opacity-95"
          >
            {isExterior ? (
              <>
                <Home className="w-4 h-4" />
                <span>Switch to Room Interior</span>
              </>
            ) : (
              <>
                <Palmtree className="w-4 h-4" />
                <span>Switch to City Exterior</span>
              </>
            )}
          </button>
        </div>

      </div>
    </aside>
  );
}
