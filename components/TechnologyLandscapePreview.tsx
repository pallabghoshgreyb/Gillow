import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import './TechnologyLandscapePreview.css';

type RGB = [number, number, number];

interface Cluster {
  label: string;
  nx: number;
  ny: number;
  r: number;
  color: RGB;
  hex: string;
  patents: number;
  growth: number;
  up: boolean;
  sats: number;
  satPositions?: Array<{ angle: number; dist: number; r: number }>;
}

interface FreeSat {
  nx: number;
  ny: number;
  r: number;
  color: RGB;
}

interface HoverState {
  index: number;
  left: number;
  top: number;
}

const WIDTH = 900;
const HEIGHT = 480;

const CLUSTERS: Cluster[] = [
  { label: 'AI', nx: 0.5, ny: 0.22, r: 28, color: [120, 80, 240], hex: '#7850f0', patents: 4821, growth: 18.6, up: true, sats: 5 },
  { label: 'Robotics', nx: 0.2, ny: 0.25, r: 22, color: [30, 180, 200], hex: '#1eb4c8', patents: 2340, growth: 11.2, up: true, sats: 4 },
  { label: 'Battery', nx: 0.37, ny: 0.38, r: 24, color: [30, 210, 130], hex: '#1ed282', patents: 3102, growth: 8.4, up: true, sats: 5 },
  { label: 'Semiconductor', nx: 0.57, ny: 0.5, r: 22, color: [100, 70, 230], hex: '#6446e6', patents: 2890, growth: 6.1, up: true, sats: 4 },
  { label: 'Medical Devices', nx: 0.17, ny: 0.52, r: 20, color: [30, 210, 160], hex: '#1ed2a0', patents: 1980, growth: 14.3, up: true, sats: 4 },
  { label: 'Computer Vision', nx: 0.72, ny: 0.2, r: 18, color: [60, 140, 250], hex: '#3c8cfa', patents: 1450, growth: 22.1, up: true, sats: 3 },
  { label: 'Quantum', nx: 0.82, ny: 0.48, r: 17, color: [240, 60, 140], hex: '#f03c8c', patents: 820, growth: 31.0, up: true, sats: 4 },
  { label: 'Materials', nx: 0.46, ny: 0.68, r: 20, color: [250, 150, 40], hex: '#fa9628', patents: 1120, growth: 5.8, up: true, sats: 4 },
  { label: 'Solar', nx: 0.23, ny: 0.72, r: 16, color: [250, 180, 30], hex: '#fab41e', patents: 940, growth: 9.7, up: true, sats: 3 },
  { label: 'Wireless', nx: 0.68, ny: 0.75, r: 16, color: [60, 130, 240], hex: '#3c82f0', patents: 1340, growth: 7.2, up: true, sats: 3 },
];

const FREE_SATS: FreeSat[] = [
  { nx: 0.42, ny: 0.12, r: 5, color: [120, 80, 240] },
  { nx: 0.62, ny: 0.14, r: 4, color: [60, 140, 250] },
  { nx: 0.3, ny: 0.15, r: 4, color: [30, 180, 200] },
  { nx: 0.55, ny: 0.35, r: 4, color: [100, 70, 230] },
  { nx: 0.63, ny: 0.42, r: 3, color: [60, 140, 250] },
  { nx: 0.4, ny: 0.55, r: 4, color: [120, 80, 240] },
  { nx: 0.77, ny: 0.35, r: 3, color: [60, 140, 250] },
  { nx: 0.88, ny: 0.62, r: 3, color: [240, 60, 140] },
  { nx: 0.1, ny: 0.4, r: 3, color: [30, 210, 160] },
  { nx: 0.08, ny: 0.62, r: 4, color: [30, 210, 160] },
  { nx: 0.28, ny: 0.88, r: 3, color: [250, 180, 30] },
  { nx: 0.57, ny: 0.88, r: 3, color: [250, 150, 40] },
  { nx: 0.78, ny: 0.88, r: 3, color: [60, 130, 240] },
  { nx: 0.9, ny: 0.78, r: 3, color: [240, 60, 140] },
];

const EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 5],
  [0, 6],
  [0, 9],
  [1, 4],
  [1, 2],
  [2, 3],
  [2, 7],
  [2, 8],
  [3, 5],
  [3, 6],
  [4, 7],
  [4, 8],
  [5, 6],
  [7, 8],
  [6, 9],
  [7, 9],
];

const palette = ['#1eb4c8', '#1ed282', '#6446e6', '#f03c8c', '#fa9628', '#3c8cfa', '#fab41e'];

const rgba = (color: RGB, alpha: number) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const createSeededRandom = (seed: number) => {
  let value = seed || 1;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

const hashString = (value: string) =>
  value.split('').reduce((accumulator, character) => (accumulator * 31 + character.charCodeAt(0)) >>> 0, 0);

const buildSparklinePoints = (cluster: Cluster) => {
  const seed = hashString(cluster.label) + Math.round(cluster.patents / 3);
  const random = createSeededRandom(seed);
  return Array.from({ length: 8 }, (_, index) => {
    const base = 8 + Math.sin(index * 0.9 + (cluster.patents % 6)) * 6;
    const jitter = (random() - 0.5) * 2.6;
    return [index * 7, 22 - clamp(base + jitter, 3, 19)];
  });
};

const buildClusters = () => {
  return CLUSTERS.map((cluster) => {
    const random = createSeededRandom(hashString(cluster.label));
    const satPositions = Array.from({ length: cluster.sats }, (_, index) => {
      const angle = (index / cluster.sats) * Math.PI * 2 + random() * 0.6;
      const dist = cluster.r * 2.4 + random() * cluster.r * 0.8;
      const r = 4 + random() * 4;
      return { angle, dist, r };
    });

    return { ...cluster, satPositions };
  });
};

const TechnologyLandscapePreview: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vizRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const clusters = useMemo(() => buildClusters(), []);
  const [, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<HoverState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const vizArea = vizRef.current;
    if (!canvas || !vizArea) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = vizArea.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const drawNode = (
      cx: number,
      cy: number,
      radius: number,
      color: RGB,
      pulse: number,
      isHovered: boolean,
    ) => {
      if (isHovered) {
        const glow = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius * 3);
        glow.addColorStop(0, rgba(color, 0.25));
        glow.addColorStop(1, rgba(color, 0));
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      const aura = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.9);
      aura.addColorStop(0, rgba(color, 0.18));
      aura.addColorStop(1, rgba(color, 0));
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.9 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = aura;
      ctx.fill();

      const [cr, cg, cb] = color;
      const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.05, cx, cy, radius);
      gradient.addColorStop(0, `rgba(${Math.min(cr + 80, 255)},${Math.min(cg + 70, 255)},${Math.min(cb + 70, 255)},1)`);
      gradient.addColorStop(0.5, rgba(color, 1));
      gradient.addColorStop(1, `rgba(${Math.max(cr - 30, 0)},${Math.max(cg - 30, 0)},${Math.max(cb - 30, 0)},1)`);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, radius * pulse + (isHovered ? 3 : 1.5), 0, Math.PI * 2);
      ctx.strokeStyle = rgba(color, isHovered ? 0.7 : 0.35);
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      const spec = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, 0, cx - radius * 0.2, cy - radius * 0.2, radius * 0.55);
      spec.addColorStop(0, 'rgba(255,255,255,0.55)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx - radius * 0.2, cy - radius * 0.25, radius * 0.48, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();
    };

    const drawHeatmap = (width: number, height: number) => {
      clusters.forEach((cluster) => {
        const cx = cluster.nx * width;
        const cy = cluster.ny * height;
        const radius = Math.max(width, height) * 0.22;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, rgba(cluster.color, 0.18));
        gradient.addColorStop(0.45, rgba(cluster.color, 0.08));
        gradient.addColorStop(1, rgba(cluster.color, 0));
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.78, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
    };

    const drawEdges = (width: number, height: number) => {
      EDGES.forEach(([a, b]) => {
        const start = clusters[a];
        const end = clusters[b];
        const isHovered = hoveredIndexRef.current === a || hoveredIndexRef.current === b;
        ctx.beginPath();
        ctx.moveTo(start.nx * width, start.ny * height);
        ctx.lineTo(end.nx * width, end.ny * height);
        ctx.strokeStyle = isHovered ? 'rgba(100,150,255,0.45)' : 'rgba(160,190,240,0.22)';
        ctx.lineWidth = isHovered ? 1.5 : 0.8;
        ctx.setLineDash(isHovered ? [] : [4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    };

    const drawFreeSats = (width: number, height: number, tick: number) => {
      FREE_SATS.forEach((sat, index) => {
        const cx = sat.nx * width;
        const cy = sat.ny * height;
        drawNode(cx, cy, sat.r, sat.color, 1 + 0.04 * Math.sin(tick * 0.03 + index * 2), false);
      });
    };

    const drawClusters = (width: number, height: number, tick: number) => {
      clusters.forEach((cluster, index) => {
        const cx = cluster.nx * width;
        const cy = cluster.ny * height;
        const isHovered = hoveredIndexRef.current === index;
        const pulse = isHovered ? 1.08 : 1 + 0.035 * Math.sin(tick * 0.025 + index * 1.4);

        cluster.satPositions?.forEach((sat) => {
          const sx = cx + Math.cos(sat.angle) * sat.dist;
          const sy = cy + Math.sin(sat.angle) * sat.dist;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = rgba(cluster.color, isHovered ? 0.45 : 0.22);
          ctx.lineWidth = isHovered ? 1.2 : 0.7;
          ctx.stroke();
          drawNode(sx, sy, sat.r, cluster.color, 1 + 0.04 * Math.sin(tick * 0.03 + index + sat.angle), false);
        });

        drawNode(cx, cy, cluster.r, cluster.color, pulse, isHovered);

        const labelY = cy + cluster.r * pulse + 16;
        ctx.font = isHovered ? `600 12px -apple-system,BlinkMacSystemFont,'Inter',sans-serif` : `500 11px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
        ctx.textAlign = 'center';

        if (isHovered) {
          const textWidth = ctx.measureText(cluster.label).width;
          const boxX = cx - textWidth / 2 - 8;
          const boxY = labelY - 11;
          const boxWidth = textWidth + 16;
          const boxHeight = 18;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 6);
          ctx.fill();
          ctx.strokeStyle = rgba(cluster.color, 0.4);
          ctx.lineWidth = 1;
          roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 6);
          ctx.stroke();
        }

        ctx.fillStyle = isHovered ? cluster.hex : 'rgba(20,35,80,0.75)';
        ctx.fillText(cluster.label, cx, labelY);
      });
    };

    const draw = (tick: number) => {
      const width = vizArea.clientWidth;
      const height = vizArea.clientHeight;
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawHeatmap(width, height);
      drawEdges(width, height);
      drawFreeSats(width, height, tick);
      drawClusters(width, height, tick);
    };

    let tick = 0;
    const animate = () => {
      draw(tick);
      tick += 1;
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [clusters]);

  const showTooltipForCluster = (index: number) => {
    const vizArea = vizRef.current;
    if (!vizArea) return;

    const rect = vizArea.getBoundingClientRect();
    const cluster = clusters[index];
    const width = rect.width;
    const height = rect.height;
    const cardWidth = 210;
    const cardHeight = 90;
    const leftBase = cluster.nx * width + cluster.r + 16;
    const topBase = cluster.ny * height - 20;
    let left = leftBase;
    let top = topBase;

    if (left + cardWidth > width) {
      left = cluster.nx * width - cluster.r - cardWidth - 16;
    }
    if (top + cardHeight > height) {
      top = height - cardHeight - 8;
    }
    if (top < 8) {
      top = 8;
    }

    hoveredIndexRef.current = index;
    setHoveredIndex(index);
    setTooltip({
      index,
      left,
      top,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const vizArea = vizRef.current;
    if (!canvas || !vizArea) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    let hit: number | null = null;
    clusters.forEach((cluster, index) => {
      const cx = cluster.nx * width;
      const cy = cluster.ny * height;
      const distance = Math.hypot(mx - cx, my - cy);
      if (distance < cluster.r + 12) {
        hit = index;
      }
    });

    if (hit !== null) {
      canvas.style.cursor = 'pointer';
      showTooltipForCluster(hit);
      return;
    }

    canvas.style.cursor = 'default';
    hoveredIndexRef.current = null;
    setHoveredIndex(null);
    setTooltip(null);
  };

  const handleMouseLeave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }

    hoveredIndexRef.current = null;
    setHoveredIndex(null);
    setTooltip(null);
  };

  const tooltipCluster = tooltip ? clusters[tooltip.index] : null;

  return (
    <div className="tlp-card">
      <div className="tlp-header">
        <div className="tlp-header-left">
          <div className="tlp-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 3 }).map((_, row) =>
                Array.from({ length: 3 }).map((__, column) => (
                  <circle
                    key={`${row}-${column}`}
                    cx={5 + column * 6}
                    cy={5 + row * 6}
                    r="2.2"
                    fill="#4a7cf5"
                  />
                )),
              )}
            </svg>
          </div>
          <div className="tlp-header-title">
            <h1>Technology Landscape Preview</h1>
            <p>Patent landscape · 26 technology clusters</p>
          </div>
        </div>

        <div className="tlp-header-right">
          <button type="button" className="tlp-view-button" onClick={() => navigate('/landscape-preview')}>
            View full landscape
            <ArrowRight size={14} />
          </button>
          <button type="button" className="tlp-dots-button" aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="tlp-hint-bar">
        <div className="tlp-hint-pill">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 2C3.34 2 2 3.34 2 5s1.34 3 3 3a2.99 2.99 0 002.83-2H9v1h1V6h1V5H7.83A3 3 0 005 2z" fill="#5070b0" />
            <circle cx="5" cy="5" r="1" fill="#5070b0" />
          </svg>
          Hover a cluster to explore
        </div>
      </div>

      <div className="tlp-viz-area" ref={vizRef}>
        <canvas
          ref={canvasRef}
          className="tlp-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/landscape-preview')}
        />

        {tooltipCluster && tooltip && (
          <div
            className="tlp-hover-card visible"
            style={{
              left: `${tooltip.left}px`,
              top: `${tooltip.top}px`,
            }}
          >
            <div className="tlp-hover-card-top">
              <div className="tlp-hover-name">
                <span className="tlp-hover-dot" style={{ background: tooltipCluster.hex }} />
                <span>{tooltipCluster.label}</span>
              </div>
              <svg className="tlp-sparkline" viewBox="0 0 50 22" fill="none" preserveAspectRatio="none" aria-hidden="true">
                <polyline
                  points={buildSparklinePoints(tooltipCluster)
                    .map(([x, y]) => `${x},${y}`)
                    .join(' ')}
                  stroke={tooltipCluster.hex}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="tlp-hover-patents">{tooltipCluster.patents.toLocaleString()} patents</div>
            <div className={`tlp-hover-growth ${tooltipCluster.up ? 'up' : 'down'}`}>
              <span>{tooltipCluster.up ? '↑' : '↓'}</span>
              <span>{tooltipCluster.growth.toFixed(1)}%</span>
              <span className="tlp-muted">vs last quarter</span>
            </div>
          </div>
        )}
      </div>

      <div className="tlp-footer">
        <div className="tlp-legend">
          <span>Low density</span>
          <div className="tlp-legend-bar" />
          <span>High density</span>
        </div>

        <div className="tlp-stats">
          <div className="tlp-stat-item">
            <div className="tlp-stat-icon blue">▦</div>
            <div className="tlp-stat-text">
              <div className="tlp-stat-num">26</div>
              <div className="tlp-stat-label">Clusters</div>
            </div>
          </div>

          <div className="tlp-sep" />

          <div className="tlp-stat-item">
            <div className="tlp-stat-icon purple">▦</div>
            <div className="tlp-stat-text">
              <div className="tlp-stat-num">18.7K</div>
              <div className="tlp-stat-label">Patents</div>
            </div>
          </div>

          <div className="tlp-sep" />

          <div className="tlp-stat-item">
            <div className="tlp-stat-icon green">↗</div>
            <div className="tlp-stat-text">
              <div className="tlp-stat-num tlp-green">+14.3%</div>
              <div className="tlp-stat-label">vs last quarter</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyLandscapePreview;
