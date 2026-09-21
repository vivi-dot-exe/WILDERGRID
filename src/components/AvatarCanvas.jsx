import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BODY_FORMS, THEMES } from '../types/avatar';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

export default function AvatarCanvas({ config, width = 340, height = 440 }) {
  const containerRef = useRef(null);
  const engineRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    mannequinGroup: null,
    pedestalMesh: null,
    ringLightMesh: null,
    dirLight: null,
    hemiLight: null,
    pedestalLight: null,
    animId: null,
    yaw: 0.35,
    targetYaw: 0.35,
    pitch: 0.15,
    targetPitch: 0.15,
    distance: 4.6,
    targetDistance: 4.6,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    isAutoRotating: false,
    tick: 0,
  });

  const [autoRotate, setAutoRotate] = useState(false);

  // Helper to build the 3D Lego Mannequin
  const buildMannequin = useCallback((scene, cfg) => {
    // If existing mannequin exists, remove and dispose
    if (engineRef.current.mannequinGroup) {
      scene.remove(engineRef.current.mannequinGroup);
      engineRef.current.mannequinGroup.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      engineRef.current.mannequinGroup = null;
    }

    const group = new THREE.Group();
    group.name = 'mannequin';

    // Proportions
    const bodyForm = BODY_FORMS.find((b) => b.id === cfg.bodyForm) || BODY_FORMS[2];
    const {
      torsoWidth = 1.0,
      torsoHeight = 1.0,
      shoulderWidth = 1.0,
      waistScale = 1.0,
      legHeight = 1.0,
      armWidth = 1.0,
    } = bodyForm;

    // Materials with PBR Lego plastic sheen
    const skinMat = new THREE.MeshStandardMaterial({
      color: cfg.skinTone || '#e0ac69',
      roughness: 0.35,
      metalness: 0.05,
    });

    const topMat = new THREE.MeshStandardMaterial({
      color: cfg.topColor || '#ff8da1',
      roughness: 0.3,
      metalness: 0.08,
    });

    const bottomMat = new THREE.MeshStandardMaterial({
      color: cfg.bottomColor || '#ffffff',
      roughness: 0.4,
      metalness: 0.05,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: cfg.shoeColor || '#ffd166',
      roughness: 0.3,
      metalness: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: cfg.hairColor || '#3e2723',
      roughness: 0.45,
      metalness: 0.1,
    });

    const studMat = new THREE.MeshStandardMaterial({
      color: cfg.skinTone || '#e0ac69',
      roughness: 0.3,
      metalness: 0.05,
    });

    // Helper for Lego Studs
    const createStud = (radius = 0.08, height = 0.05, mat = studMat) => {
      const geom = new THREE.CylinderGeometry(radius, radius, height, 16);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      return mesh;
    };

    // 1. FEET & SHOES
    const shoeGroup = new THREE.Group();
    shoeGroup.name = 'shoes';
    const legSpacing = 0.22;
    const footY = 0.1;

    const createShoeMesh = (isLeft) => {
      const sg = new THREE.Group();
      const baseShoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.16, 0.32),
        shoeMat
      );
      baseShoe.position.set(0, 0.08, 0.03);
      baseShoe.castShadow = true;
      sg.add(baseShoe);

      // Sneaker sole / toe cap
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(0.21, 0.05, 0.34),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
      );
      sole.position.set(0, 0.025, 0.03);
      sole.castShadow = true;
      sg.add(sole);

      // Lego studs on top of shoe toe
      const toeStud = createStud(0.045, 0.03, shoeMat);
      toeStud.position.set(0, 0.17, 0.12);
      sg.add(toeStud);

      sg.position.set(isLeft ? -legSpacing : legSpacing, 0, 0);
      return sg;
    };

    const leftShoe = createShoeMesh(true);
    const rightShoe = createShoeMesh(false);
    shoeGroup.add(leftShoe);
    shoeGroup.add(rightShoe);
    group.add(shoeGroup);

    // 2. LEGS & BOTTOMS
    const legsGroup = new THREE.Group();
    legsGroup.name = 'legs';
    const legH = 0.65 * legHeight;
    const legW = 0.19;
    const legD = 0.22;
    const legCenterY = footY + 0.12 + legH / 2;

    const leftLegGeom = new THREE.BoxGeometry(legW, legH, legD);
    const leftLeg = new THREE.Mesh(leftLegGeom, bottomMat);
    leftLeg.position.set(-legSpacing, legCenterY, 0);
    leftLeg.castShadow = true;
    legsGroup.add(leftLeg);

    const rightLegGeom = new THREE.BoxGeometry(legW, legH, legD);
    const rightLeg = new THREE.Mesh(rightLegGeom, bottomMat);
    rightLeg.position.set(legSpacing, legCenterY, 0);
    rightLeg.castShadow = true;
    legsGroup.add(rightLeg);

    // Hip Pelvis Block
    const hipW = (legSpacing * 2) + legW;
    const hipH = 0.14;
    const hipGeom = new THREE.BoxGeometry(hipW, hipH, legD + 0.01);
    const hipMesh = new THREE.Mesh(hipGeom, bottomMat);
    hipMesh.position.set(0, legCenterY + legH / 2 + hipH / 2 - 0.02, 0);
    hipMesh.castShadow = true;
    legsGroup.add(hipMesh);

    group.add(legsGroup);

    // 3. TORSO & UPPER BODY
    const upperBodyGroup = new THREE.Group();
    upperBodyGroup.name = 'upperBody';

    const tw = 0.58 * torsoWidth * shoulderWidth;
    const th = 0.68 * torsoHeight;
    const td = 0.32 * torsoWidth;
    const torsoY = hipMesh.position.y + hipH / 2 + th / 2;

    // Trapezoidal Torso shape (Lego style, tapered towards shoulders or waist)
    const torsoGeom = new THREE.BoxGeometry(tw, th, td);
    // Subtle waist taper if feminine/slender
    const posAttr = torsoGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y < 0 && waistScale !== 1.0) {
        posAttr.setX(i, posAttr.getX(i) * waistScale);
      }
    }
    torsoGeom.computeVertexNormals();

    const torsoMesh = new THREE.Mesh(torsoGeom, topMat);
    torsoMesh.position.set(0, torsoY, 0);
    torsoMesh.castShadow = true;
    upperBodyGroup.add(torsoMesh);

    // Collar / Resort Shirt Detail
    if (cfg.topStyle === 'resort_shirt') {
      const collar = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.12, 0.04),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
      );
      collar.position.set(0, torsoY + th / 3, td / 2 + 0.01);
      upperBodyGroup.add(collar);
    } else if (cfg.topStyle === 'hoodie') {
      // Hood pouch on front
      const pouch = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.18, 0.05),
        new THREE.MeshStandardMaterial({
          color: cfg.topColor || '#ff6b8b',
          roughness: 0.4,
        })
      );
      pouch.position.set(0, torsoY - 0.12, td / 2 + 0.02);
      upperBodyGroup.add(pouch);
    }

    // 4. ARMS & SLEEVES
    const armW = 0.16 * armWidth;
    const armH = 0.58 * torsoHeight;
    const armD = 0.16 * armWidth;
    const armY = torsoY + 0.04;
    const armOffset = tw / 2 + armW / 2 + 0.02;

    const createArm = (isLeft) => {
      const ag = new THREE.Group();
      // Shoulder Joint
      const shoulderJoint = new THREE.Mesh(
        new THREE.SphereGeometry(armW / 2 + 0.01, 16, 16),
        topMat
      );
      shoulderJoint.position.set(0, armH / 2, 0);
      ag.add(shoulderJoint);

      // Arm Sleeve
      const armMesh = new THREE.Mesh(
        new THREE.BoxGeometry(armW, armH, armD),
        topMat
      );
      armMesh.castShadow = true;
      ag.add(armMesh);

      // Lego Hand (C-shape curved cuff & palm)
      const handGroup = new THREE.Group();
      const cuffGeom = new THREE.CylinderGeometry(0.065, 0.07, 0.08, 16);
      const cuff = new THREE.Mesh(cuffGeom, skinMat);
      cuff.position.set(0, -armH / 2 - 0.04, 0);
      handGroup.add(cuff);

      const palmGeom = new THREE.TorusGeometry(0.06, 0.025, 8, 16, Math.PI * 1.3);
      const palm = new THREE.Mesh(palmGeom, skinMat);
      palm.rotation.z = isLeft ? Math.PI / 2 : -Math.PI / 2;
      palm.rotation.x = Math.PI / 2;
      palm.position.set(0, -armH / 2 - 0.1, 0.01);
      handGroup.add(palm);

      ag.add(handGroup);
      ag.position.set(isLeft ? -armOffset : armOffset, armY, 0);
      return ag;
    };

    const leftArm = createArm(true);
    leftArm.name = 'leftArm';
    const rightArm = createArm(false);
    rightArm.name = 'rightArm';
    upperBodyGroup.add(leftArm);
    upperBodyGroup.add(rightArm);

    // 5. NECK & HEAD
    const neckGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
    const neckMesh = new THREE.Mesh(neckGeom, skinMat);
    neckMesh.position.set(0, torsoY + th / 2 + 0.05, 0);
    upperBodyGroup.add(neckMesh);

    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    const headSize = 0.48;
    const headY = neckMesh.position.y + 0.05 + headSize / 2;
    headGroup.position.set(0, headY, 0);

    // Cylindrical / rounded block Lego Head
    const headGeom = new THREE.CylinderGeometry(headSize * 0.48, headSize * 0.48, headSize, 24);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Iconic Lego Head Top Stud
    const headStud = createStud(0.12, 0.09, studMat);
    headStud.position.set(0, headSize / 2 + 0.045, 0);
    headGroup.add(headStud);

    // Face Decal / Dynamic Canvas Texture for Eyes & Expression
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256;
    faceCanvas.height = 256;
    const fctx = faceCanvas.getContext('2d');
    fctx.clearRect(0, 0, 256, 256);

    // Cute Eyes
    const eyeSpacing = 44;
    const eyeY = 122;

    // White eye background + glints
    fctx.fillStyle = '#18181b';
    fctx.beginPath();
    fctx.arc(128 - eyeSpacing, eyeY, 14, 0, Math.PI * 2);
    fctx.arc(128 + eyeSpacing, eyeY, 14, 0, Math.PI * 2);
    fctx.fill();

    // Glint
    fctx.fillStyle = '#ffffff';
    fctx.beginPath();
    fctx.arc(128 - eyeSpacing + 4, eyeY - 4, 5, 0, Math.PI * 2);
    fctx.arc(128 + eyeSpacing + 4, eyeY - 4, 5, 0, Math.PI * 2);
    fctx.arc(128 - eyeSpacing - 4, eyeY + 4, 2.5, 0, Math.PI * 2);
    fctx.arc(128 + eyeSpacing - 4, eyeY + 4, 2.5, 0, Math.PI * 2);
    fctx.fill();

    // Rosy Cheeks
    fctx.fillStyle = 'rgba(255, 107, 139, 0.45)';
    fctx.beginPath();
    fctx.arc(128 - eyeSpacing - 14, eyeY + 22, 16, 0, Math.PI * 2);
    fctx.arc(128 + eyeSpacing + 14, eyeY + 22, 16, 0, Math.PI * 2);
    fctx.fill();

    // Cheerful Smile
    fctx.strokeStyle = '#2d1810';
    fctx.lineWidth = 5;
    fctx.lineCap = 'round';
    fctx.beginPath();
    fctx.arc(128, eyeY + 26, 18, 0.15 * Math.PI, 0.85 * Math.PI);
    fctx.stroke();

    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    faceTexture.anisotropy = 4;
    const facePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(headSize * 0.85, headSize * 0.85),
      new THREE.MeshBasicMaterial({
        map: faceTexture,
        transparent: true,
        depthWrite: false,
      })
    );
    facePlane.position.set(0, 0, headSize * 0.48 + 0.005);
    headGroup.add(facePlane);

    // 6. HAIR STYLES
    const hairGroup = new THREE.Group();
    hairGroup.name = 'hair';
    const hs = cfg.hairStyle || 'curls';

    if (hs === 'afro' || hs === 'curls') {
      const radius = hs === 'afro' ? headSize * 0.65 : headSize * 0.58;
      const sphereCount = hs === 'afro' ? 14 : 10;
      for (let i = 0; i < sphereCount; i++) {
        const angle = (i / sphereCount) * Math.PI * 2;
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 0.38, 12, 12),
          hairMat
        );
        puff.position.set(
          Math.cos(angle) * (radius * 0.6),
          headSize * 0.35 + Math.sin(i * 2.5) * 0.05,
          Math.sin(angle) * (radius * 0.6) - 0.02
        );
        puff.castShadow = true;
        hairGroup.add(puff);
      }
      const topPuff = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.5, 14, 14),
        hairMat
      );
      topPuff.position.set(0, headSize * 0.5, -0.04);
      topPuff.castShadow = true;
      hairGroup.add(topPuff);
    } else if (hs === 'locs' || hs === 'braids') {
      // Sculpted layered crown
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(headSize * 0.52, headSize * 0.54, 0.22, 16),
        hairMat
      );
      crown.position.set(0, headSize * 0.32, -0.03);
      crown.castShadow = true;
      hairGroup.add(crown);

      // Hanging locs / braids
      const strandCount = 10;
      for (let i = 0; i < strandCount; i++) {
        const a = (i / strandCount) * Math.PI * 1.5 - Math.PI * 0.75;
        const strandH = hs === 'locs' ? 0.45 : 0.55;
        const strand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.028, strandH, 8),
          hairMat
        );
        strand.position.set(
          Math.sin(a) * (headSize * 0.5 + 0.02),
          0.05 - strandH / 2,
          Math.cos(a) * (headSize * 0.5 + 0.02) - 0.06
        );
        strand.rotation.x = 0.1;
        strand.castShadow = true;
        hairGroup.add(strand);
      }
    } else if (hs === 'bob') {
      // Sleek chin-length curved helmet
      const bobCap = new THREE.Mesh(
        new THREE.SphereGeometry(headSize * 0.56, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.65),
        hairMat
      );
      bobCap.position.set(0, headSize * 0.1, -0.02);
      bobCap.rotation.x = -0.15;
      bobCap.castShadow = true;
      hairGroup.add(bobCap);

      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.32), hairMat);
      sideL.position.set(-headSize * 0.45, 0.05, 0);
      sideL.castShadow = true;
      hairGroup.add(sideL);

      const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.32), hairMat);
      sideR.position.set(headSize * 0.45, 0.05, 0);
      sideR.castShadow = true;
      hairGroup.add(sideR);
    } else if (hs === 'long_flowy') {
      // Cascading locks
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(headSize * 0.54, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
        hairMat
      );
      crown.position.set(0, headSize * 0.12, -0.02);
      crown.castShadow = true;
      hairGroup.add(crown);

      // Back cape of hair
      const backHair = new THREE.Mesh(
        new THREE.BoxGeometry(headSize * 0.95, 0.72, 0.14),
        hairMat
      );
      backHair.position.set(0, -0.12, -headSize * 0.46);
      backHair.castShadow = true;
      hairGroup.add(backHair);

      // Front curls
      const frontL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.55, 8), hairMat);
      frontL.position.set(-headSize * 0.42, -0.06, headSize * 0.2);
      frontL.castShadow = true;
      hairGroup.add(frontL);

      const frontR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.55, 8), hairMat);
      frontR.position.set(headSize * 0.42, -0.06, headSize * 0.2);
      frontR.castShadow = true;
      hairGroup.add(frontR);
    } else if (hs === 'fade') {
      // Clean modern fade
      const topCap = new THREE.Mesh(
        new THREE.BoxGeometry(headSize * 0.95, 0.14, headSize * 0.95),
        hairMat
      );
      topCap.position.set(0, headSize * 0.48, 0);
      topCap.castShadow = true;
      hairGroup.add(topCap);

      const fadeRing = new THREE.Mesh(
        new THREE.CylinderGeometry(headSize * 0.49, headSize * 0.49, 0.16, 24),
        new THREE.MeshStandardMaterial({
          color: cfg.hairColor || '#3e2723',
          roughness: 0.6,
        })
      );
      fadeRing.position.set(0, headSize * 0.35, 0);
      hairGroup.add(fadeRing);
    } else {
      // Pixie Crop
      const pixieMesh = new THREE.Mesh(
        new THREE.SphereGeometry(headSize * 0.52, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
        hairMat
      );
      pixieMesh.position.set(0, headSize * 0.22, 0);
      pixieMesh.castShadow = true;
      hairGroup.add(pixieMesh);
    }

    headGroup.add(hairGroup);

    // 7. ACCESSORIES: HATS & GLASSES
    const acc = cfg.accessory;
    if (acc === 'sun_cap') {
      const capGroup = new THREE.Group();
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(headSize * 0.55, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.45),
        new THREE.MeshStandardMaterial({ color: '#ff6b8b', roughness: 0.35 })
      );
      dome.position.set(0, headSize * 0.28, 0);
      capGroup.add(dome);

      // Visor brim
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(headSize * 0.75, 0.035, 0.26),
        new THREE.MeshStandardMaterial({ color: '#ff8da1', roughness: 0.35 })
      );
      visor.position.set(0, headSize * 0.22, headSize * 0.5);
      visor.rotation.x = 0.15;
      capGroup.add(visor);
      headGroup.add(capGroup);
    } else if (acc === 'beanie') {
      const beanie = new THREE.Mesh(
        new THREE.CylinderGeometry(headSize * 0.54, headSize * 0.56, 0.32, 20),
        new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.5 })
      );
      beanie.position.set(0, headSize * 0.4, -0.01);
      headGroup.add(beanie);
    } else if (acc === 'sunglasses') {
      const sgGroup = new THREE.Group();
      const lensMat = new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.1,
        metalness: 0.8,
      });
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#ffd166',
        roughness: 0.2,
        metalness: 0.6,
      });

      const leftLens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.04), lensMat);
      leftLens.position.set(-0.11, 0.02, headSize * 0.5 + 0.02);
      const rightLens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.04), lensMat);
      rightLens.position.set(0.11, 0.02, headSize * 0.5 + 0.02);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.04), frameMat);
      bridge.position.set(0, 0.035, headSize * 0.5 + 0.02);

      sgGroup.add(leftLens);
      sgGroup.add(rightLens);
      sgGroup.add(bridge);
      headGroup.add(sgGroup);
    } else if (acc === 'glasses') {
      const gGroup = new THREE.Group();
      const wireMat = new THREE.MeshStandardMaterial({
        color: '#ffd166',
        roughness: 0.2,
        metalness: 0.8,
      });

      const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 8, 20), wireMat);
      leftRing.position.set(-0.11, 0.02, headSize * 0.5 + 0.01);
      const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 8, 20), wireMat);
      rightRing.position.set(0.11, 0.02, headSize * 0.5 + 0.01);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), wireMat);
      bridge.position.set(0, 0.035, headSize * 0.5 + 0.01);

      gGroup.add(leftRing);
      gGroup.add(rightRing);
      gGroup.add(bridge);
      headGroup.add(gGroup);
    }

    upperBodyGroup.add(headGroup);
    group.add(upperBodyGroup);

    // Center pivot point
    group.position.y = -1.15;
    scene.add(group);
    engineRef.current.mannequinGroup = group;
  }, []);

  // Update theme lighting & pedestal
  const applyTheme = useCallback((themeId) => {
    const themeObj = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const { pedestalMesh, ringLightMesh, dirLight, hemiLight, pedestalLight } = engineRef.current;

    if (pedestalMesh) {
      pedestalMesh.material.color.set(themeObj.modalTheme.pedestalColor);
    }
    if (ringLightMesh) {
      ringLightMesh.material.color.set(themeObj.modalTheme.accentColor);
    }
    if (pedestalLight) {
      pedestalLight.color.set(themeObj.modalTheme.accentColor);
    }
    if (dirLight) {
      dirLight.color.set(themeObj.modalTheme.ambientColor);
    }
  }, []);

  // Initialize Three.js WebGL Studio
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.1, engineRef.current.distance);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbde9ff, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.3);
    dirLight.position.set(4, 8, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x80e5ff, 0.6);
    backLight.position.set(-4, 3, -4);
    scene.add(backLight);

    const pedestalLight = new THREE.PointLight(0xff6b8b, 1.2, 4);
    pedestalLight.position.set(0, -1.0, 0.8);
    scene.add(pedestalLight);

    // 1. Studio Pedestal Base (Glowing round Lego baseplate)
    const pedestalGroup = new THREE.Group();
    const pedGeom = new THREE.CylinderGeometry(1.35, 1.45, 0.15, 32);
    const pedMat = new THREE.MeshStandardMaterial({
      color: '#ff8da1',
      roughness: 0.25,
      metalness: 0.1,
    });
    const pedestalMesh = new THREE.Mesh(pedGeom, pedMat);
    pedestalMesh.position.y = -1.22;
    pedestalMesh.receiveShadow = true;
    pedestalGroup.add(pedestalMesh);

    // Top studs circle on pedestal
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const studGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16);
      const stud = new THREE.Mesh(studGeom, pedMat);
      stud.position.set(Math.cos(a) * 1.05, -1.12, Math.sin(a) * 1.05);
      stud.receiveShadow = true;
      stud.castShadow = true;
      pedestalGroup.add(stud);
    }

    // Glowing rim
    const ringGeom = new THREE.TorusGeometry(1.42, 0.025, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#ff6b8b' });
    const ringLightMesh = new THREE.Mesh(ringGeom, ringMat);
    ringLightMesh.rotation.x = Math.PI / 2;
    ringLightMesh.position.y = -1.16;
    pedestalGroup.add(ringLightMesh);

    scene.add(pedestalGroup);

    // Save refs
    engineRef.current.scene = scene;
    engineRef.current.camera = camera;
    engineRef.current.renderer = renderer;
    engineRef.current.pedestalMesh = pedestalMesh;
    engineRef.current.ringLightMesh = ringLightMesh;
    engineRef.current.dirLight = dirLight;
    engineRef.current.hemiLight = hemiLight;
    engineRef.current.pedestalLight = pedestalLight;

    // Initial Mannequin Build
    buildMannequin(scene, config);
    applyTheme(config.theme || 'pastel_dream');

    // Animation Render Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      engineRef.current.tick += 1;
      const { tick, isAutoRotating } = engineRef.current;

      // Auto-rotate if toggled
      if (isAutoRotating) {
        engineRef.current.targetYaw += 0.012;
      }

      // Smooth damping lerp for yaw & pitch
      engineRef.current.yaw += (engineRef.current.targetYaw - engineRef.current.yaw) * 0.12;
      engineRef.current.pitch += (engineRef.current.targetPitch - engineRef.current.pitch) * 0.12;
      engineRef.current.distance += (engineRef.current.targetDistance - engineRef.current.distance) * 0.12;

      const { yaw, pitch, distance } = engineRef.current;

      // Camera orbital position
      const cy = Math.sin(pitch) * distance;
      const horizDist = Math.cos(pitch) * distance;
      const cx = Math.sin(yaw) * horizDist;
      const cz = Math.cos(yaw) * horizDist;

      camera.position.set(cx, cy - 0.1, cz);
      camera.lookAt(0, -0.15, 0);

      // Subtle breathing idle sway
      const mannequin = engineRef.current.mannequinGroup;
      if (mannequin) {
        const breathe = Math.sin(tick * 0.045) * 0.015;
        const upper = mannequin.getObjectByName('upperBody');
        if (upper) {
          upper.position.y = breathe;
        }
        const leftArm = mannequin.getObjectByName('leftArm');
        const rightArm = mannequin.getObjectByName('rightArm');
        if (leftArm) leftArm.rotation.x = Math.sin(tick * 0.045) * 0.05;
        if (rightArm) rightArm.rotation.x = -Math.sin(tick * 0.045) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();
    engineRef.current.animId = animId;

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height, buildMannequin, applyTheme]);

  // React to config updates live
  useEffect(() => {
    if (engineRef.current.scene) {
      buildMannequin(engineRef.current.scene, config);
      applyTheme(config.theme || 'pastel_dream');
    }
  }, [config, buildMannequin, applyTheme]);

  // Pointer drag interaction
  const handlePointerDown = (e) => {
    engineRef.current.isDragging = true;
    engineRef.current.lastX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    engineRef.current.lastY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  };

  const handlePointerMove = (e) => {
    if (!engineRef.current.isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    const deltaX = clientX - engineRef.current.lastX;
    const deltaY = clientY - engineRef.current.lastY;

    engineRef.current.lastX = clientX;
    engineRef.current.lastY = clientY;

    engineRef.current.targetYaw += deltaX * 0.012;
    // Clamp pitch
    engineRef.current.targetPitch = Math.max(
      -0.4,
      Math.min(0.65, engineRef.current.targetPitch - deltaY * 0.008)
    );
  };

  const handlePointerUp = () => {
    engineRef.current.isDragging = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  // Quick Controls
  const handleResetView = (e) => {
    e.stopPropagation();
    engineRef.current.targetYaw = 0.35;
    engineRef.current.targetPitch = 0.15;
    engineRef.current.targetDistance = 4.6;
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    engineRef.current.targetDistance = Math.max(3.2, engineRef.current.targetDistance - 0.5);
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    engineRef.current.targetDistance = Math.min(6.2, engineRef.current.targetDistance + 0.5);
  };

  const handleToggleAutoRotate = (e) => {
    e.stopPropagation();
    const nextVal = !autoRotate;
    setAutoRotate(nextVal);
    engineRef.current.isAutoRotating = nextVal;
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
    >
      <div ref={containerRef} className="w-full h-full flex items-center justify-center drop-shadow-2xl" />

      {/* Floating 3D Navigation Controls Toolbar */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5 p-1 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-sm z-20">
        <button
          onClick={handleToggleAutoRotate}
          title={autoRotate ? 'Pause auto-spin' : 'Auto-spin 360°'}
          className={`p-1.5 rounded-xl transition ${
            autoRotate
              ? 'bg-tropical-coral text-white shadow-sm'
              : 'text-slate-600 hover:bg-black/5 hover:text-slate-900'
          }`}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleResetView}
          title="Reset Camera Angle"
          className="p-1.5 rounded-xl text-slate-600 hover:bg-black/5 hover:text-slate-900 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded-xl text-slate-600 hover:bg-black/5 hover:text-slate-900 transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded-xl text-slate-600 hover:bg-black/5 hover:text-slate-900 transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 360 Rotation Hint pill */}
      <div className="absolute bottom-2 px-3 py-1 rounded-full bg-white/75 backdrop-blur-md text-[11px] font-medium text-slate-600 border border-white/80 shadow-sm pointer-events-none flex items-center space-x-1.5">
        <span>⇄</span>
        <span>Drag to rotate 360°</span>
      </div>
    </div>
  );
}
