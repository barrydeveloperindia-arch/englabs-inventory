import React, { useState, useMemo, useRef } from 'react';
import { Purchase, Supplier, ViewType, AuditEntry, InventoryItem, AdjustmentLog, Bill, LedgerEntry, Transaction } from '../types';
import { scanDocument } from '../lib/ai_pdf_scanner';
import { SHOP_INFO } from '../constants';

interface PurchasesViewProps {
  userId: string;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: AuditEntry['severity']) => void;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  activeStaffName: string;
  postToLedger: (entries: Omit<LedgerEntry, 'id' | 'timestamp'>[]) => void;
  transactions: Transaction[];
}

import { auth } from '../lib/firebase';
import { addPurchase, addBill, updateInventoryItem, updateSupplier, updatePurchase } from '../lib/firestore';
import PurchaseDashboard from './PurchaseDashboard';

const PurchasesView: React.FC<PurchasesViewProps> = ({
  userId, purchases, setPurchases, suppliers, setSuppliers, logAction, inventory, setInventory, bills, setBills, activeStaffName, postToLedger, transactions
}) => {
  const [showManageRegistry, setShowManageRegistry] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'ledger'>('dashboard');
  const [isScanning, setIsScanning] = useState(false);

  const addReceiptRef = useRef<HTMLInputElement>(null);
  const editReceiptRef = useRef<HTMLInputElement>(null);

  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editingPurchaseForm, setEditingPurchaseForm] = useState<Partial<Purchase>>({});

  const [formData, setFormData] = useState<Partial<Purchase & { itemId: string; qty: number; paymentMethod: string; category: string; remarks: string; customItem: string }>>({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    itemId: '',
    qty: 0,
    category: 'Stock',
    remarks: '',
    invoiceNumber: '',
    customItem: ''
  });

  const dailySummaries = useMemo(() => {
    const map = new Map<string, { total: number; cash: number; digital: number; credit: number }>();

    purchases.forEach(p => {
      const d = p.date || 'Unknown';
      if (!map.has(d)) map.set(d, { total: 0, cash: 0, digital: 0, credit: 0 });
      const entry = map.get(d)!;
      const amt = Number(p.amount || 0);
      entry.total += amt;

      const mode = (p.paymentMode || '').toUpperCase();
      if (mode.includes('CASH')) entry.cash += amt;
      else if (mode.includes('CREDIT')) entry.credit += amt;
      else entry.digital += amt;
    });

    return Array.from(map.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases]);

  const monthlySummaries = useMemo(() => {
    const map = new Map<string, { count: number; total: number; vendors: Map<string, number> }>();

    purchases.forEach(p => {
      const month = (p.date || '').slice(0, 7); // YYYY-MM
      if (!map.has(month)) map.set(month, { count: 0, total: 0, vendors: new Map() });
      const entry = map.get(month)!;
      entry.count++;
      const amt = Number(p.amount || 0);
      entry.total += amt;
      // Track highest vendor
      const vId = p.supplierId || 'unknown';
      entry.vendors.set(vId, (entry.vendors.get(vId) || 0) + amt);
    });

    return Array.from(map.entries()).map(([month, stats]) => {
      let maxVendor = '-';
      let maxSpend = 0;
      stats.vendors.forEach((amt, vid) => {
        if (amt > maxSpend) { maxSpend = amt; maxVendor = vid; }
      });
      const vendorName = suppliers.find(s => s.id === maxVendor)?.name || 'Unknown';

      return { month, ...stats, highestVendor: vendorName };
    }).sort((a, b) => b.month.localeCompare(a.month));
  }, [purchases, suppliers]);

  const processReceiptWithAI = async (file: File | string) => {
    setIsScanning(true);
    try {
      const result = await scanDocument(file, 'INVOICE_SUMMARY');
      const summary = result.summary;

      if (summary) {
        setFormData(prev => ({
          ...prev,
          amount: summary.total_amount || prev.amount,
          date: summary.date || prev.date,
          items: summary.items_summary || prev.items,
          invoiceNumber: summary.invoice_number || prev.invoiceNumber,
        }));
        
        logAction('AI Document Scan', 'purchases', `Extracted ${SHOP_INFO.currency}${summary.total_amount}.`, 'Info');
      }
    } catch (error) {
      console.error("AI Scan Error:", error);
      alert("AI failed to parse document. Please check input.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit) {
          setEditingPurchaseForm(prev => ({ ...prev, receiptData: base64 }));
        } else {
          setFormData(prev => ({ ...prev, receiptData: base64 }));
          processReceiptWithAI(file);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File processing failed", err);
      alert("Failed to process document.");
    }
  };

  const handleDownloadReceipt = (purchase: Purchase) => {
    if (!purchase.receiptData) return;
    const link = document.createElement('a');
    link.href = purchase.receiptData;
    link.download = `Receipt_${purchase.invoiceNumber || purchase.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAction('Receipt Download', 'purchases', `Exported proof of payment for entry #${purchase.id.slice(0, 8)}`, 'Info');
  };

  const handleAdd = async () => {
    // userId is passed from props

    if (!formData.supplierId || !formData.amount || (!formData.items && !formData.itemId) || (formData.qty || 0) <= 0) {
      alert("Please specify Item, Quantity, Supplier and Total Invoice Value.");
      return;
    }

    if (!formData.invoiceNumber) {
      if (!confirm("Invoice Number is missing! Proceed with auto-generated ID?")) return;
    }

    const item = inventory.find(i => i.id === formData.itemId);
    const description = formData.customItem || (item ? `${item.brand} ${item.name}` : formData.items || 'Unknown Item');

    // Category Logic: If mapped to item, use item category. Else use selected category.
    const finalCategory = item ? (item.category === 'Unclassified' ? (formData.category || 'Stock') : item.category) : (formData.category || 'Other');

    const unitBuyPrice = (formData.amount || 0) / (formData.qty || 1);
    const purchaseId = crypto.randomUUID();
    const isSettled = formData.paymentMethod !== 'ON CREDIT';

    const supplier = suppliers.find(s => s.id === formData.supplierId);

    // 0. Upload Receipt if exists and is Base64 (fresh upload)
    let finalReceiptUrl = formData.receiptData;

    try {
      if (formData.receiptData && formData.receiptData.startsWith('data:')) {
        console.log("Uploading attachment to Firebase Storage...");
        
        // Dynamic mime parsing from data URI
        const mimeType = formData.receiptData.split(';')[0].split(':')[1] || 'image/jpeg';
        const extension = mimeType.split('/')[1] === 'pdf' ? 'pdf' : 
                          mimeType.includes('sheet') || mimeType.includes('excel') ? 'xlsx' : 'jpg';

        const fetchRes = await fetch(formData.receiptData);
        const blob = await fetchRes.blob();
        const fileToUpload = new File([blob], `receipt_${Date.now()}.${extension}`, { type: mimeType });

        const { uploadFile } = await import('../lib/storage_utils');
        const storagePath = `receipts/${userId}/${Date.now()}_attachment.${extension}`;
        finalReceiptUrl = await uploadFile(fileToUpload, storagePath);
        console.log("File uploaded:", finalReceiptUrl);
      }
    } catch (uploadErr) {
      console.error("File Upload Failed:", uploadErr);
      if (!confirm("Document upload failed. Continue without attachment?")) return;
      finalReceiptUrl = '';
    }

    const newPurchase: Purchase = {
      id: purchaseId,
      date: formData.date || new Date().toISOString().split('T')[0],
      supplierId: formData.supplierId || '',
      items: description,
      amount: formData.amount || 0,
      invoiceNumber: formData.invoiceNumber || 'INV-' + Date.now().toString().slice(-6),
      status: 'Received',
      receiptData: finalReceiptUrl, // Use URL

      // New Fields
      category: finalCategory,
      qty: formData.qty,
      unitPrice: unitBuyPrice,
      paymentMode: formData.paymentMethod,
      vendorName: supplier?.name || 'Unknown Vendor',
      vendorContact: supplier?.phone || '',
      purchasedBy: activeStaffName,
      remarks: formData.remarks,
      condition: formData.condition || 'OK',
      deliveryMethod: formData.deliveryMethod || 'Delivered'
    };

    const newBill: Bill = {
      id: crypto.randomUUID(),
      supplierId: formData.supplierId || '',
      purchaseId: purchaseId,
      date: newPurchase.date,
      dueDate: new Date(new Date(newPurchase.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: formData.amount || 0,
      status: isSettled ? 'Settled' : 'Unpaid',
      note: isSettled ? `Settled via ${formData.paymentMethod}` : 'Purchased on credit'
    };

    try {
      // 1. Add Purchase
      await addPurchase(userId, newPurchase);

      // 2. Add Bill
      await addBill(userId, newBill);

      // 3. Update Inventory (Stock + Logs) IF LINKED
      if (item) {
        const newStock = item.stock + (formData.qty || 0);
        const newLog = {
          id: crypto.randomUUID(), date: new Date().toISOString(), type: 'relative',
          amount: formData.qty, previousStock: item.stock, newStock,
          reason: 'Inward', note: `Stock Inward: Unit Cost ${SHOP_INFO.currency}${unitBuyPrice.toFixed(2)}`
        } as AdjustmentLog;

        await updateInventoryItem(userId, item.id, {
          stock: newStock,
          lastBuyPrice: unitBuyPrice,
          logs: [newLog, ...(item.logs || [])]
        });
      }

      // 4. Update Supplier
      if (supplier) {
        await updateSupplier(userId, supplier.id, {
          totalSpend: supplier.totalSpend + (formData.amount || 0),
          outstandingBalance: supplier.outstandingBalance + (isSettled ? 0 : (formData.amount || 0)),
          orderCount: supplier.orderCount + 1,
          lastOrderDate: formData.date
        });
      }

      // 5. Automated Ledger Posting (Double-Entry)
      postToLedger([
        {
          account: 'Inventory Asset',
          type: 'Debit',
          amount: formData.amount || 0,
          referenceId: purchaseId,
          description: `Stock Inward: ${description}`,
          category: 'Inventory'
        },
        {
          account: isSettled ? (formData.paymentMethod === 'CASH' ? 'Cash in Hand' : 'Bank Account') : 'Accounts Payable',
          type: 'Credit',
          amount: formData.amount || 0,
          referenceId: purchaseId,
          description: `Payment for Purchase #${purchaseId.slice(0, 8)}`,
          category: 'Purchase'
        }
      ]);

      logAction('Asset Procurement', 'purchases', `Stock Inward: ${description} x${formData.qty}. Value: ${SHOP_INFO.currency}${formData.amount?.toFixed(2)}`, 'Info');

      setFormData({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        itemId: '',
        qty: 0,
        amount: 0,
        items: '',
        paymentMethod: 'ON CREDIT',
        receiptData: '',
        category: 'Stock',
        remarks: '',
        invoiceNumber: '',
        customItem: ''
      });
      alert(`Procurement verified and recorded.`);
    } catch (err) {
      console.error("Error processing procurement:", err);
      alert("Failed to record procurement. Please check connection and try again.");
    }
  };

  const startEditPurchase = (p: Purchase) => {
    setEditingPurchaseId(p.id);
    setEditingPurchaseForm({ ...p });
  };

  const savePurchaseEdit = async () => {
    if (!editingPurchaseId) return;
    try {
      let finalReceiptUrl = editingPurchaseForm.receiptData;

      if (editingPurchaseForm.receiptData && editingPurchaseForm.receiptData.startsWith('data:')) {
        console.log("Uploading edited receipt...");
        const fetchRes = await fetch(editingPurchaseForm.receiptData);
        const blob = await fetchRes.blob();
        const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });

        const { uploadFile } = await import('../lib/storage_utils');
        const storagePath = `receipts/${userId}/${Date.now()}_receipt.jpg`;
        finalReceiptUrl = await uploadFile(file, storagePath);
      }

      const updates = { ...editingPurchaseForm, receiptData: finalReceiptUrl };

      await updatePurchase(userId, editingPurchaseId, updates);
      logAction('Procurement Edit', 'purchases', `Modified details of ledger entry #${editingPurchaseId.slice(0, 8)}`, 'Warning');
      setEditingPurchaseId(null);
    } catch (err) {
      console.error("Error updating purchase:", err);
      alert("Failed to update purchase.");
    }
  };

  const renderItems = (val: any) => {
    if (!val) return 'No Details';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map((v: any) => v.description || v.name || JSON.stringify(v)).join(', ');
    if (typeof val === 'object') return val.description || val.name || JSON.stringify(val);
    return 'Unknown Format';
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface-elevated p-8 rounded-3xl border border-surface-highlight shadow-sm relative overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-surface-elevated/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-surface-highlight border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="font-black uppercase text-[10px] tracking-widest text-ink-base">AI Vision Analyzing Receipt...</p>
          </div>
        )}
        {/* Global Hidden Inputs for File Uploads (Always Mounted) */}
        <input 
          ref={addReceiptRef} 
          type="file" 
          accept="image/*,.pdf,.xlsx,.xls,.csv" 
          className="hidden" 
          onChange={e => {
            handleFileUpload(e);
            // Reset value so same file can be uploaded again
            if (e.target) e.target.value = '';
          }} 
        />
        <input 
          ref={editReceiptRef} 
          type="file" 
          accept="image/*,.pdf,.xlsx,.xls,.csv" 
          className="hidden" 
          onChange={e => {
            handleFileUpload(e, true);
            if (e.target) e.target.value = '';
          }} 
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h4 className="text-sm font-black text-ink-base uppercase tracking-widest leading-none">Stock Acquisition Interface</h4>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'dashboard' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>Dashboard</button>
              <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ledger' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>Register New</button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {viewMode === 'ledger' && (
              <>
                <button onClick={() => addReceiptRef.current?.click()} className="text-[10px] w-full md:w-auto font-black uppercase text-white bg-primary-600 px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-lg whitespace-nowrap">Scan Receipt with AI</button>
                <button onClick={() => setShowManageRegistry(true)} className="text-[10px] w-full md:w-auto font-black uppercase text-primary-900 bg-surface-highlight px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap">Manage Registry</button>
              </>
            )}
            {viewMode === 'dashboard' && (
              <button onClick={() => setShowManageRegistry(true)} className="text-[10px] w-full md:w-auto font-black uppercase text-primary-900 bg-surface-highlight px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap">Manage Registry</button>
            )}
          </div>
        </div>

        {viewMode === 'dashboard' ? (
          <PurchaseDashboard
            purchases={purchases}
            suppliers={suppliers}
            onAddNew={() => setViewMode('ledger')}
            inventory={inventory}
            transactions={transactions}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            {/* Row 1: Basic Info */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-primary-600 focus:bg-white transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Invoice / Bill No. <span className="text-rose-500">*</span></label>
              <input type="text" placeholder="e.g. INV-9985" value={formData.invoiceNumber || ''} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-primary-600 focus:bg-white transition-colors" />
            </div>

            {/* Vendor & Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Vendor <span className="text-rose-500">*</span></label>
              <select value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black uppercase outline-primary-600 appearance-none focus:bg-white transition-colors">
                <option value="">Select Vendor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">4. Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black uppercase outline-primary-600 appearance-none focus:bg-white transition-colors">
                <option value="Stock">Stock (Inventory)</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Stationery">Stationery</option>
                <option value="Repair">Repair / Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Row 2: Item Details */}
            <div className="col-span-1 lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">5. Item Description <span className="text-rose-500">*</span></label>
              <div className="flex gap-2">
                <select value={formData.itemId} onChange={(e) => setFormData({ ...formData, itemId: e.target.value, customItem: '' })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black uppercase outline-primary-600 focus:bg-white transition-colors">
                  <option value="">Select Inventory Item (Auto-Stock)</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.brand} {i.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Or Type Description..."
                  value={formData.customItem || ''}
                  onChange={(e) => setFormData({ ...formData, customItem: e.target.value, itemId: '' })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-primary-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">6. Quantity</label>
              <input type="number" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-primary-600 focus:bg-white transition-colors" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">7. Condition</label>
              <select value={formData.condition || 'OK'} onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black uppercase outline-primary-600 focus:bg-white transition-colors">
                <option value="OK">OK</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">8. Total Amount ({SHOP_INFO.currency})</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-lg font-black font-mono outline-primary-600 focus:bg-white transition-colors" />
            </div>

            {/* Row 3: Payment & Remarks */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">9. Payment Mode</label>
              <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black uppercase outline-primary-600 focus:bg-white transition-colors">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARDS">Card</option>
                <option value="NET BANKING">Bank Transfer</option>
                <option value="ON CREDIT">Credit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">10. Delivery Method</label>
              <select value={formData.deliveryMethod || 'Delivered'} onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black uppercase outline-primary-600 focus:bg-white transition-colors">
                <option value="Delivered">Delivered</option>
                <option value="Collected">Collected</option>
              </select>
            </div>

            <div className="col-span-1 lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">9. Remarks</label>
              <input type="text" placeholder="e.g. GST Bill Received, Warranty..." value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold outline-primary-600 focus:bg-white transition-colors" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">10. Evidence</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => addReceiptRef.current?.click()} 
                  className={`flex-1 py-3 rounded-xl border-2 border-dashed text-[10px] font-black uppercase transition-all ${formData.receiptData ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-300 text-slate-400 hover:border-primary-400'}`}
                >
                  {formData.receiptData ? '✓ Attached' : '+ Attach Bill'}
                </button>
                {formData.receiptData && (
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, receiptData: undefined }))}
                    className="px-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 font-bold hover:bg-rose-100 transition-colors"
                    title="Clear Attachment"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-full mt-4">
              <button onClick={handleAdd} className="w-full bg-primary-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-primary-700 transition-all hover:scale-[1.01]">
                Record Purchase Entry
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-surface-elevated border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-sm font-black text-ink-base uppercase">Procurement Master Ledger</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Audit Records: {purchases.length}</p>
        </div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-left min-w-[1400px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-12">Sr.</th>
                <th className="px-4 py-4 w-28">Date</th>
                <th className="px-4 py-4 w-32">Invoice #</th>
                <th className="px-4 py-4 w-64">Item Description</th>
                <th className="px-4 py-4 w-24">Condition</th>
                <th className="px-4 py-4 w-16 text-center">Qty</th>
                <th className="px-4 py-4 w-24 text-right">Unit Price</th>
                <th className="px-4 py-4 w-24 text-right">Total</th>
                <th className="px-4 py-4 w-40">Vendor</th>
                <th className="px-4 py-4 w-24">Del. Method</th>
                <th className="px-4 py-4 w-24">Payment</th>
                <th className="px-4 py-4 w-24">By</th>
                <th className="px-4 py-4 w-48">Remarks</th>
                <th className="px-4 py-4 w-16 text-center">Doc</th>
                <th className="px-4 py-4 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((p, index) => (
                <tr key={p.id} className="hover:bg-primary-50/30 transition-colors group">
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-400">{purchases.length - index}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-700 whitespace-nowrap">{p.date}</td>
                  <td className="px-4 py-4 text-[10px] font-black text-slate-800 bg-slate-100 rounded px-2 py-1 inline-block mt-2">{p.invoiceNumber}</td>
                  <td className="px-4 py-4 text-[11px] font-medium text-slate-700">{renderItems(p.items)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${p.condition === 'Damaged' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.condition || 'OK'}</span>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-bold text-center">{p.qty || '-'}</td>
                  <td className="px-4 py-4 text-[11px] font-mono text-right text-slate-500">{p.unitPrice ? `${SHOP_INFO.currency}${Number(p.unitPrice).toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-4 text-[12px] font-black font-mono text-right text-slate-900 border-l border-slate-100 pl-4 bg-slate-50/50">{SHOP_INFO.currency}{Number(p.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-700">{p.vendorName || suppliers.find(s => s.id === p.supplierId)?.name}</td>
                  <td className="px-4 py-4 text-[10px] font-bold">{p.deliveryMethod || '-'}</td>
                  <td className="px-4 py-4 text-[10px] font-bold uppercase">{p.paymentMode}</td>
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-500">{p.purchasedBy || 'Shop Owner'}</td>
                  <td className="px-4 py-4 text-[10px] italic text-slate-500 max-w-[150px] truncate" title={p.remarks}>{p.remarks || '-'}</td>
                  <td className="px-4 py-4 text-center">
                    {(p.receiptData || p.invoiceUrl) ? (
                      <a href={p.invoiceUrl || '#'} onClick={(e) => { if(!p.invoiceUrl) { e.preventDefault(); handleDownloadReceipt(p); } }} target="_blank" className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors inline-block" title="Download Proof">
                        📄
                      </a>
                    ) : <span className="text-slate-200 font-bold">-</span>}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditPurchase(p)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Edit">✎</button>
                      <button onClick={() => setPurchases(prev => prev.filter(x => x.id !== p.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.4em]">No procurement entries registered</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Purchases Cards */}
        <div className="md:hidden p-4 space-y-4 bg-surface-elevated">
          {purchases.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-black uppercase text-xs tracking-widest">No procurement entries</div>
          ) : (
            purchases.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(p => (
              <div key={p.id} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded mb-2 inline-block shadow-sm">#{p.invoiceNumber}</span>
                    <p className="font-black text-ink-base uppercase text-xs">{p.date}</p>
                    <p className="text-[10px] font-black text-primary-600 uppercase mt-1">{p.vendorName || suppliers.find(s => s.id === p.supplierId)?.name || 'Deleted Vendor'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-black font-mono text-ink-base">{SHOP_INFO.currency}{Number(p.amount || 0).toFixed(2)}</p>
                    <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-full block w-fit ml-auto">{p.category || 'Stock'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[8px] uppercase tracking-widest text-slate-400">Item</span>
                    <span className="text-slate-700">{renderItems(p.items)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-widest text-slate-400">Qty x Rate</span>
                    <span className="text-slate-700">{p.qty || '-'} x {SHOP_INFO.currency}{Number(p.unitPrice || 0).toFixed(2)}</span>
                  </div>
                </div>

                {p.remarks && (
                  <div className="text-[10px] text-slate-400 italic px-2 border-l-2 border-slate-200">
                    "{p.remarks}"
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                  <div className="flex gap-2">
                    {p.receiptData && (
                      <button onClick={() => handleDownloadReceipt(p)} className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg" title="Download Proof">
                        📄 Receipt
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditPurchase(p)} className="text-[10px] font-black uppercase text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">Edit</button>
                    <button onClick={() => setPurchases(prev => prev.filter(x => x.id !== p.id))} className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">Del</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily Summary Table */}
      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden mt-8 hidden md:block animate-in fade-in slide-in-from-bottom-6">
        <div className="px-8 py-6 bg-surface-elevated border-b border-slate-100">
          <h4 className="text-sm font-black text-ink-base uppercase">Daily Financial Reconciliation</h4>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4 text-right">Total Purchases</th>
              <th className="px-8 py-4 text-right">Cash</th>
              <th className="px-8 py-4 text-right">Digital</th>
              <th className="px-8 py-4 text-right">Credit</th>
              <th className="px-8 py-4 text-center">Checked By</th>
              <th className="px-8 py-4 text-center">Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dailySummaries.map(ds => (
              <tr key={ds.date} className="hover:bg-slate-50/50">
                <td className="px-8 py-4 text-xs font-black text-slate-900">{ds.date}</td>
                <td className="px-8 py-4 text-xs font-black font-mono text-right text-primary-600">{SHOP_INFO.currency}{Number(ds.total).toFixed(2)}</td>
                <td className="px-8 py-4 text-xs font-mono text-right text-emerald-600">{SHOP_INFO.currency}{Number(ds.cash).toFixed(2)}</td>
                <td className="px-8 py-4 text-xs font-mono text-right text-blue-600">{SHOP_INFO.currency}{Number(ds.digital).toFixed(2)}</td>
                <td className="px-8 py-4 text-xs font-mono text-right text-orange-600">{SHOP_INFO.currency}{Number(ds.credit).toFixed(2)}</td>
                <td className="px-8 py-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Manager</td>
                <td className="px-8 py-4 text-[10px] italic text-slate-300 text-center font-serif border-b border-dashed border-slate-200 w-32 mx-auto mt-2 block"></td>
              </tr>
            ))}
            {dailySummaries.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-slate-300 text-[10px] uppercase font-black">No reconciliation data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden mt-8 hidden md:block animate-in fade-in slide-in-from-bottom-8">
        <div className="px-8 py-6 bg-surface-elevated border-b border-slate-100">
          <h4 className="text-sm font-black text-ink-base uppercase">Monthly Purchase Summary</h4>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-8 py-4">Month</th>
              <th className="px-8 py-4 text-center">Total Bills</th>
              <th className="px-8 py-4 text-right">Total Amount</th>
              <th className="px-8 py-4 text-center">Highest Vendor Spend</th>
              <th className="px-8 py-4 text-center">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlySummaries.map(ms => (
              <tr key={ms.month} className="hover:bg-slate-50/50">
                <td className="px-8 py-4 text-xs font-black text-slate-900">{ms.month}</td>
                <td className="px-8 py-4 text-xs font-bold text-center text-slate-600">{ms.count}</td>
                <td className="px-8 py-4 text-xs font-black font-mono text-right text-primary-600">{SHOP_INFO.currency}{Number(ms.total).toFixed(2)}</td>
                <td className="px-8 py-4 text-xs font-bold text-center text-slate-600">{ms.highestVendor}</td>
                <td className="px-8 py-4 text-[10px] italic text-slate-400 text-center">{ms.total > 1000 ? 'High Spend' : 'Normal'}</td>
              </tr>
            ))}
            {monthlySummaries.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-slate-300 text-[10px] uppercase font-black">No monthly data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingPurchaseId && (
        <div className="fixed inset-0 z-[1200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-elevated w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#0F172A] p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Ledger Correction</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-1">Manual Document Attachment</p>
              </div>
              <button onClick={() => setEditingPurchaseId(null)} className="text-3xl font-light hover:rotate-90 transition-all px-4">✕</button>
            </div>
            <div className="p-12 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Arrival Date</label>
                  <input type="date" value={editingPurchaseForm.date} onChange={e => setEditingPurchaseForm({ ...editingPurchaseForm, date: e.target.value })} className="w-full bg-surface-elevated border rounded-xl px-4 py-4 text-xs font-black outline-none focus:border-primary-600" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valuation ({SHOP_INFO.currency})</label>
                  <input type="number" step="0.01" value={editingPurchaseForm.amount} onChange={e => setEditingPurchaseForm({ ...editingPurchaseForm, amount: parseFloat(e.target.value) || 0 })} className="w-full bg-surface-elevated border rounded-xl px-4 py-4 text-lg font-black font-mono outline-none focus:border-primary-600" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Proof (Receipt)</label>
                <div
                  onClick={() => editReceiptRef.current?.click()}
                  className={`w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${editingPurchaseForm.receiptData ? 'border-emerald-500 bg-emerald-50' : 'border-surface-highlight hover:border-primary-600'}`}
                >
                  {editingPurchaseForm.receiptData ? (
                    <>
                      <span className="text-emerald-600 text-3xl mb-2">📄</span>
                      <p className="text-[10px] font-black text-emerald-700 uppercase">Document Attached - Click to Replace</p>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-300 text-3xl mb-2">📥</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload payment proof</p>
                    </>
                  )}
                </div>
              </div>
              <button onClick={savePurchaseEdit} className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all mt-4">Apply Document Refinement</button>
            </div>
          </div>
        </div>
      )}

      {showManageRegistry && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-elevated w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0F172A] p-10 text-white shrink-0 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tight">Partner Registry</h3>
              <button onClick={() => setShowManageRegistry(false)} className="text-3xl font-light">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              {suppliers.map(v => (
                <div key={v.id} className="p-6 rounded-2xl border bg-surface-elevated border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-black text-ink-base uppercase text-sm">{v.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Bal: {SHOP_INFO.currency}{(v.outstandingBalance || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesView;
