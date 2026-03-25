import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map as MapIcon, ArrowLeft, Info, HelpCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center bg-white">
      <div className="relative mb-12 animate-in zoom-in duration-700">
        <div className="text-[180px] font-black text-slate-50 leading-none select-none">404</div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-[#00bdcd] text-white rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
                <Search size={48} strokeWidth={3} />
            </div>
        </div>
      </div>

      <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Endpoint Not Found</h1>
      <p className="text-xl text-slate-500 max-w-md mx-auto mb-12 font-medium leading-relaxed">
        We couldn't locate that specific patent or landscape in our database.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <ArrowLeft size={18} /> Back to Hub
        </button>
        <button 
          onClick={() => navigate('/browse')}
          className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-800 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <MapIcon size={18} /> Explore Marketplace
        </button>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
         <HelpCard icon={<Info />} title="Exact Patent #" desc="Check your publication number format (e.g. US10123456B2)." />
         <HelpCard icon={<MapIcon />} title="Map View" desc="Some landscapes only appear at specific zoom levels." />
         <HelpCard icon={<HelpCircle />} title="Support" desc="Our IP strategists are available 24/7 for custom queries." />
      </div>
    </div>
  );
};

const HelpCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:border-blue-200 transition-colors group">
    <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="font-black text-slate-900 text-sm mb-2">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

export default NotFound;