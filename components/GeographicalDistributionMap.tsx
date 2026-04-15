import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

type JurisdictionStatus = 'granted' | 'pending' | 'expired';

type MapGroup = {
  code: string;
  country: string;
  count: number;
  status: JurisdictionStatus;
};

type GeographicalDistributionMapProps = {
  groups: MapGroup[];
  onSelect: (code: string) => void;
};

type TooltipState = {
  group: MapGroup;
  x: number;
  y: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_COORDS: Record<string, [number, number]> = {
  AU: [134, -25],
  BR: [-51, -10],
  CA: [-106, 57],
  CN: [104, 35],
  DE: [10, 51],
  EP: [10, 51],
  ES: [-4, 40],
  FR: [2, 46],
  GB: [-2, 54],
  HK: [114, 22],
  IN: [78, 22],
  IT: [12, 42],
  JP: [138, 36],
  KR: [128, 36],
  MX: [-102, 23],
  MY: [102, 4],
  SG: [104, 1.3],
  TW: [121, 23.8],
  US: [-97, 38],
  WO: [6.14, 46.2],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const statusMeta = (status: JurisdictionStatus) =>
  status === 'granted'
    ? { label: 'Granted', dot: 'bg-emerald-500', fill: '#10B981' }
    : status === 'pending'
      ? { label: 'Pending', dot: 'bg-amber-500', fill: '#F59E0B' }
      : { label: 'Expired', dot: 'bg-slate-400', fill: '#94A3B8' };

const flagEmoji = (code: string) => {
  if (code === 'WO') return String.fromCodePoint(0x1F310);
  const normalized = code === 'EP' ? 'EU' : code;
  if (!/^[A-Z]{2}$/.test(normalized)) return String.fromCodePoint(0x1F3F3);
  return String.fromCodePoint(
    ...normalized.split('').map((char) => 127397 + char.charCodeAt(0)),
  );
};

const GeographicalDistributionMap: React.FC<GeographicalDistributionMapProps> = ({
  groups,
  onSelect,
}) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [position, setPosition] = useState({
    coordinates: [0, 20] as [number, number],
    zoom: 1,
  });
  const mapRef = useRef<HTMLDivElement | null>(null);

  const showTooltip = (group: MapGroup, event: React.MouseEvent<SVGGElement>) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      group,
      x: clamp(event.clientX - rect.left, 136, rect.width - 136),
      y: clamp(event.clientY - rect.top, 88, rect.height - 88),
    });
  };

  return (
    <div className="hidden md:block">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60">
        <div ref={mapRef} className="relative overflow-x-auto">
          <div className="min-w-[720px]">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 140, center: [0, 20] }}
              style={{ width: '100%', height: 'auto' }}
              className="bg-white"
            >
              <ZoomableGroup
                center={position.coordinates}
                zoom={position.zoom}
                minZoom={1}
                maxZoom={4}
                onMoveEnd={(next) =>
                  setPosition({
                    coordinates: next.coordinates as [number, number],
                    zoom: next.zoom,
                  })
                }
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#F1F5F9"
                        stroke="#CBD5E1"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: '#E2E8F0', outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {groups
                  .filter((group) => COUNTRY_COORDS[group.code])
                  .map((group) => {
                    const meta = statusMeta(group.status);
                    const radius = Math.sqrt(group.count) * 4 + 4;

                    return (
                      <Marker key={group.code} coordinates={COUNTRY_COORDS[group.code]}>
                        <motion.g
                          role="button"
                          tabIndex={0}
                          onMouseEnter={(event) => showTooltip(group, event)}
                          onMouseMove={(event) => showTooltip(group, event)}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={() => onSelect(group.code)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onSelect(group.code);
                            }
                          }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                          style={{ cursor: 'pointer', transformOrigin: 'center center' }}
                        >
                          <motion.circle
                            r={radius + 5}
                            fill={meta.fill}
                            animate={{ opacity: [0.24, 0.04, 0.24], scale: [0.92, 1.32, 0.92] }}
                            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <circle
                            r={radius}
                            fill={meta.fill}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(15,23,42,0.12))' }}
                          />
                          <text
                            textAnchor="middle"
                            y={radius + 16}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '10px',
                              fontWeight: 600,
                              fill: '#334155',
                              pointerEvents: 'none',
                            }}
                          >
                            {group.code}
                          </text>
                        </motion.g>
                      </Marker>
                    );
                  })}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="pointer-events-none absolute z-10 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden="true">
                    {flagEmoji(tooltip.group.code)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tooltip.group.country}</p>
                    <p className="text-xs text-slate-500">{tooltip.group.code}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-500">
                    {tooltip.group.count} patent{tooltip.group.count === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {statusMeta(tooltip.group.status).label}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">Click to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Legend
          </p>
          {(['granted', 'pending', 'expired'] as JurisdictionStatus[]).map((status) => (
            <div key={status} className="inline-flex items-center gap-2 text-sm text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${statusMeta(status).dot}`} />
              {statusMeta(status).label}
            </div>
          ))}
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
            Not filed
          </div>
          <p className="ml-auto text-xs text-slate-400">
            Marker size reflects the number of patent family members.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeographicalDistributionMap;
