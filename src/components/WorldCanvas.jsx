import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';
import { DOMAINS, VIEW_MODES, ALL_ITEMS } from '../types/world';

export default function WorldCanvas() {
  const {
    activeDomain,
    viewMode,
    selectedTool,
    selectedItemId,
    brushSize,
    camera,
    exteriorGrid,
    interiorGrid,
    inspectedTile,
  } = useWorldStore();

  const grid = activeDomain === DOMAINS.EXTERIOR ? exteriorGrid : interiorGrid;
  const gridSize = grid.length;

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cameraStartRef = useRef({ x: 0, y: 0 });
  const isPaintingRef = useRef(false);
  const lastPaintedTileRef = useRef(null);

  const [hoveredTile, setHoveredTile] = useState(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Isometric dimensions
  const TILE_WIDTH = 70;
  const TILE_HEIGHT = 35;
  const TILE_WIDTH_HALF = TILE_WIDTH / 2;
  const TILE_HEIGHT_HALF = TILE_HEIGHT / 2;
  const ELEVATION_STEP = 14;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') setIsSpacePressed(true);
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) worldStore.redo();
        else worldStore.undo();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Screen transformations
  const isoToScreen = useCallback((gx, gy, elev = 0, centerX, centerY) => {
    const screenX = centerX + camera.x + (gx - gy) * (TILE_WIDTH_HALF * camera.zoom);
    const screenY = centerY + camera.y + (gx + gy) * (TILE_HEIGHT_HALF * camera.zoom) - (elev * ELEVATION_STEP * camera.zoom);
    return { screenX, screenY };
  }, [camera]);

  const topDownToScreen = useCallback((gx, gy, elev = 0, centerX, centerY) => {
    const size = TILE_WIDTH * 0.8 * camera.zoom;
    const startX = centerX + camera.x - (gridSize * size) / 2;
    const startY = centerY + camera.y - (gridSize * size) / 2;
    const screenX = startX + gx * size;
    const screenY = startY + gy * size - (elev * 3 * camera.zoom);
    return { screenX, screenY, size };
  }, [camera, gridSize]);

  const screenToIso = useCallback((sx, sy, centerX, centerY) => {
    const adjustedX = (sx - (centerX + camera.x)) / camera.zoom;
    const adjustedY = (sy - (centerY + camera.y)) / camera.zoom;
    const gx = Math.floor((adjustedX / TILE_WIDTH_HALF + adjustedY / TILE_HEIGHT_HALF) / 2);
    const gy = Math.floor((adjustedY / TILE_HEIGHT_HALF - adjustedX / TILE_WIDTH_HALF) / 2);
    return { gx, gy };
  }, [camera]);

  const screenToTopDown = useCallback((sx, sy, centerX, centerY) => {
    const size = TILE_WIDTH * 0.8 * camera.zoom;
    const startX = centerX + camera.x - (gridSize * size) / 2;
    const startY = centerY + camera.y - (gridSize * size) / 2;
    const gx = Math.floor((sx - startX) / size);
    const gy = Math.floor((sy - startY) / size);
    return { gx, gy };
  }, [camera, gridSize]);

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const isPan = e.button === 1 || e.button === 2 || isSpacePressed || selectedTool === 'inspect';
    if (isPan) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      cameraStartRef.current = { x: camera.x, y: camera.y };
      return;
    }

    if (e.button === 0) {
      isPaintingRef.current = true;
      applyActionAtMouse(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      worldStore.setCamera(cameraStartRef.current.x + dx, cameraStartRef.current.y + dy, camera.zoom);
      return;
    }

    const tileCoord = viewMode === VIEW_MODES.ISOMETRIC
      ? screenToIso(mouseX, mouseY, centerX, centerY)
      : screenToTopDown(mouseX, mouseY, centerX, centerY);

    if (tileCoord.gx >= 0 && tileCoord.gx < gridSize && tileCoord.gy >= 0 && tileCoord.gy < gridSize) {
      setHoveredTile(tileCoord);
      if (isPaintingRef.current) {
        if (!lastPaintedTileRef.current ||
            lastPaintedTileRef.current.gx !== tileCoord.gx ||
            lastPaintedTileRef.current.gy !== tileCoord.gy) {
          applyActionAtMouse(e.clientX, e.clientY);
        }
      }
    } else {
      setHoveredTile(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPaintingRef.current = false;
    lastPaintedTileRef.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    worldStore.setCamera(camera.x, camera.y, camera.zoom * zoomFactor);
  };

  const applyActionAtMouse = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tileCoord = viewMode === VIEW_MODES.ISOMETRIC
      ? screenToIso(mouseX, mouseY, centerX, centerY)
      : screenToTopDown(mouseX, mouseY, centerX, centerY);

    if (tileCoord.gx >= 0 && tileCoord.gx < gridSize && tileCoord.gy >= 0 && tileCoord.gy < gridSize) {
      lastPaintedTileRef.current = tileCoord;
      if (selectedTool === 'inspect') {
        worldStore.inspectTile(tileCoord.gx, tileCoord.gy);
      } else {
        worldStore.placeItem(tileCoord.gx, tileCoord.gy);
      }
    }
  };

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Drifting tropical clouds
    const clouds = [
      { x: 50, y: 80, scale: 1.2, speed: 0.15 },
      { x: 380, y: 130, scale: 0.9, speed: 0.1 },
      { x: 800, y: 60, scale: 1.4, speed: 0.18 },
      { x: 1200, y: 110, scale: 1.0, speed: 0.12 },
    ];

    let tick = 0;

    const render = () => {
      tick += 1;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Sunny Tropical Azure Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#53baf6'); // Deep warm azure sky
      skyGrad.addColorStop(0.45, '#9ee0ff'); // Soft horizon blue
      skyGrad.addColorStop(0.75, '#d8f3ff'); // Tropical mist
      skyGrad.addColorStop(1, '#fff5ea'); // Warm sunny ground reflection
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Warm Sun Flare in Upper Right
      const sunGrad = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, 220);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGrad.addColorStop(0.2, 'rgba(255, 240, 180, 0.6)');
      sunGrad.addColorStop(0.6, 'rgba(255, 220, 150, 0.15)');
      sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Stylized Drifting Fluffy White Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      clouds.forEach(c => {
        c.x += c.speed;
        if (c.x > width + 200) c.x = -200;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.arc(22, -6, 28, 0, Math.PI * 2);
        ctx.arc(50, -2, 22, 0, Math.PI * 2);
        ctx.arc(70, 4, 18, 0, Math.PI * 2);
        ctx.arc(36, 12, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const centerX = width / 2;
      const centerY = height / 2;
      const zoom = camera.zoom;
      const tw = TILE_WIDTH * zoom;
      const th = TILE_HEIGHT * zoom;
      const twh = tw / 2;
      const thh = th / 2;
      const elevStep = ELEVATION_STEP * zoom;

      // Draw Grid Tiles
      if (viewMode === VIEW_MODES.ISOMETRIC) {
        // Back-to-front painter's algorithm
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const tile = grid[y]?.[x];
            if (!tile) continue;

            const elev = tile.elevation || 0;
            const baseItem = ALL_ITEMS[tile.base] || ALL_ITEMS['ground_sand'];
            const propItem = tile.prop ? ALL_ITEMS[tile.prop] : null;

            const { screenX, screenY } = isoToScreen(x, y, elev, centerX, centerY);

            const isHovered = hoveredTile && (
              brushSize === 1
                ? (hoveredTile.gx === x && hoveredTile.gy === y)
                : (Math.abs(hoveredTile.gx - x) <= 1 && Math.abs(hoveredTile.gy - y) <= 1)
            );
            const isInspected = inspectedTile && inspectedTile.x === x && inspectedTile.y === y && inspectedTile.domain === activeDomain;

            // ----------------------------------------
            // 1. Draw Base 3D Tile (Ground / Flooring)
            // ----------------------------------------
            const baseHeight = (elev + 1) * elevStep;
            const colors = baseItem.colors || { top: '#fff6ed', sideLeft: '#fae1dd', sideRight: '#ebd2cc' };

            // Left Side Wall
            ctx.beginPath();
            ctx.moveTo(screenX - twh, screenY);
            ctx.lineTo(screenX, screenY + thh);
            ctx.lineTo(screenX, screenY + thh + baseHeight);
            ctx.lineTo(screenX - twh, screenY + baseHeight);
            ctx.closePath();
            ctx.fillStyle = colors.sideLeft || '#fae1dd';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Right Side Wall
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + thh);
            ctx.lineTo(screenX + twh, screenY);
            ctx.lineTo(screenX + twh, screenY + baseHeight);
            ctx.lineTo(screenX, screenY + thh + baseHeight);
            ctx.closePath();
            ctx.fillStyle = colors.sideRight || '#ebd2cc';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Top Diamond Face
            ctx.beginPath();
            ctx.moveTo(screenX, screenY - thh);
            ctx.lineTo(screenX + twh, screenY);
            ctx.lineTo(screenX, screenY + thh);
            ctx.lineTo(screenX - twh, screenY);
            ctx.closePath();

            // Ground styling details
            if (tile.base === 'ground_pool') {
              // Animated turquoise water ripples
              const ripple = Math.sin(tick * 0.05 + x * 0.8 + y * 0.8) * 0.15 + 0.85;
              const poolGrad = ctx.createLinearGradient(screenX - twh, screenY, screenX + twh, screenY);
              poolGrad.addColorStop(0, '#48cae4');
              poolGrad.addColorStop(1, '#00b4d8');
              ctx.fillStyle = poolGrad;
              ctx.fill();

              // Water sparkles
              ctx.fillStyle = `rgba(255, 255, 255, ${ripple * 0.4})`;
              ctx.beginPath();
              ctx.arc(screenX, screenY, 4 * zoom, 0, Math.PI * 2);
              ctx.fill();
            } else if (tile.base === 'ground_patio') {
              // Coral patio with yellow circular accent
              ctx.fillStyle = '#ff8da1';
              ctx.fill();
              ctx.strokeStyle = '#fee440';
              ctx.lineWidth = 1.5 * zoom;
              ctx.stroke();
            } else if (tile.base === 'int_floor_terrazzo') {
              ctx.fillStyle = '#f8edeb';
              ctx.fill();
              // Terrazzo specks
              ctx.fillStyle = '#ff6b8b';
              ctx.fillRect(screenX - 4 * zoom, screenY - 2 * zoom, 1.5 * zoom, 1.5 * zoom);
              ctx.fillStyle = '#ffd166';
              ctx.fillRect(screenX + 5 * zoom, screenY + 1 * zoom, 1.5 * zoom, 1.5 * zoom);
              ctx.fillStyle = '#2ec4b6';
              ctx.fillRect(screenX - 2 * zoom, screenY + 4 * zoom, 1.5 * zoom, 1.5 * zoom);
            } else {
              ctx.fillStyle = colors.top;
              ctx.fill();
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // ----------------------------------------
            // 2. Draw 2.5D Architecture / Props / Decor
            // ----------------------------------------
            if (propItem) {
              const pid = propItem.id;

              // A. ARCHITECTURE (From Reference Photo!)
              if (pid === 'arch_pink_pavilion') {
                // Coral Pink Curved Upper Pavilion with Panoramic Glass Window
                const pavilionHeight = 36 * zoom;
                // Left curve
                ctx.fillStyle = '#ff6b8b';
                ctx.beginPath();
                ctx.moveTo(screenX - twh * 0.9, screenY);
                ctx.lineTo(screenX, screenY + thh * 0.9);
                ctx.lineTo(screenX, screenY + thh * 0.9 - pavilionHeight);
                ctx.lineTo(screenX - twh * 0.9, screenY - pavilionHeight);
                ctx.closePath();
                ctx.fill();

                // Right curve (with large panoramic glass window)
                ctx.fillStyle = '#e6496f';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY + thh * 0.9);
                ctx.lineTo(screenX + twh * 0.9, screenY);
                ctx.lineTo(screenX + twh * 0.9, screenY - pavilionHeight);
                ctx.lineTo(screenX, screenY + thh * 0.9 - pavilionHeight);
                ctx.closePath();
                ctx.fill();

                // Panoramic Window
                ctx.fillStyle = 'rgba(224, 247, 250, 0.85)';
                ctx.beginPath();
                ctx.moveTo(screenX + 4 * zoom, screenY + thh * 0.7 - 6 * zoom);
                ctx.lineTo(screenX + twh * 0.8, screenY - 2 * zoom);
                ctx.lineTo(screenX + twh * 0.8, screenY - pavilionHeight + 8 * zoom);
                ctx.lineTo(screenX + 4 * zoom, screenY + thh * 0.7 - pavilionHeight + 4 * zoom);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 * zoom;
                ctx.stroke();

                // Soft White Curtains in window
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(screenX + twh * 0.5, screenY - pavilionHeight + 9 * zoom, 6 * zoom, 16 * zoom);

                // Top Roof Cap in soft pastel pink
                ctx.fillStyle = '#ff8da1';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - thh * 0.9 - pavilionHeight);
                ctx.lineTo(screenX + twh * 0.9, screenY - pavilionHeight);
                ctx.lineTo(screenX, screenY + thh * 0.9 - pavilionHeight);
                ctx.lineTo(screenX - twh * 0.9, screenY - pavilionHeight);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 * zoom;
                ctx.stroke();
              }
              else if (pid === 'arch_blue_tower') {
                // Aqua Cylindrical Curved Tower (Upper right in photo)
                const towerH = 44 * zoom;
                const r = twh * 0.75;
                ctx.fillStyle = '#00bbf9';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY, r, r * 0.5, 0, 0, Math.PI);
                ctx.lineTo(screenX - r, screenY - towerH);
                ctx.ellipse(screenX, screenY - towerH, r, r * 0.5, 0, Math.PI, 0, true);
                ctx.closePath();
                ctx.fill();

                // Top Dome Cap
                ctx.fillStyle = '#80e5ff';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY - towerH, r, r * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 * zoom;
                ctx.stroke();
              }
              else if (pid === 'arch_yellow_terrace') {
                // Sunshine Yellow Cantilevered Rounded Balcony (Middle right in photo)
                const terraceH = 20 * zoom;
                const r = twh * 0.9;
                ctx.fillStyle = '#ffd166';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY, r, r * 0.5, 0, 0, Math.PI);
                ctx.lineTo(screenX - r, screenY - terraceH);
                ctx.ellipse(screenX, screenY - terraceH, r, r * 0.5, 0, Math.PI, 0, true);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#fee440';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY - terraceH, r, r * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Glass Handrail
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.lineWidth = 2 * zoom;
                ctx.beginPath();
                ctx.ellipse(screenX, screenY - terraceH - 6 * zoom, r * 0.95, r * 0.48, 0, 0, Math.PI);
                ctx.stroke();
              }
              else if (pid === 'arch_yellow_stairs') {
                // Yellow Architectural Stairs (Center foreground in photo)
                const numSteps = 5;
                const stepH = 4 * zoom;
                for (let s = 0; s < numSteps; s++) {
                  const sy = screenY + (s * stepH) - 10 * zoom;
                  const sx = screenX - (s * 3 * zoom);
                  const sw = (24 - s * 2) * zoom;
                  ctx.fillStyle = '#ffd166';
                  ctx.fillRect(sx - sw / 2, sy, sw, 3 * zoom);
                  ctx.fillStyle = '#fee440';
                  ctx.fillRect(sx - sw / 2, sy - 2 * zoom, sw, 2 * zoom);
                }
                // White sidewall
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 * zoom;
                ctx.beginPath();
                ctx.moveTo(screenX - 14 * zoom, screenY - 12 * zoom);
                ctx.lineTo(screenX - 22 * zoom, screenY + 12 * zoom);
                ctx.stroke();
              }
              else if (pid === 'arch_glass_atrium') {
                // Ground glass suite with white columns
                const h = 24 * zoom;
                ctx.fillStyle = 'rgba(224, 247, 250, 0.75)';
                ctx.fillRect(screenX - 15 * zoom, screenY - h, 30 * zoom, h);
                // White frames
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 * zoom;
                ctx.strokeRect(screenX - 15 * zoom, screenY - h, 30 * zoom, h);
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - h);
                ctx.lineTo(screenX, screenY);
                ctx.stroke();
              }

              // B. TROPICAL PALMS & FLORA (From Reference Photo!)
              else if (pid === 'flora_royal_palm' || pid === 'flora_coconut_palm') {
                // Tall Tropical Palm Tree with slender curving trunk and lush fronds
                const trunkH = pid === 'flora_royal_palm' ? 52 * zoom : 42 * zoom;
                const curve = Math.sin(x * 1.5) * 6 * zoom;

                // Slender Curved Trunk
                ctx.strokeStyle = '#c68b59';
                ctx.lineWidth = 3.5 * zoom;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.quadraticCurveTo(screenX + curve, screenY - trunkH * 0.6, screenX + curve * 1.4, screenY - trunkH);
                ctx.stroke();

                // Coconut cluster
                const crownX = screenX + curve * 1.4;
                const crownY = screenY - trunkH;
                ctx.fillStyle = '#8d5b4c';
                ctx.beginPath();
                ctx.arc(crownX - 2 * zoom, crownY + 2 * zoom, 2 * zoom, 0, Math.PI * 2);
                ctx.arc(crownX + 2 * zoom, crownY + 2 * zoom, 2 * zoom, 0, Math.PI * 2);
                ctx.fill();

                // Radiating Cascading Fronds (Emerald palm leaves)
                const sway = Math.sin(tick * 0.04 + x + y) * 2 * zoom;
                const numFronds = 7;
                for (let f = 0; f < numFronds; f++) {
                  const angle = (f / numFronds) * Math.PI * 2;
                  const frondLen = (20 + Math.sin(f * 2) * 4) * zoom;
                  const fx = crownX + Math.cos(angle) * frondLen + sway;
                  const fy = crownY + Math.sin(angle) * (frondLen * 0.5) + (angle > 0 ? 6 * zoom : -2 * zoom);

                  ctx.strokeStyle = '#2ec4b6';
                  ctx.lineWidth = 3 * zoom;
                  ctx.beginPath();
                  ctx.moveTo(crownX, crownY);
                  ctx.quadraticCurveTo(crownX + Math.cos(angle) * (frondLen * 0.6), crownY - 6 * zoom, fx, fy);
                  ctx.stroke();

                  ctx.strokeStyle = '#57cc99';
                  ctx.lineWidth = 1.5 * zoom;
                  ctx.stroke();
                }
              }
              else if (pid === 'flora_bougainvillea') {
                // Magenta & Purple flowering bush (nestled at base in photo)
                const bushR = 10 * zoom;
                ctx.fillStyle = '#7209b7';
                ctx.beginPath();
                ctx.arc(screenX, screenY - 4 * zoom, bushR, 0, Math.PI * 2);
                ctx.fill();

                // Vivid magenta flowers
                ctx.fillStyle = '#f72585';
                for (let b = 0; b < 6; b++) {
                  const bx = screenX + Math.cos(b * 1.1) * (bushR * 0.65);
                  const by = screenY - 4 * zoom + Math.sin(b * 1.1) * (bushR * 0.65);
                  ctx.beginPath();
                  ctx.arc(bx, by, 3 * zoom, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              else if (pid === 'flora_white_boulders') {
                // Smooth White Sculpted Boulders
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(screenX - 4 * zoom, screenY - 2 * zoom, 7 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ced4da';
                ctx.lineWidth = 1 * zoom;
                ctx.stroke();

                ctx.fillStyle = '#f1f5f9';
                ctx.beginPath();
                ctx.ellipse(screenX + 5 * zoom, screenY, 5 * zoom, 4 * zoom, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              }
              else if (pid === 'amenity_sun_cabana') {
                // Striped Beach Umbrella & Lounger
                const poleH = 26 * zoom;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 * zoom;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX, screenY - poleH);
                ctx.stroke();

                // Umbrella Canopy
                ctx.fillStyle = '#ff6b8b';
                ctx.beginPath();
                ctx.arc(screenX, screenY - poleH, 14 * zoom, Math.PI, 0);
                ctx.closePath();
                ctx.fill();

                // White stripes
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(screenX, screenY - poleH, 14 * zoom, Math.PI * 1.25, Math.PI * 1.45);
                ctx.lineTo(screenX, screenY - poleH);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(screenX, screenY - poleH, 14 * zoom, Math.PI * 1.55, Math.PI * 1.75);
                ctx.lineTo(screenX, screenY - poleH);
                ctx.closePath();
                ctx.fill();
              }

              // C. INTERIOR FURNITURE & DECOR
              else if (pid === 'int_sofa_curved') {
                // Curved Peach/Coral Bouclé Sofa
                ctx.fillStyle = '#ff8da1';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY - 5 * zoom, 16 * zoom, 8 * zoom, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffe3e8';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY - 8 * zoom, 13 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
                ctx.fill();
                // Pillows
                ctx.fillStyle = '#ffd166';
                ctx.fillRect(screenX - 6 * zoom, screenY - 11 * zoom, 5 * zoom, 4 * zoom);
              }
              else if (pid === 'int_table_coffee') {
                // Amorphous Organic Terrazzo Table
                ctx.fillStyle = '#d4af37';
                ctx.fillRect(screenX - 6 * zoom, screenY - 4 * zoom, 2 * zoom, 4 * zoom);
                ctx.fillRect(screenX + 4 * zoom, screenY - 4 * zoom, 2 * zoom, 4 * zoom);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY - 6 * zoom, 10 * zoom, 6 * zoom, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1 * zoom;
                ctx.stroke();
              }
              else if (pid === 'int_chair_bubble') {
                // Yellow Bubble Lounge Chair
                ctx.fillStyle = '#ffd166';
                ctx.beginPath();
                ctx.arc(screenX, screenY - 6 * zoom, 7 * zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(screenX, screenY - 6 * zoom, 4.5 * zoom, 0, Math.PI * 2);
                ctx.fill();
              }
              else if (pid === 'int_kitchen_island') {
                // Marble Island Bar
                const h = 14 * zoom;
                ctx.fillStyle = '#ffccd5';
                ctx.fillRect(screenX - 12 * zoom, screenY - h, 24 * zoom, h);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(screenX - 14 * zoom, screenY - h - 3 * zoom, 28 * zoom, 3 * zoom);
              }
              else if (pid === 'int_plant_monstera') {
                // Monstera in Terracotta Planter
                ctx.fillStyle = '#f28482';
                ctx.fillRect(screenX - 4 * zoom, screenY - 6 * zoom, 8 * zoom, 6 * zoom);
                // Broad emerald leaves
                ctx.fillStyle = '#2ec4b6';
                ctx.beginPath();
                ctx.ellipse(screenX - 5 * zoom, screenY - 12 * zoom, 6 * zoom, 3.5 * zoom, -0.4, 0, Math.PI * 2);
                ctx.ellipse(screenX + 5 * zoom, screenY - 11 * zoom, 6 * zoom, 3.5 * zoom, 0.4, 0, Math.PI * 2);
                ctx.fill();
              }
              else if (pid === 'int_neon_sign') {
                // Glowing Pink Neon Wall Sign
                ctx.strokeStyle = '#ff007f';
                ctx.lineWidth = 2 * zoom;
                ctx.shadowColor = '#ff007f';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(screenX - 10 * zoom, screenY - 18 * zoom);
                ctx.lineTo(screenX + 10 * zoom, screenY - 18 * zoom);
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
              else if (pid === 'int_wall_glass' || pid === 'int_wall_pink') {
                // Interior Wall Panels
                const wh = 28 * zoom;
                ctx.fillStyle = pid === 'int_wall_glass' ? 'rgba(72, 202, 228, 0.45)' : '#ffccd5';
                ctx.beginPath();
                ctx.moveTo(screenX - twh * 0.9, screenY);
                ctx.lineTo(screenX, screenY + thh * 0.9);
                ctx.lineTo(screenX, screenY + thh * 0.9 - wh);
                ctx.lineTo(screenX - twh * 0.9, screenY - wh);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 * zoom;
                ctx.stroke();
              }
            }

            // ----------------------------------------
            // 3. Hover / Inspection Highlight
            // ----------------------------------------
            if (isHovered || isInspected) {
              ctx.beginPath();
              ctx.moveTo(screenX, screenY - thh);
              ctx.lineTo(screenX + twh, screenY);
              ctx.lineTo(screenX, screenY + thh);
              ctx.lineTo(screenX - twh, screenY);
              ctx.closePath();

              if (isInspected) {
                ctx.strokeStyle = '#ffd166';
                ctx.lineWidth = 3 * zoom;
                ctx.shadowColor = '#ffd166';
                ctx.shadowBlur = 14;
                ctx.stroke();
                ctx.shadowBlur = 0;
              } else if (isHovered) {
                ctx.strokeStyle = '#ff6b8b';
                ctx.lineWidth = 2.5 * zoom;
                ctx.shadowColor = '#ff6b8b';
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
            }
          }
        }
      } else {
        // TOP DOWN VIEW
        const tileSize = TILE_WIDTH * 0.8 * zoom;
        const startX = centerX + camera.x - (gridSize * tileSize) / 2;
        const startY = centerY + camera.y - (gridSize * tileSize) / 2;

        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const tile = grid[y]?.[x];
            if (!tile) continue;

            const px = startX + x * tileSize;
            const py = startY + y * tileSize;
            const baseItem = ALL_ITEMS[tile.base] || ALL_ITEMS['ground_sand'];
            const propItem = tile.prop ? ALL_ITEMS[tile.prop] : null;

            const isHovered = hoveredTile && (hoveredTile.gx === x && hoveredTile.gy === y);
            const isInspected = inspectedTile && inspectedTile.x === x && inspectedTile.y === y && inspectedTile.domain === activeDomain;

            ctx.fillStyle = baseItem.colors?.top || '#fff6ed';
            ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

            if (propItem) {
              ctx.fillStyle = propItem.colors?.top || propItem.colors?.main || '#ff6b8b';
              ctx.beginPath();
              ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.3, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

            if (isInspected) {
              ctx.strokeStyle = '#ffd166';
              ctx.lineWidth = 3;
              ctx.strokeRect(px, py, tileSize, tileSize);
            } else if (isHovered) {
              ctx.strokeStyle = '#ff6b8b';
              ctx.lineWidth = 2.5;
              ctx.strokeRect(px, py, tileSize, tileSize);
            }
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [grid, gridSize, camera, viewMode, hoveredTile, inspectedTile, brushSize, activeDomain]);

  let cursorClass = 'cursor-default';
  if (isSpacePressed || isDraggingRef.current) {
    cursorClass = isDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab';
  } else if (selectedTool === 'inspect') {
    cursorClass = 'cursor-help';
  } else if (selectedTool === 'place') {
    cursorClass = 'cursor-crosshair';
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${cursorClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Hover Floating Pill Tag */}
      {hoveredTile && grid[hoveredTile.gy]?.[hoveredTile.gx] && (
        <div
          className="pointer-events-none absolute top-20 left-1/2 transform -translate-x-1/2 tropical-glass px-4 py-1.5 rounded-full text-xs font-medium text-tropical-textDark flex items-center space-x-2 border border-white/60 shadow-tropical-md animate-fade-in"
        >
          <span className="font-mono text-tropical-coral font-bold">
            [{hoveredTile.gx}, {hoveredTile.gy}]
          </span>
          <span className="text-black/30">•</span>
          <span className="font-semibold">
            {grid[hoveredTile.gy][hoveredTile.gx].prop
              ? ALL_ITEMS[grid[hoveredTile.gy][hoveredTile.gx].prop]?.name
              : ALL_ITEMS[grid[hoveredTile.gy][hoveredTile.gx].base]?.name || 'Base Tile'}
          </span>
          <span className="text-black/30">•</span>
          <span className="text-slate-500">Elev {grid[hoveredTile.gy][hoveredTile.gx].elevation || 0}</span>
        </div>
      )}
    </div>
  );
}
