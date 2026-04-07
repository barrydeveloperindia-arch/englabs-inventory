
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { InventoryItem, Transaction, StaffMember, ViewType } from '../types';
import { addStaffMember } from '../lib/firestore';
import { auth } from '../lib/firebase';

interface MarcoAssistantProps {
  inventory: InventoryItem[];
  transactions: Transaction[];
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const MarcoAssistant: React.FC<MarcoAssistantProps> = ({ inventory, transactions, staff, setStaff, activeView, setActiveView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'marco'; text: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isThinking]);

  // --- Tools Definitions ---
  const navigateToFeatureDeclaration: FunctionDeclaration = {
    name: 'navigateToFeature',
    parameters: {
      type: Type.OBJECT,
      description: 'Navigate the application to a specific view.',
      properties: {
        viewId: {
          type: Type.STRING,
          description: 'The ID of the view. Options: dashboard, sales, inventory, ai-command, purchases, financials, staff.',
        },
      },
      required: ['viewId'],
    },
  };

  const addStaffMemberDeclaration: FunctionDeclaration = {
    name: 'addStaffMember',
    parameters: {
      type: Type.OBJECT,
      description: 'Add a new staff member to the registry.',
      properties: {
        name: { type: Type.STRING, description: 'Full name of the staff member' },
        role: { type: Type.STRING, description: 'Role (e.g., Manager, Cashier, Stock Clerk)' },
      },
      required: ['name', 'role'],
    },
  };

  const handleToggle = () => setIsOpen(!isOpen);

  // --- Core Logic ---
  const executeAddStaff = async (name: string, role: string) => {
    if (!auth.currentUser) return "I cannot access the database (Auth Error).";

    const newStaff: StaffMember = {
      id: crypto.randomUUID(),
      name: name.toUpperCase(),
      role: role as any || 'Cashier',
      pin: '0000', // Default
      loginBarcode: `STAFF-${Math.floor(Math.random() * 1000)}`,
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      contractType: 'Full-time',
      niNumber: 'PENDING',
      taxCode: '1257L',
      rightToWork: true,
      emergencyContact: '',
      monthlyRate: 0, hourlyRate: 11.44, dailyRate: 0, advance: 0, holidayEntitlement: 28, accruedHoliday: 0
    };

    try {
      await addStaffMember(auth.currentUser.uid, newStaff);
      return `Added ${name} as ${role} to the permanent registry. Default PIN: 0000.`;
    } catch (e) {
      console.error(e);
      return "Failed to save staff member to database.";
    }
  };

  const askMarco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsThinking(true);

    const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;

    try {
      if (!apiKey || apiKey.includes('PLACEHOLDER')) {
        throw new Error("Neural Core Disconnected (Invalid API Key).");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        config: {
          tools: [{ functionDeclarations: [navigateToFeatureDeclaration, addStaffMemberDeclaration] }]
        }
      });

      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'navigateToFeature') {
            const args = call.args as any;
            setActiveView(args.viewId);
            setChat(prev => [...prev, { role: 'marco', text: `Navigating to ${args.viewId}...` }]);
          } else if (call.name === 'addStaffMember') {
            const args = call.args as any;
            const msg = await executeAddStaff(args.name, args.role);
            setChat(prev => [...prev, { role: 'marco', text: msg }]);
          }
        }
      } else {
        setChat(prev => [...prev, { role: 'marco', text: response.text || "Command executed." }]);
      }

    } catch (error: any) {
      console.error(error);
      setChat(prev => [...prev, { role: 'marco', text: `SYSTEM ERROR: ${error.message || "Neural Handshake Failed"}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[10000] no-print">
      <button
        onClick={handleToggle}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isOpen ? 'bg-rose-600 rotate-45' : 'bg-primary-600'}`}
      >
        {isOpen ? '✕' : '🧠'}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-4 border-primary-400/30 animate-ping"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-[#0F172A] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500">

          <div className="bg-primary-600 p-6 shrink-0 relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest">MARCO Assistant</h4>
                <p className="text-[8px] text-primary-200 font-black uppercase tracking-[0.4em] mt-1">Neural Core Linked</p>
              </div>
              <a
                href="https://gemini.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-elevated/10 hover:bg-surface-elevated/20 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2"
              >
                Neural Bypass ↗
              </a>
            </div>

            <div className="mt-4 overflow-hidden h-6">
              <div className="whitespace-nowrap inline-block animate-[slide-message_15s_linear_infinite]">
                <span className="text-primary-100 text-[10px] font-black uppercase tracking-[0.5em]">
                  Hello BOSS, MARCO's Here! • Performance Optimized • Navigation Ready • High Speed Protocol •
                </span>
                <span className="text-primary-100 text-[10px] font-black uppercase tracking-[0.5em]">
                  Hello BOSS, MARCO's Here! • Performance Optimized • Navigation Ready • High Speed Protocol •
                </span>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {chat.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-white text-center">
                <span className="text-6xl mb-4">⚡</span>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ready for commands, BOSS</p>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-surface-elevated/5 text-slate-300 border border-white/10 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-surface-elevated/5 text-primary-400 p-4 rounded-2xl rounded-bl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={askMarco} className="p-6 bg-surface-elevated/5 border-t border-white/10 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Where to, BOSS?"
                className="w-full bg-surface-elevated/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white text-xs font-bold outline-none focus:border-primary-500 transition-all"
              />
              <button
                type="submit"
                disabled={isThinking || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary-400 disabled:opacity-20"
              >
                ↵
              </button>
            </div>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-message {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
};

export default MarcoAssistant;
