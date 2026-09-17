import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

let cachedLegoGeometry = null;
let cachedChairGeometry = null;
let cachedTableGeometry = null;
let cachedLanternGeometry = null;
let cachedPlantGeometry = null;

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
 * Mini Interior Lego Armchair Geometry
 */
export function getLegoChairGeometry() {
  if (cachedChairGeometry) return cachedChairGeometry;

  // Seat
  const seatGeom = new THREE.BoxGeometry(0.72, 0.2, 0.72);
  seatGeom.translate(0, 0.35, 0);

  // 4 Legs
  const legGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10);
  const leg1 = legGeom.clone().translate(-0.26, 0.15, -0.26);
  const leg2 = legGeom.clone().translate(0.26, 0.15, -0.26);
  const leg3 = legGeom.clone().translate(-0.26, 0.15, 0.26);
  const leg4 = legGeom.clone().translate(0.26, 0.15, 0.26);

  // Backrest
  const backGeom = new THREE.BoxGeometry(0.72, 0.55, 0.18);
  backGeom.translate(0, 0.68, -0.27);

  // 2 Studs on top of backrest
  const stud = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 12);
  const stud1 = stud.clone().translate(-0.2, 0.98, -0.27);
  const stud2 = stud.clone().translate(0.2, 0.98, -0.27);

  const merged = mergeGeometries([seatGeom, leg1, leg2, leg3, leg4, backGeom, stud1, stud2], false);
  merged.computeVertexNormals();
  cachedChairGeometry = merged;
  return cachedChairGeometry;
}

/**
 * Mini Interior Lego Table Geometry
 */
export function getLegoTableGeometry() {
  if (cachedTableGeometry) return cachedTableGeometry;

  // Table Top
  const topGeom = new THREE.BoxGeometry(0.88, 0.16, 0.88);
  topGeom.translate(0, 0.72, 0);

  // Center Post Leg
  const postGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.65, 16);
  postGeom.translate(0, 0.32, 0);

  // Foot Stand
  const footGeom = new THREE.BoxGeometry(0.6, 0.08, 0.6);
  footGeom.translate(0, 0.04, 0);

  // 4 Studs on table corners
  const stud = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
  const s1 = stud.clone().translate(-0.26, 0.82, -0.26);
  const s2 = stud.clone().translate(0.26, 0.82, -0.26);
  const s3 = stud.clone().translate(-0.26, 0.82, 0.26);
  const s4 = stud.clone().translate(0.26, 0.82, 0.26);

  const merged = mergeGeometries([topGeom, postGeom, footGeom, s1, s2, s3, s4], false);
  merged.computeVertexNormals();
  cachedTableGeometry = merged;
  return cachedTableGeometry;
}

/**
 * Mini Glowing Amber Lantern Geometry
 */
export function getLegoLanternGeometry() {
  if (cachedLanternGeometry) return cachedLanternGeometry;

  // Lantern Base
  const baseGeom = new THREE.BoxGeometry(0.52, 0.12, 0.52);
  baseGeom.translate(0, 0.06, 0);

  // Amber Core
  const coreGeom = new THREE.BoxGeometry(0.38, 0.44, 0.38);
  coreGeom.translate(0, 0.34, 0);

  // Roof Cap
  const roofGeom = new THREE.BoxGeometry(0.52, 0.14, 0.52);
  roofGeom.translate(0, 0.62, 0);

  // Top Handle Loop
  const handleGeom = new THREE.TorusGeometry(0.12, 0.035, 8, 16);
  handleGeom.translate(0, 0.76, 0);

  const merged = mergeGeometries([baseGeom, coreGeom, roofGeom, handleGeom], false);
  merged.computeVertexNormals();
  cachedLanternGeometry = merged;
  return cachedLanternGeometry;
}

/**
 * Mini Potted Plant Geometry
 */
export function getLegoPlantGeometry() {
  if (cachedPlantGeometry) return cachedPlantGeometry;

  // Pot
  const potGeom = new THREE.CylinderGeometry(0.32, 0.22, 0.38, 14);
  potGeom.translate(0, 0.19, 0);

  // Green Plant Studs
  const leaf1 = new THREE.SphereGeometry(0.18, 10, 8);
  leaf1.translate(0, 0.46, 0);
  const leaf2 = new THREE.SphereGeometry(0.14, 8, 8);
  leaf2.translate(-0.12, 0.42, 0.1);
  const leaf3 = new THREE.SphereGeometry(0.14, 8, 8);
  leaf3.translate(0.12, 0.42, -0.08);

  const merged = mergeGeometries([potGeom, leaf1, leaf2, leaf3], false);
  merged.computeVertexNormals();
  cachedPlantGeometry = merged;
  return cachedPlantGeometry;
}

/**
 * Retrieves the geometry for any block or prop
 */
export function getGeometryForType(propId) {
  if (propId === 'lego_chair') return getLegoChairGeometry();
  if (propId === 'lego_table') return getLegoTableGeometry();
  if (propId === 'lego_lantern') return getLegoLanternGeometry();
  if (propId === 'lego_plant') return getLegoPlantGeometry();
  return getLegoBrickGeometry();
}

/**
 * Creates a plastic-like standard material for Lego bricks & props
 */
export function createLegoMaterial(color = '#ff6b8b', propId = null) {
  if (propId === 'lego_lantern') {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color('#ffb703'),
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.1,
    });
  }

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
 * Cracking Overlay Mesh for Survival 1-Second Mining Animation
 */
export function createCrackingOverlay() {
  const geom = new THREE.BoxGeometry(1.02, 1.02, 1.02);
  geom.translate(0, 0.5, 0);

  // Progressive crack wireframe lines
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geom, wireMat);
  mesh.visible = false;
  return mesh;
}

/**
 * High-Performance Instanced & Prop Voxel Manager
 */
export class LegoVoxelEngine {
  constructor(scene, maxBricks = 2500) {
    this.scene = scene;
    this.maxBricks = maxBricks;
    this.geometry = getLegoBrickGeometry();

    // Standard InstancedMesh for regular Lego blocks
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

    // Group for custom interior props (chairs, tables, glowing lanterns)
    this.propsGroup = new THREE.Group();
    this.scene.add(this.propsGroup);

    // Group for lantern point lights
    this.lightsGroup = new THREE.Group();
    this.scene.add(this.lightsGroup);

    // Map: key "${x},${y},${z}" -> brick data
    this.bricksMap = new Map();

    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();
  }

  /**
   * Syncs with world store legoBricks array
   */
  syncBricks(bricks) {
    this.bricksMap.clear();

    // Clear previous prop meshes & lantern lights
    while (this.propsGroup.children.length > 0) {
      const p = this.propsGroup.children[0];
      this.propsGroup.remove(p);
      if (p.material) p.material.dispose();
    }
    while (this.lightsGroup.children.length > 0) {
      const l = this.lightsGroup.children[0];
      this.lightsGroup.remove(l);
      if (l.dispose) l.dispose();
    }

    let standardInstanceCount = 0;

    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      const key = `${b.x},${b.y},${b.z}`;
      this.bricksMap.set(key, { ...b });

      if (b.propId) {
        // Individual custom interior prop mesh
        const propGeom = getGeometryForType(b.propId);
        const propMat = createLegoMaterial(b.color || '#ffd166', b.propId);
        const propMesh = new THREE.Mesh(propGeom, propMat);
        propMesh.position.set(b.x + 0.5, b.y, b.z + 0.5);
        propMesh.castShadow = true;
        propMesh.receiveShadow = true;
        propMesh.userData = { isInteractable: true, brickKey: key, ...b };
        this.propsGroup.add(propMesh);

        // If lantern, add a warm soft PointLight!
        if (b.propId === 'lego_lantern') {
          const pLight = new THREE.PointLight(0xffaa33, 1.8, 7.5);
          pLight.position.set(b.x + 0.5, b.y + 0.6, b.z + 0.5);
          this.lightsGroup.add(pLight);
        }
      } else {
        // Standard Lego block in InstancedMesh
        if (standardInstanceCount < this.maxBricks) {
          const idx = standardInstanceCount++;
          this.dummy.position.set(b.x + 0.5, b.y, b.z + 0.5);
          this.dummy.rotation.set(0, 0, 0);
          this.dummy.scale.set(1, 1, 1);
          this.dummy.updateMatrix();

          this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
          this.tempColor.set(b.color || '#ff6b8b');
          this.instancedMesh.setColorAt(idx, this.tempColor);
        }
      }
    }

    this.instancedMesh.count = standardInstanceCount;
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
        maxY: b.y + (b.propId ? 0.95 : 1.16),
        minZ: b.z,
        maxZ: b.z + 1,
      });
    }
    return aabbs;
  }

  dispose() {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.scene.remove(this.propsGroup);
      this.scene.remove(this.lightsGroup);
      this.geometry.dispose();
      this.material.dispose();
    }
  }
}
