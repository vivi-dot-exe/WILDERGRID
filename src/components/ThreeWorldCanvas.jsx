import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, VIEW_MODES } from '../types/world';
import { LegoVoxelEngine, createGhostBrick, createCrackingOverlay } from '../utils/legoMesh';
import { PlayerController, createAvatarMesh } from '../utils/playerController';
import HotbarHUD from './HotbarHUD';
import InventoryModal from './InventoryModal';
import {
  Sparkles,
  MousePointer,
  Eye,
} from 'lucide-react';

export default function ThreeWorldCanvas() {
  const containerRef = useRef(null);
  const {
    activeDomain,
    exteriorGrid,
    interiorGrid,
    legoBricks,
    legoSelectedColor,
    avatarConfig,
    hotbarSlots,
    selectedHotbarIndex,
    isInventoryOpen,
  } = useWorldStore();

  const [isLocked, setIsLocked] = useState(false);
  const [hasDismissedOverlay, setHasDismissedOverlay] = useState(false);
  const [cameraZoomLevel, setCameraZoomLevel] = useState('Exterior (3rd Person)');

  const isCreative =
    avatarConfig?.gameMode === 'dreamweaver' ||
    avatarConfig?.gameMode === 'creative';

  // Mining reference for holding right-click in Survival
  const miningRef = useRef({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    startTime: 0,
  });

  // References to keep Three.js instances active across renders
  const engineRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    playerController: null,
    legoEngine: null,
    ghostBrick: null,
    crackingOverlay: null,
    streetGroup: null,
    avatarMesh: null,
    sunLight: null,
    ambientLight: null,
    raycaster: new THREE.Raycaster(),
    screenCenter: new THREE.Vector2(0, 0),
    animationFrameId: null,
  });

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 4. Lighting & Themed Sky
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    sunLight.position.set(24, 38, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const shadowDist = 25;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbe1fa, 0.45);
    scene.add(hemiLight);

    // 5. Build Paved Street Base Layout
    const streetGroup = new THREE.Group();
    scene.add(streetGroup);

    // 6. Instanced & Prop Lego Voxel Engine
    const legoEngine = new LegoVoxelEngine(scene, 3000);
    legoEngine.syncBricks(legoBricks);

    // 7. Ghost Placement Brick
    const ghostBrick = createGhostBrick();
    scene.add(ghostBrick);

    // 8. Cracking Overlay for 1-Second Mining in Survival
    const crackingOverlay = createCrackingOverlay();
    scene.add(crackingOverlay);

    // 9. Player Controller & Avatar Mannequin
    const playerController = new PlayerController(camera, renderer.domElement, {
      spawnX: 4.5,
      spawnZ: 4.5,
      initialYaw: -0.75,
      initialPitch: -0.2,
      initialDistance: 5.5,
      isCreative,
      onFallDamage: (damage) => {
        worldStore.damagePlayer(damage);
      },
      onToggleFly: (flying) => {
        worldStore.setFlying(flying);
      },
      onConsumeStamina: (amount) => {
        worldStore.consumeStamina(amount);
      },
    });

    const avatarMesh = createAvatarMesh(avatarConfig);
    scene.add(avatarMesh);
    playerController.setAvatarMesh(avatarMesh);

    // Save into ref
    engineRef.current = {
      scene,
      camera,
      renderer,
      playerController,
      legoEngine,
      ghostBrick,
      crackingOverlay,
      streetGroup,
      avatarMesh,
      sunLight,
      ambientLight,
      raycaster: new THREE.Raycaster(),
      screenCenter: new THREE.Vector2(0, 0),
      animationFrameId: null,
    };

    // Apply environment theme
    applyThemeEnvironment(engineRef.current, avatarConfig?.theme || 'pastel_dream');

    // Build streets from grid
    const currentGrid = activeDomain === DOMAINS.EXTERIOR ? exteriorGrid : interiorGrid;
    rebuildStreetWorld(streetGroup, currentGrid, activeDomain);

    // Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer Lock check
    const checkLockStatus = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      setIsLocked(locked);
    };
    document.addEventListener('pointerlockchange', checkLockStatus);

    // Hotbar Number Keys (1-9) & Inventory ('E')
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slotIdx = parseInt(e.key) - 1;
        worldStore.setSelectedHotbarIndex(slotIdx);
      } else if (e.code === 'KeyE') {
        if (document.pointerLockElement === renderer.domElement) {
          document.exitPointerLock?.();
        }
        worldStore.toggleInventory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Raycast Interaction (Left-click Place, Right-click Mine)
    const handlePointerDown = (e) => {
      if (document.pointerLockElement !== renderer.domElement) {
        playerController.lock();
        return;
      }

      const raycaster = engineRef.current.raycaster;
      raycaster.setFromCamera(engineRef.current.screenCenter, camera);

      // Collect interactable targets
      const targets = [];
      if (legoEngine.instancedMesh) targets.push(legoEngine.instancedMesh);
      if (legoEngine.propsGroup) {
        legoEngine.propsGroup.children.forEach((c) => targets.push(c));
      }
      streetGroup.traverse((child) => {
        if (child.isMesh && child.userData.isInteractable) {
          targets.push(child);
        }
      });

      const intersects = raycaster.intersectObjects(targets, false);
      if (intersects.length === 0) return;

      const hit = intersects[0];
      const isLegoHit =
        hit.object === legoEngine.instancedMesh ||
        hit.object.parent === legoEngine.propsGroup;

      const currentStoreState = worldStore.getState();
      const currentSlot =
        currentStoreState.hotbarSlots[currentStoreState.selectedHotbarIndex] ||
        currentStoreState.hotbarSlots[0];
      const isCreativeMode =
        currentStoreState.avatarConfig?.gameMode === 'dreamweaver' ||
        currentStoreState.avatarConfig?.gameMode === 'creative';

      if (e.button === 0) {
        // LEFT CLICK: Place Active Hotbar Item
        // In Survival, check if slot has count
        if (!isCreativeMode && currentSlot.count <= 0) {
          return;
        }

        let targetX, targetY, targetZ;

        if (isLegoHit) {
          const hitNormal = hit.face?.normal || new THREE.Vector3(0, 1, 0);
          const hitPos = hit.point.clone().add(hitNormal.clone().multiplyScalar(0.45));
          targetX = Math.floor(hitPos.x);
          targetY = Math.max(0, Math.floor(hitPos.y));
          targetZ = Math.floor(hitPos.z);
        } else {
          // Placed on street/ground
          const hitPos = hit.point.clone().add(new THREE.Vector3(0, 0.45, 0));
          targetX = Math.floor(hitPos.x);
          targetY = Math.max(0, Math.floor(hitPos.y));
          targetZ = Math.floor(hitPos.z);
        }

        // Avoid placing inside player body
        const playerPos = playerController.position;
        const distToPlayer = Math.hypot(targetX + 0.5 - playerPos.x, targetZ + 0.5 - playerPos.z);
        const yOverlap = targetY < playerPos.y + 1.8 && targetY + 1 > playerPos.y;

        if (!(distToPlayer < 0.6 && yOverlap)) {
          worldStore.placeLegoBrick(
            targetX,
            targetY,
            targetZ,
            currentSlot.color,
            currentSlot.propId
          );

          if (!isCreativeMode) {
            worldStore.consumeCurrentHotbarItem();
          }
        }
      } else if (e.button === 2) {
        // RIGHT CLICK: Remove / Mine Lego Block
        if (isLegoHit) {
          let targetX, targetY, targetZ;

          if (hit.object.userData?.brickKey) {
            targetX = hit.object.userData.x;
            targetY = hit.object.userData.y;
            targetZ = hit.object.userData.z;
          } else {
            const hitNormal = hit.face?.normal || new THREE.Vector3(0, 0, 0);
            const hitPos = hit.point.clone().sub(hitNormal.clone().multiplyScalar(0.45));
            targetX = Math.floor(hitPos.x);
            targetY = Math.floor(hitPos.y);
            targetZ = Math.floor(hitPos.z);
          }

          if (isCreativeMode) {
            // Creative: Instant break!
            worldStore.removeLegoBrick(targetX, targetY, targetZ);
          } else {
            // Survival: Start 1.0-second break timer with cracking animation!
            miningRef.current = {
              active: true,
              x: targetX,
              y: targetY,
              z: targetZ,
              startTime: performance.now(),
            };
          }
        }
      }
    };

    const handlePointerUp = (e) => {
      if (e.button === 2 && miningRef.current.active) {
        // Cancel mining if released early
        miningRef.current.active = false;
        crackingOverlay.visible = false;
      }
    };

    const preventContext = (e) => e.preventDefault();
    renderer.domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    renderer.domElement.addEventListener('contextmenu', preventContext);

    // Main Animation Frame Loop
    let lastTime = performance.now();

    const animate = (time) => {
      engineRef.current.animationFrameId = requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Update colliders from Lego blocks and street boundaries
      const blockColliders = legoEngine.getAllBrickAABBs();
      playerController.update(delta, blockColliders);

      // Survival Mining 1-Second Timer & Cracking Overlay Animation
      if (miningRef.current.active) {
        const elapsed = (time - miningRef.current.startTime) / 1000;
        if (elapsed >= 1.0) {
          // Block broken!
          worldStore.removeLegoBrick(
            miningRef.current.x,
            miningRef.current.y,
            miningRef.current.z
          );
          worldStore.addHotbarItemCount('brick_rose', 1);
          miningRef.current.active = false;
          crackingOverlay.visible = false;
        } else {
          // Animate cracks and opacity
          crackingOverlay.position.set(
            miningRef.current.x + 0.5,
            miningRef.current.y,
            miningRef.current.z + 0.5
          );
          crackingOverlay.visible = true;
          crackingOverlay.material.opacity = Math.min(0.95, 0.25 + elapsed * 0.7);
        }
      } else {
        crackingOverlay.visible = false;
      }

      // Update Zoom HUD status
      if (playerController.currentDistance < 2.0) {
        setCameraZoomLevel('Interior (1st Person)');
      } else if (playerController.currentDistance < 7.0) {
        setCameraZoomLevel('Street View (3rd Person)');
      } else {
        setCameraZoomLevel('Panoramic City View');
      }

      // Update Ghost Placement Reticle
      if (document.pointerLockElement === renderer.domElement) {
        const raycaster = engineRef.current.raycaster;
        raycaster.setFromCamera(engineRef.current.screenCenter, camera);

        const targets = [];
        if (legoEngine.instancedMesh) targets.push(legoEngine.instancedMesh);
        if (legoEngine.propsGroup) {
          legoEngine.propsGroup.children.forEach((c) => targets.push(c));
        }
        streetGroup.traverse((child) => {
          if (child.isMesh && child.userData.isInteractable) {
            targets.push(child);
          }
        });

        const intersects = raycaster.intersectObjects(targets, false);
        if (intersects.length > 0 && intersects[0].distance < 18) {
          const hit = intersects[0];
          const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0);
          const hitPos = hit.point.clone().add(normal.clone().multiplyScalar(0.48));
          const snapX = Math.floor(hitPos.x);
          const snapY = Math.max(0, Math.floor(hitPos.y));
          const snapZ = Math.floor(hitPos.z);

          ghostBrick.position.set(snapX + 0.5, snapY, snapZ + 0.5);

          // Update ghost color from selected hotbar slot
          const st = worldStore.getState();
          const curSlot = st.hotbarSlots[st.selectedHotbarIndex];
          if (curSlot?.color) {
            ghostBrick.material.color.set(curSlot.color);
          }
          ghostBrick.visible = true;
        } else {
          ghostBrick.visible = false;
        }
      } else {
        ghostBrick.visible = false;
      }

      renderer.render(scene, camera);
    };

    engineRef.current.animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(engineRef.current.animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', checkLockStatus);
      renderer.domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      renderer.domElement.removeEventListener('contextmenu', preventContext);

      playerController.dispose();
      legoEngine.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Creative mode flag
  useEffect(() => {
    if (engineRef.current.playerController) {
      engineRef.current.playerController.setCreativeMode(isCreative);
    }
  }, [isCreative]);

  // Sync Lego Bricks
  useEffect(() => {
    if (engineRef.current.legoEngine) {
      engineRef.current.legoEngine.syncBricks(legoBricks);
    }
  }, [legoBricks]);

  // Sync Avatar config appearance
  useEffect(() => {
    if (engineRef.current.scene && engineRef.current.avatarMesh) {
      engineRef.current.scene.remove(engineRef.current.avatarMesh);
      const newAvatar = createAvatarMesh(avatarConfig);
      engineRef.current.scene.add(newAvatar);
      engineRef.current.avatarMesh = newAvatar;
      engineRef.current.playerController?.setAvatarMesh(newAvatar);
    }
  }, [avatarConfig]);

  // Sync Environment Theme
  useEffect(() => {
    if (engineRef.current.scene) {
      applyThemeEnvironment(engineRef.current, avatarConfig?.theme || 'pastel_dream');
    }
  }, [avatarConfig?.theme]);

  // Sync Grid Street Layout
  useEffect(() => {
    if (engineRef.current.streetGroup) {
      const currentGrid = activeDomain === DOMAINS.EXTERIOR ? exteriorGrid : interiorGrid;
      rebuildStreetWorld(engineRef.current.streetGroup, currentGrid, activeDomain);
    }
  }, [activeDomain, exteriorGrid, interiorGrid]);

  const activeSlot = hotbarSlots[selectedHotbarIndex] || hotbarSlots[0];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 select-none">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-pointer"
        onClick={() => engineRef.current.playerController?.lock()}
      />

      {/* Center Pointer Lock Reticle */}
      {isLocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Soft Crosshair Dot with active block color */}
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg transition-transform duration-75 scale-100"
              style={{ backgroundColor: activeSlot?.color || '#ff6b8b' }}
            />
            <div className="absolute w-8 h-8 rounded-full border border-white/50 animate-ping opacity-25" />
          </div>
        </div>
      )}

      {/* Top Left: Controls & Keybinding Helper */}
      <div className="absolute top-20 left-4 z-20 pointer-events-auto max-w-xs">
        <div className="tropical-glass p-3.5 rounded-2xl space-y-2 border border-white/80 shadow-tropical-md text-xs text-slate-700">
          <div className="font-bold flex items-center justify-between text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-tropical-coral" />
              <span>3D Walk & Build</span>
            </span>
            <span
              onClick={() => engineRef.current.playerController?.lock()}
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition ${
                isLocked
                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-400/40'
                  : 'bg-tropical-coral/15 text-tropical-coral border border-tropical-coral/30 hover:bg-tropical-coral hover:text-white'
              }`}
            >
              {isLocked ? 'Mouse Locked' : 'Click to Lock'}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-tropical-coral flex items-center space-x-1 bg-white/70 px-2 py-1 rounded-xl">
            <Eye className="w-3.5 h-3.5 text-tropical-aqua" />
            <span>{cameraZoomLevel}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                WASD
              </kbd>
              <span>Walk</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                Space
              </kbd>
              <span>Jump</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                E
              </kbd>
              <span>Inventory</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <span className="font-bold text-[10px] text-tropical-aqua">1–9</span>
              <span>Hotbar</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <span className="font-bold text-emerald-600">Left-Click</span>
              <span>Place Block</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <span className="font-bold text-rose-500">Right-Click</span>
              <span>{isCreative ? 'Break' : 'Hold Mine'}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic pt-0.5">
            Press <kbd className="font-mono bg-slate-200 px-1 rounded">Esc</kbd> anytime to unlock cursor.
          </div>
        </div>
      </div>

      {/* Minecraft-Style 9-Slot Hotbar & Survival Vitals HUD */}
      <HotbarHUD />

      {/* Full 'E' Inventory Catalog Modal */}
      <InventoryModal />

      {/* Initial Welcome & Lock Overlay (Dismissible) */}
      {!hasDismissedOverlay && !isLocked && (
        <div
          onClick={() => {
            setHasDismissedOverlay(true);
            engineRef.current.playerController?.lock();
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer transition-opacity animate-fade-in"
        >
          <div className="tropical-card px-6 py-5 rounded-3xl shadow-2xl border border-white/90 text-center max-w-sm flex flex-col items-center space-y-2.5 pointer-events-auto hover:scale-103 transition">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-tropical-coral to-tropical-yellow flex items-center justify-center text-white shadow-coral-glow mb-1">
              <MousePointer className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="font-fredoka text-lg font-bold text-slate-800">
              Enter 3D Street World
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Walk paved streets with WASD, jump, build with the 9-slot Hotbar, open full inventory with <kbd className="font-mono bg-slate-100 px-1 rounded font-bold">E</kbd>, and zoom dynamically!
            </p>
            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasDismissedOverlay(true);
                  engineRef.current.playerController?.lock();
                }}
                className="px-5 py-2 rounded-xl bg-tropical-coral hover:bg-tropical-coral/90 text-white text-xs font-bold shadow-coral-glow transition hover:scale-105"
              >
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Toast when unlocked after dismissing initial overlay */}
      {hasDismissedOverlay && !isLocked && !isInventoryOpen && (
        <div
          onClick={() => engineRef.current.playerController?.lock()}
          className="absolute top-20 right-4 z-20 pointer-events-auto cursor-pointer"
        >
          <div className="tropical-glass px-3 py-1.5 rounded-xl border border-white/80 shadow-md text-xs font-semibold text-slate-700 hover:bg-white flex items-center space-x-1.5 animate-fade-in">
            <MousePointer className="w-3.5 h-3.5 text-tropical-coral" />
            <span>Click canvas to lock mouse</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Procedurally generates the 3D base paved street, sidewalks, and environment blocks from the world grid
 */
function rebuildStreetWorld(group, grid, domain) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  }

  const gridSize = grid.length;
  const isExterior = domain === DOMAINS.EXTERIOR;

  const streetAsphaltMat = new THREE.MeshStandardMaterial({
    color: isExterior ? 0xe2e8f0 : 0xf8fafc,
    roughness: 0.7,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xfbd2d7,
    roughness: 0.5,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x57cc99,
    roughness: 0.6,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x48cae4,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const woodBoardwalkMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.6,
  });

  // Base Ground Plane
  const groundGeom = new THREE.PlaneGeometry(gridSize + 8, gridSize + 8);
  groundGeom.rotateX(-Math.PI / 2);
  groundGeom.translate(gridSize / 2, -0.01, gridSize / 2);
  const groundMesh = new THREE.Mesh(
    groundGeom,
    new THREE.MeshStandardMaterial({ color: isExterior ? 0xecfdf5 : 0xfdf2f8, roughness: 0.8 })
  );
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // Iterate tiles to create paved streets, sidewalks, and buildings
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const tile = grid[r][c];
      const terrainType = String(tile?.base || tile?.terrain || '');
      const x = c;
      const z = r;

      let tileMat = streetAsphaltMat;
      let tileHeight = 0.12;

      if (terrainType.includes('lawn') || terrainType.includes('meadow') || terrainType.includes('grass')) {
        tileMat = grassMat;
        tileHeight = 0.14;
      } else if (terrainType.includes('pool') || terrainType.includes('water')) {
        tileMat = waterMat;
        tileHeight = 0.05;
      } else if (terrainType.includes('boardwalk') || terrainType.includes('plank') || terrainType.includes('parquet')) {
        tileMat = woodBoardwalkMat;
        tileHeight = 0.16;
      } else if (terrainType.includes('sand')) {
        tileMat = new THREE.MeshStandardMaterial({ color: 0xfff6ed, roughness: 0.8 });
        tileHeight = 0.1;
      } else if (terrainType.includes('patio') || terrainType.includes('terrazzo')) {
        tileMat = sidewalkMat;
        tileHeight = 0.15;
      }

      // Tile Box
      const tileGeom = new THREE.BoxGeometry(0.96, tileHeight, 0.96);
      const tileMesh = new THREE.Mesh(tileGeom, tileMat);
      tileMesh.position.set(x + 0.5, tileHeight / 2, z + 0.5);
      tileMesh.receiveShadow = true;
      tileMesh.castShadow = true;
      tileMesh.userData = { isInteractable: true, tileX: x, tileZ: z };
      group.add(tileMesh);

      // Paved road curb markings
      if ((r === 4 || r === 11 || c === 4 || c === 11) && isExterior) {
        const lineGeom = new THREE.PlaneGeometry(0.18, 0.6);
        lineGeom.rotateX(-Math.PI / 2);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const lineMesh = new THREE.Mesh(lineGeom, lineMat);
        lineMesh.position.set(x + 0.5, tileHeight + 0.01, z + 0.5);
        group.add(lineMesh);
      }

      // If tile has building prop, render blocky architecture
      if (tile?.prop) {
        const propId = String(typeof tile.prop === 'string' ? tile.prop : (tile.prop.id || ''));
        let propColor = 0xff6b8b;
        let pHeight = 1.8;

        if (propId.includes('pavilion') || propId.includes('villa') || propId.includes('hotel') || propId.includes('house')) {
          pHeight = 2.4;
          propColor = 0xffd166;
        } else if (propId.includes('tower') || propId.includes('skyscraper')) {
          pHeight = 3.6;
          propColor = 0x00bbf9;
        } else if (propId.includes('palm') || propId.includes('tree')) {
          pHeight = 2.0;
          propColor = 0x2ec4b6;
        } else if (propId.includes('wall')) {
          pHeight = 2.4;
          propColor = 0xffffff;
        } else if (propId.includes('terrace') || propId.includes('stairs')) {
          pHeight = 1.4;
          propColor = 0xffa07a;
        }

        const bGeom = new THREE.BoxGeometry(0.85, pHeight, 0.85);
        const bMat = new THREE.MeshStandardMaterial({ color: propColor, roughness: 0.4 });
        const bMesh = new THREE.Mesh(bGeom, bMat);
        bMesh.position.set(x + 0.5, tileHeight + pHeight / 2, z + 0.5);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        bMesh.userData = { isInteractable: true, tileX: x, tileZ: z };
        group.add(bMesh);

        const roofGeom = new THREE.ConeGeometry(0.65, 0.6, 4);
        roofGeom.rotateY(Math.PI / 4);
        const roofMatLocal = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const roofMesh = new THREE.Mesh(roofGeom, roofMatLocal);
        roofMesh.position.set(x + 0.5, tileHeight + pHeight + 0.3, z + 0.5);
        roofMesh.castShadow = true;
        group.add(roofMesh);
      }
    }
  }
}

/**
 * Applies dynamic skybox and atmospheric lighting according to selected theme
 */
function applyThemeEnvironment(engine, theme) {
  const { scene, sunLight, ambientLight } = engine;
  if (!scene) return;

  if (theme === 'midnight_dark') {
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.022);

    if (ambientLight) {
      ambientLight.color.setHex(0x334155);
      ambientLight.intensity = 0.6;
    }
    if (sunLight) {
      sunLight.color.setHex(0x93c5fd);
      sunLight.intensity = 0.8;
      sunLight.position.set(-15, 30, -10);
    }
  } else if (theme === 'soft_retro') {
    scene.background = new THREE.Color(0xfef3c7);
    scene.fog = new THREE.FogExp2(0xfef3c7, 0.015);

    if (ambientLight) {
      ambientLight.color.setHex(0xffedd5);
      ambientLight.intensity = 0.9;
    }
    if (sunLight) {
      sunLight.color.setHex(0xfb923c);
      sunLight.intensity = 1.3;
      sunLight.position.set(30, 25, 15);
    }
  } else {
    scene.background = new THREE.Color(0xbde9ff);
    scene.fog = new THREE.FogExp2(0xbde9ff, 0.012);

    if (ambientLight) {
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.95;
    }
    if (sunLight) {
      sunLight.color.setHex(0xfff5ea);
      sunLight.intensity = 1.4;
      sunLight.position.set(24, 38, 20);
    }
  }
}
