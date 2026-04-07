import React, { useEffect, useState } from 'react';
import { BrandLogo } from './Logo';

const EMOJIS = ['📦', '📑', '🏗️', '📐', '🏭', '🚛', '🛠️', '🏢', '📋', '⚙️', '🔍', '📱', '💻'];
const INVENTORY_ITEMS = [
  'Asset Master', 
  'Stock Intake', 
  'Project Logs', 
  'Quality Audit', 
  'Barcode Sync', 
  'Supply Chain', 
  'Personnel Ledger', 
  'Site Financials', 
  'Materials Master', 
  'System Health'
];

const SplashScreen: React.FC = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate a denser set of floating particles for a longer animation
    const newParticles = Array.from({ length: 40 }).map((_, i) => {
      const isText = Math.random() > 0.5;
      const content = isText 
        ? INVENTORY_ITEMS[Math.floor(Math.random() * INVENTORY_ITEMS.length)]
        : EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      
      return {
        id: i,
        content,
        isText,
        left: Math.random() * 90 + 5 + '%',
        top: Math.random() * 80 + 10 + '%',
        delay: Math.random() * 5 + 's', // Spread delay over longer period
        size: isText ? (Math.random() * 8 + 10 + 'px') : (Math.random() * 30 + 20 + 'px'),
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0F172A] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/30 via-slate-900 to-slate-950"></div>
      
      {/* Floating Elements (Emojis & Names) */}
      {particles.map((p) => (
        <div 
          key={p.id}
          className="absolute animate-float-up pointer-events-none opacity-0"
          style={{ 
            left: p.left, 
            top: p.top, 
            animationDelay: p.delay,
            fontSize: p.size,
          }}
        >
          <span className={`
            ${p.isText 
              ? 'font-black uppercase tracking-[0.4em] text-primary-200 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] whitespace-nowrap' 
              : 'filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'
            }
          `}>
            {p.content}
          </span>
        </div>
      ))}

      {/* Main Branding */}
      <div className="relative z-10 text-center space-y-8">
        <div className="flex flex-col items-center">
          <div className="mb-10 p-8 bg-surface-elevated/10 rounded-[2.5rem] border border-white/20 backdrop-blur-xl animate-in zoom-in duration-1000 shadow-[0_0_50px_rgba(87,214,164,0.3)]">
            <BrandLogo size="lg" className="scale-150" />
          </div>
          <h1 className="text-white text-7xl md:text-8xl font-black uppercase tracking-tighter animate-text-reveal drop-shadow-2xl">
            ENGLABS <span className="text-emerald-400">ENTERPRISE</span>
          </h1>
          <div className="w-40 h-1.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full mt-10 animate-in slide-in-from-left duration-1500 delay-500"></div>
        </div>
        
        <p className="text-emerald-300 text-[12px] font-black uppercase tracking-[0.8em] animate-pulse delay-1000">
          Integrated Inventory Architecture
        </p>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-20 flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping"></div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Initialising Secure Terminal 50LG-UK-01</p>
        </div>
        <div className="w-64 h-1 bg-surface-elevated/5 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 w-full animate-[scan_2s_ease-in-out_infinite] origin-left"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
