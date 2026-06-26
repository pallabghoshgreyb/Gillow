import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Hand, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { PATENTS } from '../data/patents';
import './TechnologyLandscapePreviewClassic.css';
import { trackEvent } from '../utils/analytics';

type PatentRecord = (typeof PATENTS)[number];

type FieldKey = 'domain' | 'subdomain' | 'subDomain' | 'sub_domain' | 'publicationNumber' | 'publication_number' | 'publicationNo';

type Cluster = {
  subdomain: string;
  publicationNumbers: string[];
  publicationCount: number;
  centroidX: number;
  centroidY: number;
  spread: number;
  dotCount: number;
  seed: number;
  density: number;
  color: string;
  isTopLabel: boolean;
};

type LabelPlacement = {
  subdomain: string;
  x: number;
  y: number;
  align: 'start' | 'end' | 'middle';
  lineToX: number;
  lineToY: number;
  showCount: boolean;
  fontSize: number;
  boxWidth: number;
  boxHeight: number;
  color: string;
  labelText: string;
};

type TooltipState = {
  subdomain: string;
  publicationCount: number;
  share: string;
  selectedDomain: string;
  left: number;
  top: number;
};

type ChartSize = { width: number; height: number };

type PointerState = { x: number; y: number; panX: number; panY: number } | null;

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1;
const LABEL_VISIBLE_ZOOM = 1.15;
const FULL_LABEL_ZOOM = 1.35;
const ALL_LABEL_ZOOM = 1.6;
const DOT_MIN = 25;
const DOT_MAX = 220;
const SPREAD_MIN = 35;
const SPREAD_MAX = 120;
const MIN_GAP = 60;
const TOOLTIP_WIDTH = 280;
const TOOLTIP_HEIGHT = 190;
const TOOLTIP_OFFSET = 16;
const palette = ['#2563eb', '#0891b2', '#0f766e', '#7c3aed', '#f97316', '#16a34a'];

const normalize = (value?: string | null) => value?.trim() ?? '';
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatCount = (count: number) => new Intl.NumberFormat('en-US').format(count);
const hashString = (value: string) => value.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
const truncate = (value: string, maxLength: number) => (value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value);
const measureTextWidth = (value: string, fontSize: number) => value.length * fontSize * 0.56;
const seededRandom = (seed: number) => {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};
const gaussian = (random: () => number) => {
  const u1 = Math.max(random(), 1e-7);
  const u2 = Math.max(random(), 1e-7);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};
const colorForIndex = (index: number) => palette[index % palette.length];
const goldenAngle = Math.PI * (3 - Math.sqrt(5));

const getField = (record: PatentRecord, possibleKeys: FieldKey[]) => {
  for (const key of possibleKeys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const getUniqueDomains = (patents: PatentRecord[]) =>
  Array.from(new Set(patents.map((patent) => normalize(getField(patent, ['domain']))).filter(Boolean))).sort((a, b) => a.localeCompare(b));

const getDefaultDomain = (domains: string[]) => (domains.includes('Robotic Surgery') ? 'Robotic Surgery' : domains[0] ?? '');

const getSubdomains = (patents: PatentRecord[], selectedDomain: string) => {
  const groups = new Map<string, Set<string>>();
  const target = normalize(selectedDomain);

  patents.forEach((patent) => {
    const domain = normalize(getField(patent, ['domain']));
    const subdomain = normalize(getField(patent, ['subdomain', 'subDomain', 'sub_domain']));
    const publicationNumber = normalize(getField(patent, ['publicationNumber', 'publication_number', 'publicationNo']));
    if (!domain || !subdomain || !publicationNumber || domain !== target) return;
    if (!groups.has(subdomain)) groups.set(subdomain, new Set());
    groups.get(subdomain)?.add(publicationNumber);
  });

  return Array.from(groups.entries())
    .map(([subdomain, publicationNumbers]) => ({
      subdomain,
      publicationNumbers: Array.from(publicationNumbers).sort((a, b) => a.localeCompare(b)),
      publicationCount: publicationNumbers.size,
    }))
    .sort((a, b) => b.publicationCount - a.publicationCount || a.subdomain.localeCompare(b.subdomain));
};

const buildClusters = (items: ReturnType<typeof getSubdomains>, width: number, height: number) => {
  if (!items.length) return [] as Cluster[];

  const minCount = Math.min(...items.map((i) => i.publicationCount));
  const maxCount = Math.max(...items.map((i) => i.publicationCount));
  const maxUsableRadius = Math.max(160, Math.min(width, height) / 2 - 100);
  const clusters: Cluster[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const centerRadius = clamp(Math.min(width, height) * 0.13, 82, 130);
  const minDim = Math.min(width, height);
  const ringRadii = [
    Math.min(maxUsableRadius * 0.85, Math.max(centerRadius + 70, minDim * 0.26)),
    Math.min(maxUsableRadius * 0.98, Math.max(centerRadius + 190, minDim * 0.42)),
    Math.min(maxUsableRadius, Math.max(centerRadius + 320, minDim * 0.58)),
  ];
  const ringCounts = [8, 12, Math.max(0, items.length - 20)];

  items.forEach((item, index) => {
    const density = maxCount > minCount ? (item.publicationCount - minCount) / (maxCount - minCount) : 0;
    const dotCount = Math.round(DOT_MIN + density * (DOT_MAX - DOT_MIN));
    const spread = SPREAD_MIN + density * (SPREAD_MAX - SPREAD_MIN);
    const seed = hashString(`${item.subdomain}-${item.publicationCount}-${index}`);
    const color = colorForIndex(hashString(item.subdomain) % palette.length);
    const isTopLabel = index < 5;

    const ringIndex = index < ringCounts[0] ? 0 : index < ringCounts[0] + ringCounts[1] ? 1 : 2;
    const ringOffset = ringIndex === 0 ? 0 : ringIndex === 1 ? Math.PI / 10 : Math.PI / 5;
    const ringPosition = ringIndex === 0 ? index : ringIndex === 1 ? index - ringCounts[0] : index - ringCounts[0] - ringCounts[1];
    const ringTotal = Math.max(1, ringCounts[ringIndex]);
    let angle = (ringPosition / ringTotal) * Math.PI * 2 - Math.PI / 2 + ringOffset;
    let radius = ringRadii[ringIndex] + density * 16;
    let x = centerX + Math.cos(angle) * radius;
    let y = centerY + Math.sin(angle) * radius;
    const needed = (other: Cluster, xx: number, yy: number) => Math.hypot(xx - other.centroidX, yy - other.centroidY) < spread + other.spread + MIN_GAP;

    for (let attempt = 0; attempt < 96; attempt += 1) {
      const candidateX = centerX + Math.cos(angle) * radius;
      const candidateY = centerY + Math.sin(angle) * radius;
      const collides = clusters.some((other) => needed(other, candidateX, candidateY));
      const inBounds = candidateX > spread && candidateX < width - spread && candidateY > spread && candidateY < height - spread;
      if (!collides && inBounds) {
        x = candidateX;
        y = candidateY;
        break;
      }
      angle += goldenAngle * 0.28;
      radius = Math.min(maxUsableRadius, radius + 12);
      x = candidateX;
      y = candidateY;
    }

    clusters.push({
      subdomain: item.subdomain,
      publicationNumbers: item.publicationNumbers,
      publicationCount: item.publicationCount,
      centroidX: x,
      centroidY: y,
      spread,
      dotCount,
      seed,
      density,
      color,
      isTopLabel,
    });
  });

  return clusters;
};

const buildLabelPlacements = (clusters: Cluster[], chartSize: ChartSize, zoom: number) => {
  const centerX = chartSize.width / 2;
  const centerY = chartSize.height / 2;
  const maxLabels = zoom <= 1.25 ? 5 : zoom <= 1.5 ? 8 : clusters.length;
  const visibleCandidates = clusters
    .slice(0, maxLabels)
    .map((cluster) => {
      const fontSize = zoom > 1.8 ? 14 : zoom > 1.5 ? 13 : 12;
      const nameText = zoom > 1.8 ? cluster.subdomain : truncate(cluster.subdomain, 24);
      const countText = `${formatCount(cluster.publicationCount)} patents`;
      const boxWidth = Math.min(320, Math.max(140, Math.max(measureTextWidth(nameText, fontSize), measureTextWidth(countText, 10)) + 24));
      const boxHeight = 30;
      const dx = cluster.centroidX - centerX;
      const dy = cluster.centroidY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance;
      const uy = dy / distance;
      const directions = [
        { dx: ux, dy: uy },
        { dx: ux * 0.85 + (ux >= 0 ? 0.15 : -0.15), dy: uy * 0.85 },
        { dx: ux, dy: 0 },
        { dx: 0, dy: uy },
        { dx: ux * 0.7, dy: uy * 0.7 },
        { dx: -ux * 0.7, dy: uy * 0.7 },
        { dx: ux * 0.7, dy: -uy * 0.7 },
        { dx: -ux * 0.7, dy: -uy * 0.7 },
      ]
        .map((direction) => {
          const length = Math.hypot(direction.dx, direction.dy) || 1;
          return { dx: direction.dx / length, dy: direction.dy / length };
        })
        .sort((a, b) => (b.dx * ux + b.dy * uy) - (a.dx * ux + a.dy * uy));
      return {
        cluster,
        fontSize,
        nameText,
        countText,
        boxWidth,
        boxHeight,
        directions,
      };
    })
    .sort((a, b) => b.cluster.publicationCount - a.cluster.publicationCount || a.cluster.subdomain.localeCompare(b.cluster.subdomain));

  const occupied: Array<{ x: number; y: number; width: number; height: number }> = [];
  const placements: LabelPlacement[] = [];
  const pad = 8;

  const collides = (x: number, y: number, width: number, height: number) =>
    occupied.some((box) => Math.abs(x - box.x) * 2 < width + box.width + pad && Math.abs(y - box.y) * 2 < height + box.height + pad);

  visibleCandidates.forEach(({ cluster, fontSize, nameText, countText, boxWidth, boxHeight, directions }) => {
    const preferredOffset = clamp(cluster.spread + 24, 18, 32);
    const candidates = directions.map((direction) => {
      const x = cluster.centroidX + direction.dx * preferredOffset;
      const y = cluster.centroidY + direction.dy * preferredOffset;
      const align = direction.dx > 0.25 ? ('start' as const) : direction.dx < -0.25 ? ('end' as const) : ('middle' as const);
      const lineToX = cluster.centroidX + direction.dx * (cluster.spread * 0.92);
      const lineToY = cluster.centroidY + direction.dy * (cluster.spread * 0.92);
      return { x, y, align, lineToX, lineToY };
    });

    const chosen = candidates.find((candidate) => {
      const left = candidate.x - (candidate.align === 'start' ? 0 : candidate.align === 'end' ? boxWidth : boxWidth / 2);
      const top = candidate.y - 10;
      const right = left + boxWidth;
      const bottom = top + boxHeight;
      const inside = left > 12 && top > 12 && right < chartSize.width - 12 && bottom < chartSize.height - 12;
      if (!inside) return false;
      return !collides(candidate.align === 'middle' ? candidate.x : candidate.align === 'start' ? left + boxWidth / 2 : left + boxWidth / 2, top + boxHeight / 2, boxWidth, boxHeight);
    });

    if (!chosen) return;

    const left = chosen.x - (chosen.align === 'start' ? 0 : chosen.align === 'end' ? boxWidth : boxWidth / 2);
    const top = chosen.y - 10;
    occupied.push({ x: chosen.align === 'middle' ? chosen.x : left + boxWidth / 2, y: top + boxHeight / 2, width: boxWidth, height: boxHeight });
    placements.push({
      subdomain: cluster.subdomain,
      x: chosen.x,
      y: chosen.y,
      align: chosen.align,
      lineToX: chosen.lineToX,
      lineToY: chosen.lineToY,
      showCount: true,
      fontSize,
      boxWidth,
      boxHeight,
      color: cluster.color,
      labelText: nameText,
    });
  });

  return placements;
};

const buildCenterDots = (selectedDomain: string, uniquePublicationCount: number, width: number, height: number) => {
  const seed = hashString(selectedDomain || 'center');
  const dotCount = Math.min(450, Math.max(160, Math.round(uniquePublicationCount / 10)));
  const spread = clamp(Math.min(width, height) * 0.16, 74, 132);
  const color = colorForIndex(hashString(selectedDomain) % palette.length);
  return { seed, dotCount, spread, color };
};

const TechnologyLandscapePreviewRoute: React.FC = () => {
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const tooltipHideTimerRef = useRef<number | null>(null);
  const tooltipHoverRef = useRef(false);
  const dragStateRef = useRef<PointerState>(null);
  const dragMovedRef = useRef(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState<ChartSize>({ width: 0, height: 0 });
  const [hoveredSubdomain, setHoveredSubdomain] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panModeActive, setPanModeActive] = useState(true);

  const domains = useMemo(() => getUniqueDomains(PATENTS), []);
  const selectedDomainValue = useMemo(() => (selectedDomain && domains.includes(selectedDomain) ? selectedDomain : getDefaultDomain(domains)), [domains, selectedDomain]);
  const subdomains = useMemo(() => getSubdomains(PATENTS, selectedDomainValue), [selectedDomainValue]);
  const chartReady = chartSize.width >= 300 && chartSize.height >= 300;
  const clusters = useMemo(() => (chartReady ? buildClusters(subdomains, chartSize.width, chartSize.height) : []), [chartReady, subdomains, chartSize]);
  const labelPlacements = useMemo(() => (chartReady ? buildLabelPlacements(clusters, chartSize, zoom) : []), [chartReady, clusters, chartSize, zoom]);
  const totalUniquePublications = useMemo(() => new Set(subdomains.flatMap((item) => item.publicationNumbers)).size, [subdomains]);
  const centerRadius = chartReady ? clamp(Math.min(chartSize.width, chartSize.height) * 0.13, 82, 130) : 100;
  const centerDots = useMemo(() => (chartReady ? buildCenterDots(selectedDomainValue, totalUniquePublications, chartSize.width, chartSize.height) : null), [chartReady, selectedDomainValue, totalUniquePublications, chartSize]);

  useLayoutEffect(() => {
    setZoom(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    setSelectedDomain((current) => (current && domains.includes(current) ? current : getDefaultDomain(domains)));
  }, [domains]);

  useEffect(() => {
    setZoom(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
    setTooltip(null);
    setHoveredSubdomain(null);
  }, [selectedDomainValue]);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    if (tooltipHideTimerRef.current !== null) window.clearTimeout(tooltipHideTimerRef.current);
    resizeObserverRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const update = () => {
      const rect = chart.getBoundingClientRect();
      setChartSize({ width: Math.max(0, rect.width), height: Math.max(0, rect.height) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(chart);
    resizeObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  const openSelection = () => {
    trackEvent('Landscape Preview Clicked', { source: 'preview-card', domain: selectedDomainValue });
    if (selectedDomainValue === 'Robotic Surgery') {
      navigate('/domains/robotic-surgery');
      return;
    }
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToastMessage('Available soon');
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 1800);
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
    };

    chart.addEventListener('wheel', handleWheel, { passive: false });
    return () => chart.removeEventListener('wheel', handleWheel);
  }, []);

  const clearTooltipTimer = () => {
    if (tooltipHideTimerRef.current !== null) {
      window.clearTimeout(tooltipHideTimerRef.current);
      tooltipHideTimerRef.current = null;
    }
  };

  const scheduleTooltipHide = () => {
    clearTooltipTimer();
    tooltipHideTimerRef.current = window.setTimeout(() => {
      if (!tooltipHoverRef.current) {
        setTooltip(null);
        setHoveredSubdomain(null);
      }
    }, 2000);
  };

  const getTooltipPosition = (clientX: number, clientY: number) => {
    const chart = chartRef.current;
    if (!chart) return { left: 12, top: 12 };

    const rect = chart.getBoundingClientRect();
    const anchorX = clientX - rect.left;
    const anchorY = clientY - rect.top;

    let left = anchorX + TOOLTIP_OFFSET;
    let top = anchorY + TOOLTIP_OFFSET;

    if (left + TOOLTIP_WIDTH > rect.width - 12) left = anchorX - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
    if (top + TOOLTIP_HEIGHT > rect.height - 12) top = anchorY - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;

    left = clamp(left, 12, Math.max(12, rect.width - TOOLTIP_WIDTH - 12));
    top = clamp(top, 12, Math.max(12, rect.height - TOOLTIP_HEIGHT - 12));

    return { left, top };
  };

  const toChartPoint = (clientX: number, clientY: number) => {
    const chart = chartRef.current;
    if (!chart) return null;
    const rect = chart.getBoundingClientRect();
    return {
      x: (clientX - rect.left - chartSize.width / 2 - pan.x) / zoom + chartSize.width / 2,
      y: (clientY - rect.top - chartSize.height / 2 - pan.y) / zoom + chartSize.height / 2,
      rect,
    };
  };

  const findClusterAtPoint = (x: number, y: number) => {
    let closest: Cluster | null = null;
    let minDistance = Number.POSITIVE_INFINITY;
    clusters.forEach((cluster) => {
      const distance = Math.hypot(x - cluster.centroidX, y - cluster.centroidY);
      const hitRadius = cluster.spread * zoom;
      if (distance <= hitRadius && distance < minDistance) {
        minDistance = distance;
        closest = cluster;
      }
    });
    return closest;
  };

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = toChartPoint(event.clientX, event.clientY);
    if (!point) return;
    const cluster = findClusterAtPoint(point.x, point.y);
    if (!cluster) {
      setHoveredSubdomain(null);
      scheduleTooltipHide();
      return;
    }
    clearTooltipTimer();
    setHoveredSubdomain(cluster.subdomain);
    const position = getTooltipPosition(event.clientX, event.clientY);
    setTooltip({
      subdomain: cluster.subdomain,
      publicationCount: cluster.publicationCount,
      share: totalUniquePublications > 0 ? `${((cluster.publicationCount / totalUniquePublications) * 100).toFixed(1)}% of selected domain publications` : '0.0% of selected domain publications',
      selectedDomain: selectedDomainValue,
      left: position.left,
      top: position.top,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!panModeActive || event.button !== 0) return;
    dragStateRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current || !panModeActive) return;
    const dx = event.clientX - dragStateRef.current.x;
    const dy = event.clientY - dragStateRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragMovedRef.current = true;
      setIsPanning(true);
      setPan({ x: dragStateRef.current.panX + dx, y: dragStateRef.current.panY + dy });
    }
  };

  const endPan = (event?: React.PointerEvent<SVGSVGElement>) => {
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    dragStateRef.current = null;
    setIsPanning(false);
  };

  const handleChartLeave = () => {
    setHoveredSubdomain(null);
    scheduleTooltipHide();
  };

  useEffect(() => () => {
    clearTooltipTimer();
  }, []);

  return (
    <div className="technology-landscape-page">
      <div className="card">
        <div className="header">
          <div className="header-left">
            <div className="logo-icon" aria-hidden="true">
              <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                {Array.from({ length: 3 }).map((_, row) =>
                  Array.from({ length: 3 }).map((__, col) => <circle key={`${row}-${col}`} cx={5 + col * 6} cy={5 + row * 6} r="2.2" fill="#4a7cf5" />),
                )}
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
            <button type="button" className="btn-dots" aria-label="More options">...</button>
          </div>
        </div>

        <div className="hint-bar">
          <div className="hint-pill">
            <Sparkles size={14} />
            Hover clusters, use zoom, or switch domains
          </div>
          <div className="domain-filter">
            <span className="domain-label">Select Domain</span>
            <div className="domain-select-wrap">
              <select
                className="domain-select"
                value={selectedDomainValue}
                onChange={(event) => {
                  const nextDomain = event.target.value;
                  trackEvent('Domain Changed', { domain: nextDomain, source: 'landscape-preview' });
                  setSelectedDomain(nextDomain);
                }}
              >
                {domains.length === 0 ? <option value="">No domains available</option> : domains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
              </select>
              <ChevronDown size={16} className="domain-select-icon" />
            </div>
          </div>
        </div>

        <div className={`viz-area ${isPanning ? 'is-dragging' : ''}`} ref={chartRef}>
          {!chartReady && <div className="viz-loading">Loading chart...</div>}
          {chartReady && (
          <svg
            className="preview-svg"
            viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
            preserveAspectRatio="none"
            onPointerDown={handlePointerDown}
            onPointerMove={(event) => {
              handlePointerMove(event);
              handleMove(event);
            }}
            onPointerUp={endPan}
            onPointerLeave={endPan}
            onMouseLeave={handleChartLeave}
          >
            <rect width="100%" height="100%" fill="transparent" pointerEvents="all" />
            <g className="chart-transform-group" transform={`translate(${chartSize.width / 2 + pan.x}, ${chartSize.height / 2 + pan.y}) scale(${zoom}) translate(${-chartSize.width / 2}, ${-chartSize.height / 2})`}>
              <g>
                {centerDots && Array.from({ length: centerDots.dotCount }).map((_, dotIndex) => {
                  const dotSeed = seededRandom(centerDots.seed + dotIndex * 97);
                  const angle = dotSeed() * Math.PI * 2;
                  const radial = Math.abs(gaussian(dotSeed)) * centerDots.spread * 0.62;
                  const x = chartSize.width / 2 + Math.cos(angle) * radial;
                  const y = chartSize.height / 2 + Math.sin(angle) * radial * 0.82;
                  const radius = clamp(2 + gaussian(dotSeed) * 0.32, 1.8, 3.9);
                  const opacity = clamp(0.5 + dotSeed() * 0.25, 0.5, 0.88);
                  return <circle key={`center-dot-${dotIndex}`} cx={x} cy={y} r={radius} fill={centerDots.color} opacity={opacity} />;
                })}
                <circle cx={chartSize.width / 2} cy={chartSize.height / 2} r={4.2} fill={centerDots?.color ?? '#f97316'} opacity={0.96} />
              </g>
              <g pointerEvents="none">
                <rect
                  x={chartSize.width / 2 - centerRadius * 0.78}
                  y={chartSize.height / 2 - 42}
                  width={centerRadius * 1.56}
                  height="84"
                  rx="18"
                  fill="rgba(255,255,255,0.82)"
                />
                <text x={chartSize.width / 2} y={chartSize.height / 2 - 12} textAnchor="middle" fill="#0f1c3f" style={{ fontSize: '19px', fontWeight: 800 }}>
                  {truncate(selectedDomainValue || 'No domain selected', 28)}
                </text>
                <text x={chartSize.width / 2} y={chartSize.height / 2 + 10} textAnchor="middle" fill="#334155" style={{ fontSize: '12px', fontWeight: 600 }}>
                  {formatCount(totalUniquePublications)} unique publications
                </text>
                <text x={chartSize.width / 2} y={chartSize.height / 2 + 28} textAnchor="middle" fill="#5070b0" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em' }}>
                  {formatCount(subdomains.length)} subdomains
                </text>
              </g>

              {clusters.map((cluster, index) => {
                const isHovered = hoveredSubdomain === cluster.subdomain;
                const dotSeed = seededRandom(cluster.seed);
                const visibleDots = Math.round(cluster.dotCount * (zoom > 1.35 ? 1 : 0.72));
                const clusterX = cluster.centroidX;
                const clusterY = cluster.centroidY;
                const cloudAlpha = 0.12 + cluster.density * 0.28;

                return (
                  <g key={cluster.subdomain} opacity={isHovered ? 1 : 0.95}>
                    {Array.from({ length: visibleDots }).map((_, dotIndex) => {
                      const angle = dotSeed() * Math.PI * 2 + dotIndex * 0.41;
                      const radial = Math.abs(gaussian(dotSeed)) * cluster.spread * (0.3 + cluster.density * 0.24);
                      const ellipse = 0.7 + (cluster.seed % 7) * 0.04;
                      const x = clusterX + Math.cos(angle) * radial;
                      const y = clusterY + Math.sin(angle) * radial * ellipse;
                      const radius = clamp(1.9 + gaussian(dotSeed) * 0.34 + cluster.density * 0.3, 1.8, 3.8);
                      const opacity = clamp(0.45 + cluster.density * 0.35 + dotSeed() * 0.15, 0.45, 0.9);
                      return <circle key={`${cluster.subdomain}-${dotIndex}`} cx={x} cy={y} r={radius} fill={cluster.color} opacity={opacity} />;
                    })}

                    <circle cx={clusterX} cy={clusterY} r={3.2 + cluster.density * 1.3} fill={cluster.color} opacity={0.95} />
                  </g>
                );
              })}

              {labelPlacements.map((placement) => (
                <g key={placement.subdomain}>
                  <line x1={placement.lineToX} y1={placement.lineToY} x2={placement.x} y2={placement.y - 10} stroke={placement.color} strokeOpacity={0.18} strokeWidth="1" />
                  <text
                    x={placement.x}
                    y={placement.y}
                    textAnchor={placement.align}
                    fill="#0f1c3f"
                    style={{ fontSize: `${placement.fontSize}px`, fontWeight: 700 }}
                  >
                    {placement.labelText}
                  </text>
                  {placement.showCount && (
                    <text
                      x={placement.x}
                      y={placement.y + 16}
                      textAnchor={placement.align}
                      fill="#334155"
                      style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em' }}
                    >
                      {formatCount(clusters.find((cluster) => cluster.subdomain === placement.subdomain)?.publicationCount ?? 0)} patents
                    </text>
                  )}
                </g>
              ))}
            </g>
          </svg>
          )}

          <div className="zoom-controls">
            <button type="button" className="zoom-btn" onClick={() => setZoom((current) => clamp(Number((current - 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom out"><Minus size={16} /></button>
            <div className="zoom-value">{Math.round(zoom * 100)}%</div>
            <button type="button" className="zoom-btn" onClick={() => setZoom((current) => clamp(Number((current + 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom in"><Plus size={16} /></button>
            <button type="button" className={`zoom-btn ${panModeActive ? 'is-active' : ''}`} onClick={() => setPanModeActive((current) => !current)} aria-label="Pan mode"><Hand size={15} /></button>
            <button type="button" className="zoom-btn" onClick={() => { setZoom(DEFAULT_ZOOM); setPan({ x: 0, y: 0 }); }} aria-label="Reset zoom"><RotateCcw size={15} /></button>
          </div>

          {tooltip && (
            <div
              className="hover-card visible hover-card-follow"
              style={{ left: tooltip.left, top: tooltip.top }}
              onMouseEnter={() => {
                clearTooltipTimer();
                tooltipHoverRef.current = true;
              }}
              onMouseLeave={() => {
                tooltipHoverRef.current = false;
                scheduleTooltipHide();
              }}
            >
              <div className="hc-top">
                <div className="hc-name">
                  <div className="hc-dot" style={{ background: colorForIndex(hashString(tooltip.subdomain) % palette.length) }} />
                  <span>{tooltip.subdomain}</span>
                </div>
              </div>
              <div className="hc-patents">{formatCount(tooltip.publicationCount)} unique publications</div>
              <div className="hc-growth up">
                <span>{tooltip.share}</span>
              </div>
              <div className="hc-growth"><span className="hc-muted">{tooltip.selectedDomain}</span></div>
                <button
                  type="button"
                  className="hc-cta"
                  onClick={() => {
                    trackEvent('CTA Clicked', {
                      label: 'Open in PatIndex',
                      domain: tooltip.selectedDomain,
                      subdomain: tooltip.subdomain,
                    });
                    navigate(`/browse?category=${encodeURIComponent(tooltip.selectedDomain)}&sub=${encodeURIComponent(tooltip.subdomain)}`);
                  }}
                >
                Open in PatIndex →
              </button>
            </div>
          )}
        </div>

        <div className="hint-footer">
          <span>Drag to pan</span>
          <span className="hint-dot">•</span>
          <span>Scroll to zoom</span>
          <span className="hint-dot">•</span>
          <span>Click on a cluster to see more details</span>
        </div>
      </div>

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default TechnologyLandscapePreviewRoute;





