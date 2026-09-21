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
 * Mini Pastel Bookshelf Geometry
 */
export function getLegoBookshelfGeometry() {
  const shelfGeom = new THREE.BoxGeometry(0.85, 0.08, 0.38);
  const shelf1 = shelfGeom.clone().translate(0, 0.04, 0);
  const shelf2 = shelfGeom.clone().translate(0, 0.48, 0);
  const shelf3 = shelfGeom.clone().translate(0, 0.92, 0);

  // Side pillars
  const pillarGeom = new THREE.BoxGeometry(0.08, 0.96, 0.38);
  const leftPillar = pillarGeom.clone().translate(-0.4, 0.48, 0);
  const rightPillar = pillarGeom.clone().translate(0.4, 0.48, 0);

  // Books row on middle shelf
  const bookGeom = new THREE.BoxGeometry(0.55, 0.34, 0.28);
  bookGeom.translate(0, 0.69, 0);

  // 2 Top Studs
  const stud = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
  const s1 = stud.clone().translate(-0.25, 1.01, 0);
  const s2 = stud.clone().translate(0.25, 1.01, 0);

  const merged = mergeGeometries([shelf1, shelf2, shelf3, leftPillar, rightPillar, bookGeom, s1, s2], false);
  merged.computeVertexNormals();
  return merged;
}

/**
 * Mini Cozy Armchair / Sofa Geometry
 */
export function getLegoSofaGeometry() {
  // Main seat cushion
  const seatGeom = new THREE.BoxGeometry(0.88, 0.24, 0.72);
  seatGeom.translate(0, 0.28, 0.02);

  // Back cushion
  const backGeom = new THREE.BoxGeometry(0.88, 0.52, 0.22);
  backGeom.translate(0, 0.62, -0.25);

  // Armrests
  const armGeom = new THREE.BoxGeometry(0.18, 0.42, 0.68);
  const armL = armGeom.clone().translate(-0.44, 0.46, 0.02);
  const armR = armGeom.clone().translate(0.44, 0.46, 0.02);

  // Base feet
  const footGeom = new THREE.BoxGeometry(0.86, 0.14, 0.7);
  footGeom.translate(0, 0.07, 0);

  // Studs on armrests
  const stud = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
  const st1 = stud.clone().translate(-0.44, 0.71, 0.15);
  const st2 = stud.clone().translate(0.44, 0.71, 0.15);

  const merged = mergeGeometries([seatGeom, backGeom, armL, armR, footGeom, st1, st2], false);
  merged.computeVertexNormals();
  return merged;
}

/**
 * Patchwork Mini Bed Geometry
 */
export function getLegoBedGeometry() {
  // Wooden frame
  const frameGeom = new THREE.BoxGeometry(0.88, 0.18, 0.96);
  frameGeom.translate(0, 0.09, 0);

  // Mattress
  const mattressGeom = new THREE.BoxGeometry(0.82, 0.22, 0.90);
  mattressGeom.translate(0, 0.26, -0.01);

  // Headboard
  const headboard = new THREE.BoxGeometry(0.88, 0.58, 0.14);
  headboard.translate(0, 0.38, -0.42);

  // Fluffy Pillow
  const pillow = new THREE.BoxGeometry(0.65, 0.12, 0.26);
  pillow.translate(0, 0.42, -0.24);

  // 2 Headboard studs
  const stud = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
  const s1 = stud.clone().translate(-0.28, 0.71, -0.42);
  const s2 = stud.clone().translate(0.28, 0.71, -0.42);

  const merged = mergeGeometries([frameGeom, mattressGeom, headboard, pillow, s1, s2], false);
  merged.computeVertexNormals();
  return merged;
}

/**
 * Standing Floor Lamp Geometry
 */
export function getLegoLampGeometry() {
  // Base plate
  const baseGeom = new THREE.CylinderGeometry(0.32, 0.35, 0.08, 16);
  baseGeom.translate(0, 0.04, 0);

  // Tall Pole
  const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.92, 12);
  poleGeom.translate(0, 0.54, 0);

  // Lamp Shade
  const shadeGeom = new THREE.ConeGeometry(0.28, 0.34, 16, 1, true);
  shadeGeom.translate(0, 0.96, 0);

  // Glowing bulb
  const bulbGeom = new THREE.SphereGeometry(0.12, 10, 10);
  bulbGeom.translate(0, 0.94, 0);

  const merged = mergeGeometries([baseGeom, poleGeom, shadeGeom, bulbGeom], false);
  merged.computeVertexNormals();
  return merged;
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
  if (propId === 'lego_bookshelf') return getLegoBookshelfGeometry();
  if (propId === 'lego_sofa') return getLegoSofaGeometry();
  if (propId === 'lego_bed') return getLegoBedGeometry();
  if (propId === 'lego_lamp') return getLegoLampGeometry();
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
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.1,
    });
  }

  if (propId === 'lego_lamp') {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color('#ffd166'),
      emissiveIntensity: 0.85,
      roughness: 0.25,
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
  const group = new THREE.Group();
  const geom = new THREE.BoxGeometry(1.03, 1.03, 1.03);
  geom.translate(0, 0.5, 0);

  // Outer dark crack wireframe box
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x111111,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const wireMesh = new THREE.Mesh(geom, wireMat);
  group.add(wireMesh);

  // Red/coral stress flash overlay
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xff3b30,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const flashMesh = new THREE.Mesh(geom, flashMat);
  group.add(flashMesh);

  group.visible = false;
  group.material = wireMat;
  group.flashMaterial = flashMat;

  // Helper method to set progress (0.0 to 1.0)
  group.setProgress = (p) => {
    wireMat.opacity = Math.min(0.95, 0.2 + p * 0.75);
    flashMat.opacity = Math.min(0.35, p * 0.35);
  };

  return group;
}

// Spatial Chunk Size (8x8 bricks per chunk)
const CHUNK_SIZE = 8;

/**
 * Represents an 8x8 spatial chunk of Lego bricks & props with localized InstancedMesh and bounding box
 */
class LegoChunk {
  constructor(scene, chunkX, chunkZ, geometry, material) {
    this.scene = scene;
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.geometry = geometry;
    this.material = material;
    this.maxInstances = 512;

    this.group = new THREE.Group();
    this.group.name = `chunk_${chunkX}_${chunkZ}`;

    this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxInstances);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.count = 0;
    this.instancedMesh.frustumCulled = true;
    this.instancedMesh.userData = { isInteractable: true, isLegoChunk: true, chunk: this };
    this.group.add(this.instancedMesh);

    this.propsGroup = new THREE.Group();
    this.group.add(this.propsGroup);

    this.lightsGroup = new THREE.Group();
    this.group.add(this.lightsGroup);

    this.scene.add(this.group);

    this.bricks = [];
    this.boundingBox = new THREE.Box3();
    this.boundingSphere = new THREE.Sphere();
    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();
    this.visible = true;
  }

  addBrick(brick) {
    this.bricks.push(brick);
  }

  clear() {
    this.bricks = [];
    this.instancedMesh.count = 0;
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
  }

  rebuild() {
    // Clear props & lights
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

    let stdCount = 0;
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      min.x = Math.min(min.x, b.x);
      min.y = Math.min(min.y, b.y);
      min.z = Math.min(min.z, b.z);
      max.x = Math.max(max.x, b.x + 1);
      max.y = Math.max(max.y, b.y + 1.25);
      max.z = Math.max(max.z, b.z + 1);

      if (b.propId) {
        const propGeom = getGeometryForType(b.propId);
        const propMat = createLegoMaterial(b.color || '#ffd166', b.propId);
        const propMesh = new THREE.Mesh(propGeom, propMat);
        propMesh.position.set(b.x + 0.5, b.y, b.z + 0.5);
        propMesh.castShadow = true;
        propMesh.receiveShadow = true;
        propMesh.userData = { isInteractable: true, brickKey: `${b.x},${b.y},${b.z}`, ...b };
        this.propsGroup.add(propMesh);

        if (b.propId === 'lego_lantern') {
          const pLight = new THREE.PointLight(0xffaa33, 1.8, 7.5);
          pLight.position.set(b.x + 0.5, b.y + 0.6, b.z + 0.5);
          this.lightsGroup.add(pLight);
        } else if (b.propId === 'lego_lamp') {
          const pLight = new THREE.PointLight(0xffedd5, 1.6, 6.5);
          pLight.position.set(b.x + 0.5, b.y + 0.95, b.z + 0.5);
          this.lightsGroup.add(pLight);
        }
      } else {
        if (stdCount < this.maxInstances) {
          const idx = stdCount++;
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

    this.instancedMesh.count = stdCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    if (this.bricks.length > 0) {
      this.boundingBox.set(min, max);
      this.boundingBox.getBoundingSphere(this.boundingSphere);
    } else {
      this.boundingBox.makeEmpty();
    }
  }

  setVisible(visible) {
    if (this.visible === visible) return;
    this.visible = visible;
    this.group.visible = visible;
  }

  dispose() {
    this.clear();
    this.scene.remove(this.group);
    this.instancedMesh.dispose();
  }
}

/**
 * High-Performance Chunked & Frustum-Culled Lego Voxel Engine (60 FPS QA)
 */
export class LegoVoxelEngine {
  constructor(scene, maxBricks = 4000) {
    this.scene = scene;
    this.geometry = getLegoBrickGeometry();

    // Standard material with theme stud glow capability
    this.material = new THREE.MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.08,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0,
    });

    this.chunks = new Map(); // key: "cx,cz" -> LegoChunk
    this.bricksMap = new Map(); // key: "x,y,z" -> brick

    // Backwards compatibility references
    this.instancedMesh = null;
    this.propsGroup = new THREE.Group();

    // Reusable frustum testing objects
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
  }

  getOrCreateChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (!this.chunks.has(key)) {
      const chunk = new LegoChunk(this.scene, cx, cz, this.geometry, this.material);
      this.chunks.set(key, chunk);
      if (!this.instancedMesh) {
        this.instancedMesh = chunk.instancedMesh;
      }
    }
    return this.chunks.get(key);
  }

  /**
   * Syncs with world store legoBricks array using spatial 8x8 chunking
   */
  syncBricks(bricks) {
    this.bricksMap.clear();
    this.chunks.forEach((chunk) => chunk.clear());

    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      const key = `${b.x},${b.y},${b.z}`;
      this.bricksMap.set(key, { ...b });

      const cx = Math.floor(b.x / CHUNK_SIZE);
      const cz = Math.floor(b.z / CHUNK_SIZE);
      const chunk = this.getOrCreateChunk(cx, cz);
      chunk.addBrick(b);
    }

    this.chunks.forEach((chunk) => chunk.rebuild());
  }

  /**
   * Active Frustum Culling: skips rendering chunks outside camera view with safe margin
   */
  updateFrustum(camera) {
    if (!camera) return;
    camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

    const marginBox = new THREE.Box3();

    this.chunks.forEach((chunk) => {
      if (chunk.bricks.length === 0) {
        chunk.setVisible(false);
        return;
      }
      marginBox.copy(chunk.boundingBox).expandByScalar(2.5);
      const inView = this.frustum.intersectsBox(marginBox);
      chunk.setVisible(inView);
    });
  }

  /**
   * Updates stud emissive glow and material parameters to match active theme
   */
  setThemeAtmosphere(atmosphere3D) {
    if (!atmosphere3D) return;
    if (atmosphere3D.studEmissive !== undefined) {
      this.material.emissive.setHex(atmosphere3D.studEmissive);
      this.material.emissiveIntensity = atmosphere3D.studEmissiveIntensity || 0.0;
      this.material.needsUpdate = true;
    }
  }

  /**
   * Collects all active interactable meshes across chunks for raycasting
   */
  getInteractableObjects() {
    const targets = [];
    this.chunks.forEach((chunk) => {
      if (chunk.visible) {
        if (chunk.instancedMesh.count > 0) {
          targets.push(chunk.instancedMesh);
        }
        if (chunk.propsGroup.children.length > 0) {
          chunk.propsGroup.children.forEach((c) => targets.push(c));
        }
      }
    });
    return targets;
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
    this.chunks.forEach((chunk) => chunk.dispose());
    this.chunks.clear();
    this.geometry.dispose();
    this.material.dispose();
  }
}

