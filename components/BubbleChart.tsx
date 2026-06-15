import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { select, scalePoint, scaleSqrt, scaleSequential, interpolateRgb, axisTop, axisLeft, max } from 'd3';
import { Patent } from '../types';

interface BubbleChartProps {
  patents: Patent[];
  onSelectBubble?: (bubble: any) => void;
  onSelectPatent?: (patent: Patent) => void;
  onSelectAssignee?: (assignee: string) => void;
}

interface BubbleDatum {
  domain: string;
  category: string;
  assignee: string;
  count: number;
  share: number;
  patents: Patent[];
  subdomains: string[];
  href: string;
}

const BRAND_BUBBLE_BASE = '#00bdcd';
const BRAND_BUBBLE_DARK = '#0d5861';
const BRAND_BUBBLE_LIGHT = '#d4f7fa';

const topNamesByCount = (counts: Map<string, number>) =>
  Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([name]) => name);

export const BubbleChart: React.FC<BubbleChartProps> = ({ patents, onSelectBubble, onSelectPatent, onSelectAssignee }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTooltipTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const [hoveredBubble, setHoveredBubble] = useState<BubbleDatum | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { data, assignees, categories } = useMemo(() => {
    const groupedPatents: Record<string, Record<string, Patent[]>> = {};
    const assigneeCounts = new Map<string, number>();
    const subdomainCounts = new Map<string, number>();

    patents.forEach(p => {
      const assignee = p.assignee.name || 'Unknown';
      const subdomain = p.subdomain || 'General';
      
      if (!groupedPatents[subdomain]) groupedPatents[subdomain] = {};
      if (!groupedPatents[subdomain][assignee]) groupedPatents[subdomain][assignee] = [];
      groupedPatents[subdomain][assignee].push(p);

      assigneeCounts.set(assignee, (assigneeCounts.get(assignee) || 0) + 1);
      subdomainCounts.set(subdomain, (subdomainCounts.get(subdomain) || 0) + 1);
    });

    const assignees = topNamesByCount(assigneeCounts);
    const categories = topNamesByCount(subdomainCounts);

    const data: BubbleDatum[] = [];
    const totalPatents = patents.length || 1;
    categories.forEach(subdomain => {
      assignees.forEach(assignee => {
        const patentsForBubble = groupedPatents[subdomain]?.[assignee];

        if (patentsForBubble?.length) {
          const parentDomains = Array.from(
            new Set(patentsForBubble.map((patent) => patent.domain || 'Uncategorized')),
          ).sort();
          const params = new URLSearchParams({ assignee, sub: subdomain });
          if (parentDomains.length === 1) params.set('category', parentDomains[0]);
          const href = patentsForBubble.length === 1
            ? `/patent/${patentsForBubble[0].publicationNumber}`
            : `/search?${params.toString()}`;

          data.push({
            domain: parentDomains[0] || 'Uncategorized',
            category: subdomain,
            assignee,
            count: patentsForBubble.length,
            share: Math.round((patentsForBubble.length / totalPatents) * 1000) / 10,
            patents: patentsForBubble,
            subdomains: [subdomain],
            href,
          });
        }
      });
    });

    return { data, assignees, categories };
  }, [patents]);

  useEffect(() => {
    return () => {
      if (hideTooltipTimeoutRef.current) {
        window.clearTimeout(hideTooltipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const clearHideTooltip = () => {
      if (hideTooltipTimeoutRef.current) {
        window.clearTimeout(hideTooltipTimeoutRef.current);
        hideTooltipTimeoutRef.current = null;
      }
    };

    const scheduleHideTooltip = () => {
      clearHideTooltip();
      hideTooltipTimeoutRef.current = window.setTimeout(() => {
        setHoveredBubble(null);
      }, 1000);
    };

    const updateTooltipPosition = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      const tooltipWidth = 380;
      const tooltipHeight = 320;
      const offset = 28;

      const target = event.currentTarget as SVGCircleElement | null;
      const targetBounds = target?.getBoundingClientRect();
      const anchorX = targetBounds
        ? targetBounds.left - bounds.left + targetBounds.width / 2
        : event.clientX - bounds.left;
      const anchorY = targetBounds
        ? targetBounds.top - bounds.top + targetBounds.height / 2
        : event.clientY - bounds.top;

      const placeRight = anchorX < bounds.width / 2;
      const placeBelow = anchorY < bounds.height / 2;

      let x = placeRight ? anchorX + offset : anchorX - tooltipWidth - offset;
      let y = placeBelow ? anchorY + offset : anchorY - tooltipHeight - offset;

      if (placeBelow && y < anchorY + 16) y = anchorY + 16;
      if (!placeBelow && y > anchorY - 16) y = anchorY - tooltipHeight - 16;

      if (x + tooltipWidth > bounds.width - 12) x = bounds.width - tooltipWidth - 12;
      if (x < 12) x = 12;
      if (y + tooltipHeight > bounds.height - 12) y = bounds.height - tooltipHeight - 12;
      if (y < 12) y = 12;

      setTooltipPosition({ x, y });
    };

    const updateChart = () => {
      if (!containerRef.current) return;
      
      const margin = { top: 120, right: 80, bottom: 80, left: 220 };
      const minStepX = 120;
      const minStepY = 60;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const availableWidth = containerWidth - margin.left - margin.right;
      const availableHeight = containerHeight - margin.top - margin.bottom;

      // Calculate width/height based on data density vs available space
      const width = Math.max(availableWidth, assignees.length * minStepX);
      const height = Math.max(availableHeight, categories.length * minStepY);

      const svg = select(svgRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
      
      svg.selectAll("*").remove();

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = scalePoint<string>()
        .domain(assignees)
        .range([0, width])
        .padding(0.5);

      const yScale = scalePoint<string>()
        .domain(categories)
        .range([0, height])
        .padding(0.5);

      const maxCount = (max(data, (d: any) => d.count) || 1) as number;
      const radiusScale = scaleSqrt()
        .domain([0, maxCount])
        .range([5, 25]);

      const colorScale = scaleSequential(
        interpolateRgb(BRAND_BUBBLE_LIGHT, BRAND_BUBBLE_DARK),
      ).domain([1, Math.max(1, maxCount)]);

      // Grid Lines (Horizontal)
      g.selectAll(".grid-line-h")
        .data(categories)
        .enter()
        .append("line")
        .attr("class", "grid-line-h")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", (d: any) => yScale(d) || 0)
        .attr("y2", (d: any) => yScale(d) || 0)
        .attr("stroke", "#f1f5f9")
        .attr("stroke-width", 1);

      // Grid Lines (Vertical)
      g.selectAll(".grid-line-v")
        .data(assignees)
        .enter()
        .append("line")
        .attr("class", "grid-line-v")
        .attr("x1", (d: any) => xScale(d) || 0)
        .attr("x2", (d: any) => xScale(d) || 0)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#f1f5f9")
        .attr("stroke-width", 1);

      // Axes
      const xAxis = axisTop(xScale).tickSize(0).tickPadding(20);
      const yAxis = axisLeft(yScale).tickSize(0).tickPadding(20);

      g.append("g")
        .attr("class", "x-axis")
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("font-weight", "700")
        .attr("fill", "#64748b")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "start");

      g.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("fill", "#334155");

      // Bubbles
      const bubbleGroups = g.selectAll(".bubble-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bubble-group")
        .attr("transform", (d: any) => `translate(${xScale(d.assignee)},${yScale(d.category)})`);

      bubbleGroups.append("circle")
        .attr("r", (d: any) => radiusScale(d.count))
        .attr("fill", (d: any) => colorScale(d.count))
        .attr("opacity", 0.92)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d: BubbleDatum) => {
          clearHideTooltip();
          updateTooltipPosition(event);
          setHoveredBubble(d);
        })
        .on("mousemove", (event) => {
          clearHideTooltip();
          updateTooltipPosition(event);
        })
        .on("mouseleave", () => {
          scheduleHideTooltip();
        })
        .on("click", (event, d: BubbleDatum) => {
          event.preventDefault();
          event.stopPropagation();
          setHoveredBubble(d);
          if (onSelectBubble) onSelectBubble(d);
        });

      bubbleGroups.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", (d: any) => d.count > (maxCount as number) / 2 ? "white" : "#1e293b")
        .attr("font-size", "10px")
        .attr("font-weight", "700")
        .attr("pointer-events", "none")
        .text((d: any) => d.count);

      // Footer
      const fullWidth = width + margin.left + margin.right;
      svg.append("text")
        .attr("x", fullWidth / 2)
        .attr("y", height + margin.top + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-style", "italic")
        .attr("fill", "#94a3b8")
        .text(`Note: The patent count represents the number of unique patent families per assignee in each technology subdomain.`);
    };

    updateChart();

    const observer = new ResizeObserver(() => {
      updateChart();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [data, assignees, categories, onSelectBubble]);

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Special Header Section */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Assignee Competitive Landscape</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Top 10 Subdomains by Top 10 Assignees</p>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="flex-1 relative overflow-auto custom-scrollbar">
        <svg ref={svgRef} className="mx-auto" />

        {hoveredBubble && (
          <div
            className="absolute z-20 w-[380px] max-w-[calc(100%-24px)] rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-md pointer-events-auto"
            style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
            onMouseEnter={() => {
              if (hideTooltipTimeoutRef.current) {
                window.clearTimeout(hideTooltipTimeoutRef.current);
                hideTooltipTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => setHoveredBubble(null)}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full bg-[#00bdcd]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0d5861]">
                  Competitive signal
                </div>
                <h3 className="mt-2 truncate text-lg font-bold leading-tight text-slate-900">{hoveredBubble.assignee}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">{hoveredBubble.category}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 px-4 py-2 text-right text-white">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Patents</div>
                <div className="text-xl font-black leading-none">{hoveredBubble.count}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Share</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{hoveredBubble.share}%</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">State</div>
                <div className="mt-1 text-sm font-bold text-slate-900">Hover</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Scope</div>
                <div className="mt-1 text-sm font-bold text-slate-900">Subdomain</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-1">
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  'bg-white text-slate-900 shadow-sm'
                }`}
                onClick={() => undefined}
              >
                Insights
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Hover preview
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Insight
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  This bubble shows where {hoveredBubble.assignee} is strongest inside {hoveredBubble.category}. It is a
                  quick signal for concentration and competitive presence.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#00bdcd] hover:bg-[#f5fdfe]"
                  onClick={() => onSelectAssignee?.(hoveredBubble.assignee)}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Filter company</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">Jump to list</div>
                </button>
                <Link
                  to={hoveredBubble.href}
                  className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-left text-white transition hover:bg-slate-800"
                  onClick={() => {
                    if (hoveredBubble.patents.length === 1 && onSelectPatent) {
                      onSelectPatent(hoveredBubble.patents[0]);
                    }
                  }}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Navigate</div>
                  <div className="mt-1 text-sm font-bold">Open patent set</div>
                </Link>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Subdomain tags
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hoveredBubble.subdomains.map((subdomain) => (
                    <span
                      key={subdomain}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700"
                    >
                      {subdomain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
