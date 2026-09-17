import React, { useRef, useEffect, useState } from 'react';
import { BODY_FORMS } from '../types/avatar';

export default function AvatarCanvas({ config, width = 340, height = 440 }) {
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const [yaw, setYaw] = useState(0.35); // Initial angled view

  // Handle Drag to Rotate
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    setYaw((prev) => prev + deltaX * 0.012);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let tick = 0;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    // Retrieve body form metrics
    const formConfig = BODY_FORMS.find((b) => b.id === config.bodyForm) || BODY_FORMS[2];
    const { torsoWidth, torsoHeight, shoulderWidth, legHeight } = formConfig;

    // Helper: 3D Projection math (Orthographic rotated around Y axis)
    const project3D = (x, y, z, originX, originY, scale = 1.35) => {
      // Rotate around Y axis by yaw
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      const rotX = x * cosY - z * sinY;
      const rotZ = x * sinY + z * cosY;

      // Isometric tilt (angle around X axis)
      const pitch = 0.22;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const projX = originX + rotX * scale;
      const projY = originY + (y * cosP + rotZ * sinP) * scale;
      const depth = rotZ; // For z-sorting if needed

      return { x: projX, y: projY, depth, rotX, rotZ };
    };

    // Helper: Draw 3D Box/Cube with directional lighting
    const drawBox = (cx, cy, cz, w, h, d, color, originX, originY, scale = 1.35, cornerRadius = 0) => {
      const hw = w / 2;
      const hh = h / 2;
      const hd = d / 2;

      // 8 corners of the box
      const corners = [
        project3D(cx - hw, cy - hh, cz - hd, originX, originY, scale), // 0: left top back
        project3D(cx + hw, cy - hh, cz - hd, originX, originY, scale), // 1: right top back
        project3D(cx + hw, cy - hh, cz + hd, originX, originY, scale), // 2: right top front
        project3D(cx - hw, cy - hh, cz + hd, originX, originY, scale), // 3: left top front
        project3D(cx - hw, cy + hh, cz - hd, originX, originY, scale), // 4: left btm back
        project3D(cx + hw, cy + hh, cz - hd, originX, originY, scale), // 5: right btm back
        project3D(cx + hw, cy + hh, cz + hd, originX, originY, scale), // 6: right btm front
        project3D(cx - hw, cy + hh, cz + hd, originX, originY, scale), // 7: left btm front
      ];

      // Lighting normals based on yaw
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      // Top face (always visible)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Front Face (+Z)
      if (cosY > -0.15) {
        ctx.fillStyle = shadeColor(color, -10);
        ctx.beginPath();
        ctx.moveTo(corners[3].x, corners[3].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[6].x, corners[6].y);
        ctx.lineTo(corners[7].x, corners[7].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.stroke();
      }

      // Right Face (+X)
      if (sinY > -0.15) {
        ctx.fillStyle = shadeColor(color, -25);
        ctx.beginPath();
        ctx.moveTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[5].x, corners[5].y);
        ctx.lineTo(corners[6].x, corners[6].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.stroke();
      }

      // Left Face (-X)
      if (sinY < 0.15) {
        ctx.fillStyle = shadeColor(color, -18);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.lineTo(corners[7].x, corners[7].y);
        ctx.lineTo(corners[4].x, corners[4].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.stroke();
      }

      // Back Face (-Z)
      if (cosY < 0.15) {
        ctx.fillStyle = shadeColor(color, -30);
        ctx.beginPath();
        ctx.moveTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[4].x, corners[4].y);
        ctx.lineTo(corners[5].x, corners[5].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.stroke();
      }
    };

    // Color lighting shader
    function shadeColor(color, percent) {
      if (!color || color.startsWith('rgba')) return color || '#ffffff';
      let num = parseInt(color.replace('#', ''), 16);
      if (isNaN(num)) return color;
      let amt = Math.round(2.55 * percent);
      let R = (num >> 16) + amt;
      let B = ((num >> 8) & 0x00FF) + amt;
      let G = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 + (G < 255 ? (G < 1 ? 0 : G) : 255)).toString(16).slice(1);
    }

    // Render loop
    const render = () => {
      tick += 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const originX = width / 2;
      const originY = height / 2 + 35;
      const scale = 1.6;

      // Idle breathing offset
      const breathe = Math.sin(tick * 0.04) * 2;

      // 1. Pedestal Studio Circle
      ctx.save();
      const pedGrad = ctx.createRadialGradient(originX, originY + 125, 10, originX, originY + 125, 110);
      pedGrad.addColorStop(0, 'rgba(255, 107, 139, 0.35)');
      pedGrad.addColorStop(0.5, 'rgba(255, 209, 102, 0.2)');
      pedGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(originX, originY + 125, 95, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(originX, originY + 125, 75, 28, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Shadow below feet
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(originX, originY + 123, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. SHOES & FEET
      const shoeW = 16;
      const shoeH = 14;
      const shoeD = 22;
      const legSpacing = 13;
      const footY = 100 * legHeight;

      // Left Shoe
      drawBox(-legSpacing, footY, 2, shoeW, shoeH, shoeD, config.shoeColor, originX, originY, scale);
      // Right Shoe
      drawBox(legSpacing, footY, 2, shoeW, shoeH, shoeD, config.shoeColor, originX, originY, scale);

      // 3. LEGS & BOTTOMS
      const legW = 14;
      const legH = 45 * legHeight;
      const legD = 15;
      const legCenterY = footY - shoeH / 2 - legH / 2;

      // Left Leg
      drawBox(-legSpacing, legCenterY, 0, legW, legH, legD, config.bottomColor, originX, originY, scale);
      // Right Leg
      drawBox(legSpacing, legCenterY, 0, legW, legH, legD, config.bottomColor, originX, originY, scale);

      // 4. TORSO & TOP
      const tw = 40 * torsoWidth * shoulderWidth;
      const th = 48 * torsoHeight;
      const td = 24 * torsoWidth;
      const torsoY = legCenterY - legH / 2 - th / 2 + breathe;

      drawBox(0, torsoY, 0, tw, th, td, config.topColor, originX, originY, scale);

      // Collar / Button Detail on Top
      if (config.topStyle === 'resort_shirt') {
        const collar = project3D(0, torsoY - th / 3, td / 2 + 1, originX, originY, scale);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(collar.x, collar.y, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. ARMS & SLEEVES
      const armW = 11;
      const armH = 42 * torsoHeight;
      const armD = 12;
      const armY = torsoY + 4;
      const armOffset = tw / 2 + armW / 2 + 1;

      // Left Arm
      drawBox(-armOffset, armY, 0, armW, armH, armD, config.topColor, originX, originY, scale);
      // Left Hand
      drawBox(-armOffset, armY + armH / 2 + 4, 0, 9, 9, 9, config.skinTone, originX, originY, scale);

      // Right Arm
      drawBox(armOffset, armY, 0, armW, armH, armD, config.topColor, originX, originY, scale);
      // Right Hand
      drawBox(armOffset, armY + armH / 2 + 4, 0, 9, 9, 9, config.skinTone, originX, originY, scale);

      // 6. HEAD & FACE
      const headSize = 38;
      const headY = torsoY - th / 2 - headSize / 2 - 2;

      // Head Cube
      drawBox(0, headY, 0, headSize, headSize, headSize, config.skinTone, originX, originY, scale);

      // Facial Features (Only when facing forward-ish)
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      if (cosY > 0.1) {
        // Face plane
        const eyeSpacing = 7;
        const eyeY = headY - 1;
        const eyeZ = headSize / 2 + 1;

        // Left Eye
        const lEye = project3D(-eyeSpacing, eyeY, eyeZ, originX, originY, scale);
        // Right Eye
        const rEye = project3D(eyeSpacing, eyeY, eyeZ, originX, originY, scale);

        // Blinking logic
        const isBlinking = tick % 140 > 132;
        ctx.fillStyle = '#18181b';
        if (isBlinking) {
          ctx.fillRect(lEye.x - 2.5 * scale, lEye.y, 5 * scale, 1.5 * scale);
          ctx.fillRect(rEye.x - 2.5 * scale, rEye.y, 5 * scale, 1.5 * scale);
        } else {
          ctx.beginPath();
          ctx.arc(lEye.x, lEye.y, 2.5 * scale, 0, Math.PI * 2);
          ctx.arc(rEye.x, rEye.y, 2.5 * scale, 0, Math.PI * 2);
          ctx.fill();

          // Cute white eye glint
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(lEye.x + 0.8 * scale, lEye.y - 0.8 * scale, 1 * scale, 0, Math.PI * 2);
          ctx.arc(rEye.x + 0.8 * scale, rEye.y - 0.8 * scale, 1 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rosy Cheeks
        ctx.fillStyle = 'rgba(255, 107, 139, 0.4)';
        const lCheek = project3D(-eyeSpacing - 3, eyeY + 5, eyeZ, originX, originY, scale);
        const rCheek = project3D(eyeSpacing + 3, eyeY + 5, eyeZ, originX, originY, scale);
        ctx.beginPath();
        ctx.arc(lCheek.x, lCheek.y, 2.5 * scale, 0, Math.PI * 2);
        ctx.arc(rCheek.x, rCheek.y, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        const mouth = project3D(0, eyeY + 6, eyeZ, originX, originY, scale);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(mouth.x, mouth.y, 3 * scale, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Glasses Accessory
        if (config.accessory === 'sunglasses') {
          ctx.fillStyle = '#1e293b';
          const glassL = project3D(-eyeSpacing, eyeY, eyeZ + 2, originX, originY, scale);
          const glassR = project3D(eyeSpacing, eyeY, eyeZ + 2, originX, originY, scale);
          ctx.fillRect(glassL.x - 5 * scale, glassL.y - 4 * scale, 9 * scale, 7 * scale);
          ctx.fillRect(glassR.x - 4 * scale, glassR.y - 4 * scale, 9 * scale, 7 * scale);
          // Bridge
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.moveTo(glassL.x + 3 * scale, glassL.y);
          ctx.lineTo(glassR.x - 3 * scale, glassR.y);
          ctx.stroke();
        } else if (config.accessory === 'glasses') {
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 1.5 * scale;
          const glassL = project3D(-eyeSpacing, eyeY, eyeZ + 2, originX, originY, scale);
          const glassR = project3D(eyeSpacing, eyeY, eyeZ + 2, originX, originY, scale);
          ctx.beginPath();
          ctx.arc(glassL.x, glassL.y, 4 * scale, 0, Math.PI * 2);
          ctx.arc(glassR.x, glassR.y, 4 * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(glassL.x + 4 * scale, glassL.y);
          ctx.lineTo(glassR.x - 4 * scale, glassR.y);
          ctx.stroke();
        }
      }

      // 7. HAIR STYLES
      const hairColor = config.hairColor;
      const hs = config.hairStyle;

      if (hs === 'curls' || hs === 'afro') {
        const r = hs === 'afro' ? 26 : 22;
        // Volumetric textured crown
        drawBox(0, headY - headSize / 2 - 4, 0, headSize + 8, 14, headSize + 8, hairColor, originX, originY, scale);
        drawBox(-headSize / 2 - 3, headY - 4, 0, 10, headSize - 4, headSize + 4, hairColor, originX, originY, scale);
        drawBox(headSize / 2 + 3, headY - 4, 0, 10, headSize - 4, headSize + 4, hairColor, originX, originY, scale);
        drawBox(0, headY - 2, -headSize / 2 - 3, headSize + 6, headSize, 10, hairColor, originX, originY, scale);
      } else if (hs === 'locs' || hs === 'braids') {
        drawBox(0, headY - headSize / 2 - 3, 0, headSize + 6, 12, headSize + 6, hairColor, originX, originY, scale);
        // Cascading side loc strands
        drawBox(-headSize / 2 - 3, headY + 8, 2, 8, 30, 10, hairColor, originX, originY, scale);
        drawBox(headSize / 2 + 3, headY + 8, 2, 8, 30, 10, hairColor, originX, originY, scale);
        drawBox(0, headY + 12, -headSize / 2 - 3, headSize, 32, 8, hairColor, originX, originY, scale);
      } else if (hs === 'fade') {
        // Tapered modern crop
        drawBox(0, headY - headSize / 2 - 3, 0, headSize + 4, 10, headSize + 4, hairColor, originX, originY, scale);
        drawBox(0, headY - 4, -headSize / 2 - 1, headSize + 2, headSize - 8, 4, hairColor, originX, originY, scale);
      } else if (hs === 'bob') {
        // Sleek chin-length cut
        drawBox(0, headY - headSize / 2 - 3, 0, headSize + 6, 12, headSize + 6, hairColor, originX, originY, scale);
        drawBox(-headSize / 2 - 2, headY + 4, 0, 8, 22, headSize + 4, hairColor, originX, originY, scale);
        drawBox(headSize / 2 + 2, headY + 4, 0, 8, 22, headSize + 4, hairColor, originX, originY, scale);
        drawBox(0, headY + 4, -headSize / 2 - 2, headSize + 4, 22, 8, hairColor, originX, originY, scale);
      } else if (hs === 'long_flowy') {
        // Cascading wavy locks
        drawBox(0, headY - headSize / 2 - 3, 0, headSize + 6, 12, headSize + 6, hairColor, originX, originY, scale);
        drawBox(-headSize / 2 - 3, headY + 12, 0, 8, 36, 12, hairColor, originX, originY, scale);
        drawBox(headSize / 2 + 3, headY + 12, 0, 8, 36, 12, hairColor, originX, originY, scale);
        drawBox(0, headY + 16, -headSize / 2 - 3, headSize + 4, 40, 8, hairColor, originX, originY, scale);
      } else {
        // Pixie crop
        drawBox(0, headY - headSize / 2 - 3, 0, headSize + 4, 10, headSize + 4, hairColor, originX, originY, scale);
        drawBox(0, headY - 6, -headSize / 2 - 2, headSize + 2, 16, 6, hairColor, originX, originY, scale);
      }

      // 8. HEADWEAR ACCESSORIES
      if (config.accessory === 'sun_cap') {
        // Visor Dad Cap
        drawBox(0, headY - headSize / 2 - 6, 0, headSize + 6, 8, headSize + 6, '#ff6b8b', originX, originY, scale);
        drawBox(0, headY - headSize / 2 - 2, headSize / 2 + 8, headSize + 2, 3, 14, '#ff8da1', originX, originY, scale);
      } else if (config.accessory === 'beanie') {
        // Folded knit dome
        drawBox(0, headY - headSize / 2 - 8, 0, headSize + 8, 16, headSize + 8, '#ffd166', originX, originY, scale);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [config, yaw, width, height]);

  return (
    <div
      className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="block drop-shadow-2xl"
      />
      {/* 360 Rotation Hint */}
      <div className="absolute bottom-3 px-3 py-1 rounded-full tropical-glass text-[11px] font-medium text-slate-600 border border-white/80 shadow-sm pointer-events-none">
        ⇄ Drag to rotate 360°
      </div>
    </div>
  );
}
