import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, VIEW_MODES } from '../types/world';
import { LegoVoxelEngine, createGhostBrick } from '../utils/legoMesh';
import { PlayerController, createAvatarMesh } from '../utils/playerController';
import {
  Compass,
  Sparkles,
  MousePointer,
  RotateCcw,
  Palette,
  Maximize2,
  Eye,
  ChevronRight,
  Zap,
} from 'lucide-react';

const LEGO_PALETTE = [
  '#ff6b8b', // Coral Pink
  '#ffd166', // Buttercup Yellow
  '#00bbf9', // Sky Cyan
  '#2ec4b6', // Mint Teal
  '#9d4edd', // Lavender Purple
  '#ff9f1c', // Tangelo Orange
  '#ffffff', // Crisp White
  '#343a40', // Slate Black
];

export default function ThreeWorldCanvas() {
  const containerRef = useRef(null);
  const {
    activeDomain,
    exteriorGrid,
    interiorGrid,
    legoBricks,
    legoSelectedColor,
    avatarConfig,
  } = useWorldStore();

  const [isLocked, setIsLocked] = useState(false);
  const [hasDismissedOverlay, setHasDismissedOverlay] = useState(false);
  const [cameraZoomLevel, setCameraZoomLevel] = useState('Exterior (3rd Person)');
  const [activeColor, setActiveColor] = useState(legoSelectedColor || '#ff6b8b');

  // References to keep Three.js instances active across renders
  const engineRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    playerController: null,
    legoEngine: null,
    ghostBrick: null,
    streetGroup: null,
    avatarMesh: null,
    sunLight: null,
    ambientLight: null,
    skyMesh: null,
    groundMesh: null,
    raycaster: new THREE.Raycaster(),
    screenCenter: new THREE.Vector2(0, 0),
    animationFrameId: null,
  });

  // Keep active color in sync
  useEffect(() => {
    setActiveColor(legoSelectedColor);
  }, [legoSelectedColor]);

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

    // Secondary hemisphere fill light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbe1fa, 0.45);
    scene.add(hemiLight);

    // 5. Build Paved Street Base Layout
    const streetGroup = new THREE.Group();
    scene.add(streetGroup);

    // 6. Instanced Lego Voxel Engine
    const legoEngine = new LegoVoxelEngine(scene, 3000);
    legoEngine.syncBricks(legoBricks);

    // 7. Ghost Placement Brick
    const ghostBrick = createGhostBrick();
    scene.add(ghostBrick);

    // 8. Player Controller & Avatar Mannequin
    const playerController = new PlayerController(camera, renderer.domElement, {
      spawnX: 4.5,
      spawnZ: 4.5,
      initialYaw: -0.75,
      initialPitch: -0.2,
      initialDistance: 5.5,
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
      streetGroup,
      avatarMesh,
      sunLight,
      ambientLight,
      skyMesh: null,
      groundMesh: null,
      raycaster: new THREE.Raycaster(),
      screenCenter: new THREE.Vector2(0, 0),
      animationFrameId: null,
    };

    // Apply environment theme
    applyThemeEnvironment(engineRef.current, avatarConfig?.theme || 'pastel_dream');

    // Build streets from grid
    const currentGrid = activeDomain === DOMAINS.EXTERIOR ? exteriorGrid : interiorGrid;
    rebuildStreetWorld(streetGroup, currentGrid, activeDomain);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Pointer Lock status check
    const checkLockStatus = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      setIsLocked(locked);
    };
    document.addEventListener('pointerlockchange', checkLockStatus);

    // 11. Mouse Click Raycast (Left-click to place, Right-click to remove)
    const handlePointerDown = (e) => {
      // Must be locked or clicking directly to lock
      if (document.pointerLockElement !== renderer.domElement) {
        playerController.lock();
        return;
      }

      const raycaster = engineRef.current.raycaster;
      raycaster.setFromCamera(engineRef.current.screenCenter, camera);

      // Collect interactable targets: lego blocks and street floor
      const targets = [];
      if (legoEngine.instancedMesh) targets.push(legoEngine.instancedMesh);
      streetGroup.traverse((child) => {
        if (child.isMesh && child.userData.isInteractable) {
          targets.push(child);
        }
      });

      const intersects = raycaster.intersectObjects(targets, false);
      if (intersects.length === 0) return;

      const hit = intersects[0];
      const isLegoHit = hit.object === legoEngine.instancedMesh;

      if (e.button === 0) {
        // LEFT CLICK: Place Lego Brick
        let targetX, targetY, targetZ;

        if (isLegoHit && hit.instanceId !== undefined) {
          // Find which brick was hit
          const hitNormal = hit.face?.normal || new THREE.Vector3(0, 1, 0);
          // Transform normal to world space if needed (instanced mesh is at origin)
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
          worldStore.placeLegoBrick(targetX, targetY, targetZ, activeColor);
        }
      } else if (e.button === 2) {
        // RIGHT CLICK: Remove targeted Lego Brick
        if (isLegoHit && hit.instanceId !== undefined) {
          // Identify brick coordinates from hit point
          const hitNormal = hit.face?.normal || new THREE.Vector3(0, 0, 0);
          const hitPos = hit.point.clone().sub(hitNormal.clone().multiplyScalar(0.45));
          const targetX = Math.floor(hitPos.x);
          const targetY = Math.floor(hitPos.y);
          const targetZ = Math.floor(hitPos.z);

          worldStore.removeLegoBrick(targetX, targetY, targetZ);
        }
      }
    };

    const preventContext = (e) => e.preventDefault();
    renderer.domElement.addEventListener('mousedown', handlePointerDown);
    renderer.domElement.addEventListener('contextmenu', preventContext);

    // 12. Main Animation Frame Loop
    let lastTime = performance.now();

    const animate = (time) => {
      engineRef.current.animationFrameId = requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Update colliders from Lego blocks and street boundaries
      const blockColliders = legoEngine.getAllBrickAABBs();
      playerController.update(delta, blockColliders);

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
      document.removeEventListener('pointerlockchange', checkLockStatus);
      renderer.domElement.removeEventListener('mousedown', handlePointerDown);
      renderer.domElement.removeEventListener('contextmenu', preventContext);

      playerController.dispose();
      legoEngine.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Lego Bricks when store changes
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

  const handleSelectColor = (color) => {
    setActiveColor(color);
    worldStore.setLegoSelectedColor(color);
  };

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
            {/* Soft Crosshair Dot */}
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg transition-transform duration-75 scale-100"
              style={{ backgroundColor: activeColor }}
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
              <span className="font-bold text-[10px] text-tropical-aqua">Scroll</span>
              <span>Zoom In/Out</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                Shift
              </kbd>
              <span>Sprint</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <span className="font-bold text-emerald-600">Left-Click</span>
              <span>Place Block</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
              <span className="font-bold text-rose-500">Right-Click</span>
              <span>Remove</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic pt-0.5">
            Press <kbd className="font-mono bg-slate-200 px-1 rounded">Esc</kbd> anytime to unlock cursor.
          </div>
        </div>
      </div>

      {/* Bottom Center: Lego Brick Color Palette Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="tropical-glass px-4 py-2.5 rounded-3xl flex items-center space-x-3 shadow-tropical-lg border border-white/90">
          <div className="flex items-center space-x-1.5 pr-2 border-r border-slate-200/80">
            <Palette className="w-4 h-4 text-tropical-coral" />
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">Lego Stud:</span>
          </div>

          {/* Color buttons */}
          <div className="flex items-center space-x-2">
            {LEGO_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => handleSelectColor(color)}
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-xl shadow-sm transition-all hover:scale-115 relative flex items-center justify-center ${
                  activeColor === color
                    ? 'ring-3 ring-tropical-coral scale-110 shadow-coral-glow'
                    : 'border border-black/10 hover:shadow-md'
                }`}
                title={`Select ${color}`}
              >
                {activeColor === color && (
                  <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>

          {/* Clear / Undo block helpers */}
          <div className="pl-2 border-l border-slate-200/80 flex items-center space-x-1.5">
            <button
              onClick={() => worldStore.clearLegoBricks()}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-sm"
              title="Clear custom placed Lego bricks"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

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
              Walk paved streets with WASD, jump, build Lego blocks with realistic studs, and dynamically zoom between interior and exterior perspectives!
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
      {hasDismissedOverlay && !isLocked && (
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
  // Clear previous meshes
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

  // Base paved street/floor material
  const streetAsphaltMat = new THREE.MeshStandardMaterial({
    color: isExterior ? 0xe2e8f0 : 0xf8fafc,
    roughness: 0.7,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xfbd2d7, // Soft pastel coral-tinted sidewalk
    roughness: 0.5,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
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

  const buildingWallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xff6b8b,
    roughness: 0.35,
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

      // Select material based on terrain
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

      // Paved road curb markings for cross-streets
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

        // Base building block
        const bGeom = new THREE.BoxGeometry(0.85, pHeight, 0.85);
        const bMat = new THREE.MeshStandardMaterial({ color: propColor, roughness: 0.4 });
        const bMesh = new THREE.Mesh(bGeom, bMat);
        bMesh.position.set(x + 0.5, tileHeight + pHeight / 2, z + 0.5);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        bMesh.userData = { isInteractable: true, tileX: x, tileZ: z };
        group.add(bMesh);

        // Roof pyramid/stud cap
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
    // Deep starry midnight indigo
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.022);

    if (ambientLight) {
      ambientLight.color.setHex(0x334155);
      ambientLight.intensity = 0.6;
    }
    if (sunLight) {
      sunLight.color.setHex(0x93c5fd); // Pale moonlight
      sunLight.intensity = 0.8;
      sunLight.position.set(-15, 30, -10);
    }
  } else if (theme === 'soft_retro') {
    // Golden hour sunset retro
    scene.background = new THREE.Color(0xfef3c7);
    scene.fog = new THREE.FogExp2(0xfef3c7, 0.015);

    if (ambientLight) {
      ambientLight.color.setHex(0xffedd5);
      ambientLight.intensity = 0.9;
    }
    if (sunLight) {
      sunLight.color.setHex(0xfb923c); // Warm amber sunlight
      sunLight.intensity = 1.3;
      sunLight.position.set(30, 25, 15);
    }
  } else {
    // Default: Vibrant Pastel Dream
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
