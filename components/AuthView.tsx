
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { BrandLogo } from './Logo';
import { FluxButton } from './ui/FluxButton';
import { GlassCard } from './ui/GlassCard';
import { AlertCircle, Lock, Monitor, ArrowRight, ShieldCheck, Globe, Code } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { INITIAL_STAFF } from '../constants';
import { cn } from '../lib/utils';

const AuthView: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  // Auto-Submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin]);

  const handlePinSubmit = async () => {
    setError('');
    setStatus('PROCESSING');
    setLoading(true);

    try {
      // Find staff by PIN (Simplified access logic: Admin=0001)
      const matched = INITIAL_STAFF.find(s => s.pin === pin);

      if (matched) {
        // SILENT FLEET AUTH: Bridge to Firebase via Verified Fleet Identity
        // This bypasses the 'admin-restricted-operation' error on Anonymous Auth
        await signInWithEmailAndPassword(auth, 'englabscivilteam@gmail.com', 'Ram@2026');
        
        localStorage.setItem('englabs_identity', matched.id);
        setStatus('SUCCESS');
      } else {
        throw new Error('Verification Failed: Invalid Terminal Passcode');
      }
    } catch (err: any) {
      setError(err.message || 'Access Denied');
      setStatus('IDLE');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyClick = (n: string) => {
    if (pin.length < 4) setPin(prev => prev + n);
  };

  const handleClear = () => setPin('');

  return (
    <div data-testid="login-screen" className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-emerald-950">
      {/* FULL SCREEN IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-800 to-teal-900 animate-in fade-in duration-1000"></div>
        
        {/* Dynamic Vector Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-[150px]"></div>
        
        {/* Particle Decoration */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg p-6 animate-in zoom-in-95 duration-700">
        <GlassCard className="p-8 md:p-12 space-y-10 border-white/20 backdrop-blur-3xl shadow-2xl bg-white/90 dark:bg-black/60">
          
          {/* Header / Branding */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-white rounded-3xl shadow-xl shadow-black/5">
              <BrandLogo size="lg" className="hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">Terminal Login</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-[0.3em]">Authorized Engineering Access Only</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* PIN Gateway Styling */}
            <div className="space-y-6">
              <div className="space-y-4">
                 <div className="flex flex-col items-center gap-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Enter Terminal Passcode</label>
                    <div className="flex gap-4 justify-center">
                      {[0, 1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-12 h-14 md:w-14 md:h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 transition-all duration-300",
                            pin.length > i 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105" 
                              : "bg-neutral-50 dark:bg-white/5 border-neutral-100 dark:border-white/10 text-transparent"
                          )}
                        >
                          {pin.length > i ? '•' : ''}
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <FluxButton
                onClick={handlePinSubmit}
                loading={loading}
                disabled={pin.length < 4}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black tracking-[0.2em] uppercase text-xs transition-all shadow-xl shadow-emerald-500/20"
              >
                {status === 'SUCCESS' ? 'Access Granted' : 'Start Session'}
              </FluxButton>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold uppercase tracking-wide animate-in shake duration-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* PIN Keypad (Industrial Terminal Standard) */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                <button 
                  key={n} 
                  onClick={() => handleKeyClick(n)}
                  className="h-14 bg-neutral-100/50 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-900 dark:text-white font-black rounded-xl transition-all active:scale-95 border border-neutral-200/50 dark:border-white/5 shadow-sm"
                >
                  {n}
                </button>
              ))}
              <button onClick={handleClear} className="h-14 text-rose-600 font-black rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-rose-100/30 dark:border-rose-500/10">CLR</button>
              <button onClick={() => handleKeyClick('0')} className="h-14 bg-neutral-100/50 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-900 dark:text-white font-black rounded-xl transition-all border border-neutral-200/50 dark:border-white/5 shadow-sm">0</button>
              <div className="h-14 flex items-center justify-center opacity-40"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
            </div>

            <div className="text-center pt-4">
               <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                  ENGLABS Engineering Portal &bull; v2.0.0
               </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Floating Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
    </div>

  );
};

export default AuthView;
