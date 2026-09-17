import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

let cachedLegoGeometry = null;

/**
 * Creates or returns the cached Lego Brick BufferGeometry:
 * - 1x1x1 unit base cube (0.98 x 0.98 x 0.98 to give crisp Lego block seams)
 * - Cylindrical stud on the top (+Y face)
 */
export function getLegoBrickGeometry() {
  if (cachedLegoGeometry) return cachedLegoGeometry;

  // Base cube
  const boxGeom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
  boxGeom.translate(0, 0.49, 0); // Bottom sits at y = 0, top at y = 0.98

  // Top stud cylinder
  const studRadius = 0.26;
  const studHeight = 0.16;
  const studGeom = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 20);
  studGeom.translate(0, 0.98 + studHeight / 2, 0); // Sits centered right on top (+Y face)

  // Merge into a single performant BufferGeometry
  const merged = mergeGeometries([boxGeom, studGeom], false);
  merged.computeVertexNormals();
  cachedLegoGeometry = merged;

  return cachedLegoGeometry;
}

/**
 * Creates a plastic-like standard material for Lego bricks
 */
export function createLegoMaterial(color = '#ff6b8b') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.28,
    metalness: 0.08,
    envMapIntensity: 0.8,
  });
}

/**
 * Ghost/Hologram brick for placement preview
 */
export function createGhostBrick() {
  const geom = getLegoBrickGeometry();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00f5d4,
    transparent: true,
    opacity: 0.55,
    wireframe: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.visible = false;

  // Add wireframe outline cage for high clarity
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.0, 1.0, 1.0));
  edges.translate(0, 0.5, 0);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const wire = new THREE.LineSegments(edges, lineMat);
  mesh.add(wire);

  return mesh;
}

/**
 * High-Performance Instanced Lego Voxel Manager
 */
export class LegoVoxelEngine {
  constructor(scene, maxBricks = 2500) {
    this.scene = scene;
    this.maxBricks = maxBricks;
    this.geometry = getLegoBrickGeometry();

    // Shared material supporting instanced colors
    this.material = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.05,
    });

    this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, maxBricks);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.count = 0;
    this.scene.add(this.instancedMesh);

    // Bricks map: key "${x},${y},${z}" -> { x, y, z, color, instanceId }
    this.bricksMap = new Map();

    // Reusable dummy object for setting transformation matrices
    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();
  }

  /**
   * Syncs with world store legoBricks array
   */
  syncBricks(bricks) {
    this.bricksMap.clear();
    const count = Math.min(bricks.length, this.maxBricks);
    this.instancedMesh.count = count;

    for (let i = 0; i < count; i++) {
      const b = bricks[i];
      const key = `${b.x},${b.y},${b.z}`;
      this.bricksMap.set(key, { ...b, instanceId: i });

      this.dummy.position.set(b.x + 0.5, b.y, b.z + 0.5);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.tempColor.set(b.color || '#ff6b8b');
      this.instancedMesh.setColorAt(i, this.tempColor);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  hasBrickAt(x, y, z) {
    return this.bricksMap.has(`${x},${y},${z}`);
  }

  getBrickAt(x, y, z) {
    return this.bricksMap.get(`${x},${y},${z}`);
  }

  getAllBrickAABBs() {
    const aabbs = [];
    for (const b of this.bricksMap.values()) {
      aabbs.push({
        minX: b.x,
        maxX: b.x + 1,
        minY: b.y,
        maxY: b.y + 1.16, // including top stud
        minZ: b.z,
        maxZ: b.z + 1,
      });
    }
    return aabbs;
  }

  dispose() {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.geometry.dispose();
      this.material.dispose();
    }
  }
}
