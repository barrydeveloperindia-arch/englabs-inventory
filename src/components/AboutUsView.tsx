
import React from 'react';
import { SHOP_INFO } from '../constants';

const AboutUsView: React.FC = () => {
  const exactLocationQuery = `${SHOP_INFO.name}, ${SHOP_INFO.address}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(exactLocationQuery)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {/* Brand Hero */}
      <div className="bg-[#0F172A] p-16 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150 text-9xl">🏭</div>
        <div className="relative z-10 space-y-4">
          <p className="text-primary-400 text-[12px] font-black uppercase tracking-[0.5em]">Corporate Profile</p>
          <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">{SHOP_INFO.name}</h2>
          <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
            Panchkula's premier destination for industrial inventory management, project coordination, and top-tier logistics. Operating at the intersection of professional engineering workflows and modern enterprise efficiency.
          </p>
        </div>
      </div>

      {/* Identity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="bg-surface-elevated p-12 rounded-[3rem] border border-surface-highlight shadow-sm space-y-8 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xl font-black text-ink-base uppercase tracking-tight">Direct Access</h4>
            <p className="text-ink-muted text-sm font-medium">Digital concierge for material procurement and project inquiries.</p>
          </div>
          <div className="bg-surface-elevated p-6 rounded-2xl border border-slate-100 flex items-center gap-6 group hover:border-primary-200 transition-colors">
            <span className="text-4xl">📱</span>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Line</p>
              <p className="text-lg font-black text-ink-base">{SHOP_INFO.whatsapp}</p>
            </div>
          </div>
        </div>

        {/* Address & Location */}
        <div className="lg:col-span-2 bg-surface-elevated p-12 rounded-[3rem] border border-surface-highlight shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h4 className="text-xl font-black text-ink-base uppercase tracking-tight">Corporate Office</h4>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{SHOP_INFO.address}</p>
            </div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exactLocationQuery)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-primary-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
            >
              View on Map
            </a>
          </div>
          
          <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-slate-100 bg-surface-elevated shadow-inner">
            <iframe 
              title="ENGLABS Panchkula Location"
              width="100%" 
              height="100%" 
              frameBorder="0" 
              style={{ border: 0 }} 
              src={mapEmbedUrl}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      {/* Community Footer */}
      <div className="bg-primary-50 p-12 rounded-[3.5rem] border border-primary-100 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-1 bg-primary-600/20 rounded-full"></div>
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.6em] text-primary-400 mb-4">Official Enterprise Record</p>
          <p className="text-2xl font-black text-primary-900 uppercase tracking-tight">{SHOP_INFO.name} • INDUSTRIAL HUB OF PANCHKULA</p>
        </div>
        <div className="flex gap-4">
           <span className="text-[10px] font-black bg-primary-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest">Est. 2025</span>
           <span className="text-[10px] font-black border border-primary-200 text-primary-600 px-4 py-1.5 rounded-full uppercase tracking-widest">GST Registered</span>
        </div>
        <p className="text-[10px] font-bold text-primary-600/50 uppercase tracking-widest mt-4">© 2026 ENGLABS Inventory Enterprise. All System Records Verified.</p>
      </div>
    </div>
  );
};

export default AboutUsView;
