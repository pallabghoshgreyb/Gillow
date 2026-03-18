import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { select, scalePoint, scaleSqrt, scaleSequential, interpolateBlues, axisTop, axisLeft, max } from 'd3';
import { Patent } from '../types';

interface BubbleChartProps {
  patents: Patent[];
  onSelectBubble?: (bubble: any) => void;
  onSelectPatent?: (patent: Patent) => void;
}

interface BubbleDatum {
  domain: string;
  assignee: string;
  count: number;
  patents: Patent[];
  subdomains: string[];
  href: string;
}

export const BubbleChart: React.FC<BubbleChartProps> = ({ patents, onSelectBubble, onSelectPatent }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTooltipTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const [hoveredBubble, setHoveredBubble] = useState<BubbleDatum | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { data, assignees, categories } = useMemo(() => {
    const groupedPatents: Record<string, Record<string, Patent[]>> = {};
    const groupedSubdomains: Record<string, Record<string, Set<string>>> = {};
    const allAssigneesSet = new Set<string>();
    const allCategoriesSet = new Set<string>();

    patents.forEach(p => {
      const assignee = p.assignee.name || 'Unknown';
      const domain = p.domain || 'Uncategorized';
      const subdomain = p.subdomain || 'General';
      
      if (!groupedPatents[domain]) groupedPatents[domain] = {};
      if (!groupedPatents[domain][assignee]) groupedPatents[domain][assignee] = [];
      groupedPatents[domain][assignee].push(p);

      if (!groupedSubdomains[domain]) groupedSubdomains[domain] = {};
      if (!groupedSubdomains[domain][assignee]) groupedSubdomains[domain][assignee] = new Set<string>();
      groupedSubdomains[domain][assignee].add(subdomain);
      
      allAssigneesSet.add(assignee);
      allCategoriesSet.add(domain);
    });

    const assignees = Array.from(allAssigneesSet).sort();
    const categories = Array.from(allCategoriesSet).sort();

    const data: BubbleDatum[] = [];
    categories.forEach(domain => {
      assignees.forEach(assignee => {
        const patentsForBubble = groupedPatents[domain]?.[assignee];
        const subdomains = Array.from(groupedSubdomains[domain]?.[assignee] || []).sort();

        if (patentsForBubble?.length) {
          const href = patentsForBubble.length === 1
            ? `/patent/${patentsForBubble[0].publicationNumber}`
            : `/search?q=${encodeURIComponent(assignee)}&category=${encodeURIComponent(domain)}${
                subdomains.length === 1 ? `&sub=${encodeURIComponent(subdomains[0])}` : ''
              }`;

          data.push({
            domain,
            assignee,
            count: patentsForBubble.length,
            patents: patentsForBubble,
            subdomains,
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
      }, 120);
    };

    const updateTooltipPosition = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 170;
      const offset = 18;

      let x = event.clientX - bounds.left + offset;
      let y = event.clientY - bounds.top + offset;

      if (x + tooltipWidth > bounds.width) {
        x = event.clientX - bounds.left - tooltipWidth - offset;
      }

      if (y + tooltipHeight > bounds.height) {
        y = event.clientY - bounds.top - tooltipHeight - offset;
      }

      setTooltipPosition({
        x: Math.max(12, x),
        y: Math.max(12, y),
      });
    };

    const handleBubbleNavigation = (bubble: BubbleDatum) => {
      if (bubble.patents.length === 1 && onSelectPatent) {
        onSelectPatent(bubble.patents[0]);
      }

      navigate(bubble.href);
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

      const colorScale = scaleSequential(interpolateBlues)
        .domain([0, (maxCount as number) * 1.2]);

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
        .attr("transform", (d: any) => `translate(${xScale(d.assignee)},${yScale(d.domain)})`);

      bubbleGroups.append("circle")
        .attr("r", (d: any) => radiusScale(d.count))
        .attr("fill", (d: any) => colorScale(d.count))
        .attr("opacity", 0.8)
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
          if (onSelectBubble) onSelectBubble(d);
          handleBubbleNavigation(d);
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
        .text(`Note: The patent count represents the number of unique patent families per assignee in each technology domain.`);
    };

    updateChart();

    const observer = new ResizeObserver(() => {
      updateChart();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [data, assignees, categories, navigate, onSelectBubble, onSelectPatent]);

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Special Header Section */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assignee Competitive Landscape</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Technology Domains by Key Assignees</p>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="flex-1 relative overflow-auto custom-scrollbar">
        <svg ref={svgRef} className="mx-auto" />

        {hoveredBubble && (
          <div
            className="absolute z-20 w-80 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm"
            style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
            onMouseEnter={() => {
              if (hideTooltipTimeoutRef.current) {
                window.clearTimeout(hideTooltipTimeoutRef.current);
                hideTooltipTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => setHoveredBubble(null)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                  {hoveredBubble.count} patent{hoveredBubble.count === 1 ? '' : 's'}
                </div>
                <h3 className="mt-1 text-sm font-black text-slate-900">{hoveredBubble.assignee}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">{hoveredBubble.domain}</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {hoveredBubble.count}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Level 2 Subdomains
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {hoveredBubble.subdomains.map((subdomain) => (
                  <span
                    key={subdomain}
                    className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"
                  >
                    {subdomain}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {hoveredBubble.patents.slice(0, 3).map((patent) => (
                <div key={patent.publicationNumber} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {patent.publicationNumber}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-medium text-slate-700">
                    {patent.title}
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={hoveredBubble.href}
              className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
              onClick={() => {
                if (hoveredBubble.patents.length === 1 && onSelectPatent) {
                  onSelectPatent(hoveredBubble.patents[0]);
                }
              }}
            >
              {hoveredBubble.patents.length === 1 ? 'Open Patent' : 'Open Patent Set'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
