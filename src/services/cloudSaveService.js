/**
 * Wildergrid Cloud Save Service (Supabase & PostgreSQL Integration)
 *
 * PostgreSQL / Supabase Migration Schema:
 * ```sql
 * CREATE TABLE IF NOT EXISTS wildergrid_worlds (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id TEXT NOT NULL DEFAULT 'anonymous_builder',
 *   world_name TEXT NOT NULL,
 *   theme TEXT NOT NULL DEFAULT 'pastel_dream',
 *   seed TEXT NOT NULL,
 *   brick_count INTEGER DEFAULT 0,
 *   world_data JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- Enable Row Level Security (RLS)
 * ALTER TABLE wildergrid_worlds ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow all public read/write" ON wildergrid_worlds FOR ALL USING (true);
 * ```
 */

const LOCAL_CLOUD_STORAGE_KEY = 'wildergrid_cloud_saves_v4';

// Check if optional Supabase credentials exist in environment
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || null;
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || null;

class CloudSaveService {
  constructor() {
    this.isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
    this.initDefaultMockSaves();
  }

  /**
   * Initializes starter default cloud worlds if empty
   */
  initDefaultMockSaves() {
    const existing = localStorage.getItem(LOCAL_CLOUD_STORAGE_KEY);
    if (!existing) {
      const defaultSaves = [
        {
          id: 'cloud-save-pastel-resort',
          world_name: 'Pastel Harbor Villa',
          theme: 'pastel_dream',
          seed: 'sunny-resort-villa',
          brick_count: 24,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          world_data: {
            version: '4.0',
            name: 'Pastel Harbor Villa',
            theme: 'pastel_dream',
            seed: 'sunny-resort-villa',
            gameMode: 'creative',
            player: { health: 20, stamina: 20, isFlying: true },
            legoBricks: [
              { x: 4, y: 0, z: 4, color: '#ff6b8b' },
              { x: 4, y: 1, z: 4, color: '#ffd166' },
              { x: 5, y: 0, z: 4, color: '#00bbf9' },
              { x: 4, y: 0, z: 5, color: '#2ec4b6' },
              { x: 5, y: 0, z: 5, color: '#ff8da1' },
              { x: 5, y: 1, z: 4, color: '#ffd166', propId: 'lego_chair' },
              { x: 4, y: 1, z: 5, color: '#ffb703', propId: 'lego_lantern' },
            ],
          },
        },
        {
          id: 'cloud-save-cyber-outpost',
          world_name: 'Cyber Neon Bastion',
          theme: 'cyber_dark',
          seed: 'coral-citadel-7',
          brick_count: 36,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          world_data: {
            version: '4.0',
            name: 'Cyber Neon Bastion',
            theme: 'cyber_dark',
            seed: 'coral-citadel-7',
            gameMode: 'creative',
            player: { health: 20, stamina: 20, isFlying: false },
            legoBricks: [
              { x: 6, y: 0, z: 6, color: '#00f5d4' },
              { x: 6, y: 1, z: 6, color: '#7000ff' },
              { x: 7, y: 0, z: 6, color: '#00bbf9' },
              { x: 6, y: 0, z: 7, color: '#38bdf8' },
              { x: 7, y: 1, z: 6, color: '#ffd166', propId: 'lego_lantern' },
            ],
          },
        },
      ];
      localStorage.setItem(LOCAL_CLOUD_STORAGE_KEY, JSON.stringify(defaultSaves));
    }
  }

  isLiveCloudConnected() {
    return this.isConfigured;
  }

  /**
   * Fetches all cloud-saved worlds
   */
  async listCloudWorlds() {
    // Artificial latency simulation for realistic UI feel
    await new Promise((res) => setTimeout(res, 140));

    if (this.isConfigured) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wildergrid_worlds?select=*&order=updated_at.desc`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Supabase remote fetch failed, falling back to local cloud cache:', e);
      }
    }

    // Local Cloud fallback
    try {
      const raw = localStorage.getItem(LOCAL_CLOUD_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read local cloud saves', e);
      return [];
    }
  }

  /**
   * Saves or overwrites a world to cloud
   */
  async saveWorldToCloud(worldName, worldData) {
    await new Promise((res) => setTimeout(res, 200));

    const record = {
      id: 'cloud-' + Math.random().toString(36).substring(2, 11),
      user_id: 'builder-' + (worldData.player?.username || 'anonymous'),
      world_name: (worldName || worldData.name || 'Untitled World').trim(),
      theme: worldData.theme || 'pastel_dream',
      seed: worldData.seed || 'sunny-haven',
      brick_count: Array.isArray(worldData.legoBricks) ? worldData.legoBricks.length : 0,
      world_data: worldData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isConfigured) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wildergrid_worlds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(record),
        });
        if (response.ok) {
          const resJson = await response.json();
          return resJson[0] || record;
        }
      } catch (e) {
        console.warn('Supabase remote save failed, storing locally:', e);
      }
    }

    // Local Cloud storage fallback
    const list = await this.listCloudWorlds();
    const existingIdx = list.findIndex((item) => item.world_name.toLowerCase() === record.world_name.toLowerCase());

    if (existingIdx >= 0) {
      record.id = list[existingIdx].id;
      record.created_at = list[existingIdx].created_at;
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }

    localStorage.setItem(LOCAL_CLOUD_STORAGE_KEY, JSON.stringify(list));
    return record;
  }

  /**
   * Loads a specific world by ID
   */
  async loadCloudWorld(id) {
    await new Promise((res) => setTimeout(res, 120));

    if (this.isConfigured) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wildergrid_worlds?id=eq.${id}&select=*`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (response.ok) {
          const list = await response.json();
          if (list.length > 0) return list[0].world_data;
        }
      } catch (e) {
        console.warn('Supabase load failed, falling back:', e);
      }
    }

    const list = await this.listCloudWorlds();
    const found = list.find((item) => item.id === id);
    return found ? found.world_data : null;
  }

  /**
   * Deletes a cloud world by ID
   */
  async deleteCloudWorld(id) {
    await new Promise((res) => setTimeout(res, 100));

    if (this.isConfigured) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/wildergrid_worlds?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
      } catch (e) {
        console.warn('Supabase delete failed:', e);
      }
    }

    const list = await this.listCloudWorlds();
    const filtered = list.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_CLOUD_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
}

export const cloudSaveService = new CloudSaveService();
