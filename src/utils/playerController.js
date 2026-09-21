import * as THREE from 'three';
import { soundManager } from './sound.js';

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
    this.gameMode = options.gameMode || 'creative';
    this.flySpeed = (this.gameMode === 'architect' || this.gameMode === 'blueprint') ? 14.5 : 9.0;

    // Mode flags
    this.isCreative = options.isCreative ?? true;
    this.isFlying = (this.gameMode === 'spectator' || this.gameMode === 'chronicler');
    this.lastSpaceTime = 0;
    this.fallApexY = 0;

    // Orientation (Euler yaw & pitch) with Butter-Smooth Damping & Adjustable Sensitivity
    this.yaw = options.initialYaw !== undefined ? options.initialYaw : -0.75;
    this.pitch = options.initialPitch !== undefined ? options.initialPitch : -0.15;
    this.targetYaw = this.yaw;
    this.targetPitch = this.pitch;
    this.sensitivity = 0.0020;
    this.sensitivityMultiplier = options.sensitivityMultiplier || 1.0;
    this.smoothing = options.smoothing ?? 0.82;
    this.headBobbingEnabled = options.headBobbingEnabled ?? true;

    // Dynamic Zoom (1.0 = first person, 16.0 = wide panoramic overview)
    this.targetDistance = options.initialDistance || 5.5;
    this.currentDistance = this.targetDistance;
    this.minDistance = 1.0;
    this.maxDistance = 16.0;
    this.smoothDist = this.targetDistance;

    // Head-bobbing & Walking Dynamics
    this.headBobOffset = new THREE.Vector3(0, 0, 0);
    this.lastStepSin = 0;
    this.landingDip = 0;

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
    this.isMoving = false;

    // Pad / Pointer Drag-to-Look state
    this.isPointerDown = false;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.hasDragged = false;

    // Touch / Pad Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.hasTouchDragged = false;
    this.touchPinchStartDist = null;

    // Bind listeners
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.onPointerLockChange = this.handlePointerLockChange.bind(this);

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);

    // Canvas pointer and wheel listeners for both Pad & Mouse
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch listeners for mobile/tablets/touchpads
    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);
  }

  setCreativeMode(isCreative, gameMode) {
    this.isCreative = isCreative;
    if (gameMode) {
      this.gameMode = gameMode;
      this.flySpeed = (gameMode === 'architect' || gameMode === 'blueprint') ? 14.5 : 9.0;
    }
    if (gameMode === 'spectator' || gameMode === 'chronicler') {
      this.isFlying = true;
      this.options.onToggleFly?.(true);
    } else if (!isCreative && this.isFlying) {
      this.isFlying = false;
      this.options.onToggleFly?.(false);
    }
  }

  lock() {
    try {
      const res = this.domElement.requestPointerLock?.();
      if (res && typeof res.catch === 'function') {
        res.catch(() => {});
      }
    } catch (e) {}
  }

  unlock() {
    try {
      const res = document.exitPointerLock?.();
      if (res && typeof res.catch === 'function') {
        res.catch(() => {});
      }
    } catch (e) {}
  }

  handlePointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  zoom(delta) {
    const prev = this.targetDistance;
    this.targetDistance = THREE.MathUtils.clamp(
      this.targetDistance + delta,
      this.minDistance,
      this.maxDistance
    );
    if (Math.abs(this.targetDistance - prev) > 0.03) {
      soundManager.playZoomTick(delta < 0 ? 'in' : 'out');
      this.options.onZoomChange?.(this.targetDistance);
    }
  }

  zoomIn(amount = 0.85) {
    this.zoom(-amount);
  }

  zoomOut(amount = 0.85) {
    this.zoom(amount);
  }

  togglePerspective() {
    if (this.targetDistance <= 1.35) {
      this.targetDistance = 4.2; // 3rd-person medium
    } else if (this.targetDistance <= 5.8) {
      this.targetDistance = 9.5; // 3rd-person panoramic
    } else {
      this.targetDistance = 1.0; // 1st-person
    }
    soundManager.playZoomTick(this.targetDistance <= 1.35 ? 'in' : 'out');
    this.options.onZoomChange?.(this.targetDistance);
  }

  getPerspectiveMode() {
    if (this.targetDistance <= 1.35) return '1st Person';
    if (this.targetDistance <= 5.8) return '3rd Person (Close)';
    return 'Panoramic View';
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
          if (this.isFlying) soundManager.playJump();
        } else if (!this.isFlying && this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
          this.fallApexY = this.position.y;
          soundManager.playJump();
        }
        this.lastSpaceTime = now;
        break;
      }
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = true;
        break;
      // Quick zoom keys & perspective toggle
      case 'KeyZ':
      case 'Minus':
      case 'NumpadSubtract':
      case 'BracketRight':
        this.zoomOut(0.85);
        break;
      case 'KeyX':
      case 'Equal':
      case 'NumpadAdd':
      case 'BracketLeft':
        this.zoomIn(0.85);
        break;
      case 'KeyV':
      case 'F5':
        e.preventDefault();
        this.togglePerspective();
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

  setSensitivityMultiplier(val) {
    this.sensitivityMultiplier = Math.max(0.2, Math.min(3.0, val));
  }

  setSmoothing(val) {
    this.smoothing = typeof val === 'boolean' ? (val ? 0.82 : 0) : val;
  }

  setHeadBobbing(val) {
    this.headBobbingEnabled = !!val;
    if (!val) {
      this.headBobOffset.set(0, 0, 0);
    }
  }

  handleMouseMove(e) {
    if (!this.isLocked) return;

    const sens = this.sensitivity * this.sensitivityMultiplier;
    const mx = THREE.MathUtils.clamp(e.movementX, -160, 160);
    const my = THREE.MathUtils.clamp(e.movementY, -160, 160);
    this.targetYaw -= mx * sens;
    this.targetPitch -= my * sens;

    // Clamp pitch between roughly -85 deg and +85 deg
    const maxPitch = Math.PI / 2 - 0.05;
    this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -maxPitch, maxPitch);

    if (this.smoothing <= 0) {
      this.yaw = this.targetYaw;
      this.pitch = this.targetPitch;
    }
  }

  handlePointerDown(e) {
    if (e.target !== this.domElement) return;
    this.isPointerDown = true;
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.hasDragged = false;
  }

  handlePointerMove(e) {
    if (this.isLocked) {
      return;
    }

    // Pad / Unlocked Mouse: Drag-to-Look!
    if (this.isPointerDown) {
      const dx = THREE.MathUtils.clamp(e.clientX - this.lastPointerX, -80, 80);
      const dy = THREE.MathUtils.clamp(e.clientY - this.lastPointerY, -80, 80);
      const distFromStart = Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY);
      if (distFromStart > 4) {
        this.hasDragged = true;
      }
      const sens = this.sensitivity * this.sensitivityMultiplier * 0.95;
      this.targetYaw -= dx * sens;
      this.targetPitch -= dy * sens;
      const maxPitch = Math.PI / 2 - 0.05;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -maxPitch, maxPitch);

      if (this.smoothing <= 0) {
        this.yaw = this.targetYaw;
        this.pitch = this.targetPitch;
      }

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  }

  handlePointerUp() {
    this.isPointerDown = false;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.lastTouchX = this.touchStartX;
      this.lastTouchY = this.touchStartY;
      this.hasTouchDragged = false;
    } else if (e.touches.length >= 2) {
      // 2-finger pinch
      this.touchPinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }

  handleTouchMove(e) {
    if (e.touches.length >= 2 && this.touchPinchStartDist) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = (this.touchPinchStartDist - currentDist) * 0.025;
      this.zoom(diff);
      this.touchPinchStartDist = currentDist;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = THREE.MathUtils.clamp(touch.clientX - this.lastTouchX, -80, 80);
      const dy = THREE.MathUtils.clamp(touch.clientY - this.lastTouchY, -80, 80);
      const dist = Math.hypot(touch.clientX - this.touchStartX, touch.clientY - this.touchStartY);
      if (dist > 4) this.hasTouchDragged = true;

      const sens = this.sensitivity * this.sensitivityMultiplier * 1.05;
      this.targetYaw -= dx * sens;
      this.targetPitch -= dy * sens;
      const maxPitch = Math.PI / 2 - 0.05;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -maxPitch, maxPitch);

      if (this.smoothing <= 0) {
        this.yaw = this.targetYaw;
        this.pitch = this.targetPitch;
      }

      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    }
  }

  handleTouchEnd(e) {
    if (e.touches.length === 0) {
      this.touchPinchStartDist = null;
    }
  }

  handleWheel(e) {
    e.preventDefault();

    // 1. Trackpad pinch-to-zoom (Browsers set ctrlKey = true when pinch-zooming on trackpads)
    if (e.ctrlKey) {
      const pinchDelta = e.deltaY * 0.015;
      this.zoom(pinchDelta);
      return;
    }

    // 2. Alt/Shift can cycle hotbar if user wants that
    if (e.altKey || e.shiftKey) {
      const dir = e.deltaY > 0 ? 1 : -1;
      this.options.onCycleHotbar?.(dir);
      return;
    }

    // 3. Both pad (two-finger scroll) and mouse (wheel scroll):
    // Smoothly zoom in / out with tick sound feedback!
    const zoomDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * 0.005, 0.95);
    this.zoom(zoomDelta);
  }

  setAvatarMesh(avatarGroup) {
    this.avatarGroup = avatarGroup;
  }

  /**
   * Main update physics, collision, flying, walking, and camera frame step
   */
  update(delta, colliders = []) {
    const dt = Math.min(delta, 0.1);

    // Butter-smooth camera look interpolation
    if (this.smoothing > 0) {
      const smoothRate = (1.0 - this.smoothing * 0.6) * 48;
      this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, Math.min(1.0, dt * smoothRate));
      this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, Math.min(1.0, dt * smoothRate));
    } else {
      this.yaw = this.targetYaw;
      this.pitch = this.targetPitch;
    }

    // Smoothly lerp camera distance for dynamic zoom
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, this.targetDistance, dt * 11);

    // Calculate movement vector aligned with camera horizontal yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.left) moveDir.sub(right);
    if (this.keys.right) moveDir.add(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) moveDir.normalize();
    this.isMoving = isMoving;

    // Creative Flight Physics vs Survival Gravity Physics
    if (this.isFlying) {
      const speed = this.flySpeed;
      this.position.x += moveDir.x * speed * dt;
      this.position.z += moveDir.z * speed * dt;

      if (this.keys.jump) {
        this.position.y += speed * 0.85 * dt;
      } else if (this.keys.run) {
        this.position.y = Math.max(0, this.position.y - speed * 0.85 * dt);
      }
      this.velocity.set(0, 0, 0);
      this.isGrounded = false;
      this.fallApexY = this.position.y;
    } else {
      // Walking / Running / Jumping Physics with Gravity
      let speed = this.walkSpeed;
      if (this.keys.run && isMoving) {
        speed = this.runSpeed;
        if (!this.isCreative) {
          this.options.onConsumeStamina?.(dt * 3.5);
        }
      }

      const targetVelX = moveDir.x * speed;
      const targetVelZ = moveDir.z * speed;
      const accel = this.isGrounded ? 18.0 : 8.0;

      this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, dt * accel);
      this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, dt * accel);

      // Apply Gravity
      this.velocity.y += this.gravity * dt;

      // Horizontal Collision Resolution (AABB block colliders)
      const desiredX = this.position.x + this.velocity.x * dt;
      const desiredZ = this.position.z + this.velocity.z * dt;

      this.position.x = this.resolveHorizontalCollision('x', desiredX, colliders);
      this.position.z = this.resolveHorizontalCollision('z', desiredZ, colliders);

      // Vertical Collision Resolution
      const desiredY = this.position.y + this.velocity.y * dt;
      this.resolveVerticalCollision(desiredY, colliders);
    }

    // Footsteps & Head-Bobbing Dynamics
    if (this.isMoving && this.isGrounded && !this.isFlying) {
      const stepFreq = this.keys.run ? 14.8 : 10.2;
      this.walkCycle += dt * stepFreq;

      // Footstep sound synchronized with ground impact (zero-crossing)
      const currSin = Math.sin(this.walkCycle);
      if ((this.lastStepSin < 0 && currSin >= 0) || (this.lastStepSin > 0 && currSin <= 0)) {
        soundManager.playFootstep(this.position.y <= 0.2 ? 'grass' : 'stone');
      }
      this.lastStepSin = currSin;

      // Head-bobbing vertical & horizontal sway
      if (this.headBobbingEnabled) {
        const bobMag = this.keys.run ? 0.075 : 0.04;
        const swayMag = this.keys.run ? 0.045 : 0.022;
        const targetBobY = Math.sin(this.walkCycle * 2) * bobMag;
        const targetBobX = Math.cos(this.walkCycle) * swayMag;

        this.headBobOffset.x = THREE.MathUtils.lerp(this.headBobOffset.x, targetBobX, dt * 14);
        this.headBobOffset.y = THREE.MathUtils.lerp(this.headBobOffset.y, targetBobY, dt * 14);
      } else {
        this.headBobOffset.set(0, 0, 0);
      }
    } else {
      // Smoothly settle head bob when idle or airborne
      this.headBobOffset.x = THREE.MathUtils.lerp(this.headBobOffset.x, 0, dt * 8);
      this.headBobOffset.y = THREE.MathUtils.lerp(this.headBobOffset.y, 0, dt * 8);
    }

    // Avatar mesh position & animated limb swing
    if (this.avatarGroup) {
      this.avatarGroup.position.set(this.position.x, this.position.y, this.position.z);
      this.avatarGroup.rotation.y = this.yaw + Math.PI;

      if (isMoving && this.isGrounded && !this.isFlying) {
        this.animateAvatarLimbs();
      } else if (this.isFlying || !this.isGrounded) {
        this.animateAirborneLimbs();
      } else {
        this.resetAvatarLimbs();
      }
    }

    // Wall-Occlusion Aware Camera Position with Smooth Spring Lerp, Dynamic FOV, and Head-Bob
    this.updateCamera(colliders, dt);
  }

  resolveHorizontalCollision(axis, desiredCoord, colliders) {
    const r = this.playerRadius;
    const pY = this.position.y;
    const pH = this.playerHeight;

    const targetX = axis === 'x' ? desiredCoord : this.position.x;
    const targetZ = axis === 'z' ? desiredCoord : this.position.z;

    const pMinX = targetX - r;
    const pMaxX = targetX + r;
    const pMinZ = targetZ - r;
    const pMaxZ = targetZ + r;
    const pMinY = pY + 0.1;
    const pMaxY = pY + pH;

    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (pMaxX > b.minX && pMinX < b.maxX && pMaxZ > b.minZ && pMinZ < b.maxZ && pMaxY > b.minY && pMinY < b.maxY) {
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
        if (b.maxY <= this.position.y + 0.55) {
          groundLevel = Math.max(groundLevel, b.maxY);
        }
      }
    }

    if (desiredY <= groundLevel) {
      const prevVelY = this.velocity.y;
      // Landing dip and audio effect
      if (!this.isGrounded && prevVelY < -2.2) {
        this.landingDip = Math.min(0.22, Math.abs(prevVelY) * 0.02);
        soundManager.playLand();
      }

      // Landing: check fall damage in Survival Mode
      const fallDist = (this.fallApexY || this.position.y) - groundLevel;
      if (!this.isCreative && !this.isGrounded && fallDist > 3.2) {
        const dmg = Math.floor((fallDist - 3.2) * 2.5);
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
      this.fallApexY = Math.max(this.fallApexY || this.position.y, this.position.y);
    }
  }

  animateAvatarLimbs() {
    if (!this.avatarGroup) return;

    const swing = Math.sin(this.walkCycle) * (this.keys.run ? 0.72 : 0.48);
    const bob = Math.abs(Math.sin(this.walkCycle)) * 0.06;

    const leftArm = this.avatarGroup.getObjectByName('leftArm');
    const rightArm = this.avatarGroup.getObjectByName('rightArm');
    const leftLeg = this.avatarGroup.getObjectByName('leftLeg');
    const rightLeg = this.avatarGroup.getObjectByName('rightLeg');
    const torso = this.avatarGroup.getObjectByName('torsoGroup');
    const head = this.avatarGroup.getObjectByName('headGroup');

    if (leftArm) leftArm.rotation.x = -swing;
    if (rightArm) rightArm.rotation.x = swing;
    if (leftLeg) leftLeg.rotation.x = swing;
    if (rightLeg) rightLeg.rotation.x = -swing;
    if (torso) {
      torso.position.y = bob;
      torso.rotation.x = this.keys.run ? 0.16 : 0.03;
    }
    if (head) {
      head.rotation.x = this.pitch * 0.35;
    }
  }

  animateAirborneLimbs() {
    if (!this.avatarGroup) return;
    const leftArm = this.avatarGroup.getObjectByName('leftArm');
    const rightArm = this.avatarGroup.getObjectByName('rightArm');
    const leftLeg = this.avatarGroup.getObjectByName('leftLeg');
    const rightLeg = this.avatarGroup.getObjectByName('rightLeg');
    const torso = this.avatarGroup.getObjectByName('torsoGroup');
    const head = this.avatarGroup.getObjectByName('headGroup');

    if (leftArm) leftArm.rotation.x = -0.4;
    if (rightArm) rightArm.rotation.x = -0.4;
    if (leftLeg) leftLeg.rotation.x = 0.35;
    if (rightLeg) rightLeg.rotation.x = 0.35;
    if (torso) {
      torso.position.y = 0;
      torso.rotation.x = this.isFlying ? 0.35 : 0.1;
    }
    if (head) {
      head.rotation.x = this.pitch * 0.4;
    }
  }

  resetAvatarLimbs() {
    if (!this.avatarGroup) return;
    const leftArm = this.avatarGroup.getObjectByName('leftArm');
    const rightArm = this.avatarGroup.getObjectByName('rightArm');
    const leftLeg = this.avatarGroup.getObjectByName('leftLeg');
    const rightLeg = this.avatarGroup.getObjectByName('rightLeg');
    const torso = this.avatarGroup.getObjectByName('torsoGroup');
    const head = this.avatarGroup.getObjectByName('headGroup');

    if (leftArm) leftArm.rotation.x = 0;
    if (rightArm) rightArm.rotation.x = 0;
    if (leftLeg) leftLeg.rotation.x = 0;
    if (rightLeg) rightLeg.rotation.x = 0;
    if (torso) {
      torso.position.y = 0;
      torso.rotation.x = 0;
    }
    if (head) {
      head.rotation.x = this.pitch * 0.35;
    }
  }

  /**
   * Camera position with wall occlusion raycasting to prevent clipping through interior Lego rooms
   * Features smooth spring lerping to eliminate violent snapping, dynamic FOV, and head-bobbing
   */
  updateCamera(colliders, dt = 0.016) {
    this.landingDip = THREE.MathUtils.lerp(this.landingDip, 0, dt * 9);

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

    // Camera local right vector for horizontal head sway
    const cameraRight = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
    const bobDisplacement = cameraRight.clone().multiplyScalar(this.headBobOffset.x)
      .add(new THREE.Vector3(0, this.headBobOffset.y - this.landingDip, 0));

    // Dynamic FOV calculation:
    // 1. Zoom breathing (narrower telephoto in 1st person ~60°, wider panoramic in 3rd person ~72°)
    const zoomRatio = (this.currentDistance - this.minDistance) / (this.maxDistance - this.minDistance);
    let desiredFov = THREE.MathUtils.lerp(60, 72, THREE.MathUtils.clamp(zoomRatio, 0, 1));

    // 2. Dynamic speed warp when sprinting or flying fast (+6.5° FOV)
    if (this.keys.run && this.isMoving && !this.isFlying) {
      desiredFov += 6.5;
    } else if (this.isFlying && this.isMoving) {
      desiredFov += 5.0;
    }

    if (Math.abs(this.camera.fov - desiredFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, desiredFov, dt * 7.5);
      this.camera.updateProjectionMatrix();
    }

    // FIRST-PERSON MODE (< 1.35m)
    if (this.targetDistance <= 1.35) {
      const fpCameraPos = eyePoint.clone().add(bobDisplacement);
      this.camera.position.copy(fpCameraPos);
      const targetLookPoint = fpCameraPos.clone().add(lookDir);
      this.camera.lookAt(targetLookPoint);
      if (this.avatarGroup) this.avatarGroup.visible = false;
      this.smoothDist = 1.0;
      return;
    }

    // THIRD-PERSON MODE
    if (this.avatarGroup) this.avatarGroup.visible = true;

    // Camera ray direction (from eye pointing backwards)
    const rayDir = lookDir.clone().negate().normalize();
    // Offset ray origin outside player's bounding radius (0.35m) so ray never hits player themselves
    const rayStart = eyePoint.clone().add(rayDir.clone().multiplyScalar(0.42));
    const maxRayDist = Math.max(0.2, this.currentDistance - 0.42);
    let closestDist = maxRayDist;

    // Check collision against world colliders
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      const dist = this.intersectRayAABB(rayStart, rayDir, b);
      if (dist !== null && dist > 0.05 && dist < closestDist) {
        closestDist = dist;
      }
    }

    const targetDist = Math.max(1.4, 0.42 + closestDist - 0.25);

    if (this.smoothDist === undefined) {
      this.smoothDist = targetDist;
    } else {
      // Smooth spring interpolation eliminates camera glitching/snapping
      this.smoothDist = THREE.MathUtils.lerp(
        this.smoothDist,
        targetDist,
        Math.min(1.0, dt * 14)
      );
    }

    const finalCameraPos = eyePoint.clone().add(rayDir.multiplyScalar(this.smoothDist));
    finalCameraPos.add(bobDisplacement.clone().multiplyScalar(0.35));
    if (finalCameraPos.y < 0.4) finalCameraPos.y = 0.4;

    this.camera.position.copy(finalCameraPos);
    this.camera.lookAt(eyePoint.clone().add(bobDisplacement.clone().multiplyScalar(0.25)));
  }

  /**
   * Robust Ray-AABB intersection distance
   */
  intersectRayAABB(origin, dir, box) {
    const dx = Math.abs(dir.x) < 1e-6 ? (dir.x >= 0 ? 1e-6 : -1e-6) : dir.x;
    const dy = Math.abs(dir.y) < 1e-6 ? (dir.y >= 0 ? 1e-6 : -1e-6) : dir.y;
    const dz = Math.abs(dir.z) < 1e-6 ? (dir.z >= 0 ? 1e-6 : -1e-6) : dir.z;

    let tmin = (box.minX - origin.x) / dx;
    let tmax = (box.maxX - origin.x) / dx;
    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (box.minY - origin.y) / dy;
    let tymax = (box.maxY - origin.y) / dy;
    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if (tmin > tymax || tymin > tmax) return null;
    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (box.minZ - origin.z) / dz;
    let tzmax = (box.maxZ - origin.z) / dz;
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
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }
}

/**
 * Builds a 3D blocky avatar mesh matching avatarConfig
 */
export function createAvatarMesh(avatarConfig) {
  const group = new THREE.Group();

  const skinColor = avatarConfig?.skinTone || '#ffd166';
  const topColor = avatarConfig?.topColor || '#ff6b8b';
  const bottomColor = avatarConfig?.bottomColor || avatarConfig?.pantsColor || '#2ec4b6';
  const shoeColor = avatarConfig?.shoeColor || '#ffd166';
  const hairColor = avatarConfig?.hairColor || '#2d3748';
  const bodyFormId = avatarConfig?.bodyForm || 'androgynous';

  // Body scale factors based on form
  let torsoW = 0.55;
  let torsoH = 0.65;
  let legH = 0.65;
  let shoulderScale = 1.0;

  if (bodyFormId === 'feminine') {
    torsoW = 0.50;
    torsoH = 0.62;
    shoulderScale = 0.9;
    legH = 0.64;
  } else if (bodyFormId === 'masculine') {
    torsoW = 0.62;
    torsoH = 0.68;
    shoulderScale = 1.15;
    legH = 0.67;
  } else if (bodyFormId === 'tall') {
    torsoW = 0.52;
    torsoH = 0.72;
    legH = 0.78;
  } else if (bodyFormId === 'petite') {
    torsoW = 0.52;
    torsoH = 0.55;
    legH = 0.54;
  }

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.45 });
  const topMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.35 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: bottomColor, roughness: 0.45 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 });

  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torsoGroup';

  // Torso
  const torsoGeom = new THREE.BoxGeometry(torsoW * shoulderScale, torsoH, 0.32);
  const torsoMesh = new THREE.Mesh(torsoGeom, topMat);
  torsoMesh.position.y = legH + torsoH / 2;
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Head
  const headSize = 0.40;
  const headGeom = new THREE.BoxGeometry(headSize, headSize, headSize);
  const headMesh = new THREE.Mesh(headGeom, skinMat);
  headMesh.position.set(0, torsoMesh.position.y + torsoH / 2 + headSize / 2 + 0.02, 0);
  headMesh.castShadow = true;
  torsoGroup.add(headMesh);

  // Lego Head Stud on Top
  const headStudGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16);
  const headStud = new THREE.Mesh(headStudGeom, skinMat);
  headStud.position.set(0, headMesh.position.y + headSize / 2 + 0.03, 0);
  torsoGroup.add(headStud);

  // Hair
  const hairStyle = avatarConfig?.hairStyle || 'curls';
  const hairGroup = new THREE.Group();

  if (hairStyle === 'afro' || hairStyle === 'curls') {
    const hairCap = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.08, 0.22, headSize + 0.08),
      hairMat
    );
    hairCap.position.set(0, headMesh.position.y + 0.14, -0.01);
    hairCap.castShadow = true;
    hairGroup.add(hairCap);
  } else if (hairStyle === 'locs' || hairStyle === 'braids') {
    const hairCap = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.06, 0.20, headSize + 0.06),
      hairMat
    );
    hairCap.position.set(0, headMesh.position.y + 0.12, 0);
    hairCap.castShadow = true;
    hairGroup.add(hairCap);

    // Cascading strands
    const strandL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), hairMat);
    strandL.position.set(-headSize / 2 - 0.02, headMesh.position.y - 0.05, 0);
    hairGroup.add(strandL);

    const strandR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), hairMat);
    strandR.position.set(headSize / 2 + 0.02, headMesh.position.y - 0.05, 0);
    hairGroup.add(strandR);
  } else if (hairStyle === 'long_flowy') {
    const hairCap = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.06, 0.18, headSize + 0.06),
      hairMat
    );
    hairCap.position.set(0, headMesh.position.y + 0.12, 0);
    hairGroup.add(hairCap);

    const backHair = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.04, 0.45, 0.08),
      hairMat
    );
    backHair.position.set(0, headMesh.position.y - 0.10, -headSize / 2 - 0.02);
    hairGroup.add(backHair);
  } else {
    // Crop / Fade / Bob / Pixie
    const hairCap = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.04, 0.16, headSize + 0.04),
      hairMat
    );
    hairCap.position.set(0, headMesh.position.y + 0.14, 0);
    hairCap.castShadow = true;
    hairGroup.add(hairCap);
  }
  torsoGroup.add(hairGroup);

  // Accessories: Glasses / Hat
  const acc = avatarConfig?.accessory;
  if (acc === 'sunglasses') {
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.04),
      new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.1, metalness: 0.8 })
    );
    glasses.position.set(0, headMesh.position.y + 0.02, headSize / 2 + 0.025);
    torsoGroup.add(glasses);
  } else if (acc === 'glasses') {
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.07, 0.03),
      new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.2, metalness: 0.6 })
    );
    glasses.position.set(0, headMesh.position.y + 0.02, headSize / 2 + 0.02);
    torsoGroup.add(glasses);
  } else if (acc === 'sun_cap') {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.06, 0.08, headSize + 0.16),
      new THREE.MeshStandardMaterial({ color: '#ff6b8b', roughness: 0.4 })
    );
    cap.position.set(0, headMesh.position.y + headSize / 2 + 0.02, 0.05);
    torsoGroup.add(cap);
  } else if (acc === 'beanie') {
    const beanie = new THREE.Mesh(
      new THREE.BoxGeometry(headSize + 0.08, 0.18, headSize + 0.08),
      new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.5 })
    );
    beanie.position.set(0, headMesh.position.y + headSize / 2 + 0.06, 0);
    torsoGroup.add(beanie);
  }

  // Left Arm (pivot at shoulder)
  const armW = 0.16;
  const armH = torsoH * 0.85;
  const armGeom = new THREE.BoxGeometry(armW, armH, armW);
  armGeom.translate(0, -armH / 2, 0);

  const leftArm = new THREE.Mesh(armGeom, topMat);
  leftArm.name = 'leftArm';
  leftArm.position.set(-(torsoW * shoulderScale / 2 + armW / 2 + 0.02), torsoMesh.position.y + torsoH / 2 - 0.05, 0);
  leftArm.castShadow = true;

  // Hand
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skinMat);
  handL.position.set(0, -armH - 0.04, 0);
  leftArm.add(handL);
  group.add(leftArm);

  // Right Arm (pivot at shoulder)
  const rightArm = new THREE.Mesh(armGeom, topMat);
  rightArm.name = 'rightArm';
  rightArm.position.set((torsoW * shoulderScale / 2 + armW / 2 + 0.02), torsoMesh.position.y + torsoH / 2 - 0.05, 0);
  rightArm.castShadow = true;

  // Hand
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skinMat);
  handR.position.set(0, -armH - 0.04, 0);
  rightArm.add(handR);
  group.add(rightArm);

  // Left Leg (pivot at hip)
  const legW = 0.20;
  const legGeom = new THREE.BoxGeometry(legW, legH, 0.20);
  legGeom.translate(0, -legH / 2, 0);

  const leftLeg = new THREE.Mesh(legGeom, pantsMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.14, legH, 0);
  leftLeg.castShadow = true;

  // Left Shoe
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(legW + 0.02, 0.12, 0.26), shoeMat);
  leftShoe.position.set(0, -legH + 0.04, 0.03);
  leftShoe.castShadow = true;
  leftLeg.add(leftShoe);
  group.add(leftLeg);

  // Right Leg (pivot at hip)
  const rightLeg = new THREE.Mesh(legGeom, pantsMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.14, legH, 0);
  rightLeg.castShadow = true;

  // Right Shoe
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(legW + 0.02, 0.12, 0.26), shoeMat);
  rightShoe.position.set(0, -legH + 0.04, 0.03);
  rightShoe.castShadow = true;
  rightLeg.add(rightShoe);
  group.add(rightLeg);

  group.add(torsoGroup);
  return group;
}
