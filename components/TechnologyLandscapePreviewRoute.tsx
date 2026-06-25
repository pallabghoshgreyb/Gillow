import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Minus, Plus, RotateCcw } from 'lucide-react';
import { PATENTS } from '../data/patents';
import './TechnologyLandscapePreviewClassic.css';

type PatentRecord = (typeof PATENTS)[number];

type NodeLayout = {
  subdomain: string;
  publicationCount: number;
  publicationNumbers: string[];
  x: number;
  y: number;
  radius: number;
  hue: number;
};

type TooltipState = {
  subdomain: string;
  publicationCount: number;
  selectedDomain: string;
  x: number;
  y: number;
};

const WIDTH = 900;
const HEIGHT = 480;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const CENTER_RADIUS = 92;
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.5;
const COUNT_VISIBLE_ZOOM = 1.15;

const normalize = (value?: string | null) => value?.trim() ?? '';

const formatCount = (count: number) => new Intl.NumberFormat('en-US').format(count);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hashString = (value: string) =>
  value.split('').reduce((accumulator, character) => (accumulator * 31 + character.charCodeAt(0)) >>> 0, 0);

const colorFor = (value: string) => {
  const hue = hashString(value) % 360;
  return {
    hue,
    border: `hsla(${hue}, 72%, 72%, 0.55)`,
    fill: `radial-gradient(circle at 32% 28%, hsla(${hue}, 90%, 96%, 0.98) 0%, hsla(${hue}, 86%, 86%, 0.92) 34%, hsla(${hue}, 78%, 72%, 0.88) 62%, hsla(${hue}, 70%, 60%, 0.92) 100%)`,
    shadow: `0 16px 38px hsla(${hue}, 70%, 50%, 0.16)`,
    dot: `hsl(${hue} 85% 58%)`,
  };
};

const getPatentField = (record: PatentRecord, keys: string[]) => {
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
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

const getDefaultDomain = (domains: string[]) => (domains.includes('Robotic Surgery') ? 'Robotic Surgery' : domains[0] ?? '');

const getSubdomains = (patents: PatentRecord[], selectedDomain: string) => {
  const groups = new Map<string, Set<string>>();
  const target = normalize(selectedDomain);

  patents.forEach((patent) => {
    const domain = normalize(getPatentField(patent, ['domain']));
    const subdomain = normalize(getPatentField(patent, ['subdomain', 'subDomain', 'sub_domain']));
    const publicationNumber = normalize(getPatentField(patent, ['publicationNumber', 'publication_number', 'publicationNo']));

    if (!domain || !subdomain || !publicationNumber || domain !== target) return;

    if (!groups.has(subdomain)) groups.set(subdomain, new Set());
    groups.get(subdomain)?.add(publicationNumber);
  });

  return Array.from(groups.entries())
    .map(([subdomain, publicationNumbers]) => ({
      subdomain,
      publicationNumbers: Array.from(publicationNumbers),
      publicationCount: publicationNumbers.size,
    }))
    .sort((left, right) => right.publicationCount - left.publicationCount || left.subdomain.localeCompare(right.subdomain));
};

const radiusFor = (count: number, minCount: number, maxCount: number) => {
  if (maxCount <= minCount) return 56;
  const ratio = Math.sqrt((count - minCount) / (maxCount - minCount));
  return Math.round(42 + ratio * 56);
};

const buildLayout = (items: ReturnType<typeof getSubdomains>) => {
  if (!items.length) return [] as NodeLayout[];

  const maxCount = Math.max(...items.map((item) => item.publicationCount), 1);
  const minCount = Math.min(...items.map((item) => item.publicationCount), maxCount);
  const ringCount = Math.min(4, Math.max(1, Math.ceil(items.length / 6)));
  const ringRadii = [120, 198, 276, 352];
  const nodes: NodeLayout[] = [];
  let cursor = 0;

  for (let ring = 0; ring < ringCount; ring += 1) {
    const remaining = items.length - cursor;
    const ringsLeft = ringCount - ring;
    const countOnRing = Math.max(1, Math.ceil(remaining / ringsLeft));
    const ringItems = items.slice(cursor, cursor + countOnRing);
    cursor += countOnRing;

    ringItems.forEach((item, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, ringItems.length) - Math.PI / 2 + ring * 0.22;
      const distance = ringRadii[Math.min(ring, ringRadii.length - 1)];
      const hue = hashString(item.subdomain) % 360;

      nodes.push({
        ...item,
        x: CENTER_X + Math.cos(angle) * distance,
        y: CENTER_Y + Math.sin(angle) * distance * 0.72,
        radius: radiusFor(item.publicationCount, minCount, maxCount),
        hue,
      });
    });
  }

  return nodes;
};

const TechnologyLandscapePreviewRoute: React.FC = () => {
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [selectedDomain, setSelectedDomain] = useState(() => getDefaultDomain(getUniqueDomains(PATENTS)));
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const domains = useMemo(() => getUniqueDomains(PATENTS), []);
  const subdomains = useMemo(() => getSubdomains(PATENTS, selectedDomain), [selectedDomain]);
  const layout = useMemo(() => buildLayout(subdomains), [subdomains]);
  const topSubdomain = subdomains[0];
  const totalUniquePublications = useMemo(() => new Set(subdomains.flatMap((item) => item.publicationNumbers)).size, [subdomains]);
  const showCounts = zoom > COUNT_VISIBLE_ZOOM;

  useEffect(() => {
    setSelectedDomain((current) => (current && domains.includes(current) ? current : getDefaultDomain(domains)));
  }, [domains]);

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const openSelection = () => {
    if (selectedDomain === 'Robotic Surgery') {
      navigate('/domains/robotic-surgery');
      return;
    }

    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToastMessage('Available soon');
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 1800);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const handleHover = (event: React.MouseEvent<HTMLButtonElement>, node: NodeLayout) => {
    const chart = chartRef.current;
    if (!chart) return;

    const rect = chart.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left + 12, 16, rect.width - 230);
    const y = clamp(event.clientY - rect.top - 106, 16, rect.height - 124);

    setTooltip({
      subdomain: node.subdomain,
      publicationCount: node.publicationCount,
      selectedDomain,
      x,
      y,
    });
  };

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
            </div>
          </div>

          <div className="header-right">
            <button type="button" className="btn-view" onClick={openSelection}>
              View full landscape
              <ArrowRight size={14} />
            </button>
            <button type="button" className="btn-dots" aria-label="More options">
              ...
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
              <select className="domain-select" value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)}>
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

        <div className="viz-area" ref={chartRef} onWheel={handleWheel} onMouseLeave={() => setTooltip(null)}>
          <div className="chart-overlay" aria-hidden="true">
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
              <defs>
                <radialGradient id="tlp-bg" cx="50%" cy="45%" r="65%">
                  <stop offset="0%" stopColor="rgba(0,189,205,0.10)" />
                  <stop offset="45%" stopColor="rgba(79,70,229,0.08)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#tlp-bg)" />
              {layout.map((node) => {
                const scaledX = CENTER_X + (node.x - CENTER_X) * zoom;
                const scaledY = CENTER_Y + (node.y - CENTER_Y) * zoom;
                const nodeRadius = node.radius * zoom;
                const palette = colorFor(node.subdomain);

                return (
                  <g key={node.subdomain}>
                    <line x1={CENTER_X} y1={CENTER_Y} x2={scaledX} y2={scaledY} stroke="rgba(160,190,240,0.22)" strokeDasharray="4 5" />
                    <circle cx={scaledX} cy={scaledY} r={nodeRadius * 2.2} fill={`hsla(${node.hue}, 86%, 60%, 0.14)`} />
                    <circle cx={scaledX} cy={scaledY} r={nodeRadius} fill={palette.fill} stroke={palette.border} />
                  </g>
                );
              })}
              <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS * zoom * 0.5} fill="rgba(255,255,255,0.9)" stroke="rgba(148,163,184,0.28)" />
            </svg>
          </div>

          <button type="button" className="center-bubble" onClick={openSelection}>
            <div className="center-kicker">Selected domain</div>
            <div className="center-name">{selectedDomain || 'No domain selected'}</div>
            <div className="center-chip">{subdomains.length} subdomains</div>
            <div className="center-subtext">{formatCount(totalUniquePublications)} unique publications</div>
          </button>

          <div className="chart-overlay">
            {layout.map((node) => {
              const scaledX = CENTER_X + (node.x - CENTER_X) * zoom;
              const scaledY = CENTER_Y + (node.y - CENTER_Y) * zoom;
              const size = node.radius * 2 * zoom;
              const palette = colorFor(node.subdomain);

              return (
                <button
                  key={node.subdomain}
                  type="button"
                  onMouseEnter={(event) => handleHover(event, node)}
                  onMouseMove={(event) => handleHover(event, node)}
                  onClick={openSelection}
                  className="bubble-node"
                  style={{
                    left: scaledX,
                    top: scaledY,
                    width: size,
                    height: size,
                    background: palette.fill,
                    borderColor: palette.border,
                    boxShadow: palette.shadow,
                  }}
                >
                  <div className="bubble-node-inner">
                    <div className="bubble-node-name">{node.subdomain}</div>
                    {showCounts && <div className="bubble-node-chip">{formatCount(node.publicationCount)} patents</div>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="zoom-controls">
            <button type="button" className="zoom-btn" onClick={() => setZoom((current) => clamp(Number((current - 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom out">
              <Minus size={16} />
            </button>
            <div className="zoom-value">{Math.round(zoom * 100)}%</div>
            <button type="button" className="zoom-btn" onClick={() => setZoom((current) => clamp(Number((current + 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom in">
              <Plus size={16} />
            </button>
            <button type="button" className="zoom-btn" onClick={() => setZoom(DEFAULT_ZOOM)} aria-label="Reset zoom">
              <RotateCcw size={15} />
            </button>
          </div>

          {tooltip && (
            <div className="hover-card visible" style={{ left: tooltip.x, top: tooltip.y }}>
              <div className="hc-top">
                <div className="hc-name">
                  <div className="hc-dot" style={{ background: colorFor(tooltip.subdomain).dot }} />
                  <span>{tooltip.subdomain}</span>
                </div>
              </div>
              <div className="hc-patents">{formatCount(tooltip.publicationCount)} patents</div>
              <div className="hc-growth up">
                <span>UP</span>
                <span className="hc-muted">{tooltip.selectedDomain}</span>
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
              <div className="stat-icon blue">[]</div>
              <div className="stat-info">
                <div className="stat-num">{subdomains.length}</div>
                <div className="stat-label">Clusters</div>
              </div>
            </div>
            <div className="sep" />
            <div className="stat-item">
              <div className="stat-icon purple">[]</div>
              <div className="stat-info">
                <div className="stat-num">{formatCount(totalUniquePublications)}</div>
                <div className="stat-label">Patents</div>
              </div>
            </div>
            <div className="sep" />
            <div className="stat-item">
              <div className="stat-icon green">GO</div>
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

export default TechnologyLandscapePreviewRoute;
