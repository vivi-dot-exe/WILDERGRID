import React from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import {
  DOMAINS,
  VIEW_MODES,
  EXTERIOR_CATEGORIES,
  EXTERIOR_ITEMS,
  INTERIOR_CATEGORIES,
  INTERIOR_ITEMS,
  ALL_ITEMS,
} from '../types/world';
import {
  Search,
  Eraser,
  Paintbrush,
  ChevronUp,
  ChevronDown,
  Box,
  Grid3X3,
  Sun,
  Leaf,
  Building,
  Building2,
  Home,
  Trees,
  Maximize2,
  Maximize,
  Columns,
  CircleDot,
  Circle,
  Armchair,
  Bed,
  Coffee,
  Palette,
  Droplets,
  Droplet,
  Layers,
  Sparkles,
  TrendingUp,
  Palmtree,
  Flower2,
  Mountain,
  Umbrella,
  Lamp,
  Square,
  Table,
  LampCeiling,
  Tv,
  Utensils,
  Archive,
  Shield,
  Zap,
  Disc,
} from 'lucide-react';

const ICON_COMPONENTS = {
  Sun,
  Leaf,
  Building,
  Building2,
  Home,
  Trees,
  Maximize2,
  Maximize,
  Columns,
  CircleDot,
  Circle,
  Armchair,
  Bed,
  Coffee,
  Palette,
  Droplets,
  Droplet,
  Layers,
  Sparkles,
  TrendingUp,
  Palmtree,
  Flower2,
  Mountain,
  Umbrella,
  Lamp,
  Square,
  Table,
  LampCeiling,
  Tv,
  Utensils,
  Archive,
  Shield,
  Zap,
  Disc,
};

export default function BottomToolbar() {
  const {
    activeDomain,
    selectedTool,
    selectedCategory,
    selectedItemId,
    brushSize,
    viewMode,
  } = useWorldStore();

  const isExterior = activeDomain === DOMAINS.EXTERIOR;
  const categories = isExterior ? EXTERIOR_CATEGORIES : INTERIOR_CATEGORIES;
  const itemsMap = isExterior ? EXTERIOR_ITEMS : INTERIOR_ITEMS;

  // Filter items by category
  const filteredItems = Object.values(itemsMap).filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-[94vw] max-w-5xl">
      <div className="tropical-glass p-3 rounded-3xl pointer-events-auto border border-white/80 shadow-tropical-lg backdrop-blur-xl flex flex-col space-y-2.5">

        {/* Top Sub-Bar: Categories & Action Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => worldStore.setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? isExterior
                      ? 'bg-tropical-coral text-white shadow-coral-glow scale-105'
                      : 'bg-tropical-aqua text-white shadow-aqua-glow scale-105'
                    : 'bg-white/60 text-slate-700 hover:bg-white/90'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tools: Inspect, Place, Erase, Height, 2.5D Mode */}
          <div className="flex items-center space-x-1">
            {/* Inspect Tool */}
            <button
              onClick={() => worldStore.setSelectedTool('inspect')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                selectedTool === 'inspect'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-black/5'
              }`}
              title="Inspect item & coordinates"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspect</span>
            </button>

            {/* Place Tool */}
            <button
              onClick={() => worldStore.setSelectedTool('place')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                selectedTool === 'place'
                  ? isExterior ? 'bg-tropical-coral text-white shadow-sm' : 'bg-tropical-aqua text-white shadow-sm'
                  : 'text-slate-600 hover:bg-black/5'
              }`}
              title="Place selected item"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Place</span>
            </button>

            {/* Erase Tool */}
            <button
              onClick={() => worldStore.setSelectedTool('erase')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                selectedTool === 'erase'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-black/5'
              }`}
              title="Eraser tool"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Erase</span>
            </button>

            <div className="w-[1px] h-4 bg-black/10 mx-1" />

            {/* Elevation Controls */}
            <button
              onClick={() => worldStore.setSelectedTool('elev_up')}
              className={`p-1.5 rounded-xl transition ${
                selectedTool === 'elev_up' ? 'bg-tropical-mint text-white' : 'text-slate-600 hover:bg-black/5'
              }`}
              title="Elevation Up (+1)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => worldStore.setSelectedTool('elev_down')}
              className={`p-1.5 rounded-xl transition ${
                selectedTool === 'elev_down' ? 'bg-indigo-400 text-white' : 'text-slate-600 hover:bg-black/5'
              }`}
              title="Elevation Down (-1)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-black/10 mx-1 hidden sm:block" />

            {/* View Mode */}
            <button
              onClick={() => {
                if (viewMode === VIEW_MODES.ISOMETRIC) worldStore.setViewMode(VIEW_MODES.TOP_DOWN);
                else if (viewMode === VIEW_MODES.TOP_DOWN) worldStore.setViewMode(VIEW_MODES.WALK_3D);
                else worldStore.setViewMode(VIEW_MODES.ISOMETRIC);
              }}
              className="p-1.5 rounded-xl text-slate-600 hover:bg-black/5 transition text-xs font-medium flex items-center space-x-1"
              title="Cycle Views: 2.5D Isometric → Top-Down → 3D Walk"
            >
              {viewMode === VIEW_MODES.ISOMETRIC && <Box className="w-4 h-4 text-tropical-coral" />}
              {viewMode === VIEW_MODES.TOP_DOWN && <Grid3X3 className="w-4 h-4 text-tropical-aqua" />}
              {viewMode === VIEW_MODES.WALK_3D && <Sparkles className="w-4 h-4 text-emerald-500" />}
              <span className="hidden md:inline">
                {viewMode === VIEW_MODES.ISOMETRIC ? '2.5D' : viewMode === VIEW_MODES.TOP_DOWN ? 'Top-Down' : '3D Walk'}
              </span>
            </button>

            {/* Brush Size */}
            <button
              onClick={() => worldStore.setBrushSize(brushSize === 1 ? 3 : 1)}
              className="px-2 py-1 rounded-xl text-xs font-bold text-slate-700 bg-white/70 hover:bg-white shadow-sm transition"
              title="Toggle brush size 1x1 vs 3x3"
            >
              {brushSize === 1 ? '1×1' : '3×3'}
            </button>
          </div>
        </div>

        {/* Bottom Catalog: Item Cards Carousel */}
        <div className="flex items-center space-x-2.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
          {filteredItems.map((item) => {
            const isSelected = selectedItemId === item.id && selectedTool === 'place';
            const IconCmp = ICON_COMPONENTS[item.icon] || Sparkles;

            return (
              <button
                key={item.id}
                onClick={() => worldStore.setSelectedItem(item.id)}
                className={`group shrink-0 relative flex items-center space-x-2.5 px-3 py-2 rounded-2xl transition-all ${
                  isSelected
                    ? isExterior
                      ? 'bg-white shadow-tropical-md ring-2 ring-tropical-coral scale-105'
                      : 'bg-white shadow-tropical-md ring-2 ring-tropical-aqua scale-105'
                    : 'bg-white/60 hover:bg-white/90 text-slate-700 hover:shadow-tropical-sm'
                }`}
              >
                {/* Visual Color / Icon Badge */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: item.colors?.top || item.colors?.main || item.colors?.fronds || '#ff6b8b',
                  }}
                >
                  <IconCmp className="w-4 h-4 text-slate-900/80" />
                </div>

                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 tracking-tight leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium capitalize">
                    {item.type}
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div
                    className="w-2 h-2 rounded-full absolute top-2 right-2 animate-pulse"
                    style={{
                      backgroundColor: isExterior ? '#ff6b8b' : '#00bbf9'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
