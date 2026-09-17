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
  ChevronRight
} from 'lucide-react';

export default function InspectorDrawer() {
  const { inspectedTile, activeDomain, exteriorGrid, interiorGrid, chronicledLore } = useWorldStore();
  const [lore, setLore] = useState(null);
  const [showFullLore, setShowFullLore] = useState(false);

  const isExterior = inspectedTile?.domain === DOMAINS.EXTERIOR;
  const grid = isExterior ? exteriorGrid : interiorGrid;
  const tile = inspectedTile ? grid[inspectedTile.y]?.[inspectedTile.x] : null;
  const coordKey = inspectedTile ? `[${inspectedTile.x}, ${inspectedTile.y}]` : null;

  useEffect(() => {
    if (!inspectedTile || !tile) {
      setLore(null);
      return;
    }

    if (chronicledLore[coordKey]) {
      setLore(chronicledLore[coordKey]);
    } else {
      generateLoreForSector(tile, activeDomain).then((generated) => {
        setLore(generated);
        worldStore.setChronicledLore(coordKey, generated);
      });
    }
  }, [coordKey, inspectedTile?.domain]);

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
    <aside className="absolute right-4 top-20 z-30 pointer-events-auto select-none transition-all duration-300">
      <div className="tropical-glass w-72 p-4 rounded-3xl border border-white/90 shadow-tropical-lg backdrop-blur-xl space-y-3 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-tropical-coral" />
            <span className="font-mono text-xs font-bold text-slate-800">
              Sector [{x}, {y}]
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-black/5 text-slate-500">
              {isExterior ? 'Exterior' : 'Interior'}
            </span>
          </div>
          <button
            onClick={() => worldStore.closeInspector()}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-black/5 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Placed Item or Base Tile */}
        <div className="tropical-card p-3 rounded-2xl border border-white/90 space-y-1">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-5 h-5 rounded-lg shadow-sm shrink-0"
              style={{
                backgroundColor: propItem?.colors?.top || propItem?.colors?.main || baseItem?.colors?.top || '#ff6b8b',
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">
                {propItem ? propItem.name : baseItem.name}
              </div>
              <div className="text-[10px] text-slate-500 capitalize">
                {propItem ? propItem.type : (isExterior ? 'Ground' : 'Floor')}
              </div>
            </div>
          </div>
        </div>

        {/* Whimsical Lore Tagline (Compact, friendly 1-liner!) */}
        {lore && (
          <div className="tropical-card p-2.5 rounded-2xl border border-white/80 bg-gradient-to-br from-white/90 to-pink-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-tropical-coral text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span className="truncate">{lore.islandName}</span>
              </div>
              <button
                onClick={() => setShowFullLore(!showFullLore)}
                className="text-[10px] text-slate-400 hover:text-slate-700 font-medium ml-1"
              >
                {showFullLore ? 'Less' : 'More'}
              </button>
            </div>

            {/* Optional Collapsed Lore Details */}
            {showFullLore && (
              <p className="text-[10px] text-slate-600 mt-2 leading-relaxed italic border-t border-black/5 pt-1.5 animate-fade-in">
                {lore.narrative}
              </p>
            )}
          </div>
        )}

        {/* Controls: Elevation & Actions */}
        <div className="space-y-2 pt-1">
          {/* Elevation Tier */}
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
              <Mountain className="w-3.5 h-3.5 text-tropical-coral" />
              <span>Elevation: Tier {tile.elevation || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleElevationChange(-1)}
                disabled={(tile.elevation || 0) <= 0}
                className="p-1 rounded-lg bg-black/5 hover:bg-black/10 text-slate-700 disabled:opacity-30 transition"
                title="Lower height"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleElevationChange(1)}
                disabled={(tile.elevation || 0) >= 5}
                className="p-1 rounded-lg bg-black/5 hover:bg-black/10 text-slate-700 disabled:opacity-30 transition"
                title="Raise height"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Building Step Inside Button */}
          {propItem?.hasInterior && isExterior && (
            <button
              onClick={() => worldStore.setDomain(DOMAINS.INTERIOR)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-tropical-aqua to-tropical-mint text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-aqua-glow transition hover:opacity-95"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Step Inside Villa</span>
            </button>
          )}

          {/* Remove Item Button */}
          {propItem && (
            <button
              onClick={handleRemoveProp}
              className="w-full py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 border border-rose-200/50 flex items-center justify-center space-x-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove Item</span>
            </button>
          )}
        </div>

      </div>
    </aside>
  );
}
