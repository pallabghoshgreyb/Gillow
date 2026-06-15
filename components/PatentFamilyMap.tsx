import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Patent, MapPoint, PatentGeographyData } from '../types';
import { processPatentGeography, getRegionColor, getMarkerSize } from '../utils/geoUtils';
import { Globe, X, ChevronRight, Info, BarChart3, Building2, ExternalLink } from 'lucide-react';

interface Props {
  patent: Patent;
  height?: number;
}

const PatentFamilyMap: React.FC<Props> = ({ patent, height = 450 }) => {
  const geoData = useMemo(() => processPatentGeography(patent), [patent]);
  const [selectedCountry, setSelectedCountry] = useState<MapPoint | null>(null);

  if (!geoData) {
    return (
      <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <Info className="text-slate-300 mb-2" size={24} />
        <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">No family geography data available</span>
      </div>
    );
  }

  // Custom diamond icon for regional offices (EPO, WIPO)
  const createRegionalIcon = (point: MapPoint) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 -rotate-45 border-2 border-dashed border-indigo-500 bg-white/90 flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2">
              <div class="w-4 h-4 rotate-45 bg-indigo-600 rounded-sm animate-pulse"></div>
            </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  return (
    <div className="relative rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group/map">
      {/* Top Stats Bar */}
      <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-2xl border border-white pointer-events-auto flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tighter">Global Family</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={12} /> {geoData.totalFamilyMembers} Members • {geoData.uniqueJurisdictions} Jurisdictions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {geoData.mapPoints.slice(0, 3).map(pt => (
              <div key={pt.code} className="flex flex-col gap-1 min-w-[80px]">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight text-slate-500">
                  <span>{pt.code}</span>
                  <span>{pt.count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${pt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div key={patent.publicationNumber} style={{ height }} className="w-full relative z-0">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          scrollWheelZoom={false}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {geoData.mapPoints.map(point => (
            <CircleMarker
              key={point.code}
              center={point.coordinates}
              radius={getMarkerSize(point.count)}
              fillColor={getRegionColor(point.region)}
              color="white"
              weight={2}
              opacity={1}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => setSelectedCountry(point),
                mouseover: (e) => {
                  e.target.setStyle({ fillOpacity: 1, weight: 3 });
                  e.target.openTooltip();
                },
                mouseout: (e) => {
                  e.target.setStyle({ fillOpacity: 0.7, weight: 2 });
                  e.target.closeTooltip();
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="!bg-slate-900 !border-none !text-white !rounded-lg !px-3 !py-2 !font-bold !text-xs !shadow-2xl">
                <div className="flex items-center gap-2">
                  <span>{point.country}</span>
                  <span className="opacity-50">•</span>
                  <span className="text-blue-400">{point.count} Filings</span>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {geoData.regionalOffices.map(office => (
            <Marker
              key={office.code}
              position={office.coordinates}
              icon={createRegionalIcon(office)}
              eventHandlers={{
                click: () => setSelectedCountry(office)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="!bg-indigo-900 !border-none !text-white !rounded-lg !px-3 !py-2 !font-bold !text-xs !shadow-2xl">
                <div className="flex flex-col">
                  <span>{office.country}</span>
                  <span className="text-[10px] opacity-60">Regional coverage across {office.region}</span>
                </div>
              </Tooltip>
            </Marker>
          ))}
          
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>

      {/* Detail Sidebar */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-[1001] transform transition-transform duration-500 border-l border-slate-200 flex flex-col ${selectedCountry ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedCountry && (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getFlagEmoji(selectedCountry.code)}</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none">{selectedCountry.country}</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedCountry.region}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCountry(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filings</div>
                  <div className="text-2xl font-black text-slate-900">{selectedCountry.count}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight</div>
                  <div className="text-2xl font-black text-blue-600">{selectedCountry.percentage}%</div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={12} /> Jurisdiction Intelligence
                </h5>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {selectedCountry.isRegionalOffice 
                    ? `Filings at the ${selectedCountry.country} provide unified protection pathways for participating territories within the ${selectedCountry.region} cluster.`
                    : `Active technical enforcement detected within ${selectedCountry.country}. Strategic family members indicate significant market interest in this territory.`
                  }
                </p>
              </div>

              <div className="space-y-4">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Registry</h5>
                 <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Building2 size={16} /> Local Patent Office <ExternalLink size={14} className="opacity-50" />
                 </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Ref: {patent.id}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] hidden md:flex items-center gap-6 bg-slate-900/90 backdrop-blur p-4 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">N. America</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Asia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Europe</span>
        </div>
      </div>
    </div>
  );
};

// Helper for flag emojis
const getFlagEmoji = (code: string) => {
  if (code === 'EP') return '🇪🇺';
  if (code === 'WO') return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default PatentFamilyMap;