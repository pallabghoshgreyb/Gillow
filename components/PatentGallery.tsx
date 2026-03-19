import React, { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PatentGalleryProps {
  images: string[];
}

const PatentGallery: React.FC<PatentGalleryProps> = ({ images }) => {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative h-[500px] w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner group">
        <img 
          src={images[active]} 
          alt={`Drawing ${active + 1}`} 
          className="w-full h-full object-contain p-8"
        />
        
        <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setActive(prev => (prev > 0 ? prev - 1 : images.length - 1))}
            className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center justify-center text-slate-700 hover:bg-[#006AFF] hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setActive(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center justify-center text-slate-700 hover:bg-[#006AFF] hover:text-white transition-all active:scale-90"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <button className="absolute bottom-6 right-6 p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg text-slate-500 hover:text-[#006AFF] transition-all">
          <Maximize2 size={20} />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
        {images.map((img, i) => (
          <button 
            key={i}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${active === i ? 'border-[#006AFF] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={img} alt="Thumb" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatentGallery;