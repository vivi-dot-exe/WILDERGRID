import * as THREE from 'three';
import { soundManager } from './sound';
import { worldStore } from '../store/useWorldStore';

/**
 * Creates a blocky 3D Minecraft/Lego style Cow
 */
export function createVoxelCow(x, y, z, id = 'cow-1') {
  const cowGroup = new THREE.Group();
  cowGroup.name = id;
  cowGroup.position.set(x, y, z);

  // Materials
  const cowWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5,
    roughness: 0.7,
  });

  const cowSpotMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.6,
  });

  const snoutMat = new THREE.MeshStandardMaterial({
    color: 0xfbcfe8,
    roughness: 0.5,
  });

  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.4,
  });

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const hoofMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  // 1. Torso / Body (L: 1.1, H: 0.75, W: 0.7)
  const bodyGeom = new THREE.BoxGeometry(0.7, 0.7, 1.1);
  const bodyMesh = new THREE.Mesh(bodyGeom, cowWhiteMat);
  bodyMesh.position.set(0, 0.75, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  cowGroup.add(bodyMesh);

  // Decorative Black Spots on Torso
  const spotGeom1 = new THREE.BoxGeometry(0.71, 0.35, 0.4);
  const spotMesh1 = new THREE.Mesh(spotGeom1, cowSpotMat);
  spotMesh1.position.set(0, 0.8, -0.15);
  cowGroup.add(spotMesh1);

  const spotGeom2 = new THREE.BoxGeometry(0.71, 0.25, 0.3);
  const spotMesh2 = new THREE.Mesh(spotGeom2, cowSpotMat);
  spotMesh2.position.set(0, 0.68, 0.28);
  cowGroup.add(spotMesh2);

  // Pink Udder underneath
  const udderGeom = new THREE.BoxGeometry(0.3, 0.15, 0.35);
  const udderMesh = new THREE.Mesh(udderGeom, snoutMat);
  udderMesh.position.set(0, 0.35, 0.22);
  cowGroup.add(udderMesh);

  // 2. Head Pivot Group (allows grazing head-dip)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.9, -0.6);

  const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
  const headMesh = new THREE.Mesh(headGeom, cowWhiteMat);
  headMesh.position.set(0, 0.05, -0.15);
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  // Snout
  const snoutGeom = new THREE.BoxGeometry(0.36, 0.22, 0.2);
  const snoutMesh = new THREE.Mesh(snoutGeom, snoutMat);
  snoutMesh.position.set(0, -0.05, -0.4);
  headPivot.add(snoutMesh);

  // Nostrils
  const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x831843 });
  const nostrilL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), nostrilMat);
  nostrilL.position.set(-0.09, -0.04, -0.51);
  const nostrilR = nostrilL.clone();
  nostrilR.position.x = 0.09;
  headPivot.add(nostrilL);
  headPivot.add(nostrilR);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
  eyeL.position.set(-0.25, 0.12, -0.32);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.25;
  headPivot.add(eyeL);
  headPivot.add(eyeR);

  // Horns
  const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), hornMat);
  hornL.position.set(-0.22, 0.35, -0.12);
  hornL.rotation.z = -0.2;
  const hornR = hornL.clone();
  hornR.position.x = 0.22;
  hornR.rotation.z = 0.2;
  headPivot.add(hornL);
  headPivot.add(hornR);

  // Ears
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.06), cowWhiteMat);
  earL.position.set(-0.31, 0.18, -0.1);
  const earR = earL.clone();
  earR.position.x = 0.31;
  headPivot.add(earL);
  headPivot.add(earR);

  cowGroup.add(headPivot);

  // 3. Four Walking Legs with Hooves
  const legGeom = new THREE.BoxGeometry(0.2, 0.45, 0.2);
  legGeom.translate(0, -0.225, 0); // pivot at top of leg

  const legFL = new THREE.Mesh(legGeom, cowWhiteMat);
  legFL.position.set(-0.22, 0.45, -0.35);
  legFL.castShadow = true;

  const hoofFL = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.1, 0.205), hoofMat);
  hoofFL.position.set(0, -0.4, 0);
  legFL.add(hoofFL);

  const legFR = legFL.clone();
  legFR.position.x = 0.22;

  const legBL = legFL.clone();
  legBL.position.set(-0.22, 0.45, 0.35);

  const legBR = legFL.clone();
  legBR.position.set(0.22, 0.45, 0.35);

  cowGroup.add(legFL);
  cowGroup.add(legFR);
  cowGroup.add(legBL);
  cowGroup.add(legBR);

  // 4. Tail
  const tailGeom = new THREE.BoxGeometry(0.08, 0.35, 0.08);
  const tailMesh = new THREE.Mesh(tailGeom, cowSpotMat);
  tailMesh.position.set(0, 0.6, 0.58);
  tailMesh.rotation.x = 0.25;
  cowGroup.add(tailMesh);

  // Interaction flag
  cowGroup.traverse((child) => {
    if (child.isMesh) {
      child.userData = {
        isCow: true,
        cowId: id,
        isInteractable: true,
      };
    }
  });

  return {
    group: cowGroup,
    headPivot,
    legFL,
    legFR,
    legBL,
    legBR,
    tailMesh,
    posX: x,
    posZ: z,
    targetX: x,
    targetZ: z,
    yaw: 0,
    targetYaw: 0,
    walkCycle: 0,
    state: 'idle', // 'idle' | 'walking' | 'grazing'
    stateTimer: Math.random() * 3 + 2,
    grazePhase: 0,
  };
}

/**
 * Manager handling multiple 3D cows roaming the world
 */
export class VoxelCowManager {
  constructor(scene, bounds = 16) {
    this.scene = scene;
    this.bounds = bounds;
    this.cows = [];
    this.cowGroup = new THREE.Group();
    this.cowGroup.name = 'VoxelCowsGroup';
    this.scene.add(this.cowGroup);
  }

  spawnCows(count = 4) {
    this.clear();
    const spawnPositions = [
      { x: 1.5, z: 1.5 },
      { x: 8.5, z: 1.5 },
      { x: 13.5, z: 6.5 },
      { x: 2.0, z: 13.0 },
      { x: 12.5, z: 12.5 },
      { x: 9.0, z: 13.5 },
    ];

    for (let i = 0; i < count; i++) {
      const pos = spawnPositions[i % spawnPositions.length];
      const cowData = createVoxelCow(
        pos.x + (Math.random() - 0.5) * 1.5,
        0.14,
        pos.z + (Math.random() - 0.5) * 1.5,
        `cow-${i + 1}`
      );
      this.cows.push(cowData);
      this.cowGroup.add(cowData.group);
    }
  }

  update(delta, playerPos) {
    for (const cow of this.cows) {
      cow.stateTimer -= delta;

      // State machine
      if (cow.stateTimer <= 0) {
        const rand = Math.random();
        if (rand < 0.45) {
          // Walk to a new nearby meadow spot
          cow.state = 'walking';
          cow.stateTimer = Math.random() * 4 + 2;
          cow.targetX = Math.max(1.5, Math.min(this.bounds - 1.5, cow.posX + (Math.random() - 0.5) * 5));
          cow.targetZ = Math.max(1.5, Math.min(this.bounds - 1.5, cow.posZ + (Math.random() - 0.5) * 5));

          const dx = cow.targetX - cow.posX;
          const dz = cow.targetZ - cow.posZ;
          cow.targetYaw = Math.atan2(dx, dz);
        } else if (rand < 0.8) {
          cow.state = 'grazing';
          cow.stateTimer = Math.random() * 3 + 2;
        } else {
          cow.state = 'idle';
          cow.stateTimer = Math.random() * 3 + 1.5;
        }
      }

      // Handle States
      if (cow.state === 'walking') {
        const dx = cow.targetX - cow.posX;
        const dz = cow.targetZ - cow.posZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.15) {
          const moveSpeed = 1.2 * delta;
          cow.posX += (dx / dist) * Math.min(dist, moveSpeed);
          cow.posZ += (dz / dist) * Math.min(dist, moveSpeed);
          cow.group.position.x = cow.posX;
          cow.group.position.z = cow.posZ;

          // Leg swing animation
          cow.walkCycle += delta * 7;
          const swing = Math.sin(cow.walkCycle) * 0.55;
          cow.legFL.rotation.x = swing;
          cow.legBR.rotation.x = swing;
          cow.legFR.rotation.x = -swing;
          cow.legBL.rotation.x = -swing;
        } else {
          cow.state = 'idle';
          cow.stateTimer = Math.random() * 2 + 1;
        }
      } else {
        // Reset legs gently
        cow.legFL.rotation.x = THREE.MathUtils.lerp(cow.legFL.rotation.x, 0, delta * 8);
        cow.legFR.rotation.x = THREE.MathUtils.lerp(cow.legFR.rotation.x, 0, delta * 8);
        cow.legBL.rotation.x = THREE.MathUtils.lerp(cow.legBL.rotation.x, 0, delta * 8);
        cow.legBR.rotation.x = THREE.MathUtils.lerp(cow.legBR.rotation.x, 0, delta * 8);
      }

      // Smooth yaw rotation
      let diff = cow.targetYaw - cow.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      cow.group.rotation.y += diff * Math.min(1.0, delta * 4);

      // Head Grazing or idle bobbing
      if (cow.state === 'grazing') {
        cow.grazePhase += delta * 2.5;
        cow.headPivot.rotation.x = 0.45 + Math.sin(cow.grazePhase) * 0.15;
      } else {
        cow.headPivot.rotation.x = THREE.MathUtils.lerp(cow.headPivot.rotation.x, 0, delta * 6);
      }

      // Tail gentle wag
      if (cow.tailMesh) {
        cow.tailMesh.rotation.z = Math.sin(performance.now() * 0.003 + cow.posX) * 0.15;
      }
    }
  }

  interactWithCow(cowId) {
    const cow = this.cows.find((c) => c.group.name === cowId);
    if (!cow) return;

    soundManager.playPlaceTile('meadow');

    // Bounce cow in excitement
    cow.group.position.y = 0.35;
    setTimeout(() => {
      if (cow.group) cow.group.position.y = 0.14;
    }, 200);

    // Give player experience / friendly greeting in activity logs
    worldStore.addHotbarItemCount('brick_wood_plank', 1);
  }

  getInteractableObjects() {
    const objects = [];
    this.cowGroup.traverse((child) => {
      if (child.isMesh && child.userData?.isCow) {
        objects.push(child);
      }
    });
    return objects;
  }

  clear() {
    while (this.cowGroup.children.length > 0) {
      const child = this.cowGroup.children[0];
      this.cowGroup.remove(child);
      child.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
          else c.material.dispose();
        }
      });
    }
    this.cows = [];
  }
}

/**
 * Creates a Harvestable Minecraft-style Lego Oak/Palm Tree
 * Trunk blocks drop Wood Logs when mined!
 */
export function createHarvestableTree(x, y, z, height = 3, id = 'tree-1') {
  const treeGroup = new THREE.Group();
  treeGroup.name = id;
  treeGroup.position.set(x, y, z);

  // Wood Trunk Material (rich Lego wood brown)
  const woodLogMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,
    roughness: 0.85,
  });

  // Green Foliage Material (vibrant Lego leaf green)
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.5,
  });

  const leafTopMat = new THREE.MeshStandardMaterial({
    color: 0x52b788,
    roughness: 0.45,
  });

  // 1. Stacked Wood Log Trunk Blocks (each block is 1x1x1)
  for (let h = 0; h < height; h++) {
    const trunkGeom = new THREE.BoxGeometry(0.82, 0.98, 0.82);
    const trunkMesh = new THREE.Mesh(trunkGeom, woodLogMat);
    trunkMesh.position.set(0, h + 0.5, 0);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    // Top Stud for Lego look
    const studGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12);
    const studMesh = new THREE.Mesh(studGeom, woodLogMat);
    studMesh.position.set(0, 0.53, 0);
    trunkMesh.add(studMesh);

    // Harvestable Wood metadata
    trunkMesh.userData = {
      isWoodTrunk: true,
      isInteractable: true,
      woodDrop: 'brick_wood_log',
      treeId: id,
      trunkHeightIndex: h,
    };

    treeGroup.add(trunkMesh);
  }

  // 2. Leafy Canopy Box Layers
  const canopyBase = height;

  // Broad lower leaf layer (3x3 blocks wide)
  const leavesLowerGeom = new THREE.BoxGeometry(2.4, 0.9, 2.4);
  const leavesLower = new THREE.Mesh(leavesLowerGeom, leafMat);
  leavesLower.position.set(0, canopyBase + 0.45, 0);
  leavesLower.castShadow = true;
  leavesLower.receiveShadow = true;
  leavesLower.userData = { isInteractable: true, isLeaf: true, woodDrop: 'brick_wood_plank' };
  treeGroup.add(leavesLower);

  // Middle leaf layer (2x2)
  const leavesMidGeom = new THREE.BoxGeometry(1.8, 0.85, 1.8);
  const leavesMid = new THREE.Mesh(leavesMidGeom, leafTopMat);
  leavesMid.position.set(0, canopyBase + 1.2, 0);
  leavesMid.castShadow = true;
  leavesMid.userData = { isInteractable: true, isLeaf: true, woodDrop: 'brick_wood_plank' };
  treeGroup.add(leavesMid);

  // Crown leaf block (1x1)
  const leavesTopGeom = new THREE.BoxGeometry(1.0, 0.6, 1.0);
  const leavesTop = new THREE.Mesh(leavesTopGeom, leafTopMat);
  leavesTop.position.set(0, canopyBase + 1.8, 0);
  leavesTop.castShadow = true;
  leavesTop.userData = { isInteractable: true, isLeaf: true, woodDrop: 'brick_wood_plank' };
  treeGroup.add(leavesTop);

  return treeGroup;
}
