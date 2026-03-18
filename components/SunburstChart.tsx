import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Patent } from '../types';
import { DOMAIN_COLORS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { Info, LayoutGrid, ArrowLeft, MousePointer2 } from 'lucide-react';

interface SunburstChartProps {
  patents: Patent[];
}

const SunburstChart: React.FC<SunburstChartProps> = ({ patents }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['All Patents']);
  const [currentNode, setCurrentNode] = useState<any>(null);
  const [hoveredInfo, setHoveredInfo] = useState<any>(null);

  const hierarchyData = useMemo(() => {
    const root = {
      name: "All Patents",
      children: [] as any[]
    };

    const domainMap = new Map<string, any>();

    patents.forEach(patent => {
      // Fix: Use 'domain' and 'subdomain' properties instead of technologyCategory/subCategory
      const domain = patent.domain || 'Uncategorized';
      const sub = patent.subdomain || 'General';

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          name: domain,
          color: DOMAIN_COLORS[domain] || DOMAIN_COLORS.Default,
          children: new Map<string, any>()
        });
      }

      const domainNode = domainMap.get(domain);
      if (!domainNode.children.has(sub)) {
        domainNode.children.set(sub, {
          name: sub,
          domain: domain,
          children: []
        });
      }

      domainNode.children.get(sub).children.push({
        name: patent.id,
        value: 1,
        title: patent.title,
        assignee: patent.assignee.name
      });
    });

    root.children = Array.from(domainMap.values()).map(d => ({
      ...d,
      children: Array.from(d.children.values())
    }));

    return root;
  }, [patents]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 650;
    const radius = Math.min(width, height) / 2.2;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .style("font", "10px sans-serif");

    svg.selectAll("*").remove();

    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const partition = d3.partition<any>()
      .size([2 * Math.PI, radius]);

    partition(root);

    const arc = d3.arc<any>()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius((d: any) => d.y0)
      .outerRadius((d: any) => d.y1 - 1);

    const color = (d: any) => {
      if (d.depth === 0) return "#ffffff";
      if (d.depth === 1) return d.data.color;
      return d3.color(d.parent.data.color || "#cbd5e1")?.brighter(d.depth * 0.3).toString() || "#cbd5e1";
    };

    const g = svg.append("g");

    const path = g.selectAll("path")
      .data(root.descendants().filter(d => d.depth > 0))
      .join("path")
      .attr("fill", d => color(d))
      .attr("fill-opacity", d => (d.children ? 0.75 : 0.45))
      .attr("d", arc)
      .attr("class", "cursor-pointer transition-all duration-300 hover:fill-opacity-100 hover:stroke-white hover:stroke-1")
      .on("mouseover", (event, d) => {
          setHoveredInfo({
              name: d.data.name,
              count: d.value,
              topAssignee: d.data.assignee || 'Multiple',
              depth: d.depth
          });
      })
      .on("mouseout", () => setHoveredInfo(null))
      .on("click", (event, d) => {
          if (d.children) clicked(event, d);
      });

    const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().filter((d: any) => d.depth > 0 && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
      .join("text")
      .attr("transform", function(d: any) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .attr("fill", "#0f172a")
      .attr("font-weight", "800")
      .attr("font-size", d => d.depth === 1 ? "12px" : "9px")
      .text(d => d.data.name.length > 18 ? d.data.name.slice(0, 15) + '...' : d.data.name);

    // Center UI
    const centerGroup = svg.append("g")
        .attr("class", "center-ui cursor-pointer")
        .on("click", (event) => clicked(event, root));

    centerGroup.append("circle")
      .attr("r", (root as any).y1)
      .attr("fill", "white")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 2);

    const centerText = centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.8em")
      .attr("fill", "#64748b")
      .attr("font-weight", "900")
      .attr("class", "uppercase tracking-[0.2em] text-[10px]")
      .text("Universe");

    const centerCount = centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.8em")
      .attr("fill", "#0f172a")
      .attr("font-size", "32px")
      .attr("font-weight", "900")
      .text(root.value || 0);

    function clicked(event: any, p: any) {
      if (!p) return;
      
      setBreadcrumb(p.ancestors().map((d: any) => d.data.name).reverse());
      setCurrentNode(p);
      
      centerCount.transition().duration(750).text(p.value || 0);
      centerText.transition().duration(750).text(p.depth === 0 ? "Universe" : "Section");

      root.each((d: any) => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth * (radius / 3)),
        y1: Math.max(0, d.y1 - p.depth * (radius / 3))
      });

      const t = svg.transition().duration(750);

      path.transition(t)
        .tween("data", (d: any) => {
          const i = d3.interpolate(d.current, d.target);
          return (t: any) => d.current = i(t);
        })
        .filter(function(d: any): any {
          return +((this as any).getAttribute("fill-opacity") || 0) || arcVisible(d.target);
        })
        .attr("fill-opacity", (d: any) => arcVisible(d.target) ? (d.children ? 0.75 : 0.45) : 0)
        .attr("pointer-events", (d: any) => arcVisible(d.target) ? "auto" : "none")
        .attrTween("d", (d: any) => () => arc(d.current));

      label.filter(function(d: any): any {
          return +((this as any).getAttribute("fill-opacity") || 0) || labelVisible(d.target);
        }).transition(t)
        .attr("fill-opacity", (d: any) => +labelVisible(d.target))
        .attrTween("transform", (d: any) => () => labelTransform(d.current));
    }

    function arcVisible(d: any) {
      return d.y1 <= radius && d.y0 >= 0 && d.x1 > d.x0;
    }

    function labelVisible(d: any) {
      return d.y1 <= radius && d.y0 >= 0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d: any) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    root.each((d: any) => d.current = d);

  }, [hierarchyData]);

  const handleViewPatents = () => {
    if (!currentNode || currentNode.depth === 0) {
        navigate('/browse');
        return;
    }
    const domain = currentNode.depth === 1 ? currentNode.data.name : currentNode.data.domain;
    const subdomain = currentNode.depth === 2 ? currentNode.data.name : '';
    navigate(`/browse?category=${encodeURIComponent(domain)}${subdomain ? `&sub=${encodeURIComponent(subdomain)}` : ''}`);
  };

  return (
    <div className="w-full flex flex-col items-center bg-white rounded-[3.5rem] p-8 md:p-16 border border-slate-100 shadow-2xl relative group/chart overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#006AFF]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Sunburst UI Overlay */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-10 flex flex-col gap-4 pointer-events-none w-full md:w-auto">
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/50 pointer-events-auto max-w-xs md:max-w-md">
             <div className="flex items-center gap-2 text-[10px] font-black text-[#006AFF] uppercase tracking-[0.2em] mb-3">
                <Info size={14}/> Technical Portfolio Map
             </div>
             <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-tight">
                {breadcrumb.map((b, i) => (
                  <React.Fragment key={i}>
                    <span className={`${i === breadcrumb.length - 1 ? 'text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100' : 'opacity-60 cursor-pointer hover:opacity-100'}`}>
                      {b}
                    </span>
                    {i < breadcrumb.length - 1 && <span className="opacity-20">/</span>}
                  </React.Fragment>
                ))}
             </div>
          </div>

          {currentNode && (
             <button 
                onClick={handleViewPatents}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest pointer-events-auto flex items-center gap-3 hover:bg-slate-800 transition-all animate-in slide-in-from-left-4 active:scale-95"
             >
                <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                  <LayoutGrid size={14} />
                </div>
                View {currentNode.value} technical patents
             </button>
          )}
      </div>

      {/* Tooltip Overlay */}
      {hoveredInfo && (
          <div className="absolute top-12 right-12 z-20 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none max-w-[240px]">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Cluster Insights</div>
              <h4 className="text-lg font-black leading-tight mb-3">{hoveredInfo.name}</h4>
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase">Volume</span>
                      <span className="font-black">{hoveredInfo.count} Patents</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase">Dominance</span>
                      <span className="font-black text-right truncate ml-4">{hoveredInfo.topAssignee}</span>
                  </div>
              </div>
          </div>
      )}

      {/* Legend & Instructions */}
      <div className="absolute bottom-12 right-12 text-right pointer-events-none opacity-40 group-hover/chart:opacity-100 transition-opacity hidden md:block">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-end gap-2">
              <MousePointer2 size={12} /> Navigation Guide
          </div>
          <div className="text-xs font-bold text-slate-600">Click segments to zoom • Center circle to reset</div>
      </div>

      <div ref={containerRef} className="w-full h-[650px] flex items-center justify-center">
        <svg ref={svgRef} className="w-full h-full overflow-visible"></svg>
      </div>
    </div>
  );
};

export default SunburstChart;