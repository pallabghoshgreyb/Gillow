import React, { useEffect, useRef, useMemo, useState } from 'react';
import { select, zoom as d3Zoom, zoomIdentity } from 'd3';
import { TechNode, TechLevel } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { ZoomIn, ZoomOut, Compass, Layers } from 'lucide-react';

interface TechMapProps {
  nodes: TechNode[];
  onSelectNode: (node: TechNode | null) => void;
  selectedNodeId: string | null;
  showLegend?: boolean;
}

const TechMap: React.FC<TechMapProps> = ({ nodes, onSelectNode, selectedNodeId, showLegend = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<any>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const nodeBounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: MAP_WIDTH, minY: 0, maxY: MAP_HEIGHT };
    }

    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.x - node.radius * 2.4),
        maxX: Math.max(acc.maxX, node.x + node.radius * 2.4),
        minY: Math.min(acc.minY, node.y - node.radius * 2.4),
        maxY: Math.max(acc.maxY, node.y + node.radius * 2.4),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );

    return {
      minX: Math.max(0, bounds.minX),
      maxX: Math.min(MAP_WIDTH, bounds.maxX),
      minY: Math.max(0, bounds.minY),
      maxY: Math.min(MAP_HEIGHT, bounds.maxY),
    };
  }, [nodes]);

  const getOverviewTransform = (width: number, height: number) => {
    const isDesktop = width >= 1024;
    const padding = {
      top: height >= 700 ? 28 : 20,
      right: 72,
      bottom: 68,
      left: isDesktop ? 280 : 24,
    };
    const usableWidth = Math.max(width - padding.left - padding.right, 320);
    const usableHeight = Math.max(height - padding.top - padding.bottom, 240);
    const boundsWidth = Math.max(nodeBounds.maxX - nodeBounds.minX, 640);
    const boundsHeight = Math.max(nodeBounds.maxY - nodeBounds.minY, 480);
    const overviewScale = Math.max(0.28, Math.min(Math.min(usableWidth / boundsWidth, usableHeight / boundsHeight) * 0.94, 1.1));
    const contentWidth = boundsWidth * overviewScale;
    const contentHeight = boundsHeight * overviewScale;
    const tx = padding.left + (usableWidth - contentWidth) / 2 - nodeBounds.minX * overviewScale;
    const ty = padding.top + (usableHeight - contentHeight) / 2 - nodeBounds.minY * overviewScale;

    return zoomIdentity.translate(tx, ty).scale(overviewScale);
  };

  // Generate a dense set of points for density calculation
  const scatterPoints = useMemo(() => {
    const points: { x: number; y: number; color: string; r: number; nodeId: string; level: TechLevel }[] = [];
    nodes.forEach((node, idx) => {
      // Scale points based on level
      const pointMultiplier = node.level === TechLevel.DOMAIN ? 50 : 20;
      const count = Math.min(node.patentCount * pointMultiplier, 500); 
      
      for (let i = 0; i < count; i++) {
        const rand = (s: number) => {
          const x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        
        const u1 = Math.max(rand(idx * 1000 + i), 0.0001);
        const u2 = rand(idx * 2000 + i);
        const radiusFactor = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const spread = node.level === TechLevel.DOMAIN ? 0.8 : 0.6;
        const r = Math.min(Math.abs(radiusFactor) * node.radius * spread, node.radius * 2);
        const angle = rand(idx * 3000 + i) * 2 * Math.PI;

        points.push({
          x: node.x + r * Math.cos(angle),
          y: node.y + r * Math.sin(angle),
          color: node.color,
          r: 1 + rand(idx * 4000 + i) * 1.5,
          nodeId: node.id,
          level: node.level
        });
      }
    });
    return points;
  }, [nodes]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateSize = () => {
      if (!wrapperRef.current) return;
      setViewportSize({
        width: wrapperRef.current.clientWidth,
        height: wrapperRef.current.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current || viewportSize.width === 0 || viewportSize.height === 0) return;

    const svg = select(svgRef.current);
    const wrapperWidth = viewportSize.width;
    const wrapperHeight = viewportSize.height;

    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${wrapperWidth} ${wrapperHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g");

    // --- ZOOM LOGIC ---
    const updateVisibility = (scale: number) => {
      // Logic: 
      // Zoom out (scale < 0.8): Only Domains visible.
      // Zoom in (scale > 1.2): Only Subdomains visible.
      // In-between: Cross-fade transition.
      
      const subOpacity = Math.max(0, Math.min((scale - 0.7) * 3, 1));
      const domainOpacity = Math.max(0, Math.min(1 - (scale - 1.0) * 3, 1));

      // Update Subdomain labels and points
      g.selectAll(".label-group.level-SUBDOMAIN")
        .style("opacity", subOpacity)
        .style("pointer-events", scale > 0.8 ? "all" : "none");

      g.selectAll(".scatter-SUBDOMAIN")
        .style("opacity", subOpacity * 0.6);

      // Update Domain labels and points
      g.selectAll(".label-group.level-DOMAIN")
        .style("opacity", domainOpacity)
        .style("pointer-events", scale < 1.3 ? "all" : "none");

      g.selectAll(".scatter-DOMAIN")
        .style("opacity", domainOpacity * 0.6);
        
      // Peak markers also cross-fade
      g.selectAll(".peak-DOMAIN").style("opacity", domainOpacity);
      g.selectAll(".peak-SUBDOMAIN").style("opacity", subOpacity);
    };

    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .extent([[0, 0], [wrapperWidth, wrapperHeight]])
      .translateExtent([[-MAP_WIDTH * 0.2, -MAP_HEIGHT * 0.2], [MAP_WIDTH * 1.2, MAP_HEIGHT * 1.2]])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        updateVisibility(event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Initial transform
    const initialTransform = getOverviewTransform(wrapperWidth, wrapperHeight);
    svg.call(zoom.transform, initialTransform);

    // --- DEFS ---
    const defs = svg.append("defs");
    const dropShadow = defs.append("filter").attr("id", "3d-shadow")
      .attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    dropShadow.append("feDropShadow")
      .attr("dx", 0).attr("dy", 4)
      .attr("stdDeviation", 8)
      .attr("flood-opacity", 0.1);

    const terrainBlur = defs.append("filter").attr("id", "contour-blur");
    terrainBlur.append("feGaussianBlur").attr("stdDeviation", 4);

    // --- GRID ---
    g.append("rect")
      .attr("width", MAP_WIDTH)
      .attr("height", MAP_HEIGHT)
      .attr("fill", "#f8fafc");

    const gridSize = 150;
    for (let x = 0; x <= MAP_WIDTH; x += gridSize) {
      g.append("line").attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", MAP_HEIGHT)
        .attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("opacity", 0.3);
    }
    for (let y = 0; y <= MAP_HEIGHT; y += gridSize) {
      g.append("line").attr("x1", 0).attr("y1", y).attr("x2", MAP_WIDTH).attr("y2", y)
        .attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("opacity", 0.3);
    }

    // --- TOPOGRAPHIC HEATMAP ---
    const terrain = g.append("g").attr("class", "terrain");
    nodes.forEach(node => {
        const layers = node.level === TechLevel.DOMAIN ? 6 : 3;
        for (let i = 0; i < layers; i++) {
            terrain.append("circle")
                .attr("cx", node.x)
                .attr("cy", node.y)
                .attr("r", node.radius * (2.2 - i * 0.3))
                .attr("fill", node.color)
                .attr("opacity", (node.level === TechLevel.DOMAIN ? 0.03 : 0.015) + (i * 0.01))
                .style("filter", "url(#contour-blur)");
        }
    });

    // --- SCATTER DOTS ---
    const scatter = g.append("g").attr("class", "scatter");
    scatter.selectAll("circle")
      .data(scatterPoints)
      .enter()
      .append("circle")
      .attr("class", (d: any) => `scatter-${d.level}`)
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => d.color)
      .attr("opacity", 0); // Initially hidden, set by updateVisibility

    // --- CALLOUT LABELS ---
    const labels = g.append("g").attr("class", "labels");
    nodes.forEach((node, i) => {
        const isDomain = node.level === TechLevel.DOMAIN;
        const offset = (isDomain ? 160 : 80) + node.radius * 0.4;
        const angle = isDomain ? ((i % 2 === 0 ? -1 : 1) * (Math.PI / 4) - (Math.PI / 2)) : (Math.PI / 4);
        const lx = node.x + Math.cos(angle) * offset;
        const ly = node.y + Math.sin(angle) * offset * 0.8;

        const labelGroup = labels.append("g")
            .attr("class", `label-group cursor-pointer level-${node.level}`)
            .attr("transform", `translate(${lx - 70}, ${ly})`)
            .style("opacity", 0) // Initially hidden, set by updateVisibility
            .on("click", (event) => {
                event.stopPropagation();
                onSelectNode(node);
                
                const scale = isDomain ? 1.0 : 1.5;
                const tx = -node.x * scale + wrapperWidth / 2;
                const ty = -node.y * scale + wrapperHeight / 2;
                svg.transition().duration(800).call(zoom.transform, zoomIdentity.translate(tx, ty).scale(scale));
            });

        // Box
        labelGroup.append("rect")
            .attr("width", isDomain ? 150 : 130)
            .attr("height", isDomain ? 65 : 50)
            .attr("rx", 8)
            .attr("fill", "white")
            .attr("stroke", node.id === selectedNodeId ? node.color : "#e2e8f0")
            .attr("stroke-width", node.id === selectedNodeId ? 2.5 : 1)
            .style("filter", "url(#3d-shadow)");

        // Text
        const header = isDomain ? node.domain.split(' ')[0].toUpperCase() : "SUB-SECTOR";
        labelGroup.append("text")
            .attr("x", 12)
            .attr("y", 20)
            .text(header)
            .attr("fill", isDomain ? "#64748b" : "#94a3b8")
            .attr("font-size", "8px")
            .attr("font-weight", "900")
            .attr("font-family", "var(--font-sans)");

        labelGroup.append("text")
            .attr("x", 12)
            .attr("y", isDomain ? 38 : 34)
            .text(node.name)
            .attr("fill", "#0f172a")
            .attr("font-size", isDomain ? "11px" : "10px")
            .attr("font-weight", "bold");

        labelGroup.append("text")
            .attr("x", 12)
            .attr("y", isDomain ? 54 : 44)
            .text(`${node.patentCount} Patent${node.patentCount !== 1 ? 's' : ''}`)
            .attr("fill", node.color)
            .attr("font-size", "9px")
            .attr("font-weight", "800");

        // Peak marker
        g.append("circle")
            .attr("class", `peak-${node.level}`)
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", isDomain ? 5 : 3)
            .attr("fill", "white")
            .attr("stroke", node.color)
            .attr("stroke-width", 2);
    });

    svg.on("click", () => onSelectNode(null));

    // Run initial visibility check
    updateVisibility(initialTransform.k);

  }, [nodes, selectedNodeId, onSelectNode, scatterPoints, viewportSize, nodeBounds]);

  return (
    <div ref={wrapperRef} className="w-full h-full min-h-0 relative overflow-hidden rounded-[2rem] bg-white">
      {showLegend && (
        <div className="absolute left-4 top-4 z-10 space-y-4 md:left-8 md:top-8">
          <div className="w-[calc(100vw-2rem)] max-w-64 bg-white/95 p-4 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-xl md:p-5">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              <Layers size={14} className="text-blue-600"/> Technical Discovery
            </h3>
            <div className="space-y-2">
              {nodes.filter(n => n.level === TechLevel.DOMAIN).map(n => (
                <div key={n.id} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: n.color }} />
                  <span className="text-sm font-medium text-slate-700">{n.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs font-medium uppercase tracking-[0.14em] leading-relaxed text-slate-400">
              Zoom out for high-level technical Domains. Zoom in to uncover specialized technical Subdomains.
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3 md:bottom-8 md:right-8">
        <button onClick={() => select(svgRef.current!).transition().call(zoomRef.current.scaleBy, 1.5)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-xl active:scale-95 transition-all">
          <ZoomIn size={24} />
        </button>
        <button onClick={() => select(svgRef.current!).transition().call(zoomRef.current.scaleBy, 0.7)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-xl active:scale-95 transition-all">
          <ZoomOut size={24} />
        </button>
        <button onClick={() => {
          if (!svgRef.current || !zoomRef.current || !wrapperRef.current) return;
          select(svgRef.current).transition().duration(750).call(
            zoomRef.current.transform,
            getOverviewTransform(wrapperRef.current.clientWidth, wrapperRef.current.clientHeight)
          );
        }} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-xl active:scale-95 transition-all">
          <Compass size={24} />
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
};

export default TechMap;
