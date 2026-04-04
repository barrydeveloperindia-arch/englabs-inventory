
import React, { useState, useEffect, useRef } from 'react';
import { StaffMember } from '../types';
import { BrandLogo } from './Logo';

interface LockScreenProps {
  staff: StaffMember[];
  onLogin: (staff: StaffMember) => void;
  shopName: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ staff, onLogin, shopName }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  const handleKeypadClick = (val: string) => {
    if (pin.length < 4 && !success) {
      setPin(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (pin.length === 4) {
      const authenticatedStaff = staff.find(s => s.pin === pin && s.status === 'Active');
      if (authenticatedStaff) {
        setSuccess(true);
        setTimeout(() => onLogin(authenticatedStaff), 200);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    }
  }, [pin, staff, onLogin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isNaN(parseInt(e.key)) && pin.length < 4) {
        handleKeypadClick(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        handleDelete();
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current > 100) barcodeBuffer.current = '';
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current) {
          const authenticatedStaff = staff.find(s => s.loginBarcode === barcodeBuffer.current && s.status === 'Active');
          if (authenticatedStaff) {
            setSuccess(true);
            setTimeout(() => onLogin(authenticatedStaff), 200);
          } else {
            setError(true);
            setTimeout(() => setError(false), 1000);
          }
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [staff, onLogin, pin, success]);

  return (
    <div className={`fixed inset-0 transition-colors duration-500 flex flex-col items-center justify-center p-6 text-white z-[9999] overflow-hidden ${success ? 'bg-emerald-600' : error ? 'bg-rose-900' : 'bg-[#0F172A]'
      }`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-[scan_3s_infinite]" />
      </div>

      <div className="absolute top-12 text-center animate-in fade-in duration-1000 flex flex-col items-center">
        <div className="bg-surface-elevated/10 p-8 rounded-[3rem] backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
          <BrandLogo light size="lg" />
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary-400">Retail Operations OS</p>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{shopName} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-10 relative z-10 pt-48">
        <div className="text-center space-y-8">
          <div className="flex justify-center gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${success ? 'bg-surface-elevated border-white scale-125' :
                  error ? 'bg-rose-400 border-rose-400 animate-pulse' :
                    pin.length > i ? 'bg-primary-400 border-primary-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]' :
                      'bg-transparent border-white/20'
                  }`}
              />
            ))}
          </div>
          <div className="space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${success ? 'text-white' : error ? 'text-rose-400' : 'text-white/60'
              }`}>
              {success ? "SESSION INITIATED" : error ? "AUTH FAILED" : "Secure PIN or Badge Scan Required"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeypadClick(num.toString())}
              className="h-20 bg-surface-elevated/5 border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-surface-elevated/10 active:scale-90 transition-all backdrop-blur-sm"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeypadClick('0')}
            className="h-20 bg-surface-elevated/5 border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-surface-elevated/10 active:scale-90 transition-all backdrop-blur-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-20 bg-primary-600/10 border border-primary-500/20 rounded-2xl flex items-center justify-center text-xl font-black hover:bg-primary-600/30 active:scale-90 transition-all backdrop-blur-sm text-primary-400"
          >
            ⌫
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="flex gap-4">
          <div className="w-10 h-[2px] bg-surface-elevated/10"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">SYSTEM COMPLIANCE SECURED</span>
          <div className="w-10 h-[2px] bg-surface-elevated/10"></div>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
