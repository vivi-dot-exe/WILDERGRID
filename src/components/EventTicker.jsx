import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { Sparkles, Cloud, Sun, Flower2, ChevronRight, Wind } from 'lucide-react';

const WEATHER_ICONS = {
  aurora_breeze: Sparkles,
  golden_pollen: Sun,
  marshmallow_mist: Cloud,
  starfall_drizzle: Sparkles,
  sunburst_bloom: Flower2,
};

export default function EventTicker() {
  const { currentWeather, activityLogs, weatherCountdown } = useWorldStore();
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  // Rotate log messages every 7 seconds
  useEffect(() => {
    if (!activityLogs || activityLogs.length === 0) return;
    const interval = setInterval(() => {
      setCurrentLogIndex((prev) => (prev + 1) % activityLogs.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [activityLogs]);

  const activeIcon = currentWeather ? (WEATHER_ICONS[currentWeather.id] || Sparkles) : Sparkles;
  const ActiveIconCmp = activeIcon;

  return (
    <div className="absolute top-20 left-4 z-20 pointer-events-none max-w-md hidden md:block">
      <div className="tropical-glass px-3.5 py-2 rounded-2xl flex items-center space-x-3 pointer-events-auto border border-white/80 shadow-tropical-sm">

        {/* Active Weather Badge */}
        <button
          onClick={() => worldStore.triggerNextWeather()}
          className="shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition hover:scale-105"
          style={{
            backgroundColor: `${currentWeather?.themeColor || '#ff6b8b'}20`,
            color: currentWeather?.themeColor || '#ff6b8b',
            borderColor: `${currentWeather?.themeColor || '#ff6b8b'}40`,
            borderWidth: 1,
          }}
          title="Click to trigger next whimsical weather event!"
        >
          <ActiveIconCmp className="w-3.5 h-3.5 animate-pulse" />
          <span>{currentWeather?.name || 'Sunny Calm'}</span>
          <span className="text-[10px] opacity-70 font-mono">({weatherCountdown}s)</span>
        </button>

        {/* Rotating Activity Log */}
        <div className="overflow-hidden flex-1 text-xs text-slate-700 font-medium">
          <div className="truncate transition-all duration-500">
            {activityLogs[currentLogIndex] || 'The island rests peacefully in the morning warmth.'}
          </div>
        </div>

        {/* Micro-trigger button */}
        <button
          onClick={() => worldStore.triggerNextWeather()}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition"
          title="Fast-forward weather event"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
}
