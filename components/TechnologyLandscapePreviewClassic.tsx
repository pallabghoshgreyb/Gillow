import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Minus, Plus, RotateCcw } from 'lucide-react';
import { PATENTS } from '../data/patents';
import './TechnologyLandscapePreviewClassic.css';

type PatentRecord = (typeof PATENTS)[number];

interface SubdomainBucket {
  subdomain: string;
  publicationNumbers: string[];
  publicationCount: number;
}

interface BubbleNode extends SubdomainBucket {
  x: number;
  y: number;
  radius: number;
  ring: number;
  hue: number;
  satellites: Array<{ angle: number; distance: number; radius: number }>;
}

interface TooltipState {
  x: number;
  y: number;
  subdomain: string;
  publicationCount: number;
  selectedDomain: string;
}

const CHART_WIDTH = 900;
const CHART_HEIGHT = 480;
const CENTER_X = CHART_WIDTH / 2;
const CENTER_Y = CHART_HEIGHT / 2;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.5;
const DEFAULT_ZOOM = 1;
const COUNT_VISIBLE_ZOOM = 1.15;

const normalize = (value?: string | null) => value?.trim() ?? '';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hashString = (value: string) =>
  value.split('').reduce((accumulator, character) => (accumulator * 31 + character.charCodeAt(0)) >>> 0, 0);

const formatCount = (count: number) => new Intl.NumberFormat('en-US').format(count);

const getColorForText = (text: string) => {
  const hue = hashString(text) % 360;
  return {
    hue,
    hex: `hsl(${hue} 85% 58%)`,
    border: `hsla(${hue}, 72%, 72%, 0.55)`,
    fill: `radial-gradient(circle at 32% 28%, hsla(${hue}, 90%, 95%, 0.98) 0%, hsla(${hue}, 86%, 86%, 0.92) 34%, hsla(${hue}, 78%, 72%, 0.88) 62%, hsla(${hue}, 70%, 60%, 0.92) 100%)`,
    glow: `0 0 0 1px hsla(${hue}, 72%, 70%, 0.20), 0 18px 44px hsla(${hue}, 70%, 55%, 0.16)`,
  };
};

const getPatentField = (record: PatentRecord, possibleKeys: Array<keyof PatentRecord | string>) => {
  for (const key of possibleKeys) {
    const value = record[key as keyof PatentRecord] as unknown;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const getUniqueDomains = (patents: PatentRecord[]) =>
  Array.from(
    new Set(
      patents
        .map((patent) => normalize(getPatentField(patent, ['domain'])))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

const getDefaultDomain = (domains: string[]) =>
  domains.includes('Robotic Surgery') ? 'Robotic Surgery' : domains[0] ?? '';

const getSubdomainPublicationCounts = (patents: PatentRecord[], selectedDomain: string) => {
  const grouped = new Map<string, Set<string>>();
  const targetDomain = normalize(selectedDomain);

  patents.forEach((patent) => {
    const domain = normalize(getPatentField(patent, ['domain']));
    const subdomain = normalize(getPatentField(patent, ['subdomain', 'subDomain', 'sub_domain']));
    const publicationNumber = normalize(getPatentField(patent, ['publicationNumber', 'publication_number', 'publicationNo']));

    if (!domain || !subdomain || !publicationNumber) return;
    if (domain !== targetDomain) return;

    if (!grouped.has(subdomain)) {
      grouped.set(subdomain, new Set());
    }
    grouped.get(subdomain)?.add(publicationNumber);
  });

  return Array.from(grouped.entries())
    .map(([subdomain, publicationNumbers]) => ({
      subdomain,
      publicationNumbers: Array.from(publicationNumbers).sort((left, right) => left.localeCompare(right)),
      publicationCount: publicationNumbers.size,
    }))
    .sort((left, right) => right.publicationCount - left.publicationCount || left.subdomain.localeCompare(right.subdomain));
};

const getBubbleRadius = (count: number, minCount: number, maxCount: number) => {
  if (maxCount <= minCount) return 58;
  const ratio = Math.sqrt((count - minCount) / (maxCount - minCount));
  return Math.round(46 + ratio * 58);
};

const buildLayout = (items: SubdomainBucket[]) => {
  if (!items.length) return [];

  const maxCount = Math.max(...items.map((item) => item.publicationCount), 1);
  const minCount = Math.min(...items.map((item) => item.publicationCount), maxCount);
  const ringCount = Math.min(4, Math.max(1, Math.ceil(items.length / 6)));
  const ringRadii = [120, 198, 276, 352];

  const rings: SubdomainBucket[][] = [];
  let cursor = 0;

  for (let ring = 0; ring < ringCount; ring += 1) {
    const remaining = items.length - cursor;
    const ringsLeft = ringCount - ring;
    const size = Math.max(1, Math.ceil(remaining / ringsLeft));
    rings.push(items.slice(cursor, cursor + size));
    cursor += size;
  }

  const nodes: BubbleNode[] = [];
  rings.forEach((ringItems, ring) => {
    ringItems.forEach((item, indexOnRing) => {
      const angle = (Math.PI * 2 * indexOnRing) / Math.max(1, ringItems.length) - Math.PI / 2 + ring * 0.22;
      const radius = ringRadii[Math.min(ring, ringRadii.length - 1)];
      const color = getColorForText(item.subdomain);
      const bubbleRadius = getBubbleRadius(item.publicationCount, minCount, maxCount);
      const random = hashString(item.subdomain);
      const satellites = Array.from({ length: Math.min(5, Math.max(2, Math.round(item.publicationCount / 70) + 2)) }, (_, satIndex) => {
        const satAngle = angle + ((satIndex / 5) - 0.5) * 1.1 + ((random >> satIndex) % 7) * 0.03;
        const distance = bubbleRadius * 1.65 + (satIndex % 3) * 6 + ((random >> (satIndex + 2)) % 13);
        const radius = 2.2 + (satIndex % 3) * 0.8;
        return { angle: satAngle, distance, radius };
      });

      nodes.push({
        ...item,
        x: CENTER_X + Math.cos(angle) * radius,
        y: CENTER_Y + Math.sin(angle) * (radius * 0.72),
        radius: bubbleRadius,
        ring,
        hue: color.hue,
        satellites,
      });
    });
  });

  return nodes;
};

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

const TechnologyLandscapePreviewClassic: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredSubdomain, setHoveredSubdomain] = useState<string | null>(null);

  const domains = useMemo(() => getUniqueDomains(PATENTS), []);
  const subdomains = useMemo(() => getSubdomainPublicationCounts(PATENTS, selectedDomain), [selectedDomain]);
  const layout = useMemo(() => buildLayout(subdomains), [subdomains]);
  const totalUniquePublications = useMemo(
    () => new Set(subdomains.flatMap((item) => item.publicationNumbers)).size,
    [subdomains],
  );
  const topSubdomain = subdomains[0];
  const showCounts = zoom > COUNT_VISIBLE_ZOOM;

  useEffect(() => {
    if (!domains.length) return;
    setSelectedDomain((current) => (current && domains.includes(current) ? current : getDefaultDomain(domains)));
  }, [domains]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const resizeCanvas = () => {
      const rect = chart.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    };

    const draw = (tick: number) => {
      const width = chart.clientWidth;
      const height = chart.clientHeight;
      const scale = Math.min(width / CHART_WIDTH, height / CHART_HEIGHT);
      const centerX = width / 2;
      const centerY = height / 2;

      context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      context.clearRect(0, 0, width, height);

      const bgGlow = context.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.62);
      bgGlow.addColorStop(0, 'rgba(0,189,205,0.10)');
      bgGlow.addColorStop(0.4, 'rgba(79,70,229,0.08)');
      bgGlow.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = bgGlow;
      context.fillRect(0, 0, width, height);

      // Heatmap glows under the clusters.
      layout.forEach((node) => {
        const nodeX = centerX + (node.x - CENTER_X) * zoom * scale;
        const nodeY = centerY + (node.y - CENTER_Y) * zoom * scale;
        const nodeRadius = node.radius * zoom * scale;
        const glow = context.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, nodeRadius * 2.8);
        glow.addColorStop(0, `hsla(${node.hue}, 90%, 64%, 0.18)`);
        glow.addColorStop(0.45, `hsla(${node.hue}, 90%, 64%, 0.08)`);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        context.beginPath();
        context.arc(nodeX, nodeY, nodeRadius * 2.6, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();
      });

      // Connection lines.
      layout.forEach((node) => {
        const nodeX = centerX + (node.x - CENTER_X) * zoom * scale;
        const nodeY = centerY + (node.y - CENTER_Y) * zoom * scale;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(nodeX, nodeY);
        context.strokeStyle = 'rgba(160,190,240,0.22)';
        context.lineWidth = 0.9;
        context.setLineDash([4, 5]);
        context.stroke();
        context.setLineDash([]);

        node.satellites.forEach((sat, satIndex) => {
          const sx = nodeX + Math.cos(sat.angle) * sat.distance * zoom * scale * 0.2;
          const sy = nodeY + Math.sin(sat.angle) * sat.distance * zoom * scale * 0.2;
          context.beginPath();
          context.moveTo(nodeX, nodeY);
          context.lineTo(sx, sy);
          context.strokeStyle = 'rgba(160,190,240,0.14)';
          context.lineWidth = 0.6;
          context.stroke();

          const pulse = 1 + 0.04 * Math.sin(tick * 0.03 + satIndex);
          context.beginPath();
          context.arc(sx, sy, sat.radius * zoom * scale * pulse, 0, Math.PI * 2);
          context.fillStyle = `hsla(${node.hue}, 70%, 58%, 0.7)`;
          context.fill();
        });
      });

      // Center bubble.
      const centerRadius = (CENTER_SIZE * zoom * scale) / 2;
      const centerGlow = context.createRadialGradient(centerX - centerRadius * 0.2, centerY - centerRadius * 0.2, centerRadius * 0.1, centerX, centerY, centerRadius * 1.8);
      centerGlow.addColorStop(0, 'rgba(255,255,255,0.98)');
      centerGlow.addColorStop(1, 'rgba(255,255,255,0.40)');
      context.beginPath();
      context.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      context.fillStyle = centerGlow;
      context.fill();
      context.strokeStyle = 'rgba(148,163,184,0.28)';
      context.lineWidth = 1.2;
      context.stroke();

      context.textAlign = 'center';
      context.fillStyle = '#0f1c3f';
      context.font = `700 ${Math.max(18, 22 * zoom)}px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
      context.fillText(selectedDomain || 'No domain selected', centerX, centerY - 2);

      context.fillStyle = '#5070b0';
      context.font = `700 ${Math.max(10, 10 * zoom)}px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
      context.fillText('Selected domain', centerX, centerY - centerRadius * 0.58);

      context.fillStyle = '#0f1c3f';
      context.font = `600 ${Math.max(12, 13 * zoom)}px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
      context.fillText(`${subdomains.length} subdomains`, centerX, centerY + centerRadius * 0.42);

      context.fillStyle = '#7b8db0';
      context.font = `500 ${Math.max(11, 11 * zoom)}px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
      context.fillText(`${formatCount(totalUniquePublications)} unique publications`, centerX, centerY + centerRadius * 0.68);

      // Subdomain bubbles and labels.
      layout.forEach((node) => {
        const nodeX = centerX + (node.x - CENTER_X) * zoom * scale;
        const nodeY = centerY + (node.y - CENTER_Y) * zoom * scale;
        const nodeRadius = node.radius * zoom * scale;
        const isHovered = hoveredSubdomain === node.subdomain;
        const color = getColorForText(node.subdomain);

        const glow = context.createRadialGradient(nodeX, nodeY, nodeRadius * 0.3, nodeX, nodeY, nodeRadius * 2.4);
        glow.addColorStop(0, `hsla(${node.hue}, 86%, 60%, ${isHovered ? 0.26 : 0.18})`);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        context.beginPath();
        context.arc(nodeX, nodeY, nodeRadius * 2.1, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();

        const pulse = isHovered ? 1.06 : 1 + 0.02 * Math.sin(tick * 0.03 + node.ring * 1.3);
        const sphere = context.createRadialGradient(nodeX - nodeRadius * 0.3, nodeY - nodeRadius * 0.3, nodeRadius * 0.08, nodeX, nodeY, nodeRadius);
        sphere.addColorStop(0, 'rgba(255,255,255,0.98)');
        sphere.addColorStop(0.35, 'rgba(255,255,255,0.82)');
        sphere.addColorStop(0.68, 'rgba(255,255,255,0.16)');
        sphere.addColorStop(1, 'rgba(255,255,255,0)');

        context.beginPath();
        context.arc(nodeX, nodeY, nodeRadius * pulse, 0, Math.PI * 2);
        context.fillStyle = color.fill;
        context.fill();
        context.fillStyle = sphere;
        context.fill();
        context.strokeStyle = color.border;
        context.lineWidth = isHovered ? 1.5 : 1;
        context.stroke();

        context.font = `600 ${Math.max(11, 11 * zoom)}px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
        context.fillStyle = isHovered ? color.hex : 'rgba(20,35,80,0.80)';
        context.textAlign = 'center';
        const labelOffset = nodeRadius + 16;
        context.fillText(node.subdomain, nodeX, nodeY - labelOffset);

        if (showCounts) {
          context.fillStyle = '#0f1c3f';
          context.font = `700 ${Math.max(10, 10 * zoom)}px -apple-system,BlinkMacSystemFont,'Inter',sans-serif`;
          context.fillText(`${formatCount(node.publicationCount)} patents`, nodeX, nodeY + 6);
        }
      });
    };

    let tick = 0;
    const animate = () => {
      draw(tick);
      tick += 1;
      frameRef.current = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [layout, selectedDomain, showCounts, subdomains.length, totalUniquePublications, zoom, hoveredSubdomain]);

  const showSoon = () => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage('Available soon');
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 1800);
  };

  const openSelection = () => {
    if (selectedDomain === 'Robotic Surgery') {
      navigate('/domains/robotic-surgery');
      return;
    }
    showSoon();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const hitTestNode = (clientX: number, clientY: number) => {
    const chart = chartRef.current;
    if (!chart) return null;

    const rect = chart.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const scale = Math.min(width / CHART_WIDTH, height / CHART_HEIGHT);
    const centerX = width / 2;
    const centerY = height / 2;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    for (const node of layout) {
      const nodeX = centerX + (node.x - CENTER_X) * zoom * scale;
      const nodeY = centerY + (node.y - CENTER_Y) * zoom * scale;
      const nodeRadius = node.radius * zoom * scale;
      const distance = Math.hypot(mouseX - nodeX, mouseY - nodeY);
      if (distance <= nodeRadius + 12) {
        return {
          node,
          left: clamp(nodeX + nodeRadius + 14, 14, width - 230),
          top: clamp(nodeY - 106, 14, height - 124),
        };
      }
    }

    return null;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const hit = hitTestNode(event.clientX, event.clientY);
    if (hit) {
      setHoveredSubdomain(hit.node.subdomain);
      setTooltip({
        x: hit.left,
        y: hit.top,
        subdomain: hit.node.subdomain,
        publicationCount: hit.node.publicationCount,
        selectedDomain,
      });
      return;
    }
    setHoveredSubdomain(null);
    setTooltip(null);
  };

  const handleMouseLeave = () => {
    setHoveredSubdomain(null);
    setTooltip(null);
  };

  const zoomOut = () => setZoom((current) => clamp(Number((current - 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  const zoomIn = () => setZoom((current) => clamp(Number((current + 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  const resetZoom = () => setZoom(DEFAULT_ZOOM);

  return (
    <div className="technology-landscape-page">
      <div className="card">
        <div className="header">
          <div className="header-left">
            <div className="logo-icon" aria-hidden="true">
              <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="5" r="2.2" fill="#4a7cf5" />
                <circle cx="11" cy="5" r="2.2" fill="#4a7cf5" />
                <circle cx="17" cy="5" r="2.2" fill="#4a7cf5" />
                <circle cx="5" cy="11" r="2.2" fill="#4a7cf5" />
                <circle cx="11" cy="11" r="2.2" fill="#4a7cf5" />
                <circle cx="17" cy="11" r="2.2" fill="#4a7cf5" />
                <circle cx="5" cy="17" r="2.2" fill="#4a7cf5" />
                <circle cx="11" cy="17" r="2.2" fill="#4a7cf5" />
                <circle cx="17" cy="17" r="2.2" fill="#4a7cf5" />
              </svg>
            </div>
            <div className="header-title">
              <h1>Technology Landscape Preview</h1>
              <p>Patent landscape · {subdomains.length} technology clusters</p>
            </div>
          </div>
          <div className="header-right">
            <button type="button" className="btn-view" onClick={openSelection}>
              View full landscape
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="#1a2c5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="btn-dots" aria-label="More options">
              ···
            </button>
          </div>
        </div>

        <div className="hint-bar">
          <div className="hint-pill">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 2C3.34 2 2 3.34 2 5s1.34 3 3 3a2.99 2.99 0 002.83-2H9v1h1V6h1V5H7.83A3 3 0 005 2z" fill="#5070b0" />
              <circle cx="5" cy="5" r="1" fill="#5070b0" />
            </svg>
            Hover a cluster to explore
          </div>

          <div className="domain-filter">
            <span className="domain-label">Select Domain</span>
            <div className="domain-select-wrap">
              <select
                value={selectedDomain}
                onChange={(event) => setSelectedDomain(event.target.value)}
                className="domain-select"
              >
                {domains.length === 0 ? (
                  <option value="">No domains available</option>
                ) : (
                  domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={16} className="domain-select-icon" />
            </div>
          </div>
        </div>

        <div className="viz-area" ref={chartRef} onWheel={handleWheel} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <canvas ref={canvasRef} id="tlCanvas" />

          <div className="chart-overlay">
            <button type="button" onClick={openSelection} className="center-bubble" aria-label="Selected domain">
              <div className="center-kicker">Selected domain</div>
              <div className="center-name">{selectedDomain || 'No domain selected'}</div>
              <div className="center-chip">{subdomains.length} subdomains</div>
              <div className="center-subtext">{formatCount(totalUniquePublications)} unique publications</div>
            </button>
          </div>

          <div className="zoom-controls">
            <button type="button" className="zoom-btn" onClick={zoomOut} aria-label="Zoom out">
              <Minus size={16} />
            </button>
            <div className="zoom-value">{Math.round(zoom * 100)}%</div>
            <button type="button" className="zoom-btn" onClick={zoomIn} aria-label="Zoom in">
              <Plus size={16} />
            </button>
            <button type="button" className="zoom-btn" onClick={resetZoom} aria-label="Reset zoom">
              <RotateCcw size={15} />
            </button>
          </div>

          {tooltip && (
            <div
              className="hover-card visible"
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              <div className="hc-top">
                <div className="hc-name">
                  <div className="hc-dot" style={{ background: getColorForText(tooltip.subdomain).hex }} />
                  <span>{tooltip.subdomain}</span>
                </div>
                <svg className="hc-sparkline" viewBox="0 0 50 22" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <polyline
                    points={Array.from({ length: 8 }, (_, index) => {
                      const seed = hashString(tooltip.subdomain) + index * 17;
                      const value = 8 + Math.sin(index * 0.9 + (seed % 6)) * 6 + ((seed % 7) - 3);
                      return `${index * 7},${22 - clamp(value, 3, 19)}`;
                    }).join(' ')}
                    stroke={getColorForText(tooltip.subdomain).hex}
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="hc-patents">{formatCount(tooltip.publicationCount)} patents</div>
              <div className="hc-growth up">
                <span>↑</span>
                <span>{formatCount(tooltip.publicationCount)}</span>
                <span className="hc-muted">unique publications in {tooltip.selectedDomain}</span>
              </div>
            </div>
          )}
        </div>

        <div className="footer">
          <div className="legend">
            <span>Low density</span>
            <div className="legend-bar" />
            <span>High density</span>
          </div>

          <div className="stats">
            <div className="stat-item">
              <div className="stat-icon blue">▦</div>
              <div className="stat-info">
                <div className="stat-num">{subdomains.length}</div>
                <div className="stat-label">Clusters</div>
              </div>
            </div>
            <div className="sep" />
            <div className="stat-item">
              <div className="stat-icon purple">▦</div>
              <div className="stat-info">
                <div className="stat-num">{formatCount(totalUniquePublications)}</div>
                <div className="stat-label">Patents</div>
              </div>
            </div>
            <div className="sep" />
            <div className="stat-item">
              <div className="stat-icon green">↗</div>
              <div className="stat-info">
                <div className="stat-num green">{topSubdomain ? formatCount(topSubdomain.publicationCount) : '0'}</div>
                <div className="stat-label">{topSubdomain ? topSubdomain.subdomain : 'Top subdomain'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default TechnologyLandscapePreviewClassic;
