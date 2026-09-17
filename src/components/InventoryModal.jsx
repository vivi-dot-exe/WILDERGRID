import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { INVENTORY_CATALOG } from '../types/hotbar';
import {
  X,
  Package,
  Sparkles,
  Box,
  Armchair,
  Coffee,
  Flame,
  Flower2,
  BookOpen,
  Trees,
  Check,
} from 'lucide-react';

const ICON_MAP = {
  Box,
  Armchair,
  Coffee,
  Flame,
  Flower2,
  BookOpen,
  Trees,
  Sparkles,
};

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'bricks', label: 'Pastel Bricks' },
  { id: 'props', label: 'Mini Interior Props' },
  { id: 'nature', label: 'Nature & Glass' },
];

export default function InventoryModal() {
  const {
    isInventoryOpen,
    hotbarSlots,
    selectedHotbarIndex,
    avatarConfig,
  } = useWorldStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(INVENTORY_CATALOG[0]);
  const [targetHotbarIndex, setTargetHotbarIndex] = useState(selectedHotbarIndex);

  const isCreative =
    avatarConfig?.gameMode === 'dreamweaver' ||
    avatarConfig?.gameMode === 'creative';

  // Listen to 'E' and 'Escape' to close inventory
  useEffect(() => {
    if (!isInventoryOpen) return;

    const handleKeyDown = (e) => {
      if (e.code === 'KeyE' || e.code === 'Escape') {
        worldStore.toggleInventory(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInventoryOpen]);

  if (!isInventoryOpen) return null;

  const filteredItems = INVENTORY_CATALOG.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const handleEquipItem = (catalogItem, slotIdx = targetHotbarIndex) => {
    worldStore.setHotbarSlot(slotIdx, {
      id: catalogItem.id,
      name: catalogItem.name,
      type: catalogItem.type,
      propId: catalogItem.propId,
      color: catalogItem.color,
      icon: catalogItem.icon,
      count: catalogItem.defaultCount || 64,
    });
    worldStore.setSelectedHotbarIndex(slotIdx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-fade-in select-none">
      <div className="tropical-glass w-full max-w-3xl rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-black/5 bg-white/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-tropical-coral to-tropical-yellow flex items-center justify-center text-white shadow-coral-glow">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-fredoka text-base font-bold text-slate-800">
                Full Builder Inventory
              </h2>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Select items to equip into your 9-slot Hotbar
              </span>
            </div>
          </div>

          <button
            onClick={() => worldStore.toggleInventory(false)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-black/5 transition"
            title="Close (Key: E or Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 px-5 py-2.5 bg-white/30 border-b border-black/5 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeCategory === cat.id
                  ? 'bg-tropical-coral text-white shadow-coral-glow'
                  : 'bg-white/60 text-slate-600 hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Catalog Items Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Box;
            const isEquippedInHotbar = hotbarSlots.some((s) => s.id === item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedCatalogItem(item);
                  handleEquipItem(item, targetHotbarIndex);
                }}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-between space-y-2 bg-white/70 hover:bg-white hover:scale-102 ${
                  selectedCatalogItem?.id === item.id
                    ? 'border-tropical-coral shadow-coral-glow scale-102 bg-white'
                    : 'border-transparent'
                }`}
              >
                {/* 3D Visual Block / Prop Preview */}
                <div
                  className="w-12 h-12 rounded-xl shadow-md border border-black/10 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: item.color }}
                >
                  <div className="w-4 h-4 rounded-full bg-white/30 shadow-inner" />
                  {item.type === 'prop' && (
                    <IconComponent className="w-6 h-6 text-slate-800 absolute drop-shadow-sm" />
                  )}
                </div>

                <div className="text-center w-full">
                  <h4 className="font-fredoka text-xs font-bold text-slate-800 truncate">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold capitalize">
                    {item.type === 'prop' ? 'Interior Prop' : 'Lego Stud Brick'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEquipItem(item, targetHotbarIndex);
                  }}
                  className="w-full py-1 rounded-xl text-[11px] font-bold bg-tropical-coral/10 hover:bg-tropical-coral text-tropical-coral hover:text-white transition flex items-center justify-center space-x-1"
                >
                  <span>Equip to #{targetHotbarIndex + 1}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom 9-Slot Hotbar Assignment Dock */}
        <div className="p-4 bg-white/80 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              Equip Target Hotbar Slot:
            </span>
            <span className="text-[10px] text-slate-500">
              Click a slot below, then click any item above to assign it
            </span>
          </div>

          {/* 9 Hotbar Slots */}
          <div className="flex items-center space-x-1.5 overflow-x-auto p-1 bg-black/5 rounded-2xl">
            {hotbarSlots.map((slot, idx) => {
              const isTarget = targetHotbarIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setTargetHotbarIndex(idx)}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isTarget
                      ? 'bg-white shadow-coral-glow scale-110 ring-3 ring-tropical-coral z-10'
                      : 'bg-white/60 hover:bg-white hover:scale-105'
                  }`}
                  title={`Slot ${idx + 1}: ${slot.name}`}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] font-black text-slate-400">
                    {idx + 1}
                  </span>
                  <div
                    className="w-4 h-4 rounded-md shadow-sm"
                    style={{ backgroundColor: slot.color }}
                  />
                  <span className="absolute bottom-0 right-1 text-[8px] font-bold text-slate-700">
                    {isCreative ? '∞' : slot.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => worldStore.toggleInventory(false)}
            className="px-4 py-2 rounded-xl bg-tropical-coral text-white text-xs font-bold shadow-coral-glow hover:scale-105 transition"
          >
            Done (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
