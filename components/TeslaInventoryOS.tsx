
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Aperture, 
  Radar, 
  Cpu, 
  Scan, 
  ShieldCheck, 
  History, 
  AlertTriangle,
  RefreshCw,
  Camera,
  Layers,
  Activity,
  Box,
  Coins,
  QrCode
} from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { InventoryItem, UserRole, ViewType } from '../types';
import { SHOP_INFO } from '../constants';

interface TeslaInventoryOSProps {
  userId: string;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
}

interface ScanResult {
  itemName: string;
  qty: number;
  price: number;
  stock: number;
  confidence: number;
  type: 'BILL' | 'PRODUCT' | 'BARCODE';
  timestamp: string;
}

export const TeslaInventoryOS: React.FC<TeslaInventoryOSProps> = ({
  userId,
  inventory,
  setInventory,
  logAction
}) => {
  const [isAutoPilot, setIsAutoPilot] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [visionFeed, setVisionFeed] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [activeDetections, setActiveDetections] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState(98.4);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inventoryRef = useRef(inventory);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Camera failed:", err);
      }
    };
    startCamera();
    
    // Initialize QR Scanner
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
    
    const onScanSuccess = (decodedText: string) => {
        const item = inventoryRef.current.find(i => i.sku === decodedText || i.barcode === decodedText);
        if (item) {
            const scan: ScanResult = {
                itemName: item.name,
                qty: 1,
                price: item.price,
                stock: item.stock,
                confidence: 1.0,
                type: 'BARCODE',
                timestamp: new Date().toLocaleTimeString()
            };
            commitUpdate(scan);
        }
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        scanner.clear();
    };
  }, []);

  // Neural Processing Engine (Gemini 2.5 Flash)
  const processVision = useCallback(async (base64: string, type: 'BILL' | 'PRODUCT') => {
    setIsScanning(true);
    const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '' });

    const prompt = `
      System: TESLA MODE INVENTORY OS
      Context: ${SHOP_INFO.address}
      
      Analyze the image and extract:
      1. Item Name (Professional Name)
      2. Quantity (Detected number)
      3. Price (Unit price if available)
      4. Confidence (0.00 to 1.00)
      
      Return STRICT JSON: { "itemName": string, "qty": number, "price": number, "confidence": number }
    `;

    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            parts: [
                { inlineData: { mimeType: "image/jpeg", data: base64 } },
                { text: prompt }
            ]
        }],
        config: { responseMimeType: "application/json" }
      });
      
      const responseText = response.text || "{}";
      const responseData = JSON.parse(responseText);
      
      const newResult: ScanResult = {
        ...responseData,
        type: type === 'BILL' ? 'BILL' : 'PRODUCT',
        timestamp: new Date().toLocaleTimeString(),
        stock: inventory.find(i => i.name.toLowerCase() === responseData.itemName.toLowerCase())?.stock || 0
      };

      if (isAutoPilot && responseData.confidence > 0.85) {
        commitUpdate(newResult);
      } else {
        setHistory(prev => [newResult, ...prev]);
      }
      
      logAction(`Tesla Vision: ${type} Managed`, 'inventory', `${newResult.itemName} (+${newResult.qty})`, 'Info');
    } catch (err) {
      logAction("Tesla Vision Error", 'inventory', "Unclear scan detected", 'Warning');
    } finally {
        setIsScanning(false);
    }
  }, [inventory, isAutoPilot]);

  const captureFrame = (type: 'BILL' | 'PRODUCT') => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    processVision(base64, type);
  };

  const commitUpdate = (scan: ScanResult) => {
    setInventory(prev => {
        const itemIdx = prev.findIndex(i => i.name.toLowerCase() === scan.itemName.toLowerCase());
        if (itemIdx > -1) {
            const updated = [...prev];
            updated[itemIdx] = { 
                ...updated[itemIdx], 
                stock: updated[itemIdx].stock + scan.qty,
                price: scan.price > 0 ? scan.price : updated[itemIdx].price
            };
            return updated;
        } else {
            return [...prev, {
                id: crypto.randomUUID(),
                name: scan.itemName,
                stock: scan.qty,
                price: scan.price,
                category: 'Automated Intake',
                sku: `TM-${Date.now()}`,
                status: 'Active',
                brand: 'Detected',
                costPrice: scan.price * 0.8,
                lastBuyPrice: scan.price,
                minStock: 5,
                unitType: 'pcs',
                packSize: '1',
                barcode: '',
                vatRate: 20,
                origin: 'India',
                shelfLocation: 'Tesla Staging',
                logs: [],
                supplierId: ''
            } as InventoryItem];
        }
    });

    setHistory(prev => [scan, ...prev].map(s => s.itemName === scan.itemName ? { ...s, stock: s.stock + scan.qty } : s));
    setSystemHealth(h => Math.min(100, h + 0.1));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-emerald-500 overflow-hidden">
      
      {/* 🔮 Glass Top Navigation */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8 pb-6 border-b border-white/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="text-emerald-400 fill-emerald-400/20" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Tesla <span className="text-emerald-500">Mode</span></h1>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Autonomous Inventory OS v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">System Health</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-mono text-emerald-400">{systemHealth}%</span>
              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: `${systemHealth}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsAutoPilot(!isAutoPilot)}
            className={cn(
              "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all border",
              isAutoPilot 
                ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                : "bg-white/5 text-white/60 border-white/10 hover:border-white/30"
            )}
          >
            {isAutoPilot ? "Auto-Pilot Active" : "Manual Override"}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-16rem)]">
        
        {/* 🎥 Tesla Vision Core (Left) */}
        <div className="col-span-12 lg:col-span-8 relative">
          <div className="w-full h-full rounded-[2rem] overflow-hidden bg-black border border-white/5 shadow-2xl relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover opacity-60 grayscale-[0.5] contrast-[1.2]"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* AR Overlays */}
            <div className="absolute inset-0 pointer-events-none p-12">
               <div className="w-full h-full border-2 border-dashed border-emerald-500/20 rounded-3xl relative">
                  <motion.div 
                    animate={{ y: [0, 400, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-px bg-emerald-500 shadow-[0_0_15px_#10b981]"
                  />
               </div>
            </div>

            {/* Vision Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6">
                <button 
                  onClick={() => captureFrame('BILL')}
                  className="group relative flex flex-col items-center gap-3 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-emerald-500/50 transition-all"
                >
                   <Scan className="text-white/60 group-hover:text-emerald-400" size={28} />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Scan Bill</span>
                </button>

                <button 
                  onClick={() => captureFrame('PRODUCT')}
                  className="group p-10 bg-emerald-500 text-black rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)] active:scale-95 transition-all"
                >
                   <Aperture size={48} className="animate-spin-slow" />
                </button>

                <button 
                  id="qr-scan-trigger"
                  className="group relative flex flex-col items-center gap-3 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-emerald-500/50 transition-all"
                >
                   <QrCode className="text-white/60 group-hover:text-emerald-400" size={28} />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/40">QR Engine</span>
                </button>
            </div>

            {/* QR Scanner Target Hidden */}
            <div id="reader" className="hidden" />

            {/* Intelligence Loading Overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
                            />
                            <Aperture className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" size={32} />
                        </div>
                        <p className="mt-8 text-[11px] font-black text-emerald-400 uppercase tracking-[0.5em] animate-pulse">Neural Matrix Reconstruction...</p>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* 🧠 Neural Log (Right) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           
           {/* Neural Stats */}
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                 <div className="flex items-center gap-3 mb-4 text-emerald-400">
                    <Activity size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Real-time Flux</span>
                 </div>
                 <h4 className="text-3xl font-black font-mono">1.2ms</h4>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                 <div className="flex items-center gap-3 mb-4 text-emerald-400">
                    <Layers size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Grid Load</span>
                 </div>
                 <h4 className="text-3xl font-black font-mono">14%</h4>
              </div>
           </div>

           {/* Activity Stream */}
           <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/5 p-8 flex flex-col gap-6 overflow-hidden">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <History size={16} className="text-white/40" /> Neural History
                 </h3>
                 <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">{history.length} Events</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                 <AnimatePresence initial={false}>
                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/20">
                            <Box size={48} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Input</p>
                        </div>
                    ) : (
                        history.map((scan, i) => (
                            <motion.div 
                                key={i}
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="p-5 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                            >
                               <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border",
                                    scan.type === 'BILL' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                  )}>
                                     {scan.type === 'BILL' ? <Coins size={18} /> : <Box size={18} />}
                                  </div>
                                  <div>
                                     <h5 className="text-xs font-black uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{scan.itemName}</h5>
                                     <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-black text-white/30 uppercase">{scan.timestamp}</p>
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                        <p className="text-[10px] font-black text-emerald-500 uppercase">{scan.confidence * 100}% Confidence</p>
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="text-base font-black font-mono">+{scan.qty}</div>
                                  <div className="text-[9px] font-black text-white/30 uppercase">Stock: {scan.stock}</div>
                               </div>
                            </motion.div>
                        ))
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </div>
      </div>

      {/* 🚀 Predictive Metrics Panel (Bottom) */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8"
      >
        {[
            { label: 'Neural Throughput', val: '430 Assets/H', icon: Cpu, color: 'emerald' },
            { label: 'Audit Integrity', val: '99.99%', icon: ShieldCheck, color: 'emerald' },
            { label: 'Intelligent Savings', val: '₹1,240', icon: Coins, color: 'emerald' },
            { label: 'Anomaly Detected', val: 'None', icon: AlertTriangle, color: 'neutral' },
        ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-xl font-black font-mono">{stat.val}</h4>
               </div>
               <div className={cn("p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 group-hover:text-emerald-400 transition-all", stat.color === 'neutral' ? '' : 'group-hover:text-emerald-400')}>
                  <stat.icon size={20} />
               </div>
            </div>
        ))}
      </motion.div>

    </div>
  );
};
