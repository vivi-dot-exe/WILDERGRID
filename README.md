# Wildergrid 🌴🏛️

> A whimsical, desktop-optimized browser-based world-building game and architectural sandbox inspired by sunny retro-modern tropical resort villas. Build coastal cities and furnish penthouse interiors in real-time 2.5D isometric projection.

![Wildergrid](https://raw.githubusercontent.com/vivi-dot-exe/WILDERGRID/main/screenshot.png)

---

## ✨ Features

- **Dual-Domain Building Modes**:
  - **🌴 City Exterior Mode**: Design coastal resort environments with white beach sands, turquoise pools, boardwalks, curved coral pink pavilions, sky blue cylindrical towers, sunshine yellow cantilevered terraces, yellow architectural stairs, and royal tropical palm trees.
  - **🛋️ Room Interior Mode**: Furnish luxury interiors with terrazzo, oak herringbone, and glazed mint tiles; panoramic curved glass window walls; curved bouclé sofas; bubble chairs; island kitchen bars; and flourishing potted monsteras.
- **2.5D Isometric & Top-Down Canvas**: Real-time 60 FPS HTML5 Canvas engine supporting both depth-based 3D isometric block projection and a top-down flat grid.
- **Categorized Inventory System**: Tabbed inventory dock featuring grounds, architecture, flora, amenities, flooring, walls, living room, dining/kitchen, bedroom, and decor.
- **Inspector Tool**: Click to inspect any sector, view coordinates, elevation tiers (`0–5`), descriptions, and instant "Step Inside Room" transitions.
- **Procedural Island Generator & Undo/Redo**: Full history stack (`Ctrl+Z` / `Ctrl+Shift+Z`) and export/import via JSON.
- **Synthesized Cozy Audio**: Web Audio API synthesizer for ambient feedback.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm` or `yarn`

### Installation

```bash
# Clone the repository
git clone https://github.com/vivi-dot-exe/WILDERGRID.git

# Navigate into the project directory
cd WILDERGRID

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🎮 Controls

- **Space + Drag** (or **Middle Click Drag**): Pan the camera across the world map.
- **Mouse Wheel** or **`+` / `-` buttons**: Zoom smoothly between 40% and 280%.
- **Left Click / Drag**: Place selected item or paint terrain.
- **Inspect Mode**: Click any tile to inspect elevation, coordinates, and details.
- **Elevation Controls**: Raise or lower structure tiers.
- **Domain Switcher**: Toggle between **City Exterior** and **Room Interior** in the top navigation bar.

---

## 🛠️ Built With

- **React 18** + **Vite**
- **HTML5 Canvas 2D Context**
- **Tailwind CSS**
- **Lucide Icons**
- **Web Audio API**

---

## 📄 License

MIT License. Crafted with cozy vibes!
