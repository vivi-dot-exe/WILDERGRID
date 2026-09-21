import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, VIEW_MODES } from '../types/world';
import { LegoVoxelEngine, createGhostBrick, createCrackingOverlay } from '../utils/legoMesh';
import { PlayerController, createAvatarMesh } from '../utils/playerController';
import { multiplayerManager } from '../utils/multiplayer';
import { getThemeById, isCreativeMode } from '../types/avatar';
import { VoxelCowManager, createHarvestableTree } from '../utils/voxelEntities';
import HotbarHUD from './HotbarHUD';
import InventoryModal from './InventoryModal';
import {
  Sparkles,
  MousePointer,
  Eye,
  ZoomIn,
  ZoomOut,
  Compass,
  Volume2,
  VolumeX,
  Settings,
  ChevronDown,
  ChevronUp,
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
    soundMuted,
    mouseSensitivity,
    cameraSmoothing,
    headBobbing,
  } = useWorldStore();

  const [isLocked, setIsLocked] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [hasDismissedOverlay, setHasDismissedOverlay] = useState(false);
  const [cameraZoomLevel, setCameraZoomLevel] = useState('Exterior (3rd Person)');
  const [miningProgress, setMiningProgress] = useState(0);

  const isCreative = isCreativeMode(avatarConfig?.gameMode);

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
    renderer.shadowMap.type = THREE.PCFShadowMap;
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
      gameMode: avatarConfig?.gameMode,
      sensitivityMultiplier: mouseSensitivity,
      smoothing: cameraSmoothing,
      headBobbingEnabled: headBobbing,
      onFallDamage: (damage) => {
        worldStore.damagePlayer(damage);
      },
      onToggleFly: (flying) => {
        worldStore.setFlying(flying);
      },
      onConsumeStamina: (amount) => {
        worldStore.consumeStamina(amount);
      },
      onCycleHotbar: (direction) => {
        worldStore.cycleHotbar(direction);
      },
      onZoomChange: (dist) => {
        if (dist <= 1.35) {
          setCameraZoomLevel('1st Person View');
        } else if (dist <= 5.8) {
          setCameraZoomLevel('3rd Person (Close)');
        } else {
          setCameraZoomLevel('Panoramic Overview');
        }
      },
    });

    const avatarMesh = createAvatarMesh(avatarConfig);
    scene.add(avatarMesh);
    playerController.setAvatarMesh(avatarMesh);

    // 10. Remote Multiplayer Players Group
    const remotePlayersGroup = new THREE.Group();
    scene.add(remotePlayersGroup);
    const remoteMeshes = new Map(); // peerId -> { mesh, nameplate, leftArm, rightArm, leftLeg, rightLeg, walkCycle, targetPos, targetYaw, isMoving }

    // 11. 3D Voxel Cows Manager
    const cowManager = new VoxelCowManager(scene, 16);
    if (activeDomain === DOMAINS.EXTERIOR) {
      cowManager.spawnCows(5);
    }

    // Save into ref
    engineRef.current = {
      scene,
      camera,
      renderer,
      playerController,
      legoEngine,
      cowManager,
      ghostBrick,
      crackingOverlay,
      streetGroup,
      avatarMesh,
      remotePlayersGroup,
      remoteMeshes,
      sunLight,
      ambientLight,
      raycaster: new THREE.Raycaster(),
      screenCenter: new THREE.Vector2(0, 0),
      animationFrameId: null,
    };

    // Apply environment theme
    applyThemeEnvironment(engineRef.current, avatarConfig?.theme || 'pastel_dream');

    // Build streets from grid and get static colliders
    const currentGrid = activeDomain === DOMAINS.EXTERIOR ? exteriorGrid : interiorGrid;
    const initialColliders = rebuildStreetWorld(streetGroup, currentGrid, activeDomain, avatarConfig?.theme);
    engineRef.current.streetColliders = initialColliders;

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

    // Reusable raycast interaction logic for both locked FPS & pad drag mode
    const executeRaycastInteraction = (raycaster, button) => {
      // Collect interactable targets across chunks, voxel cows, trees, and street layout
      const targets = [];
      targets.push(...legoEngine.getInteractableObjects());
      if (engineRef.current.cowManager) {
        targets.push(...engineRef.current.cowManager.getInteractableObjects());
      }
      streetGroup.traverse((child) => {
        if (child.isMesh && child.userData?.isInteractable) {
          targets.push(child);
        }
      });

      const intersects = raycaster.intersectObjects(targets, false);
      if (intersects.length === 0) return false;

      const hit = intersects[0];

      // 1. Check for clicking / petting 3D Voxel Cows
      if (hit.object.userData?.isCow) {
        engineRef.current.cowManager?.interactWithCow(hit.object.userData.cowId);
        return true;
      }

      // 2. Check for harvesting 3D Lego Tree Wood
      if (hit.object.userData?.isWoodTrunk || hit.object.userData?.isLeaf) {
        const isCreativeActive = isCreativeMode(worldStore.getState().avatarConfig?.gameMode);
        const dropType = hit.object.userData?.woodDrop || 'brick_wood_log';

        if (button === 0 && isCreativeActive) {
          worldStore.addHotbarItemCount(dropType, 1);
          hit.object.visible = false;
          hit.object.position.y = -999;
          return true;
        } else if (button === 2) {
          if (isCreativeActive) {
            worldStore.addHotbarItemCount(dropType, 1);
            hit.object.visible = false;
            hit.object.position.y = -999;
            return true;
          } else {
            miningRef.current = {
              active: true,
              x: hit.point.x,
              y: hit.point.y,
              z: hit.point.z,
              startTime: performance.now(),
              isWoodTrunk: true,
              woodMesh: hit.object,
              woodDrop: dropType,
            };
            return true;
          }
        }
      }

      const isLegoHit =
        hit.object.userData?.isLegoChunk ||
        hit.object.userData?.brickKey ||
        hit.object === legoEngine.instancedMesh ||
        hit.object.parent === legoEngine.propsGroup;

      const currentStoreState = worldStore.getState();
      const currentSlot =
        currentStoreState.hotbarSlots[currentStoreState.selectedHotbarIndex] ||
        currentStoreState.hotbarSlots[0];
      const isCreativeModeActive = isCreativeMode(currentStoreState.avatarConfig?.gameMode);

      if (button === 0) {
        // LEFT CLICK: Place Active Hotbar Item
        if (!isCreativeModeActive && currentSlot.count <= 0) {
          return false;
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

          if (!isCreativeModeActive) {
            worldStore.consumeCurrentHotbarItem();
          }
          return true;
        }
      } else if (button === 2) {
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

          if (isCreativeModeActive) {
            worldStore.removeLegoBrick(targetX, targetY, targetZ);
          } else {
            miningRef.current = {
              active: true,
              x: targetX,
              y: targetY,
              z: targetZ,
              startTime: performance.now(),
            };
          }
          return true;
        }
      }
      return false;
    };

    const handlePointerDown = (e) => {
      if (e.target !== renderer.domElement) return;
      if (document.pointerLockElement === renderer.domElement) {
        const raycaster = engineRef.current.raycaster;
        raycaster.setFromCamera(engineRef.current.screenCenter, camera);
        executeRaycastInteraction(raycaster, e.button);
      }
    };

    const handlePointerUp = (e) => {
      if (e.button === 2 && miningRef.current.active) {
        // Cancel mining if released early
        miningRef.current.active = false;
        crackingOverlay.visible = false;
        setMiningProgress(0);
      }

      // If NOT pointer locked (Pad Drag mode / Unlocked mouse):
      if (document.pointerLockElement !== renderer.domElement) {
        // Only trigger interaction if clicking directly on the 3D canvas and not dragged
        if (e.target === renderer.domElement && !playerController.hasDragged) {
          const rect = renderer.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );
          const raycaster = engineRef.current.raycaster;
          raycaster.setFromCamera(mouse, camera);
          executeRaycastInteraction(raycaster, e.button);
        }
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

      // Block colliders from Lego engine + precomputed street architecture colliders
      const blockColliders = legoEngine.getAllBrickAABBs();
      const streetColliders = engineRef.current.streetColliders || [];

      const currentConfig = worldStore.getState().avatarConfig;
      const isSpectator =
        currentConfig?.gameMode === 'spectator' ||
        currentConfig?.gameMode === 'chronicler';

      // Spectators have no-clip flight (bypass colliders)
      playerController.update(
        delta,
        isSpectator ? [] : [...blockColliders, ...streetColliders]
      );

      // Update 3D Voxel Cows wandering & limb animations
      if (engineRef.current.cowManager) {
        engineRef.current.cowManager.update(delta, playerController.position);
      }

      // Multiplayer Live Player Movement Sync Broadcast (~25Hz)
      multiplayerManager.sendPlayerMove(
        playerController.position,
        playerController.yaw,
        playerController.isMoving,
        playerController.isFlying
      );

      // Reconcile and Interpolate Remote Players
      const remotePlayers = worldStore.getState().multiplayer.remotePlayers || {};
      const activePeerIds = Object.keys(remotePlayers);

      activePeerIds.forEach((peerId) => {
        const remoteData = remotePlayers[peerId];
        let entry = remoteMeshes.get(peerId);

        if (!entry) {
          const mesh = createAvatarMesh(remoteData.avatarConfig);
          const nameplate = createNameplateSprite(remoteData.username);
          mesh.add(nameplate);

          const startPos = remoteData.targetPosition || remoteData.position || { x: 4.5, y: 1.5, z: 4.5 };
          mesh.position.set(startPos.x, startPos.y, startPos.z);
          mesh.rotation.y = remoteData.targetYaw || remoteData.yaw || 0;

          remotePlayersGroup.add(mesh);

          entry = {
            mesh,
            nameplate,
            leftArm: mesh.getObjectByName('leftArm'),
            rightArm: mesh.getObjectByName('rightArm'),
            leftLeg: mesh.getObjectByName('leftLeg'),
            rightLeg: mesh.getObjectByName('rightLeg'),
            walkCycle: 0,
            targetPos: new THREE.Vector3(startPos.x, startPos.y, startPos.z),
            targetYaw: remoteData.targetYaw || 0,
            isMoving: false,
          };
          remoteMeshes.set(peerId, entry);
        }

        // Update target position and yaw
        if (remoteData.targetPosition) {
          entry.targetPos.set(
            remoteData.targetPosition.x,
            remoteData.targetPosition.y,
            remoteData.targetPosition.z
          );
        }
        if (remoteData.targetYaw !== undefined) {
          entry.targetYaw = remoteData.targetYaw;
        }
        entry.isMoving = !!remoteData.isMoving;

        // Smooth position interpolation (lerp)
        entry.mesh.position.lerp(entry.targetPos, Math.min(1.0, delta * 14));

        // Shortest angle yaw interpolation
        let diff = entry.targetYaw - entry.mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        entry.mesh.rotation.y += diff * Math.min(1.0, delta * 12);

        // Limb animation
        if (entry.isMoving) {
          entry.walkCycle += delta * 10;
          const swing = Math.sin(entry.walkCycle) * 0.65;
          if (entry.leftArm) entry.leftArm.rotation.x = swing;
          if (entry.rightArm) entry.rightArm.rotation.x = -swing;
          if (entry.leftLeg) entry.leftLeg.rotation.x = -swing;
          if (entry.rightLeg) entry.rightLeg.rotation.x = swing;
        } else {
          if (entry.leftArm) entry.leftArm.rotation.x = THREE.MathUtils.lerp(entry.leftArm.rotation.x, 0, delta * 10);
          if (entry.rightArm) entry.rightArm.rotation.x = THREE.MathUtils.lerp(entry.rightArm.rotation.x, 0, delta * 10);
          if (entry.leftLeg) entry.leftLeg.rotation.x = THREE.MathUtils.lerp(entry.leftLeg.rotation.x, 0, delta * 10);
          if (entry.rightLeg) entry.rightLeg.rotation.x = THREE.MathUtils.lerp(entry.rightLeg.rotation.x, 0, delta * 10);
        }
      });

      // Cleanup disconnected peers
      remoteMeshes.forEach((entry, peerId) => {
        if (!remotePlayers[peerId]) {
          remotePlayersGroup.remove(entry.mesh);
          if (entry.nameplate?.material?.map) {
            entry.nameplate.material.map.dispose();
          }
          remoteMeshes.delete(peerId);
        }
      });

      // Survival Mining 1-Second Timer & Cracking Overlay Animation
      if (miningRef.current.active) {
        const elapsed = (time - miningRef.current.startTime) / 1000;
        const progress = Math.min(1.0, elapsed);
        setMiningProgress(progress);

        if (elapsed >= 1.0) {
          // Block or harvestable tree trunk broken!
          if (miningRef.current.isWoodTrunk) {
            if (miningRef.current.woodMesh) {
              miningRef.current.woodMesh.visible = false;
              miningRef.current.woodMesh.position.y = -999;
            }
            worldStore.addHotbarItemCount(miningRef.current.woodDrop || 'brick_wood_log', 1);
          } else {
            const brickData = legoEngine.getBrickAt(
              miningRef.current.x,
              miningRef.current.y,
              miningRef.current.z
            );
            worldStore.removeLegoBrick(
              miningRef.current.x,
              miningRef.current.y,
              miningRef.current.z
            );
            // Return the broken brick or prop back to the player's hotbar
            worldStore.addHotbarItemCount(
              brickData?.propId || brickData?.color || 'brick_rose',
              1
            );
          }
          miningRef.current.active = false;
          crackingOverlay.visible = false;
          setMiningProgress(0);
        } else {
          // Animate cracks and opacity
          crackingOverlay.position.set(
            miningRef.current.x + 0.5,
            miningRef.current.y,
            miningRef.current.z + 0.5
          );
          crackingOverlay.visible = true;
          if (crackingOverlay.setProgress) {
            crackingOverlay.setProgress(progress);
          } else if (crackingOverlay.material) {
            crackingOverlay.material.opacity = Math.min(0.95, 0.25 + elapsed * 0.7);
          }
        }
      } else {
        if (crackingOverlay.visible) {
          crackingOverlay.visible = false;
        }
      }

      // Update Zoom HUD status
      if (playerController.currentDistance <= 1.35) {
        setCameraZoomLevel('1st Person View');
      } else if (playerController.currentDistance <= 5.8) {
        setCameraZoomLevel('3rd Person (Close)');
      } else {
        setCameraZoomLevel('Panoramic Overview');
      }

      // Update Ghost Placement Reticle
      if (document.pointerLockElement === renderer.domElement) {
        const raycaster = engineRef.current.raycaster;
        raycaster.setFromCamera(engineRef.current.screenCenter, camera);

        const targets = [];
        targets.push(...legoEngine.getInteractableObjects());
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

      // Active Chunk Frustum Culling for 60 FPS Laptop QA
      legoEngine.updateFrustum(camera);

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

      remoteMeshes.forEach((entry) => {
        remotePlayersGroup.remove(entry.mesh);
        if (entry.nameplate?.material?.map) {
          entry.nameplate.material.map.dispose();
        }
      });
      remoteMeshes.clear();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Creative mode flag & gameMode
  useEffect(() => {
    if (engineRef.current.playerController) {
      engineRef.current.playerController.setCreativeMode(isCreative, avatarConfig?.gameMode);
    }
  }, [isCreative, avatarConfig?.gameMode]);

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

  // Sync Grid Street Layout & Theme Environment Ground
  useEffect(() => {
    if (engineRef.current.streetGroup) {
      const currentGrid = activeDomain === DOMAINS.EXTERIOR ? exteriorGrid : interiorGrid;
      const newColliders = rebuildStreetWorld(
        engineRef.current.streetGroup,
        currentGrid,
        activeDomain,
        avatarConfig?.theme
      );
      engineRef.current.streetColliders = newColliders;

      if (engineRef.current.cowManager) {
        if (activeDomain === DOMAINS.EXTERIOR) {
          engineRef.current.cowManager.spawnCows(5);
        } else {
          engineRef.current.cowManager.clear();
        }
      }
    }
  }, [activeDomain, exteriorGrid, interiorGrid, avatarConfig?.theme]);

  // Sync cursor sensitivity and camera damping settings directly to PlayerController
  useEffect(() => {
    if (engineRef.current?.playerController) {
      engineRef.current.playerController.setSensitivityMultiplier(mouseSensitivity ?? 1.0);
      engineRef.current.playerController.setSmoothing(cameraSmoothing ?? true);
      engineRef.current.playerController.setHeadBobbing(headBobbing ?? true);
    }
  }, [mouseSensitivity, cameraSmoothing, headBobbing]);

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
            {/* Mining Progress Radial Timer (Survival Mode) */}
            {miningProgress > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <svg className="w-14 h-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="21"
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="21"
                    stroke="#f97316"
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 21}
                    strokeDashoffset={2 * Math.PI * 21 * (1 - miningProgress)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[8.5px] font-black text-white bg-black/80 px-1.5 py-0.2 rounded-full mt-14 shadow">
                  {Math.round(miningProgress * 100)}%
                </span>
              </div>
            )}

            {/* Soft Crosshair Dot with active block color */}
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg transition-transform duration-75 ${
                miningProgress > 0 ? 'scale-125 ring-2 ring-orange-500' : 'scale-100'
              }`}
              style={{ backgroundColor: activeSlot?.color || '#ff6b8b' }}
            />
            {miningProgress === 0 && (
              <div className="absolute w-8 h-8 rounded-full border border-white/50 animate-ping opacity-25" />
            )}
          </div>
        </div>
      )}

      {/* Top Left: Controls & Keybinding Helper (Collapsible for Spacious View) */}
      <div className="absolute top-28 left-4 z-20 pointer-events-auto max-w-xs select-none">
        {!isControlsExpanded ? (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsControlsExpanded(true)}
              className="tropical-glass px-3 py-1.5 rounded-2xl border border-white/80 shadow-tropical-md flex items-center space-x-2 text-slate-700 hover:text-slate-900 hover:bg-white/90 transition backdrop-blur-md"
              title="Open Controls & Shortcuts Guide"
            >
              <Sparkles className="w-3.5 h-3.5 text-tropical-coral" />
              <span className="text-xs font-bold font-fredoka">Controls & Guide</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => {
                if (isLocked) {
                  engineRef.current.playerController?.unlock();
                } else {
                  engineRef.current.playerController?.lock();
                }
              }}
              className={`text-[10px] px-2.5 py-1.5 rounded-2xl font-bold transition shadow-tropical-sm border backdrop-blur-md ${
                isLocked
                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-400/50 hover:bg-emerald-500/25'
                  : 'bg-tropical-coral/15 text-tropical-coral border-tropical-coral/40 hover:bg-tropical-coral hover:text-white'
              }`}
              title="Toggle Aim Lock / Pad Drag"
            >
              {isLocked ? 'Aim Locked' : 'Pad Drag'}
            </button>
          </div>
        ) : (
          <div className="tropical-glass p-3.5 rounded-2xl space-y-2 border border-white/80 shadow-tropical-md text-xs text-slate-700 animate-fade-in backdrop-blur-md">
            <div className="font-bold flex items-center justify-between text-slate-800">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-tropical-coral" />
                <span>3D Walk & Build</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    if (isLocked) {
                      engineRef.current.playerController?.unlock();
                    } else {
                      engineRef.current.playerController?.lock();
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition ${
                    isLocked
                      ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-400/40'
                      : 'bg-tropical-coral/15 text-tropical-coral border border-tropical-coral/30 hover:bg-tropical-coral hover:text-white'
                  }`}
                >
                  {isLocked ? 'Aim Locked' : 'Click to Lock'}
                </button>
                <button
                  onClick={() => setIsControlsExpanded(false)}
                  className="w-5 h-5 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
                  title="Collapse Guide"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
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
                <span>Walk & Bob</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
                <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  Shift
                </kbd>
                <span>Sprint FOV</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
                <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  Space
                </kbd>
                <span>Jump</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
                <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  V / F5
                </kbd>
                <span>1st / 3rd</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
                <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  Pad Pinch
                </kbd>
                <span>Zoom In/Out</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-white/60 px-2 py-1 rounded-lg">
                <kbd className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  Wheel
                </kbd>
                <span>Zoom In/Out</span>
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
              Pad: Drag to look, Pinch/scroll to zoom • Mouse: Scroll to zoom, click to lock aim.
            </div>
          </div>
        )}
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

      {/* Floating Quick Dock: Sound Toggle, Settings, Quick Zoom & Pad/Mouse (Elevated to avoid Hotbar overlap) */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-end space-y-2 pointer-events-auto select-none">
        <div className="tropical-glass px-3 py-1.5 rounded-2xl border border-white/80 shadow-tropical-md flex items-center space-x-2 text-slate-700 backdrop-blur-md">
          {/* Direct Sound Toggle Button */}
          <button
            onClick={() => worldStore.toggleSound()}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition shadow-sm border active:scale-95 ${
              soundMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={soundMuted ? 'Sound is MUTED (Click to Turn Sound ON)' : 'Sound is ON (Click to Mute)'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="hidden sm:inline">{soundMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => worldStore.toggleSettingsModal()}
            className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center space-x-1.5 transition shadow-sm border border-slate-200/80 active:scale-95"
            title="Settings: Audio, Cursor Sensitivity, Controls"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <div className="h-4 w-px bg-slate-300" />

          <button
            onClick={() => engineRef.current.playerController?.zoomIn(1.2)}
            className="w-8 h-8 rounded-xl bg-white/80 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition shadow-sm border border-slate-200/80 active:scale-95"
            title="Zoom In (Scroll up / Pinch in / Key X)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => engineRef.current.playerController?.zoomOut(1.2)}
            className="w-8 h-8 rounded-xl bg-white/80 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition shadow-sm border border-slate-200/80 active:scale-95"
            title="Zoom Out (Scroll down / Pinch out / Key Z)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300" />

          <button
            onClick={() => engineRef.current.playerController?.togglePerspective()}
            className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-emerald-500 hover:text-white text-[11px] font-bold flex items-center space-x-1.5 transition shadow-sm border border-slate-200/80 active:scale-95"
            title="Switch Perspective: 1st Person / 3rd Person (Key V / F5)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{cameraZoomLevel.split(' ')[0]}</span>
          </button>

          <div className="h-4 w-px bg-slate-300" />

          <button
            onClick={() => {
              if (isLocked) {
                engineRef.current.playerController?.unlock();
              } else {
                engineRef.current.playerController?.lock();
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition shadow-sm border active:scale-95 ${
              isLocked
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white/80 text-slate-700 hover:bg-slate-100 border-slate-200/80'
            }`}
            title="Toggle Mouse Look Lock / Pad Drag Look"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>{isLocked ? 'Aim Locked' : 'Pad Drag'}</span>
          </button>
        </div>
      </div>

      {/* Subtle Toast when unlocked after dismissing initial overlay */}
      {hasDismissedOverlay && !isLocked && !isInventoryOpen && (
        <div
          onClick={() => engineRef.current.playerController?.lock()}
          className="absolute top-20 right-4 z-20 pointer-events-auto cursor-pointer"
        >
          <div className="tropical-glass px-3 py-1.5 rounded-xl border border-white/80 shadow-md text-xs font-semibold text-slate-700 hover:bg-white flex items-center space-x-1.5 animate-fade-in">
            <MousePointer className="w-3.5 h-3.5 text-tropical-coral" />
            <span>Pad: Drag to look • Click to lock aim</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Procedurally generates the 3D base paved street, sidewalks, and environment blocks from the world grid
 */
/**
 * Builds expansive 360-unit landscape, paved roads, buildings, trees, and returns static colliders
 */
function rebuildStreetWorld(group, grid, domain, theme = 'pastel_dream') {
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
  const isCyber = theme === 'cyber_dark';
  const isSunset = theme === 'cozy_sunset';

  const streetColliders = [];

  // 1. Expansive 360x360 Ground Landscape (eliminates black void cutoff)
  const EXT_SIZE = 360;
  const groundGeom = new THREE.PlaneGeometry(EXT_SIZE, EXT_SIZE);
  groundGeom.rotateX(-Math.PI / 2);
  groundGeom.translate(gridSize / 2, -0.01, gridSize / 2);

  const groundColor = isCyber
    ? 0x070b18
    : isSunset
    ? 0x6e3d2a
    : 0x48bb78; // rich lush meadow green

  const groundMesh = new THREE.Mesh(
    groundGeom,
    new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: isCyber ? 0.9 : 0.85,
      metalness: isCyber ? 0.2 : 0.05,
    })
  );
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // In Cyber Dark mode: add an expansive glowing Tron-style cyan/purple neon grid overlay
  if (isCyber && isExterior) {
    const cyberGrid = new THREE.GridHelper(EXT_SIZE, 180, 0x00f5d4, 0x1e1b4b);
    cyberGrid.position.set(gridSize / 2, 0.01, gridSize / 2);
    group.add(cyberGrid);
  }

  // 2. Tile Materials
  const streetAsphaltMat = new THREE.MeshStandardMaterial({
    color: isCyber ? 0x0f172a : isExterior ? 0xe2e8f0 : 0xf8fafc,
    roughness: 0.7,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: isCyber ? 0x1e293b : 0xfbd2d7,
    roughness: 0.5,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: isCyber ? 0x0e2f38 : 0x57cc99,
    roughness: 0.6,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: isCyber ? 0x00f5d4 : 0x48cae4,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const woodBoardwalkMat = new THREE.MeshStandardMaterial({
    color: isCyber ? 0x334155 : 0xffd166,
    roughness: 0.6,
  });

  // 3. Iterate tiles to create paved streets, sidewalks, and buildings
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const tile = grid[r][c];
      const terrainType = String(tile?.base || tile?.terrain || '');
      const x = c;
      const z = r;

      // Distance from player spawn (4.5, 4.5)
      const distFromSpawn = Math.hypot(x - 4.5, z - 4.5);
      const isSpawnPlaza = distFromSpawn < 3.8;
      const isRoad = (r === 4 || r === 11 || c === 4 || c === 11) && isExterior;

      let tileMat = streetAsphaltMat;
      let tileHeight = 0.12;

      if (isSpawnPlaza) {
        // Central Town Plaza around player spawn: wide, open, clean, beautiful cobblestone/terrazzo
        tileMat = sidewalkMat;
        tileHeight = 0.14;
      } else if (terrainType.includes('lawn') || terrainType.includes('meadow') || terrainType.includes('grass')) {
        tileMat = grassMat;
        tileHeight = 0.14;
      } else if (terrainType.includes('pool') || terrainType.includes('water')) {
        tileMat = waterMat;
        tileHeight = 0.05;
      } else if (terrainType.includes('boardwalk') || terrainType.includes('plank') || terrainType.includes('parquet')) {
        tileMat = woodBoardwalkMat;
        tileHeight = 0.16;
      } else if (terrainType.includes('sand')) {
        tileMat = new THREE.MeshStandardMaterial({ color: isCyber ? 0x1e293b : 0xfff6ed, roughness: 0.8 });
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
      if (isRoad) {
        const lineGeom = new THREE.PlaneGeometry(0.18, 0.6);
        lineGeom.rotateX(-Math.PI / 2);
        const lineMat = new THREE.MeshBasicMaterial({ color: isCyber ? 0x00f5d4 : 0xffffff });
        const lineMesh = new THREE.Mesh(lineGeom, lineMat);
        lineMesh.position.set(x + 0.5, tileHeight + 0.01, z + 0.5);
        group.add(lineMesh);
      }

      // DO NOT spawn blocking props or trees on the Central Town Plaza or directly on road lanes
      if (isSpawnPlaza || isRoad) {
        continue;
      }

      // If tile has building prop, render blocky architecture or harvestable Lego tree
      if (tile?.prop) {
        const propId = String(typeof tile.prop === 'string' ? tile.prop : (tile.prop.id || ''));

        // Harvestable 3D Lego Oak & Palm Trees with Wood Trunks
        if (propId.includes('palm') || propId.includes('tree') || propId.includes('flora')) {
          const tree = createHarvestableTree(x + 0.5, tileHeight, z + 0.5, 3, `tree-${x}-${z}`);
          group.add(tree);
          streetColliders.push({
            minX: x + 0.15,
            maxX: x + 0.85,
            minY: 0,
            maxY: 3.2,
            minZ: z + 0.15,
            maxZ: z + 0.85,
          });
          continue;
        }

        let propColor = isCyber ? 0x7000ff : 0xff6b8b;
        let pHeight = 1.8;

        if (propId.includes('pavilion') || propId.includes('villa') || propId.includes('hotel') || propId.includes('house')) {
          pHeight = 2.4;
          propColor = isCyber ? 0x00f5d4 : 0xffd166;
        } else if (propId.includes('tower') || propId.includes('skyscraper')) {
          pHeight = 3.6;
          propColor = isCyber ? 0x3b82f6 : 0x00bbf9;
        } else if (propId.includes('wall')) {
          pHeight = 2.4;
          propColor = isCyber ? 0x1e293b : 0xffffff;
        } else if (propId.includes('terrace') || propId.includes('stairs')) {
          pHeight = 1.4;
          propColor = isCyber ? 0x8b5cf6 : 0xffa07a;
        }

        const bGeom = new THREE.BoxGeometry(0.85, pHeight, 0.85);
        const bMat = new THREE.MeshStandardMaterial({
          color: propColor,
          roughness: isCyber ? 0.2 : 0.4,
          metalness: isCyber ? 0.3 : 0.0,
          emissive: isCyber ? new THREE.Color(propColor).multiplyScalar(0.25) : new THREE.Color(0x000000),
        });
        const bMesh = new THREE.Mesh(bGeom, bMat);
        bMesh.position.set(x + 0.5, tileHeight + pHeight / 2, z + 0.5);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        bMesh.userData = { isInteractable: true, tileX: x, tileZ: z };
        group.add(bMesh);

        const roofGeom = new THREE.ConeGeometry(0.65, 0.6, 4);
        roofGeom.rotateY(Math.PI / 4);
        const roofMatLocal = new THREE.MeshStandardMaterial({
          color: isCyber ? 0x00f5d4 : 0xffffff,
          roughness: 0.3,
        });
        const roofMesh = new THREE.Mesh(roofGeom, roofMatLocal);
        roofMesh.position.set(x + 0.5, tileHeight + pHeight + 0.3, z + 0.5);
        roofMesh.castShadow = true;
        group.add(roofMesh);

        streetColliders.push({
          minX: x + 0.08,
          maxX: x + 0.92,
          minY: 0,
          maxY: pHeight,
          minZ: z + 0.08,
          maxZ: z + 0.92,
        });
      } else if (isExterior && (terrainType.includes('lawn') || terrainType.includes('meadow') || terrainType.includes('grass'))) {
        // Natural Harvestable Voxel Trees across open meadows - spaced naturally away from spawn
        const isRoadBuffer = (r >= 3 && r <= 5) || (r >= 10 && r <= 12) || (c >= 3 && c <= 5) || (c >= 10 && c <= 12);
        if (distFromSpawn >= 5.5 && !isRoadBuffer) {
          const hash = (r * 31 + c * 47) % 23;
          if (hash === 7) {
            const natTree = createHarvestableTree(x + 0.5, tileHeight, z + 0.5, 3, `tree-nat-${x}-${z}`);
            group.add(natTree);
            streetColliders.push({
              minX: x + 0.15,
              maxX: x + 0.85,
              minY: 0,
              maxY: 3.2,
              minZ: z + 0.15,
              maxZ: z + 0.85,
            });
          }
        }
      }
    }
  }

  return streetColliders;
}

/**
 * Applies dynamic skybox and atmospheric lighting according to selected theme
 */
function applyThemeEnvironment(engine, theme) {
  const { scene, sunLight, ambientLight, legoEngine } = engine;
  if (!scene) return;

  const themeObj = getThemeById(theme);
  const atmos = themeObj?.atmosphere3D;

  if (atmos) {
    scene.background = new THREE.Color(atmos.skyColor);
    // Smooth linear fog to seamlessly blend the 360-unit ground into the horizon sky
    scene.fog = new THREE.Fog(atmos.fogColor, 40, 145);

    if (ambientLight) {
      ambientLight.color.setHex(atmos.ambientColor);
      ambientLight.intensity = atmos.ambientIntensity;
    }
    if (sunLight) {
      sunLight.color.setHex(atmos.sunColor);
      sunLight.intensity = atmos.sunIntensity;
      sunLight.position.set(...atmos.sunPos);
    }
    if (legoEngine?.setThemeAtmosphere) {
      legoEngine.setThemeAtmosphere(atmos);
    }
  }
}

/**
 * Creates a high-DPI 3D billboard sprite with a stylized username plate
 */
function createNameplateSprite(username = 'Player') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background rounded pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  const r = 28;
  const x = 20, y = 20, w = 472, h = 88;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Vibrant gradient border
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();

  // Green active pulse dot
  ctx.beginPath();
  ctx.arc(x + 46, y + h / 2, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#2ec4b6';
  ctx.fill();

  // Username text
  ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const display = (username || 'Player').length > 15 ? (username || 'Player').substring(0, 14) + '…' : (username || 'Player');
  ctx.fillText(display, x + 76, y + h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.8, 0.45, 1.0);
  sprite.position.set(0, 2.3, 0);
  sprite.name = 'nameplateSprite';
  return sprite;
}

