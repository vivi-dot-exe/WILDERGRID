import React from 'react';
import { X, Palmtree, Home, Layers, Move, Sparkles, Paintbrush } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="tropical-glass p-6 sm:p-8 rounded-3xl w-full max-w-lg border border-white/80 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-black/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-tropical-coral via-tropical-yellow to-tropical-aqua flex items-center justify-center shadow-coral-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-fredoka text-xl font-bold text-slate-800">
              City & Interior Architect Guide
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Build Tropical Modernist Cities and Furnish Penthouse Interiors
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-slate-700 my-5 max-h-[60vh] overflow-y-auto pr-2">
          <div className="tropical-card p-3 rounded-2xl flex items-start space-x-3">
            <Palmtree className="w-5 h-5 text-tropical-coral mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 mb-0.5">1. City Exterior Mode</h4>
              <p className="text-slate-600">
                Design coastal resorts with white beach sand, pools, boardwalks, curved pink pavilions, aqua towers, yellow stairs, and royal tropical palm trees!
              </p>
            </div>
          </div>

          <div className="tropical-card p-3 rounded-2xl flex items-start space-x-3">
            <Home className="w-5 h-5 text-tropical-aqua mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 mb-0.5">2. Room Interior Mode</h4>
              <p className="text-slate-600">
                Click <strong>"Room Interior"</strong> in the top bar to step inside. Lay down terrazzo or oak floors, place curved glass window walls, bouclé sofas, bubble chairs, island kitchen bars, and potted monsteras.
              </p>
            </div>
          </div>

          <div className="tropical-card p-3 rounded-2xl flex items-start space-x-3">
            <Paintbrush className="w-5 h-5 text-tropical-mint mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 mb-0.5">3. Categorized Inventory Dock</h4>
              <p className="text-slate-600">
                Use the bottom drawer tabs to filter between Grounds, Architecture, Palms, Amenities, Flooring, Walls, Living, Dining, and Decor.
              </p>
            </div>
          </div>

          <div className="tropical-card p-3 rounded-2xl flex items-start space-x-3">
            <Move className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 mb-0.5">4. Navigation & Zoom</h4>
              <p className="text-slate-600">
                Hold <kbd className="px-1.5 py-0.5 rounded bg-black/10 text-slate-800 font-mono">Space</kbd> + drag to pan anywhere, or scroll your mouse wheel to zoom in and out smoothly.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-tropical-coral to-tropical-yellow hover:opacity-95 text-white shadow-coral-glow transition"
        >
          Let's Build!
        </button>
      </div>
    </div>
  );
}
