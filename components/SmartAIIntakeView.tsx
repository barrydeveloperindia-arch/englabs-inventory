
import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { InventoryItem, SmartIntakeItem, ViewType, LedgerEntry } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, writeBatch, increment, getDocs, collection } from 'firebase/firestore';

interface SmartAIIntakeViewProps {
  userId: string;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
  postToLedger: (entries: Omit<LedgerEntry, 'id' | 'timestamp'>[]) => void;
}

const SmartAIIntakeView: React.FC<SmartAIIntakeViewProps> = ({ userId, inventory, setInventory, logAction, postToLedger }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedItems, setStagedItems] = useState<SmartIntakeItem[]>([]);
  const [summary, setSummary] = useState<{ total: number; news: number; lowStock: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Helper: Crop image based on normalized bounding box [ymin, xmin, ymax, xmax]
  const cropImageFromBase64 = (base64: string, box: [number, number, number, number]): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const [ymin, xmin, ymax, xmax] = box;
        const width = img.width * (xmax - xmin);
        const height = img.height * (ymax - ymin);
        const startX = img.width * xmin;
        const startY = img.height * ymin;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, width, height, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(base64); // Fallback if context fails
        }
      };
      img.onerror = () => resolve(base64); // Fallback if image load fails
      img.src = base64;
    });
  };

  const processInput = async (input: string | File) => {
    setIsProcessing(true);
    setStagedItems([]);
    setSummary(null);
    setCurrentImage(null);

    // Initialize the standard Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GENAI_API_KEY);

    // Use gemini-1.5-flash which is the current stable flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        role: "system",
        parts: [{
          text: `You are a smart inventory management AI for "ENGLABS INVENTORY". 
      Analyze the input (Image or Text).
      1. IDENTIFY items visible.
      2. COUNT the quantity of each item. 
      3. EXTRACT details: Brand, Name, Pack Size (if visible), Price (if visible).
      4. If Selling Price is missing, suggest a UK market price.
      5. Return a valid JSON array. Each object must have: name, brand, qty (number), costPrice (number), price (number), category, shelfLocation, barcode, sku.
      6. CRITICAL: For each item, provide "box_2d": [ymin, xmin, ymax, xmax] coordinates (0-1 scale) for cropping. 
      7. Keep descriptions concise to ensure valid JSON output.` }]
      }
    });

    let parts: any[] = [];
    let base64Image: string | null = null;

    if (typeof input !== 'string') {
      const base64 = await fileToBase64(input);
      base64Image = base64;
      setCurrentImage(base64);

      // Remove data prefix for the SDK: "data:image/png;base64,..." -> "..."
      const base64Data = base64.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: input.type,
          data: base64Data
        }
      });
    } else {
      parts.push({ text: input });
    }

    // Add prompt
    parts.push({ text: "Analyze this image/text. Count the items. Output JSON array." });

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out (30s). Try a smaller image.")), 30000)
      );

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: "user", parts: parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  brand: { type: SchemaType.STRING },
                  qty: { type: SchemaType.NUMBER },
                  costPrice: { type: SchemaType.NUMBER },
                  price: { type: SchemaType.NUMBER },
                  category: { type: SchemaType.STRING },
                  shelfLocation: { type: SchemaType.STRING },
                  barcode: { type: SchemaType.STRING },
                  sku: { type: SchemaType.STRING },
                  box_2d: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.NUMBER }
                  }
                },
                required: ['name', 'qty', 'costPrice', 'price']
              }
            }
          }
        }), timeoutPromise]) as any;

      const response = await result.response;
      const text = response.text();
      const rawItems: SmartIntakeItem[] = JSON.parse(text || '[]');

      const items = await Promise.all(rawItems.map(async (item) => {
        let finalImage = base64Image || undefined;

        if (base64Image && item.box_2d && item.box_2d.length === 4) {
          try {
            finalImage = await cropImageFromBase64(base64Image, item.box_2d);
          } catch (e) {
            console.warn("Cropping failed for item", item.name, e);
          }
        }

        return {
          ...item,
          image: finalImage
        };
      }));

      setStagedItems(items);

      // Generate Summary
      const news = items.filter(aiItem => !inventory.some(inv => inv.sku === aiItem.sku || inv.barcode === aiItem.barcode)).length;
      const lowStock = items.filter(aiItem => aiItem.qty < 10).length;
      setSummary({ total: items.length, news, lowStock });

      logAction('AI Intake Analysis', 'smart-intake', `Detected ${items.length} items from input.`, 'Info');
    } catch (err: any) {
      console.error("AI Analysis Error:", err);

      let msg = "Unknown AI Error";
      if (err.message) msg = err.message;

      if (msg.includes("403")) {
        alert("⛔ ACCESS DENIED (403)\n\nPlease enable the 'Generative Language API' in your Google Cloud Console for this API Key.");
      } else if (msg.includes("404")) {
        alert("⛔ MODEL NOT FOUND (404)\n\nThe model 'gemini-1.5-flash' is not available for your API Key/Region. Check your Google Cloud settings.");
      } else {
        alert(`❌ AI Error: ${msg}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const commitToInventory = async () => {
    try {
      if (!stagedItems.length) return;
      if (!window.confirm(`Are you sure you want to commit ${stagedItems.length} items to the database?`)) return;

      // SHARED NODE CONTEXT
      const SHOP_ID = userId;
      const batch = writeBatch(db);

      // 1. Prepare Batch Operations (using the inventory prop, which is stable enough for this)
      stagedItems.forEach(item => {
        // Find existing item in the current full inventory prop
        const existingItem = inventory.find(inv =>
          (item.sku && inv.sku === item.sku) ||
          (item.barcode && inv.barcode === item.barcode)
        );

        if (existingItem) {
          // --- UPDATE EXISTING ---
          const docRef = doc(db, 'shops', userId, 'inventory', existingItem.id);
          batch.update(docRef, {
            stock: increment(item.qty),
            lastBuyPrice: item.costPrice,
            price: item.price,
            logs: [{
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'audit',
              amount: item.qty,
              reason: 'Inward',
              note: 'Added via Smart AI Intake (Restock)'
            }]
          });
        } else {
          // --- CREATE NEW ---
          const newId = crypto.randomUUID();

          // Ensure image is compatible with all potential UI fields
          const imagePayload = item.image || undefined;

          const newItem: InventoryItem = {
            id: newId,
            supplierId: '',
            sku: item.sku || `AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            barcode: item.barcode || '',
            name: item.name,
            brand: item.brand || '',
            stock: item.qty,
            minStock: 10,
            costPrice: item.costPrice,
            lastBuyPrice: item.costPrice,
            price: item.price,
            category: item.category,
            shelfLocation: item.shelfLocation,
            unitType: 'pcs',
            packSize: '1',
            origin: 'India',
            status: 'Active',
            vatRate: 20,

            // Assign to all common image fields to ensure UI visibility
            photo: imagePayload,
            photoUrl: imagePayload,
            imageUrl: imagePayload,

            logs: [{
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'audit',
              amount: item.qty,
              reason: 'Inward',
              note: 'Added via Smart AI Intake (New)'
            }]
          };

          const docRef = doc(db, 'shops', SHOP_ID, 'inventory', newId);
          batch.set(docRef, newItem);
        }
      });
      // ... (rest of function)

      // 2. Commit to Database
      await batch.commit();

      // 3. Update Local State (Optimistic / Consistency)
      // Note: Since we are using real-time listeners in App.tsx, this local update might be redundant 
      // if the listener fires quickly. However, to prevent UI flicker or if offline, we keep it.
      setInventory(prev => {
        const updated = [...prev];
        stagedItems.forEach(item => {
          const existingIndex = updated.findIndex(inv =>
            (item.sku && inv.sku === item.sku) ||
            (item.barcode && inv.barcode === item.barcode)
          );

          if (existingIndex > -1) {
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              stock: existing.stock + item.qty,
              lastBuyPrice: item.costPrice,
              price: item.price
            };
          } else {
            // For optimistic update consistency, ideally we'd need the ID we just generated.
            // But since we didn't save the new IDs in a map above, we can't perfectly optimistically update 
            // without recreating the logic or mapping.
            // Given the complexity and that we have a live listener, it's safer to rely on the listener 
            // OR just append with a temp ID if we really want to.
            // Actually, let's just let the listener handle it to avoid "key" conflicts if the listener comes in fast.
            // BUT user wants to see "Inventory Updated" immediately.

            // Simplest approach: Just let the listener update it. 
            // The alert says "synced".
          }
        });
        return updated;
      });

      // 4. Automated Ledger Posting (Double-Entry)
      const totalInventoryValuation = stagedItems.reduce((acc, item) => acc + (item.qty * item.costPrice), 0);
      postToLedger([
        {
          account: 'Inventory Asset',
          type: 'Debit',
          amount: totalInventoryValuation,
          referenceId: `AI-${Date.now()}`,
          description: `AI Smart Intake: ${stagedItems.length} items cataloged`,
          category: 'Inventory'
        },
        {
          account: 'Accounts Payable', // Default for inward without specific payment method
          type: 'Credit',
          amount: totalInventoryValuation,
          referenceId: `AI-${Date.now()}`,
          description: `AI Smart Intake Settlement`,
          category: 'Purchase'
        }
      ]);

      logAction('Inventory Commitment', 'smart-intake', `Committed ${stagedItems.length} items to database. Valuation: £${totalInventoryValuation.toFixed(2)}`, 'Info');
      setStagedItems([]);
      setSummary(null);
      setCurrentImage(null);
      alert("✅ Success: Inventory synced to Database.");

    } catch (error) {
      console.error("Database Write Error:", error);
      alert(`❌ Sync Failed: ${error instanceof Error ? error.message : "Unknown Database Error"}`);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const runSimulation = async () => {
    try {
      const response = await fetch('/sample_shelf.png');
      const blob = await response.blob();
      const file = new File([blob], "sample_shelf.png", { type: "image/png" });
      await processInput(file);
    } catch (e) {
      alert("Simulation failed: Could not load sample image.");
    }
  };



  const forceAddStaff = async () => {
    try {
      const { addStaffMember } = await import('../lib/firestore');
      const shopId = userId;

      const debugStaff: any = {
        id: `DEBUG-NISHA-${Date.now()}`,
        name: 'Nisha (Debug Force)',
        role: 'Cashier',
        pin: '1234',
        email: 'nisha.debug@test.com',
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
        contractType: 'Full-time',
        niNumber: 'DEBUG', taxCode: '1257L', rightToWork: true, emergencyContact: 'N/A',
        monthlyRate: 2000, hourlyRate: 15, dailyRate: 0, advance: 0, holidayEntitlement: 20, accruedHoliday: 0
      };

      await addStaffMember(shopId, debugStaff);
      alert(`✅ Forcibly Added Staff: Nisha\nTarget Shop: ${shopId}\n\nPlease check Staff View now.`);
    } catch (e) {
      alert("Force Add Failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex justify-end pr-4 gap-4">
        <button onClick={forceAddStaff} className="text-[10px] font-black uppercase text-pink-400 hover:text-pink-300 underline">
          [DEBUG] Force Add Staff: Nisha
        </button>
        <button onClick={runSimulation} className="text-[10px] font-black uppercase text-primary-400 hover:text-primary-300 underline">
          [DEV] Run Simulation
        </button>
      </div>
      <div className="bg-[#0F172A] p-6 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 rotate-12 scale-150 text-9xl">🧠</div>
        <div className="relative z-10 space-y-4">
          <p className="text-primary-400 text-[12px] font-black uppercase tracking-[0.5em]">AI Management Suite</p>
          <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Smart Intake</h2>
          <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
            Upload shelf photos, invoices, or paste bulk text. Our vision system will automatically catalog your stock and suggest pricing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Card */}
        <div className="bg-surface-elevated p-6 md:p-10 rounded-[3rem] border border-surface-highlight shadow-sm flex flex-col justify-between group">
          <div className="space-y-8">
            <h4 className="text-xl font-black text-ink-base uppercase tracking-tight">Acquisition Terminal</h4>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all ${isProcessing ? 'border-primary-500 bg-primary-50' : 'border-surface-highlight hover:border-primary-400 hover:bg-surface-elevated'}`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 border-4 border-surface-highlight border-t-primary-600 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest animate-pulse">Analyzing Asset Modality...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <span className="text-6xl">📷</span>
                  <div>
                    <p className="text-lg font-black text-ink-base uppercase">Drop Media Here</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Photo / PDF / Excel</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processInput(e.target.files[0])}
              />
            </div>

            <div className="relative">
              <textarea
                id="manual-input-area"
                placeholder="Or paste manual text entry here..."
                className="w-full h-32 bg-surface-elevated border border-surface-highlight rounded-2xl p-6 text-sm font-bold outline-none focus:border-primary-600 transition-all no-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    processInput((e.target as HTMLTextAreaElement).value);
                  }
                }}
              ></textarea>
              <div className="absolute bottom-4 right-4 flex gap-2 items-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest hidden md:block">CTRL + ENTER to Scan</p>
                <button
                  onClick={() => {
                    const el = document.getElementById('manual-input-area') as HTMLTextAreaElement;
                    if (el && el.value) processInput(el.value);
                  }}
                  className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 active:scale-95 transition-all shadow-lg"
                  title="Run AI Analysis"
                >
                  <span className="text-xs font-black uppercase tracking-wider">Analyze</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-surface-elevated p-6 md:p-10 rounded-[3rem] border border-surface-highlight shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-ink-base uppercase tracking-tight">AI Staging Area</h4>
            {summary && (
              <div className="flex gap-4">
                <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black uppercase">News: {summary.news}</span>
                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase">Low Stock: {summary.lowStock}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 min-h-[300px]">
            {stagedItems.length > 0 ? (
              stagedItems.map((item, idx) => (
                <div key={idx} className="p-5 bg-surface-elevated border border-slate-100 rounded-2xl flex justify-between items-center group/row hover:border-primary-200 transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-ink-base uppercase">{item.brand} {item.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shelf: {item.shelfLocation} • Category: {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black font-mono text-ink-base">x{item.qty}</p>
                    <p className="text-[9px] font-black text-primary-600 uppercase">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40 py-20">
                <span className="text-8xl mb-8">🤖</span>
                <p className="font-black uppercase tracking-[0.4em]">Standby for Input</p>
              </div>
            )}
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100">
            <button
              disabled={stagedItems.length === 0}
              onClick={commitToInventory}
              className="w-full bg-primary-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
            >
              Commit to Master Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      {summary && (
        <div className="bg-emerald-50 p-6 md:p-12 rounded-[3.5rem] border border-emerald-100 flex flex-col items-center text-center space-y-4 animate-in slide-in-from-bottom-8">
          <div className="w-16 h-1 bg-emerald-600/20 rounded-full"></div>
          <h5 className="text-2xl font-black text-emerald-900 uppercase">Ingestion Analysis Verified</h5>
          <p className="text-emerald-700 text-sm font-medium max-w-lg">
            Total {summary.total} assets analyzed. Found {summary.news} new SKUs and identified {summary.lowStock} replenishment alerts.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartAIIntakeView;
