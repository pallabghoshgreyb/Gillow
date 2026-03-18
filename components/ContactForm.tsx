import React, { useState } from 'react';
import { X, Send, ShieldCheck, Mail, Phone, User } from 'lucide-react';

interface ContactFormProps {
  patentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ patentId, isOpen, onClose }) => {
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {sent ? (
          <div className="p-12 text-center space-y-4">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} />
             </div>
             <h2 className="text-2xl font-black text-slate-900">Inquiry Sent!</h2>
             <p className="text-slate-500">The broker for patent {patentId} has been notified. Expect a response within 24 hours.</p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Contact Broker</h2>
                  <p className="text-sm text-slate-500">Interested in acquiring or licensing {patentId}?</p>
               </div>
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><User size={12}/> Name</label>
                     <input required type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Mail size={12}/> Email</label>
                     <input required type="email" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="john@company.com" />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Phone size={12}/> Phone (Optional)</label>
                  <input type="tel" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="+1 (555) 000-0000" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">Message</label>
                  <textarea rows={4} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="I would like to discuss licensing terms for this patent..." />
               </div>

               <button type="submit" className="w-full py-4 bg-[#006AFF] text-white font-black rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg active:scale-95">
                  Send Inquiry <Send size={20} />
               </button>

               <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center pt-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Secure marketplace transaction
               </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactForm;