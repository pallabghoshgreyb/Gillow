import React, { useState } from 'react';
import { Navigation, TrendingUp, Building } from 'lucide-react';
import { Patent } from '../types';
import { formatCompactCurrency, isKnownNumber } from '../utils/patentDisplay';
import { countryMapping } from '../utils/geoUtils';

interface PatentMapProps {
  patents: Patent[];
  onSelectPatent: (patent: Patent) => void;
}

const PatentMap: React.FC<PatentMapProps> = ({ patents, onSelectPatent }) => {
  const [hoveredPatent, setHoveredPatent] = useState<Patent | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const fallbackCountries: Record<string, string> = {
    US: 'United States of America',
    CN: 'China',
    EP: 'Europe (EPO)',
    WO: 'WIPO',
    TW: 'Taiwan',
    JP: 'Japan',
    KR: 'South Korea',
    DE: 'Germany',
    AU: 'Australia',
    MX: 'Mexico',
    BR: 'Brazil',
    CA: 'Canada',
    ES: 'Spain',
    HK: 'Hong Kong',
    MY: 'Malaysia',
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getCoords = (patent: Patent) => {
    const countryName = patent.countries[0] || fallbackCountries[patent.jurisdiction];
    const mapping = countryName ? countryMapping[countryName] : undefined;

    if (!mapping) {
      return { x: 50, y: 52 };
    }

    const [lat, lon] = mapping.coords;
    return {
      x: clamp(((lon + 180) / 360) * 100, 6, 94),
      y: clamp(((90 - lat) / 180) * 100, 10, 84),
    };
  };

  const handlePinHover = (e: React.MouseEvent, patent: Patent) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      setHoveredPatent(patent);
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div className="w-full h-full bg-[#f1f3f4] relative overflow-hidden group">
      <div className="absolute inset-0" style={{ 
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
        backgroundSize: '30px 30px' 
      }} />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
         <img 
            src="https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg" 
            className="w-[120%] h-[120%] object-cover grayscale invert"
            alt="World Map"
         />
      </div>

      <div className="absolute inset-0">
        {patents.map((patent) => {
          const { x, y } = getCoords(patent);
          const isHovered = hoveredPatent?.publicationNumber === patent.publicationNumber;
          
          return (
            <div 
              key={patent.publicationNumber}
              className="absolute transition-transform duration-300 hover:z-50"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={(e) => handlePinHover(e, patent)}
              onMouseLeave={() => setHoveredPatent(null)}
              onClick={() => onSelectPatent(patent)}
            >
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg cursor-pointer transition-all whitespace-nowrap
                ${isHovered 
                  ? 'bg-[#00bdcd] text-white border-blue-400 scale-110' 
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                }
              `}>
                <div className={`w-2 h-2 rounded-full ${isHovered ? 'bg-white animate-pulse' : 'bg-blue-500'}`} />
                <span className="text-sm font-semibold tracking-tight">
                  {formatCompactCurrency(patent.valuationEstimate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {hoveredPatent && (
        <div 
          className="absolute z-[100] w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
          style={{ 
            left: `${hoverPos.x}px`, 
            top: `${hoverPos.y - 140}px`,
            transform: 'translateX(-50%)' 
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#00bdcd]">{hoveredPatent.publicationNumber}</span>
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
               <TrendingUp size={10} /> {isKnownNumber(hoveredPatent.qualityScore) ? `${hoveredPatent.qualityScore}% Quality` : 'Not scored'}
            </div>
          </div>
          <h4 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{hoveredPatent.title}</h4>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
             <Building size={10} /> {hoveredPatent.assignee.name}
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-10 space-y-2">
         <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-[#00bdcd] rounded-lg flex items-center justify-center">
               <Navigation size={20} />
            </div>
            <div>
               <div className="text-xs font-medium uppercase tracking-[0.16em] leading-none text-slate-900">Geo-Intelligence</div>
               <div className="text-[10px] text-slate-500 font-medium">Positioned by filing jurisdiction</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PatentMap;
