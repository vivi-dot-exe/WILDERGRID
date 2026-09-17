import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.options = options;

    // Position & Physics
    this.position = new THREE.Vector3(options.spawnX || 4.5, 0, options.spawnZ || 4.5);
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
    this.flySpeed = 9.0;

    // Mode flags
    this.isCreative = options.isCreative ?? true;
    this.isFlying = false;
    this.lastSpaceTime = 0;
    this.fallApexY = 0;

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

  setCreativeMode(isCreative) {
    this.isCreative = isCreative;
    if (!isCreative && this.isFlying) {
      this.isFlying = false;
      this.options.onToggleFly?.(false);
    }
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
      case 'Space': {
        this.keys.jump = true;

        // Double-tap Spacebar in Creative Mode toggles Flight
        const now = performance.now();
        if (this.isCreative && now - this.lastSpaceTime < 320) {
          this.isFlying = !this.isFlying;
          this.velocity.y = 0;
          this.options.onToggleFly?.(this.isFlying);
        } else if (!this.isFlying && this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
          this.fallApexY = this.position.y;
        }
        this.lastSpaceTime = now;
        break;
      }
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
      case 'Space':
        this.keys.jump = false;
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

  setAvatarMesh(avatarGroup) {
    this.avatarGroup = avatarGroup;
  }

  /**
   * Main update physics, collision, flying, and camera frame step
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

    // Stamina consumption in survival when running
    if (this.keys.run && isMoving && !this.isCreative) {
      this.options.onConsumeStamina?.(dt * 1.6);
    }

    const currentSpeed = this.isFlying
      ? this.flySpeed
      : this.keys.run
      ? this.runSpeed
      : this.walkSpeed;

    // Apply horizontal velocity
    const targetVelX = moveDir.x * currentSpeed;
    const targetVelZ = moveDir.z * currentSpeed;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, dt * 16);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, dt * 16);

    if (this.isFlying) {
      // Creative Flight Vertical Movement
      let targetVelY = 0;
      if (this.keys.jump) targetVelY = this.flySpeed;
      if (this.keys.run) targetVelY = -this.flySpeed;
      this.velocity.y = THREE.MathUtils.lerp(this.velocity.y, targetVelY, dt * 12);
    } else {
      // Standard Gravity Physics
      this.velocity.y += this.gravity * dt;

      // Track fall apex for fall damage
      if (this.position.y > this.fallApexY) {
        this.fallApexY = this.position.y;
      }
    }

    // Desired new positions
    const desiredX = this.position.x + this.velocity.x * dt;
    const desiredY = this.position.y + this.velocity.y * dt;
    const desiredZ = this.position.z + this.velocity.z * dt;

    // AABB Collision with Lego block obstacles
    this.position.x = this.resolveAxisCollision(desiredX, this.position.y, this.position.z, 'x', colliders);
    this.position.z = this.resolveAxisCollision(this.position.x, this.position.y, desiredZ, 'z', colliders);

    if (!this.isFlying) {
      this.resolveVerticalCollision(desiredY, colliders);
    } else {
      this.position.y = Math.max(0.2, desiredY);
      this.fallApexY = this.position.y;
    }

    // Animate avatar walk cycle and position
    if (this.avatarGroup) {
      this.avatarGroup.position.copy(this.position);
      this.avatarGroup.rotation.y = this.yaw;

      if (isMoving && (this.isGrounded || this.isFlying)) {
        this.walkCycle += dt * (this.keys.run ? 14 : 9);
      } else {
        this.walkCycle = THREE.MathUtils.lerp(this.walkCycle, 0, dt * 8);
      }

      this.animateAvatarLimbs();

      // In tight first-person interior view (< 1.8 distance), hide avatar so camera doesn't clip
      const isFirstPerson = this.currentDistance < 1.8;
      this.avatarGroup.visible = !isFirstPerson;
    }

    // Update Camera position & occlude against walls
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
      if (
        pMaxX > b.minX &&
        pMinX < b.maxX &&
        pMaxY > b.minY &&
        pMinY < b.maxY &&
        pMaxZ > b.minZ &&
        pMinZ < b.maxZ
      ) {
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

    let groundLevel = 0.0;

    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (pMaxX > b.minX && pMinX < b.maxX && pMaxZ > b.minZ && pMinZ < b.maxZ) {
        if (b.maxY <= this.position.y + 0.5) {
          groundLevel = Math.max(groundLevel, b.maxY);
        }
      }
    }

    if (desiredY <= groundLevel) {
      // Landing: check fall damage in Survival Mode
      const fallDist = this.fallApexY - groundLevel;
      if (!this.isCreative && !this.isGrounded && fallDist > 3.5) {
        const dmg = Math.floor((fallDist - 3.5) * 2.5);
        if (dmg > 0) {
          this.options.onFallDamage?.(dmg);
        }
      }

      this.position.y = groundLevel;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.fallApexY = groundLevel;
    } else {
      this.position.y = desiredY;
      this.isGrounded = false;
    }
  }

  animateAvatarLimbs() {
    if (!this.avatarGroup) return;

    const swing = Math.sin(this.walkCycle) * 0.55;
    const bob = Math.abs(Math.sin(this.walkCycle)) * 0.08;

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

  /**
   * Camera position with wall occlusion raycasting to prevent clipping through interior rooms
   */
  updateCamera(colliders) {
    const eyePoint = new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    const lookDir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    if (this.currentDistance < 1.8) {
      // First-person view
      this.camera.position.copy(eyePoint);
      const targetPoint = eyePoint.clone().add(lookDir);
      this.camera.lookAt(targetPoint);
    } else {
      // Third-person orbit view with Wall Occlusion Check
      const idealCameraPos = eyePoint.clone().sub(lookDir.clone().multiplyScalar(this.currentDistance));

      // Raycast from eyePoint towards ideal camera position
      const rayDir = idealCameraPos.clone().sub(eyePoint).normalize();
      const maxDist = this.currentDistance;
      let closestDistance = maxDist;

      // Intersect ray with block bounding boxes
      for (let i = 0; i < colliders.length; i++) {
        const b = colliders[i];
        const dist = this.intersectRayAABB(eyePoint, rayDir, b);
        if (dist !== null && dist > 0.4 && dist < closestDistance) {
          closestDistance = dist;
        }
      }

      // Safe distance with padding so camera does not touch interior walls
      const actualDistance = Math.max(1.2, closestDistance - 0.25);
      const finalCameraPos = eyePoint.clone().add(rayDir.multiplyScalar(actualDistance));

      if (finalCameraPos.y < 0.4) finalCameraPos.y = 0.4;

      this.camera.position.copy(finalCameraPos);
      this.camera.lookAt(eyePoint);
    }
  }

  /**
   * Helper: Ray-AABB intersection distance
   */
  intersectRayAABB(origin, dir, box) {
    let tmin = (box.minX - origin.x) / (dir.x || 1e-6);
    let tmax = (box.maxX - origin.x) / (dir.x || 1e-6);
    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (box.minY - origin.y) / (dir.y || 1e-6);
    let tymax = (box.maxY - origin.y) / (dir.y || 1e-6);
    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if (tmin > tymax || tymin > tmax) return null;
    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (box.minZ - origin.z) / (dir.z || 1e-6);
    let tzmax = (box.maxZ - origin.z) / (dir.z || 1e-6);
    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

    if (tmin > tzmax || tzmin > tmax) return null;
    if (tzmin > tmin) tmin = tzmin;

    return tmin >= 0 ? tmin : null;
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
