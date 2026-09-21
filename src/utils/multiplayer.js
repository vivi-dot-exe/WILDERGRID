import Peer from 'peerjs';
import { worldStore } from '../store/useWorldStore';
import { soundManager } from './sound';

// Room prefix for peer IDs to avoid collisions on public PeerJS server
const ROOM_PREFIX = 'wildergrid-v2-';

class MultiplayerManager {
  constructor() {
    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.isHost = false;
    this.roomCode = '';
    this.localPlayerId = 'player-' + Math.random().toString(36).substring(2, 8);
    this.lastBroadcastTime = 0;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `WILD-${code}`;
  }

  getShareUrl() {
    if (!this.roomCode) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomCode);
    return url.toString();
  }

  /**
   * Host a new world session
   */
  async hostWorld(customCode = null) {
    this.disconnect();
    this.isHost = true;
    this.roomCode = (customCode || this.generateRoomCode()).trim().toUpperCase();
    const hostPeerId = `${ROOM_PREFIX}${this.roomCode.toLowerCase()}`;

    worldStore.setMultiplayerStatus('connecting', {
      isHost: true,
      roomCode: this.roomCode,
      error: null,
    });

    try {
      this.peer = new Peer(hostPeerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        worldStore.setMultiplayerStatus('connected', {
          isHost: true,
          roomCode: this.roomCode,
          peerId: id,
          error: null,
        });
        soundManager.playPlaceTile('crystal');
        worldStore.addActivityLog(`🌐 Hosting World Room "${this.roomCode}"!`);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('Multiplayer host error:', err);
        // If room ID already in use, regenerate and retry
        if (err.type === 'unavailable-id') {
          const newCode = this.generateRoomCode();
          this.hostWorld(newCode);
        } else {
          worldStore.setMultiplayerStatus('error', { error: err.message || 'Host peer error' });
        }
      });

      this.peer.on('close', () => {
        this.disconnect();
      });
    } catch (err) {
      console.error('Failed to initialize host peer:', err);
      worldStore.setMultiplayerStatus('error', { error: err.message || 'Initialization failed' });
    }
  }

  /**
   * Join an existing world session via Room Code
   */
  async joinWorld(code) {
    this.disconnect();
    this.isHost = false;
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      worldStore.setMultiplayerStatus('error', { error: 'Please enter a valid room code.' });
      return;
    }

    this.roomCode = cleanCode;
    const targetPeerId = `${ROOM_PREFIX}${cleanCode.toLowerCase()}`;

    worldStore.setMultiplayerStatus('connecting', {
      isHost: false,
      roomCode: cleanCode,
      error: null,
    });

    try {
      this.peer = new Peer(undefined, { debug: 1 });

      this.peer.on('open', () => {
        const conn = this.peer.connect(targetPeerId, {
          reliable: true,
        });

        conn.on('open', () => {
          this.setupConnection(conn);
          // Handshake: Send local player info
          const state = worldStore.getState();
          conn.send({
            type: 'PLAYER_JOIN',
            peerId: this.peer.id,
            player: {
              id: this.localPlayerId,
              peerId: this.peer.id,
              username: state.avatarConfig?.username || 'Guest',
              avatarConfig: state.avatarConfig,
            },
          });

          worldStore.setMultiplayerStatus('connected', {
            isHost: false,
            roomCode: this.roomCode,
            peerId: this.peer.id,
            error: null,
          });
          soundManager.playPlaceTile('meadow');
          worldStore.addActivityLog(`✨ Connected to World Room "${this.roomCode}"!`);
        });

        conn.on('error', (err) => {
          console.warn('Connection error to host:', err);
          worldStore.setMultiplayerStatus('error', { error: 'Could not connect to room host. Please check room code.' });
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Multiplayer client peer error:', err);
        worldStore.setMultiplayerStatus('error', { error: 'Room not found or host is offline.' });
      });
    } catch (err) {
      console.error('Failed to initialize client peer:', err);
      worldStore.setMultiplayerStatus('error', { error: err.message || 'Connection failed' });
    }
  }

  setupConnection(conn) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.handleIncomingMessage(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      worldStore.removeRemotePlayer(conn.peer);

      // If host, notify other connected clients that this player left
      if (this.isHost) {
        this.broadcast({
          type: 'PLAYER_LEAVE',
          peerId: conn.peer,
        }, conn.peer);
      } else {
        // If guest and host closed the connection
        worldStore.setMultiplayerStatus('disconnected', { error: 'Room closed by host.' });
        worldStore.clearRemotePlayers();
        worldStore.addActivityLog('⚠️ Host disconnected or closed the room.');
      }
    });

    conn.on('error', (err) => {
      console.warn('Connection error on peer:', conn.peer, err);
      this.connections.delete(conn.peer);
      worldStore.removeRemotePlayer(conn.peer);
    });

    // Helper to send initial world state to joining guest once connection is open
    const sendInitialWorldState = () => {
      if (this.isHost) {
        const state = worldStore.getState();
        const existingList = Object.entries(state.multiplayer.remotePlayers)
          .filter(([pid]) => pid !== conn.peer)
          .map(([pid, p]) => ({
            peerId: pid,
            id: p.id,
            username: p.username,
            avatarConfig: p.avatarConfig,
            position: p.position || p.targetPosition,
            yaw: p.yaw || p.targetYaw,
          }));

        try {
          conn.send({
            type: 'INIT_WORLD',
            seed: state.seed,
            theme: state.avatarConfig?.theme || 'pastel_dream',
            legoBricks: state.legoBricks,
            hostPlayer: {
              peerId: this.peer?.id || 'host',
              id: this.localPlayerId,
              username: state.avatarConfig?.username || 'Host',
              avatarConfig: state.avatarConfig,
            },
            existingPlayers: existingList,
          });
        } catch (e) {
          console.warn('Failed to send INIT_WORLD:', e);
        }
      }
    };

    if (conn.open) {
      sendInitialWorldState();
    } else {
      conn.on('open', () => {
        sendInitialWorldState();
      });
    }
  }

  handleIncomingMessage(msg, senderConn) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'PLAYER_JOIN': {
        const player = msg.player;
        const peerId = msg.peerId || senderConn.peer;
        if (!player) return;

        worldStore.addRemotePlayer(peerId, player);
        worldStore.addActivityLog(`👋 ${player.username} stepped into the world!`);
        soundManager.playPlaceTile('crystal');

        // If host, relay this new player to all other connected clients
        if (this.isHost) {
          this.broadcast({
            type: 'PLAYER_JOIN',
            peerId,
            player,
          }, senderConn.peer);
        }
        break;
      }

      case 'PLAYER_LEAVE': {
        const peerId = msg.peerId || senderConn.peer;
        worldStore.removeRemotePlayer(peerId);
        break;
      }

      case 'INIT_WORLD': {
        // Client receives world state from host
        if (msg.legoBricks && Array.isArray(msg.legoBricks)) {
          worldStore.syncFullLegoWorld(msg.legoBricks);
        }
        if (msg.hostPlayer) {
          worldStore.addRemotePlayer(msg.hostPlayer.peerId || senderConn.peer, msg.hostPlayer);
        }
        if (msg.existingPlayers && Array.isArray(msg.existingPlayers)) {
          msg.existingPlayers.forEach((p) => {
            worldStore.addRemotePlayer(p.peerId || p.id, p);
          });
        }
        break;
      }

      case 'PLAYER_MOVE': {
        const peerId = msg.peerId || senderConn.peer;
        worldStore.updateRemotePlayerPosition(peerId, msg);

        // If host, forward to other clients with the sender's peerId attached
        if (this.isHost) {
          this.broadcast({
            ...msg,
            peerId,
          }, senderConn.peer);
        }
        break;
      }

      case 'PLACE':
      case 'PLACE_BLOCK': {
        const state = worldStore.getState();
        // Conflict resolution: Reject if coordinate is already occupied
        const isOccupied = state.legoBricks.some(
          (b) => b.x === msg.x && b.y === msg.y && b.z === msg.z
        );

        if (isOccupied) {
          return; // Conflict detected: drop duplicate block placement
        }

        const brickColor = msg.color || '#ff6b8b';
        const brickProp = msg.blockType || msg.propId || null;

        worldStore.placeLegoBrick(msg.x, msg.y, msg.z, brickColor, brickProp, false);

        // If host, forward to other clients
        if (this.isHost) {
          this.broadcast(msg, senderConn.peer);
        }
        break;
      }

      case 'REMOVE':
      case 'REMOVE_BLOCK': {
        worldStore.removeLegoBrick(msg.x, msg.y, msg.z, false);

        // If host, forward to other clients
        if (this.isHost) {
          this.broadcast(msg, senderConn.peer);
        }
        break;
      }
    }
  }

  /**
   * Broadcasts message to all connected peers, optionally excluding sender
   */
  broadcast(data, excludePeerId = null) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(data);
        } catch (e) {
          console.warn('Failed to send to peer:', peerId, e);
        }
      }
    });
  }

  /**
   * Broadcast local player movement (throttled to ~25Hz)
   */
  sendPlayerMove(position, yaw, isMoving = false, isFlying = false) {
    const now = performance.now();
    if (now - this.lastBroadcastTime < 40) return; // ~25 times per second
    this.lastBroadcastTime = now;

    if (this.connections.size === 0) return;

    this.broadcast({
      type: 'PLAYER_MOVE',
      peerId: this.peer?.id || this.localPlayerId,
      x: Math.round(position.x * 100) / 100,
      y: Math.round(position.y * 100) / 100,
      z: Math.round(position.z * 100) / 100,
      yaw: Math.round(yaw * 100) / 100,
      isMoving: !!isMoving,
      isFlying: !!isFlying,
    });
  }

  /**
   * Broadcast block placement
   */
  sendPlaceBlock(x, y, z, color, propId = null) {
    if (this.connections.size === 0) return;

    this.broadcast({
      type: 'PLACE',
      x,
      y,
      z,
      color,
      blockType: propId,
      propId,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast block removal
   */
  sendRemoveBlock(x, y, z) {
    if (this.connections.size === 0) return;

    this.broadcast({
      type: 'REMOVE',
      x,
      y,
      z,
      timestamp: Date.now(),
    });
  }

  disconnect() {
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {}
    });
    this.connections.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }

    this.isHost = false;
    this.roomCode = '';
    worldStore.setMultiplayerStatus('disconnected');
    worldStore.clearRemotePlayers();
  }
}

export const multiplayerManager = new MultiplayerManager();
