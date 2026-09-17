import React from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { Plus, Minus, RotateCcw } from 'lucide-react';

export default function CameraControls() {
  const { camera } = useWorldStore();

  return (
    <div className="absolute left-4 bottom-5 z-20 flex flex-col space-y-2 pointer-events-none">
      <div className="tropical-glass p-1.5 rounded-2xl flex flex-col items-center space-y-1 pointer-events-auto border border-white/80 shadow-tropical-md">
        <button
          onClick={() => worldStore.setCamera(camera.x, camera.y, camera.zoom * 1.2)}
          className="p-2 rounded-xl text-slate-700 hover:bg-black/5 transition"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-mono text-tropical-coral font-bold px-1">
          {Math.round(camera.zoom * 100)}%
        </span>

        <button
          onClick={() => worldStore.setCamera(camera.x, camera.y, camera.zoom * 0.8)}
          className="p-2 rounded-xl text-slate-700 hover:bg-black/5 transition"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-4 h-[1px] bg-black/10 my-0.5" />

        <button
          onClick={() => worldStore.resetCamera()}
          className="p-2 rounded-xl text-slate-700 hover:bg-black/5 transition"
          title="Reset Camera & Center Map"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="tropical-glass px-3 py-1 rounded-full text-[10px] text-slate-500 font-medium border border-white/60 pointer-events-auto shadow-sm">
        <span>Space + Drag to Pan</span>
      </div>
    </div>
  );
}
