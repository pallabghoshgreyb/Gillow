import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Layers3, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { PATENTS } from '../data/patents';

type PatentRecord = (typeof PATENTS)[number];

interface NodeItem {
  subdomain: string;
  publicationCount: number;
  publicationNumbers: string[];
  color: string;
  x: number;
  y: number;
  size: number;
  ring: number;
}

interface TooltipState {
  subdomain: string;
  publicationCount: number;
  selectedDomain: string;
  left: number;
  top: number;
}

const PAGE_BG = '#f0f4fa';
const CARD_MAX_WIDTH = 980;
const CHART_WIDTH = 900;
const CHART_HEIGHT = 520;
const CENTER_X = CHART_WIDTH / 2;
const CENTER_Y = CHART_HEIGHT / 2;
const CENTER_SIZE = 180;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.5;
const DEFAULT_ZOOM = 1;
const COUNT_VISIBLE_ZOOM = 1.15;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalize = (value?: string | null) => value?.trim() ?? '';

const hashString = (value: string) =>
  value.split('').reduce((accumulator, character) => (accumulator * 31 + character.charCodeAt(0)) >>> 0, 0);

const getColorForText = (text: string) => {
  const hue = hashString(text) % 360;
  return {
    hue,
    border: `hsla(${hue}, 70%, 72%, 0.5)`,
    shadow: `0 16px 38px hsla(${hue}, 70%, 50%, 0.14)`,
    background: `radial-gradient(circle at 30% 25%, hsla(${hue}, 95%, 98%, 0.98) 0%, hsla(${hue}, 90%, 88%, 0.94) 30%, hsla(${hue}, 78%, 70%, 0.92) 64%, hsla(${hue}, 70%, 60%, 0.94) 100%)`,
  };
};

const formatCount = (count: number) => new Intl.NumberFormat('en-US').format(count);

const getUniqueDomains = (patents: PatentRecord[]) =>
  Array.from(
    new Set(
      patents
        .map((patent) => normalize(patent.domain))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

const getDefaultDomain = (domains: string[]) =>
  domains.includes('Robotic Surgery') ? 'Robotic Surgery' : domains[0] ?? '';

const getSubdomainPublicationCounts = (patents: PatentRecord[], selectedDomain: string) => {
  const grouped = new Map<string, Set<string>>();
  const targetDomain = normalize(selectedDomain);

  patents.forEach((patent) => {
    const domain = normalize(patent.domain);
    const subdomain = normalize(patent.subdomain);
    const publicationNumber = normalize(patent.publicationNumber);

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
  if (maxCount <= minCount) return 56;
  const ratio = Math.sqrt((count - minCount) / (maxCount - minCount));
  return Math.round(46 + ratio * 52);
};

const buildLayout = (items: ReturnType<typeof getSubdomainPublicationCounts>) => {
  if (!items.length) return [];

  const maxCount = Math.max(...items.map((item) => item.publicationCount), 1);
  const minCount = Math.min(...items.map((item) => item.publicationCount), maxCount);
  const ringCount = Math.min(4, Math.max(1, Math.ceil(items.length / 6)));
  const ringRadii = [128, 214, 298, 382];
  const ringItems: typeof items[] = [];
  const sizes = Array.from({ length: ringCount }, (_, index) => {
    const remaining = items.length - ringItems.reduce((sum, ring) => sum + ring.length, 0);
    const ringsLeft = ringCount - index;
    const size = Math.max(1, Math.ceil(remaining / ringsLeft));
    ringItems.push(items.slice(ringItems.reduce((sum, ring) => sum + ring.length, 0), ringItems.reduce((sum, ring) => sum + ring.length, 0) + size));
    return size;
  });

  const nodes: NodeItem[] = [];

  ringItems.forEach((ring, ringIndex) => {
    const count = ring.length;
    ring.forEach((item, itemIndex) => {
      const angle = (Math.PI * 2 * itemIndex) / Math.max(1, count) - Math.PI / 2 + ringIndex * 0.22;
      const radius = ringRadii[Math.min(ringIndex, ringRadii.length - 1)];
      nodes.push({
        ...item,
        size: getBubbleRadius(item.publicationCount, minCount, maxCount),
        ring: ringIndex,
        x: CENTER_X + Math.cos(angle) * radius,
        y: CENTER_Y + Math.sin(angle) * (radius * 0.72),
        color: getColorForText(item.subdomain).background,
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

const TechnologyLandscapePreviewReal: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const domains = useMemo(() => getUniqueDomains(PATENTS), []);
  const subdomainCounts = useMemo(() => getSubdomainPublicationCounts(PATENTS, selectedDomain), [selectedDomain]);
  const layout = useMemo(() => buildLayout(subdomainCounts), [subdomainCounts]);
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

      context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(width * 0.45, height * 0.4, 0, width * 0.5, height * 0.48, Math.max(width, height) * 0.65);
      gradient.addColorStop(0, 'rgba(0,189,205,0.12)');
      gradient.addColorStop(0.45, 'rgba(99,102,241,0.07)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const scale = zoom;
      const scaledCenterX = width / 2;
      const scaledCenterY = height / 2;
      const centerSize = CENTER_SIZE * scale;
      const centerRadius = centerSize / 2;

      layout.forEach((node) => {
        const x = scaledCenterX + (node.x - CENTER_X) * scale;
        const y = scaledCenterY + (node.y - CENTER_Y) * scale;
        const radius = node.size * scale;
        const color = getColorForText(node.subdomain);

        context.beginPath();
        context.moveTo(scaledCenterX, scaledCenterY);
        context.lineTo(x, y);
        context.strokeStyle = 'rgba(145, 170, 210, 0.18)';
        context.lineWidth = 1;
        context.setLineDash([4, 8]);
        context.stroke();
        context.setLineDash([]);

        const pulse = 1 + 0.02 * Math.sin(tick * 0.03 + node.ring + node.publicationCount * 0.01);
        const glow = context.createRadialGradient(x, y, radius * 0.4, x, y, radius * 2.4);
        glow.addColorStop(0, `hsla(${color.hue}, 80%, 60%, 0.18)`);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        context.beginPath();
        context.arc(x, y, radius * 2.2 * pulse, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();

        const sphere = context.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
        sphere.addColorStop(0, 'rgba(255,255,255,0.98)');
        sphere.addColorStop(0.35, 'rgba(255,255,255,0.86)');
        sphere.addColorStop(0.65, 'rgba(255,255,255,0.2)');
        sphere.addColorStop(1, 'rgba(255,255,255,0)');
        context.beginPath();
        context.arc(x, y, radius * pulse, 0, Math.PI * 2);
        context.fillStyle = color.background;
        context.fill();
        context.fillStyle = sphere;
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = color.border;
        context.stroke();
      });

      const centerGlow = context.createRadialGradient(scaledCenterX, scaledCenterY, centerRadius * 0.3, scaledCenterX, scaledCenterY, centerRadius * 1.8);
      centerGlow.addColorStop(0, 'rgba(255,255,255,0.98)');
      centerGlow.addColorStop(1, 'rgba(255,255,255,0.35)');
      context.beginPath();
      context.arc(scaledCenterX, scaledCenterY, centerRadius, 0, Math.PI * 2);
      context.fillStyle = centerGlow;
      context.fill();
      context.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      context.lineWidth = 1.2;
      context.stroke();
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
  }, [layout, zoom]);

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
    } else {
      showSoon();
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const handleNodeHover = (event: React.MouseEvent<HTMLButtonElement>, subdomain: string, publicationCount: number) => {
    const chart = chartRef.current;
    if (!chart) return;
    const rect = chart.getBoundingClientRect();
    const left = clamp(event.clientX - rect.left + 12, 14, rect.width - 224);
    const top = clamp(event.clientY - rect.top - 106, 14, rect.height - 116);
    setTooltip({
      subdomain,
      publicationCount,
      selectedDomain,
      left,
      top,
    });
  };

  const zoomOut = () => setZoom((current) => clamp(Number((current - 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  const zoomIn = () => setZoom((current) => clamp(Number((current + 0.12).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  const resetZoom = () => setZoom(DEFAULT_ZOOM);

  return (
    <div className="flex min-h-screen justify-center bg-[#f0f4fa] px-4 py-6 md:px-6 md:py-8">
      <div className="w-full max-w-[980px]">
        <section className="overflow-hidden rounded-[24px] border border-[rgba(200,215,240,0.6)] bg-white shadow-[0_4px_40px_rgba(60,100,200,0.10),0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[rgba(200,215,240,0.5)] px-6 py-5 md:flex-row md:items-center md:justify-between md:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-[#eef2ff]" aria-hidden="true">
                <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]">
                  {Array.from({ length: 3 }).flatMap((_, row) =>
                    Array.from({ length: 3 }).map((__, col) => (
                      <circle key={`${row}-${col}`} cx={5 + col * 6} cy={5 + row * 6} r="2.2" fill="#4a7cf5" />
                    )),
                  )}
                </svg>
              </div>
              <div>
                <h1 className="text-[20px] font-bold tracking-[-0.3px] text-[#0f1c3f]">Technology Landscape Preview</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openSelection}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#d8e2f5] bg-white px-4 py-2 text-[13px] font-medium text-[#1a2c5e] transition hover:border-[#b0c4ef] hover:bg-[#f4f7ff]"
              >
                View full landscape
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="px-6 pt-4 md:px-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dce8fb] bg-[#f5f8ff] px-3 py-1 text-[12px] text-[#5070b0]">
                  <Sparkles size={14} />
                  Hover a cluster to explore
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Select Domain</span>
                <div className="relative">
                  <select
                    value={selectedDomain}
                    onChange={(event) => setSelectedDomain(event.target.value)}
                    className="min-w-[240px] appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#00bdcd] focus:ring-4 focus:ring-blue-100"
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
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
            </div>
          </div>

          <div className="px-4 pb-4 pt-4 md:px-6">
            <div
              ref={chartRef}
              className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100"
              style={{ height: 'min(72vh, 640px)', minHeight: 520 }}
              onWheel={handleWheel}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

              <div className="absolute inset-0">
                <button
                  type="button"
                  onClick={openSelection}
                  className="absolute flex flex-col items-center justify-center rounded-full border border-white/80 bg-white/92 text-center shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-md transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: CENTER_SIZE * zoom,
                    height: CENTER_SIZE * zoom,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00bdcd]">Selected Domain</div>
                  <div className="mt-2 max-w-[10rem] text-xl font-semibold leading-tight text-slate-900">{selectedDomain || 'No domain selected'}</div>
                  <div className="mt-3 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {subdomainCounts.length} subdomains
                  </div>
                </button>

                {layout.map((node) => {
                  const scaledX = CENTER_X + (node.x - CENTER_X) * zoom;
                  const scaledY = CENTER_Y + (node.y - CENTER_Y) * zoom;
                  const scaledSize = node.size * zoom;
                  const showCount = showCounts;
                  const color = getColorForText(node.subdomain);

                  return (
                    <button
                      key={node.subdomain}
                      type="button"
                      onMouseEnter={(event) => handleNodeHover(event, node.subdomain, node.publicationCount)}
                      onMouseMove={(event) => handleNodeHover(event, node.subdomain, node.publicationCount)}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={openSelection}
                      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center backdrop-blur-md transition-all duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                      style={{
                        left: scaledX,
                        top: scaledY,
                        width: scaledSize,
                        height: scaledSize,
                        background: color.background,
                        borderColor: color.border,
                        boxShadow: color.shadow,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full opacity-40"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, hsla(${color.hue}, 100%, 98%, 0.95) 0%, hsla(${color.hue}, 90%, 84%, 0.85) 42%, hsla(${color.hue}, 80%, 66%, 0.18) 100%)`,
                        }}
                      />
                      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-3">
                        <div className="text-[11px] font-semibold leading-tight text-slate-900 md:text-sm">{node.subdomain}</div>
                        {showCount && (
                          <div className="mt-2 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-white">
                            {formatCount(node.publicationCount)} patents
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={zoomOut}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
                    aria-label="Zoom out"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="min-w-[58px] text-center text-xs font-semibold tracking-[0.16em] text-slate-500">{Math.round(zoom * 100)}%</div>
                  <button
                    type="button"
                    onClick={zoomIn}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
                    aria-label="Zoom in"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                {tooltip && (
                  <div
                    className="pointer-events-none absolute z-30 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-2xl"
                    style={{
                      left: tooltip.left,
                      top: tooltip.top,
                      minWidth: 210,
                    }}
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#00bdcd]">{tooltip.selectedDomain}</div>
                    <div className="mt-1 font-semibold text-slate-900">{tooltip.subdomain}</div>
                    <div className="mt-1 text-slate-600">{formatCount(tooltip.publicationCount)} unique publications</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[95] rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnologyLandscapePreviewReal;
