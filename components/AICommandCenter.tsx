
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  InventoryItem,
  StaffMember,
  AttendanceRecord,
  ViewType,
  SystemSnapshot
} from '../types';
import { SHOP_INFO } from '../constants';

interface AICommandCenterProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
  history: SystemSnapshot[];
  createSnapshot: (description: string) => void;
  rollbackToSnapshot: (id: string) => boolean;
}

const AICommandCenter: React.FC<AICommandCenterProps> = ({
  inventory, setInventory, staff, attendance, setAttendance, logAction, history, createSnapshot, rollbackToSnapshot
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedResult, setStagedResult] = useState<any | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const systemInstruction = `You are the Neural OS for "ENGLABS INVENTORY". 
    Address: ${SHOP_INFO.address}. Currency: ${SHOP_INFO.currency}.
    
    SPECIALIZED CAPABILITIES:
    1. FACE RECOGNITION (ATTENDANCE): Identify individuals from personnel registry: [${staff.map(s => s.name).join(', ')}].
    2. WHATSAPP & PHYSICAL REGISTERS: Parse screenshots of chat logs or photos of handwritten attendance sheets. Extract names, dates, and times.
    3. SHELF VISION: Count items on shelves from photos. Suggest restocking for counts < 10.
    4. INVOICE/EXCEL AUDIT: Automatically map columns for Qty, Cost, and Retail Price.
    5. TEMPORAL COMMANDS: Handle "undo last 24 hours", "revert to yesterday", or "rollback update".
    
    DATA RULES:
    - Never delete records. Always increment stock for INVENTORY updates.
    - Default Markup: 25% if retail price missing.
    
    OUTPUT: Strict JSON with 'modality', 'summary', 'narrativeSummary', and relevant data arrays.`;

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera activation failed. Check permissions.");
      setIsCameraActive(false);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());
    setIsCameraActive(false);

    processAIRequest(base64, "Perform biometric identity verification for staff attendance and determine if they are checking in or out.");
  };

  const processAIRequest = async (mediaData?: string, textPrompt?: string) => {
    setIsProcessing(true);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '' });

    const parts: any[] = [];
    if (mediaData) parts.push({ inlineData: { mimeType: 'image/jpeg', data: mediaData } });
    if (textPrompt) parts.push({ text: textPrompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts }],
        config: { systemInstruction, responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setStagedResult(result);
      logAction(`Neural Matrix Scan`, 'ai-command', result.narrativeSummary || 'Staging data for commitment', 'Info');
    } catch (err) {
      alert("Neural processing interrupted. Please provide a high-resolution input.");
    } finally {
      setIsProcessing(false);
    }
  };

  const commitData = () => {
    if (!stagedResult) return;
    createSnapshot(`Neural Commit: ${stagedResult.modality}`);

    if (stagedResult.modality === 'ATTENDANCE') {
      const rec = stagedResult.attendanceRecords?.[0] || stagedResult;
      const matched = staff.find(s => s.name.toLowerCase().includes((rec.employeeName || '').toLowerCase()));

      if (matched) {
        const today = new Date().toISOString().split('T')[0];
        const time = rec.clockIn || rec.clockOut || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Intelligent toggle: Check if there's an open record for today
        const existingOpenRecord = attendance.find(a => a.staffId === matched.id && a.date === today && !a.clockOut);

        if (existingOpenRecord) {
          // Check-out
          setAttendance(prev => prev.map(a => a.id === existingOpenRecord.id ? {
            ...a,
            clockOut: time,
            hoursWorked: calculateHours(a.clockIn || '00:00', time)
          } : a));
          alert(`Neural Exit Protocol: ${matched.name} checked out at ${time}.`);
        } else {
          // Check-in
          setAttendance(prev => [{
            id: crypto.randomUUID(),
            staffId: matched.id,
            date: today,
            status: 'Present',
            clockIn: time,
            notes: 'Verified via Neural Vision'
          }, ...prev]);
          alert(`Neural Entry Protocol: ${matched.name} checked in at ${time}.`);
        }
      }
    } else if (stagedResult.modality === 'INVENTORY') {
      setInventory(prev => {
        const updated = [...prev];
        stagedResult.items?.forEach((item: any) => {
          const idx = updated.findIndex(u => u.name.toLowerCase() === item.name.toLowerCase() || u.sku === item.sku);
          if (idx > -1) {
            updated[idx] = { ...updated[idx], stock: updated[idx].stock + item.qty, lastBuyPrice: item.costPrice || updated[idx].lastBuyPrice };
          } else {
            updated.push({
              id: crypto.randomUUID(), name: item.name, brand: item.brand || '', stock: item.qty,
              price: item.price || (item.costPrice ? item.costPrice * 1.25 : 0),
              costPrice: item.costPrice || 0, category: item.category || 'Raw Materials',
              sku: item.sku || `AI-${Date.now()}`, barcode: item.barcode || '', status: 'Active',
              minStock: 10, logs: [], lastBuyPrice: item.costPrice || 0, vatRate: 0,
              origin: 'India', shelfLocation: item.shelfLocation || 'Awaiting Map',
              packSize: '1', unitType: 'pcs', supplierId: ''
            });
          }
        });
        return updated;
      });
      alert("Inventory Matrix Synchronized.");
    } else if (stagedResult.modality === 'ROLLBACK') {
      const targetTime = Date.now() - (24 * 60 * 60 * 1000); // 24 Hours
      const target = history.find(h => new Date(h.timestamp).getTime() <= targetTime);
      if (target && rollbackToSnapshot(target.id)) alert("Restore Successful: System reverted to 24-hour stable state.");
      else alert("No valid snapshot found from 24 hours ago. Attempting closest match.");
    }

    setStagedResult(null);
  };

  const calculateHours = (start: string, end: string): number => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, parseFloat((diff / 60).toFixed(2)));
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="bg-[#0F172A] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150 text-9xl">🧠</div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
            <p className="text-primary-400 text-[12px] font-black uppercase tracking-[0.5em]">Neural Command OS v5.2</p>
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Smart Core</h2>
            <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
              Automated Business Capture. Revert to 24h stable state, sync WhatsApp registers, or authenticate staff via Face ID.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 no-print">
            <button onClick={startCamera} className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
              Face ID Verify
            </button>
            <button onClick={() => processAIRequest(undefined, "undo last 24 hours and restore stable state")} className="bg-rose-600 hover:bg-rose-700 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              Restore 24h
            </button>
          </div>
        </div>
      </div>

      {isCameraActive && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="w-full max-w-md bg-surface-elevated rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20">
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-square object-cover" />
            <div className="p-8 flex flex-col gap-4">
              <button onClick={captureFace} className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl">Identify Personnel</button>
              <button onClick={() => setIsCameraActive(false)} className="w-full text-slate-400 font-black uppercase text-xs">Close Camera</button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-surface-elevated p-12 rounded-[3.5rem] border border-surface-highlight shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-2xl font-black text-ink-base uppercase">Input Terminal</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vision Engine Ready</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all ${isProcessing ? 'bg-primary-50 border-primary-300' : 'bg-surface-elevated border-surface-highlight hover:border-primary-400'}`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 border-4 border-surface-highlight border-t-primary-600 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] animate-pulse">Analyzing Neural Geometry...</p>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="text-7xl">📤</div>
                  <div>
                    <p className="text-xl font-black text-ink-base uppercase">Intake Assets</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">WhatsApp Screens / Invoices / Photos</p>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => processAIRequest(reader.result?.toString().split(',')[1], "Full business data extraction.");
                  reader.readAsDataURL(file);
                }
              }} />
            </div>

            <textarea
              placeholder="Paste chat logs or stock commands..."
              className="w-full h-32 bg-surface-elevated border border-surface-highlight rounded-3xl p-8 text-sm font-bold outline-none focus:border-primary-600 no-scrollbar transition-all"
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) processAIRequest(undefined, (e.target as HTMLTextAreaElement).value);
              }}
            />
          </div>
        </div>

        <div className="bg-surface-elevated p-12 rounded-[3.5rem] border border-surface-highlight shadow-sm flex flex-col h-[600px]">
          <h4 className="text-2xl font-black text-ink-base uppercase mb-10 tracking-tight">Intelligence Staging</h4>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
            {stagedResult ? (
              <>
                <div className="p-8 bg-[#0F172A] text-white rounded-[2.5rem] border-l-[12px] border-primary-500 shadow-xl">
                  <p className="text-[10px] font-black uppercase text-primary-400 mb-3 tracking-widest">Executive Summary</p>
                  <p className="text-base font-medium leading-relaxed">{stagedResult.narrativeSummary || stagedResult.summary}</p>
                </div>

                {stagedResult.modality === 'INVENTORY' && stagedResult.items && (
                  <div className="bg-surface-elevated border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    {stagedResult.items.map((it: any, i: number) => (
                      <div key={i} className="p-6 flex justify-between items-center border-b last:border-0 border-slate-50 hover:bg-surface-elevated transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-ink-base uppercase">{it.brand} {it.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Map: {it.shelfLocation || 'Auto'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black font-mono text-primary-600">+{it.qty}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{SHOP_INFO.currency}{it.price?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {stagedResult.modality === 'ATTENDANCE' && (
                  <div className="p-12 border-4 border-dashed border-emerald-200 bg-emerald-50/30 rounded-[3rem] text-center space-y-6">
                    <span className="text-7xl block animate-bounce">✅</span>
                    <div>
                      <p className="text-2xl font-black uppercase text-emerald-900">{stagedResult.employeeName || 'Staff Verified'}</p>
                      <p className="text-[10px] font-black text-emerald-600 uppercase mt-2 tracking-[0.2em]">Biometric Identity Matched</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-25">
                <span className="text-8xl mb-6">👁️‍🗨️</span>
                <p className="font-black uppercase tracking-[0.6em] text-ink-base text-xs">Waiting for Data Stream</p>
              </div>
            )}
          </div>

          <button
            disabled={!stagedResult}
            onClick={commitData}
            className="w-full mt-10 bg-[#0F172A] text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.5em] text-sm disabled:opacity-20 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl"
          >
            Authorize & Sync
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;
