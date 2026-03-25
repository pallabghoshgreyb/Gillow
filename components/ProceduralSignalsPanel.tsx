import React from 'react';
import { Patent } from '../types';
import { hasItems } from '../utils/patentDisplay';
import { Building2, FileStack, Flag, Gavel, GitBranch, Landmark, ShieldAlert, Sparkles, Target } from 'lucide-react';

interface ProceduralSignalsPanelProps {
  patent: Patent;
}

export const ProceduralSignalsPanel: React.FC<ProceduralSignalsPanelProps> = ({ patent }) => {
  const hasTrackOne = hasItems(patent.trackOneCodes);
  const hasNonPublication = hasItems(patent.nonPublicationCodes);
  const hasCipConDiv = hasItems(patent.cipConDiv);
  const hasIprPgr = hasItems(patent.iprPgr);
  const hasFit = hasItems(patent.fit);
  const hasLargestFamilies = hasItems(patent.largestFamilies);
  const hasGovernmentInterest = patent.flags.governmentInterest;
  const hasSep = patent.flags.sep;
  const hasLitigation = patent.flags.litigation;

  if (!hasTrackOne && !hasNonPublication && !hasCipConDiv && !hasIprPgr && !hasFit && !hasLargestFamilies && !hasGovernmentInterest && !hasSep && !hasLitigation) {
    return null;
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <FileStack size={120} />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Procedural & Strategic Signals</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileStack size={14} className="text-blue-500" /> Procedural Codes
          </div>
          {(hasTrackOne || hasNonPublication) && <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            {hasTrackOne && <CodeCluster
              label="Track-One Codes"
              items={patent.trackOneCodes}
              icon={<Sparkles size={18} />}
              tone="blue"
            />}
            {hasTrackOne && hasNonPublication && <div className="h-px bg-slate-50 w-full" />}
            {hasNonPublication && <CodeCluster
              label="Non-Publication Codes"
              items={patent.nonPublicationCodes}
              icon={<FileStack size={18} />}
              tone="slate"
            />}
          </div>}
          <div className="grid grid-cols-1 gap-4">
            {hasCipConDiv && <CipConDivCard items={patent.cipConDiv} />}
            {hasIprPgr && <SignalCard label="IPR / PGR" items={patent.iprPgr} icon={<Gavel size={18} />} tone="amber" />}
            {hasFit && <SignalCard label="FIT" items={patent.fit} icon={<Target size={18} />} tone="emerald" />}
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Flag size={14} className="text-blue-500" /> Strategic Flags
          </div>
          <div className="grid grid-cols-1 gap-4">
            {hasLargestFamilies && <SignalCard label="Largest Families" items={patent.largestFamilies} icon={<Building2 size={18} />} tone="slate" />}
            {hasGovernmentInterest && <BooleanCard label="Government Interest" active={hasGovernmentInterest} icon={<Landmark size={18} />} activeTone="amber" />}
            {hasSep && <BooleanCard label="SEP" active={hasSep} icon={<ShieldAlert size={18} />} activeTone="blue" />}
            {hasLitigation && <BooleanCard label="Litigation" active={hasLitigation} icon={<Gavel size={18} />} activeTone="red" />}
          </div>
        </div>
      </div>
    </div>
  );
};

const SignalCard = ({ label, items, icon, tone }: { label: string; items: string[]; icon: React.ReactNode; tone: 'blue' | 'slate' | 'amber' | 'emerald' }) => {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    slate: 'bg-slate-50 border-slate-100 text-slate-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  };

  return (
    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl border shadow-sm flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
          <div className="text-xs font-bold text-slate-500 mt-1">Patent-specific procedural metadata</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={`${label}-${item}-${index}`} className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${tones[tone]}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const CipConDivCard = ({ items }: { items: string[] }) => {
  const normalizedTokens = Array.from(
    new Set(
      items
        .flatMap((item) => String(item).split(/[|,;/\s-]+/))
        .map((token) => token.trim().toUpperCase())
        .filter((token) => ['CIP', 'CON', 'DIV'].includes(token))
    )
  );

  const definitions = [
    { key: 'CIP', label: 'CIP' },
    { key: 'CON', label: 'CON' },
    { key: 'DIV', label: 'DIV' },
  ];

  return (
    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl border shadow-sm flex items-center justify-center bg-blue-50 border-blue-100 text-blue-700">
          <GitBranch size={18} />
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CIP / CON / DIV</div>
          <div className="text-xs font-bold text-slate-500 mt-1">Continuation pathway markers</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {definitions.map((definition) => {
          const active = normalizedTokens.includes(definition.key);

          return (
            <div
              key={definition.key}
              className={`rounded-2xl border p-4 shadow-sm transition-all ${
                active
                  ? 'bg-blue-50 border-blue-100'
                  : 'hidden'
              }`}
            >
              <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                {definition.label}
              </div>
              <div className={`mt-2 text-sm font-black ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                {definition.key}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CodeCluster = ({ label, items, icon, tone }: { label: string; items: string[]; icon: React.ReactNode; tone: 'blue' | 'slate' }) => {
  const chipClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-600 hover:text-white',
    slate: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-800 hover:text-white',
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
        <span className={tone === 'blue' ? 'text-blue-500' : 'text-slate-400'}>{icon}</span>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${label}-${item}-${index}`}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-default ${chipClasses[tone]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const BooleanCard = ({ label, active, icon, activeTone }: { label: string; active: boolean; icon: React.ReactNode; activeTone: 'blue' | 'amber' | 'red' }) => {
  const activeTones: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm transition-all ${active ? activeTones[activeTone] : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${active ? 'bg-white/80 border-white/80' : 'bg-white border-slate-200'}`}>
            {icon}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
            <div className="text-xs font-bold mt-1">Signal present</div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${active ? 'bg-white/80 border-white/80' : 'bg-white border-slate-200 text-slate-400'}`}>
          Yes
        </span>
      </div>
    </div>
  );
};
