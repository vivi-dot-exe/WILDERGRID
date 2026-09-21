import React, { useState, useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { multiplayerManager } from '../utils/multiplayer';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Globe,
  Users,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Share2,
  LogOut,
  Sparkles,
  Radio,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function MultiplayerModal({ isOpen, onClose }) {
  const { multiplayer, avatarConfig } = useWorldStore();
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'join'
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customHostCode, setCustomHostCode] = useState(() => multiplayerManager.generateRoomCode());

  // Check URL query param ?room= on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  if (!isOpen) return null;

  const isConnected = multiplayer.status === 'connected';
  const isConnecting = multiplayer.status === 'connecting';
  const hasError = multiplayer.status === 'error';

  const handleCopyCode = () => {
    const code = multiplayer.roomCode || customHostCode;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    soundManager.playPop();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const shareUrl = multiplayerManager.getShareUrl();
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    soundManager.playPop();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartHost = () => {
    soundManager.playClick();
    multiplayerManager.hostWorld(customHostCode);
  };

  const handleJoinWorld = (e) => {
    e?.preventDefault();
    if (!joinCodeInput.trim()) return;
    soundManager.playClick();
    multiplayerManager.joinWorld(joinCodeInput);
  };

  const handleDisconnect = () => {
    soundManager.playClick();
    multiplayerManager.disconnect();
  };

  const regenerateHostCode = () => {
    setCustomHostCode(multiplayerManager.generateRoomCode());
    soundManager.playPop();
  };

  const remotePlayerList = Object.entries(multiplayer.remotePlayers || {}).map(([peerId, p]) => ({
    peerId,
    ...p,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-2xl transition-all">
        {/* Glow accents */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-tropical-coral/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-tropical-aqua/25 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-fredoka text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <span>Multiplayer Co-Op</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  WebRTC P2P
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live block sync, avatar tracking & cooperative building
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* CONNECTED STATE: Active Lobby View */}
          {isConnected ? (
            <div className="space-y-6">
              {/* Room Code Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-tropical-aqua/10 via-emerald-500/5 to-transparent border border-tropical-aqua/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Live Room Session
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    {multiplayer.isHost ? '👑 Host' : '👤 Guest'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-white/80 dark:border-slate-700">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Room Code
                    </div>
                    <div className="font-mono text-2xl font-black text-slate-800 dark:text-white tracking-widest">
                      {multiplayer.roomCode}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 bg-tropical-coral hover:bg-tropical-coral/90 text-white shadow-coral-glow transition"
                      title="Copy Room Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-xl text-xs font-bold flex items-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                      title="Copy Share Link"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Connected Players Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-tropical-aqua" />
                    <span>Connected Players ({1 + remotePlayerList.length})</span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {/* Local Player Card */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border border-white/80 dark:border-slate-700/60 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-sm border border-white/90"
                        style={{ backgroundColor: avatarConfig?.topColor || '#ff6b8b' }}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: avatarConfig?.skinTone || '#ffd166' }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                          <span>{avatarConfig?.username || 'You'}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-tropical-coral/15 text-tropical-coral">
                            YOU
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {multiplayer.isHost ? 'Room Host' : 'Player'} • {avatarConfig?.pronouns || 'They/Them'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Online</span>
                    </span>
                  </div>

                  {/* Remote Players */}
                  {remotePlayerList.map((remote) => (
                    <div
                      key={remote.peerId}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-800/30 border border-white/50 dark:border-slate-700/40"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-sm border border-white/90"
                          style={{ backgroundColor: remote.avatarConfig?.topColor || '#00bbf9' }}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: remote.avatarConfig?.skinTone || '#ffd166' }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-white">
                            {remote.username || 'Traveler'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {remote.avatarConfig?.pronouns || 'They/Them'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-tropical-aqua flex items-center space-x-1">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>Synced</span>
                      </span>
                    </div>
                  ))}

                  {remotePlayerList.length === 0 && (
                    <div className="text-center py-5 text-xs text-slate-400 dark:text-slate-500 italic bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                      Share your room code with friends to build together!
                    </div>
                  )}
                </div>
              </div>

              {/* Leave Room Button */}
              <button
                onClick={handleDisconnect}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect & Leave Room</span>
              </button>
            </div>
          ) : (
            /* DISCONNECTED / CONNECTING / ERROR STATE */
            <div className="space-y-5">
              {/* Error Banner */}
              {hasError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start space-x-3 text-rose-700 dark:text-rose-300 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold">Connection Issue</div>
                    <div>{multiplayer.error || 'Unable to establish peer connection.'}</div>
                  </div>
                </div>
              )}

              {/* Connecting Screen */}
              {isConnecting ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-tropical-coral/30 border-t-tropical-coral animate-spin" />
                    <Radio className="w-6 h-6 text-tropical-coral absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      Connecting to World Room...
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Negotiating WebRTC peer-to-peer data channels
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-black/5 dark:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Tab Controls: Host vs Join */
                <>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-black/5 dark:border-white/5">
                    <button
                      onClick={() => setActiveTab('host')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'host'
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Host World
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'join'
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Join World
                    </button>
                  </div>

                  {/* HOST TAB */}
                  {activeTab === 'host' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Create a room where friends can join with your shareable code and build Lego structures together in real time.
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              Generated Room Code
                            </div>
                            <div className="font-mono text-xl font-bold text-slate-800 dark:text-white tracking-wider">
                              {customHostCode}
                            </div>
                          </div>
                          <button
                            onClick={regenerateHostCode}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 transition"
                            title="Generate New Code"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleStartHost}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 bg-gradient-to-r from-tropical-coral to-[#ffd166] text-white shadow-coral-glow hover:opacity-95 transition transform hover:scale-[1.01]"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Host World Session</span>
                      </button>
                    </div>
                  )}

                  {/* JOIN TAB */}
                  {activeTab === 'join' && (
                    <form onSubmit={handleJoinWorld} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Enter Room Code
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. WILD-4K9X"
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            maxLength={12}
                            className="w-full px-4 py-3 rounded-2xl font-mono text-base font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tropical-coral tracking-widest uppercase"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Ask your friend who is hosting for their 4-character room code.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={!joinCodeInput.trim()}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition transform ${
                          joinCodeInput.trim()
                            ? 'bg-gradient-to-r from-tropical-aqua to-teal-500 text-white shadow-aqua-glow hover:scale-[1.01]'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <span>Connect to World</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
