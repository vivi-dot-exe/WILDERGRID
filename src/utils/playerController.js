import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;

    // Position & Physics
    this.position = new THREE.Vector3(options.spawnX || 8, 0, options.spawnZ || 8);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isGrounded = true;

    // Dimensions
    this.playerRadius = 0.35;
    this.playerHeight = 1.8;
    this.eyeHeight = 1.5;

    // Constants
    this.gravity = -24.0;
    this.jumpForce = 8.5;
    this.walkSpeed = 6.5;
    this.runSpeed = 10.5;

    // Orientation (Euler yaw & pitch)
    this.yaw = options.initialYaw !== undefined ? options.initialYaw : -0.75;
    this.pitch = options.initialPitch !== undefined ? options.initialPitch : -0.15;
    this.sensitivity = 0.0022;

    // Dynamic Zoom (1.2 to 14.0)
    // 1.2 = tight interior / first-person
    // 12.0 = expansive exterior city view
    this.targetDistance = options.initialDistance || 5.5;
    this.currentDistance = this.targetDistance;
    this.minDistance = 1.2;
    this.maxDistance = 14.0;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      run: false,
    };

    this.isLocked = false;
    this.walkCycle = 0;
    this.avatarGroup = null;

    // Bind listeners
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.onPointerLockChange = this.handlePointerLockChange.bind(this);

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  lock() {
    this.domElement.requestPointerLock?.();
  }

  unlock() {
    document.exitPointerLock?.();
  }

  handlePointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        if (this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = true;
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = false;
        break;
    }
  }

  handleMouseMove(e) {
    if (!this.isLocked) return;

    this.yaw -= e.movementX * this.sensitivity;
    this.pitch -= e.movementY * this.sensitivity;

    // Clamp pitch between roughly -85 deg and +85 deg
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.005;
    this.targetDistance = THREE.MathUtils.clamp(
      this.targetDistance + zoomDelta,
      this.minDistance,
      this.maxDistance
    );
  }

  /**
   * Set or update the 3D blocky mannequin avatar
   */
  setAvatarMesh(avatarGroup) {
    this.avatarGroup = avatarGroup;
  }

  /**
   * Main update physics, collision, and camera frame step
   */
  update(delta, colliders = []) {
    const dt = Math.min(delta, 0.1);

    // Smoothly lerp camera distance for dynamic zoom
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, this.targetDistance, dt * 10);

    // Calculate movement vector aligned with camera horizontal yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) moveDir.normalize();

    const currentSpeed = this.keys.run ? this.runSpeed : this.walkSpeed;

    // Apply horizontal velocity with snappy response
    const targetVelX = moveDir.x * currentSpeed;
    const targetVelZ = moveDir.z * currentSpeed;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, dt * 16);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, dt * 16);

    // Apply gravity
    this.velocity.y += this.gravity * dt;

    // Potential new position
    const desiredX = this.position.x + this.velocity.x * dt;
    const desiredY = this.position.y + this.velocity.y * dt;
    const desiredZ = this.position.z + this.velocity.z * dt;

    // AABB Collision with Lego block obstacles
    // 1. Move X with collision test
    this.position.x = this.resolveAxisCollision(desiredX, this.position.y, this.position.z, 'x', colliders);

    // 2. Move Z with collision test
    this.position.z = this.resolveAxisCollision(this.position.x, this.position.y, desiredZ, 'z', colliders);

    // 3. Move Y and resolve ground collision
    this.resolveVerticalCollision(desiredY, colliders);

    // Animate avatar walk cycle and position
    if (this.avatarGroup) {
      this.avatarGroup.position.copy(this.position);
      // Face towards look direction
      this.avatarGroup.rotation.y = this.yaw;

      if (isMoving && this.isGrounded) {
        this.walkCycle += dt * (this.keys.run ? 14 : 9);
      } else {
        this.walkCycle = THREE.MathUtils.lerp(this.walkCycle, 0, dt * 8);
      }

      this.animateAvatarLimbs();

      // In tight first-person interior view (< 2.0 distance), hide avatar so camera doesn't clip
      const isFirstPerson = this.currentDistance < 2.0;
      this.avatarGroup.visible = !isFirstPerson;
    }

    // Update Camera position & look target
    this.updateCamera(colliders);
  }

  resolveAxisCollision(targetX, curY, targetZ, axis, colliders) {
    const r = this.playerRadius;
    const pY = curY;
    const pHeight = this.playerHeight;

    const pMinX = targetX - r;
    const pMaxX = targetX + r;
    const pMinY = pY;
    const pMaxY = pY + pHeight;
    const pMinZ = targetZ - r;
    const pMaxZ = targetZ + r;

    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      // Check overlap in all three dimensions
      if (
        pMaxX > b.minX &&
        pMinX < b.maxX &&
        pMaxY > b.minY &&
        pMinY < b.maxY &&
        pMaxZ > b.minZ &&
        pMinZ < b.maxZ
      ) {
        // Collision occurred on this axis, revert movement
        if (axis === 'x') {
          this.velocity.x = 0;
          return this.position.x;
        } else {
          this.velocity.z = 0;
          return this.position.z;
        }
      }
    }

    return axis === 'x' ? targetX : targetZ;
  }

  resolveVerticalCollision(desiredY, colliders) {
    const r = this.playerRadius;
    const pMinX = this.position.x - r;
    const pMaxX = this.position.x + r;
    const pMinZ = this.position.z - r;
    const pMaxZ = this.position.z + r;

    let groundLevel = 0.0; // street / floor base level

    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (pMaxX > b.minX && pMinX < b.maxX && pMaxZ > b.minZ && pMinZ < b.maxZ) {
        // Block is horizontally underneath or aligned with player
        if (b.maxY <= this.position.y + 0.5) {
          groundLevel = Math.max(groundLevel, b.maxY);
        }
      }
    }

    if (desiredY <= groundLevel) {
      this.position.y = groundLevel;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = desiredY;
      this.isGrounded = false;
    }
  }

  animateAvatarLimbs() {
    if (!this.avatarGroup) return;

    const swing = Math.sin(this.walkCycle) * 0.55;
    const bob = Math.abs(Math.sin(this.walkCycle)) * 0.08;

    // Limb bone references if named
    const leftArm = this.avatarGroup.getObjectByName('leftArm');
    const rightArm = this.avatarGroup.getObjectByName('rightArm');
    const leftLeg = this.avatarGroup.getObjectByName('leftLeg');
    const rightLeg = this.avatarGroup.getObjectByName('rightLeg');
    const torso = this.avatarGroup.getObjectByName('torsoGroup');

    if (leftArm) leftArm.rotation.x = -swing;
    if (rightArm) rightArm.rotation.x = swing;
    if (leftLeg) leftLeg.rotation.x = swing;
    if (rightLeg) rightLeg.rotation.x = -swing;
    if (torso) torso.position.y = bob;
  }

  updateCamera(colliders) {
    const eyePoint = new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    // Compute look direction vector from pitch and yaw
    const lookDir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    if (this.currentDistance < 1.8) {
      // First-person view: camera placed right at the eyes
      this.camera.position.copy(eyePoint);
      const targetPoint = eyePoint.clone().add(lookDir);
      this.camera.lookAt(targetPoint);
    } else {
      // Third-person orbit view
      let cameraPos = eyePoint.clone().sub(lookDir.clone().multiplyScalar(this.currentDistance));

      // Prevent camera from dipping below ground street level
      if (cameraPos.y < 0.4) cameraPos.y = 0.4;

      this.camera.position.copy(cameraPos);
      this.camera.lookAt(eyePoint);
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}

/**
 * Builds a 3D blocky avatar mesh matching avatarConfig
 */
export function createAvatarMesh(avatarConfig) {
  const group = new THREE.Group();

  const skinColor = avatarConfig?.skinTone || '#ffd166';
  const topColor = avatarConfig?.topColor || '#ff6b8b';
  const pantsColor = avatarConfig?.pantsColor || '#2ec4b6';
  const hairColor = avatarConfig?.hairColor || '#2d3748';

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const topMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.4 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 });

  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torsoGroup';

  // Torso
  const torsoGeom = new THREE.BoxGeometry(0.55, 0.65, 0.32);
  const torsoMesh = new THREE.Mesh(torsoGeom, topMat);
  torsoMesh.position.y = 1.05;
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Head
  const headGeom = new THREE.BoxGeometry(0.38, 0.38, 0.38);
  const headMesh = new THREE.Mesh(headGeom, skinMat);
  headMesh.position.set(0, 1.55, 0);
  headMesh.castShadow = true;
  torsoGroup.add(headMesh);

  // Hair
  const hairGeom = new THREE.BoxGeometry(0.42, 0.22, 0.42);
  const hairMesh = new THREE.Mesh(hairGeom, hairMat);
  hairMesh.position.set(0, 1.7, -0.02);
  torsoGroup.add(hairMesh);

  // Left Arm (pivot at shoulder)
  const armGeom = new THREE.BoxGeometry(0.18, 0.55, 0.18);
  armGeom.translate(0, -0.22, 0);
  const leftArm = new THREE.Mesh(armGeom, topMat);
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.38, 1.3, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  // Right Arm (pivot at shoulder)
  const rightArm = new THREE.Mesh(armGeom, topMat);
  rightArm.name = 'rightArm';
  rightArm.position.set(0.38, 1.3, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Left Leg (pivot at hip)
  const legGeom = new THREE.BoxGeometry(0.22, 0.65, 0.22);
  legGeom.translate(0, -0.32, 0);
  const leftLeg = new THREE.Mesh(legGeom, pantsMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.16, 0.72, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  // Right Leg (pivot at hip)
  const rightLeg = new THREE.Mesh(legGeom, pantsMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.16, 0.72, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  group.add(torsoGroup);
  return group;
}
