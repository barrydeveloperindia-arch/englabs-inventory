
import React, { useState, useMemo } from 'react';
import { Supplier, Bill, ViewType, AuditEntry } from '../types';

interface SuppliersViewProps {
  userId: string;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: AuditEntry['severity']) => void;
}

import { addSupplier, updateSupplier, deleteSupplier, updateBill } from '../lib/firestore';

const SuppliersView: React.FC<SuppliersViewProps> = ({ userId, suppliers, setSuppliers, bills, setBills, logAction }) => {
  const [activeTab, setActiveTab] = useState<'registry' | 'bills'>('registry');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formData, setFormData] = useState<Partial<Supplier>>({
    id: undefined,
    name: '',
    contactName: '',
    phone: '',
    email: '',
    category: 'General Wholesale',
    address: '',
    gstin: ''
  });

  const supplierCategories = [
    'General Wholesale',
    'Approved Supplier',
    'Raw Materials',
    'Component Spares',
    'Industrial Tooling',
    'Electronic Components',
    'Pneumatic Supplies',
    'Safety & PPE',
    'Logistics & Freight'
  ];

  const filteredSuppliers = useMemo(() => {
    if (selectedCategory === 'All') return suppliers;
    return suppliers.filter(s => s.category === selectedCategory);
  }, [suppliers, selectedCategory]);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name?.trim()) return "Company Name is mandatory.";
    if (!formData.contactName?.trim()) return "Contact Person name is mandatory.";
    if (!formData.phone?.trim() || formData.phone.length < 10) return "Please enter a valid Phone Number.";
    if (!formData.email?.trim() || !emailRegex.test(formData.email)) return "A valid Email Address is required.";
    
    // Duplicate detection
    const isDuplicate = suppliers.some(s => s.name.toLowerCase() === formData.name?.trim().toLowerCase() && s.id !== formData.id);
    if (isDuplicate) return "A vendor with this company name already exists (Duplicate Detection).";
    
    return null;
  };

  const handleAdd = () => {
    const error = validateForm();
    if (error) {
      alert(`⚠️ Validation Error: ${error}`);
      return;
    }

    if (formData.id) {
       updateSupplier(userId, formData.id, {
          name: formData.name,
          contactName: formData.contactName,
          phone: formData.phone,
          email: formData.email,
          category: formData.category,
          address: formData.address,
          gstin: formData.gstin
       });
       setSuppliers(prev => prev.map(s => s.id === formData.id ? { ...s, name: formData.name!, contactName: formData.contactName!, phone: formData.phone!, email: formData.email!, category: formData.category!, address: formData.address, gstin: formData.gstin } : s));
       logAction('Vendor Updated', 'vendors', `Vendor profile ${formData.name} updated.`, 'Info');
    } else {
       const newSup: Supplier = {
         id: crypto.randomUUID(),
         name: formData.name || '',
         contactName: formData.contactName || '',
         phone: formData.phone || '',
         email: formData.email || '',
         category: formData.category || 'General Wholesale',
         address: formData.address || '',
         gstin: formData.gstin || '',
         totalSpend: 0,
         outstandingBalance: 0,
         orderCount: 0
       };

       addSupplier(userId, newSup); // Persist to Firestore
       setSuppliers(prev => [...prev, newSup]);
       logAction('Vendor Enrolled', 'vendors', `New partner ${newSup.name} added to the registry.`, 'Info');
    }
    setShowAdd(false);
    setFormData({ id: undefined, name: '', contactName: '', phone: '', email: '', category: 'General Wholesale', address: '', gstin: '' });
  };


  const settleBill = (bill: Bill) => {
    if (!confirm(`Settle Bill #${bill.id.slice(0, 8)} of ₹${(bill.amount || 0).toLocaleString('en-IN')}/-?`)) return;

    updateBill(userId, bill.id, { status: 'Settled' });
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'Settled' } : b));

    const updatedBalance = Math.max(0, (suppliers.find(s => s.id === bill.supplierId)?.outstandingBalance || 0) - bill.amount);
    updateSupplier(userId, bill.supplierId, { outstandingBalance: updatedBalance });

    setSuppliers(prev => prev.map(s => {
      if (s.id === bill.supplierId) {
        return { ...s, outstandingBalance: updatedBalance };
      }
      return s;
    }));
    logAction('Bill Settled', 'vendors', `Remittance of ₹${(bill.amount || 0).toLocaleString('en-IN')} paid to ${suppliers.find(s => s.id === bill.supplierId)?.name}.`, 'Warning');
  };

  return (
    <div className="space-y-8">
      <div className="flex bg-surface-elevated p-1.5 rounded-2xl border border-surface-highlight w-fit shadow-sm">
        <button onClick={() => setActiveTab('registry')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-[#ee0000] text-white shadow-lg' : 'text-slate-400 hover:text-ink-muted'}`}>Vendor Registry</button>
        <button onClick={() => setActiveTab('bills')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bills' ? 'bg-[#ee0000] text-white shadow-lg' : 'text-slate-400 hover:text-ink-muted'}`}>Payable Bills</button>
      </div>

      {activeTab === 'registry' && (
        <div className="bg-surface-elevated rounded-[2rem] border border-surface-highlight shadow-sm overflow-hidden">
          <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-elevated/50">
            <div>
              <h4 className="text-sm font-black text-ink-base uppercase">Official Supplier List</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Verified Logistics & Procurement Partners</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 bg-surface-elevated border border-surface-highlight px-4 py-2 rounded-xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer text-ink-base"
                >
                  <option value="All">All Categories</option>
                  {supplierCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (showAdd) setFormData({ id: undefined, name: '', contactName: '', phone: '', email: '', category: 'General Wholesale', address: '', gstin: '' });
                  setShowAdd(!showAdd);
                }}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdd ? 'bg-slate-900 text-white' : 'bg-primary-600 text-white shadow-lg shadow-primary-100'}`}
              >
                {showAdd ? 'Cancel' : 'Enroll Partner'}
              </button>
            </div>
          </div>

          {showAdd && (
            <div id="vendor-form" className="p-10 bg-surface-elevated/50 border-b space-y-8 animate-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name *</label>
                  <input
                    placeholder="e.g. Bestway Wholesale"
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-xs font-black uppercase outline-none focus:border-red-600 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Contact Person *</label>
                  <input
                    placeholder="e.g. John Smith"
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-xs font-black uppercase outline-none focus:border-red-600 transition-all"
                    value={formData.contactName}
                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Category</label>
                  <select
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-[10px] font-black uppercase outline-none focus:border-red-600 appearance-none transition-all"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {supplierCategories.map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number *</label>
                  <input
                    placeholder="e.g. 020 8123 4567"
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-xs font-black outline-none focus:border-red-600 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. sales@vendor.co.uk"
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-xs font-black lowercase outline-none focus:border-red-600 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Number</label>
                  <input
                    placeholder="e.g. 03AFWPA5127P1Z4"
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-xs font-black uppercase outline-none focus:border-primary-600 transition-all"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Address</label>
                  <input
                    placeholder="e.g. Plot No. 309, Industrial Area..."
                    className="w-full bg-surface-elevated border border-surface-highlight rounded-xl p-4 text-xs font-black outline-none focus:border-primary-600 transition-all"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleAdd}
                  className="bg-emerald-600 text-white px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all"
                >
                  {formData.id ? 'Save Profile Updates' : 'Confirm & Enroll Partner'}
                </button>
              </div>
            </div>
          )}

          <table className="w-full text-left hidden md:table">
            <thead className="bg-surface-elevated text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Partner & Identity</th>
                <th className="px-8 py-5">Contact Details</th>
                <th className="px-8 py-5">Financial Position</th>
                <th className="px-8 py-5 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-surface-elevated group transition-all">
                  <td className="px-8 py-7">
                    <p className="font-black text-ink-base text-base uppercase leading-none">{sup.name}</p>
                    <p className="text-[9px] text-primary-600 font-bold uppercase mt-2 tracking-widest">{sup.category}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] font-black bg-surface-highlight text-ink-muted px-2 py-0.5 rounded uppercase">Orders: {sup.orderCount}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <p className="text-[11px] font-black text-ink-base uppercase">{sup.contactName}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{sup.phone}</p>
                    <p className="text-[10px] font-bold text-slate-400 lowercase">{sup.email}</p>
                  </td>
                  <td className="px-8 py-7">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payable Bal</p>
                      <p className={`text-xl font-black font-mono ${sup.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{(sup.outstandingBalance || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">Lifetime Spend: ₹{(sup.totalSpend || 0).toLocaleString('en-IN')}</p>
                  </td>
                  <td className="px-8 py-7 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                           id: sup.id, name: sup.name, contactName: sup.contactName,
                           phone: sup.phone, email: sup.email, category: sup.category,
                           address: sup.address || '', gstin: sup.gstin || ''
                        });
                        setShowAdd(true);
                        setTimeout(() => {
                          const formNode = document.getElementById('vendor-form');
                          if (formNode) {
                            formNode.scrollIntoView({ behavior: 'smooth', block: 'end' });
                          } else {
                            // Fallback if form not rendered yet in next tick
                            requestAnimationFrame(() => document.getElementById('vendor-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                          }
                        }, 50);
                      }}
                      className="p-3 text-slate-400 hover:text-primary-600 transition-colors"
                      title="Edit Vendor Details"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently remove ${sup.name} from the registry?`)) {
                          deleteSupplier(userId, sup.id);
                          setSuppliers(prev => prev.filter(s => s.id !== sup.id));
                          logAction('Vendor Deletion', 'vendors', `Removed ${sup.name} from registry.`, 'Warning');
                        }
                      }}
                      className="p-3 text-slate-200 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em]">
                    No partners found in the selected category
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Supplier Cards */}
          <div className="md:hidden p-4 space-y-4 bg-surface-elevated border-t border-slate-100">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-black uppercase text-xs tracking-widest">No partners found</div>
            ) : (
              filteredSuppliers.map(sup => (
                <div key={sup.id} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-ink-base uppercase">{sup.name}</p>
                      <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">{sup.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black font-mono ${sup.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{(sup.outstandingBalance || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Due</p>
                    </div>
                  </div>
                  <div className="space-y-1 bg-surface-elevated p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Contact</span>
                      <span className="text-[10px] text-ink-base font-bold uppercase">{sup.contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Phone</span>
                      <a href={`tel:${sup.phone}`} className="text-[10px] text-primary-600 font-bold uppercase underline">{sup.phone}</a>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Permanently remove ${sup.name} from the registry?`)) {
                        setSuppliers(prev => prev.filter(s => s.id !== sup.id));
                        logAction('Vendor Deletion', 'vendors', `Removed ${sup.name} from registry.`, 'Warning');
                      }
                    }}
                    className="self-end text-[10px] text-slate-400 font-black uppercase hover:text-red-600"
                  >
                    Remove Entry ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="bg-surface-elevated rounded-[2rem] border border-surface-highlight shadow-sm overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left hidden md:table">
            <thead className="bg-surface-elevated text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr><th className="px-8 py-5">Bill Ref</th><th className="px-8 py-5">Supplier</th><th className="px-8 py-5">Amount Due</th><th className="px-8 py-5">Status</th><th className="px-8 py-5 text-right">Ops</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em]">No liabilities currently registered</td></tr>
              ) : (
                bills.sort((a, b) => b.date.localeCompare(a.date)).map(bill => (
                  <tr key={bill.id} className="hover:bg-surface-elevated transition-all">
                    <td className="px-8 py-6 font-mono text-[10px] font-black text-slate-400">#{bill.id.slice(0, 8)}</td>
                    <td className="px-8 py-6 font-black uppercase text-ink-base">{suppliers.find(s => s.id === bill.supplierId)?.name || 'N/A'}</td>
                    <td className="px-8 py-6 font-black font-mono text-lg">₹{(bill.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-[4px] text-[8px] font-black uppercase ${bill.status === 'Settled' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {bill.status === 'Unpaid' && (
                        <button
                          onClick={() => settleBill(bill)}
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                        >
                          Settle Remittance
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Bills Cards */}
          <div className="md:hidden p-4 space-y-4 bg-surface-elevated">
            {bills.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-black uppercase text-xs tracking-widest">No liabilities found</div>
            ) : (
              bills.sort((a, b) => b.date.localeCompare(a.date)).map(bill => (
                <div key={bill.id} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-ink-base uppercase text-sm">#{bill.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-ink-muted font-bold uppercase mt-1">{suppliers.find(s => s.id === bill.supplierId)?.name || 'N/A'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-[4px] text-[8px] font-black uppercase ${bill.status === 'Settled' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xl font-black font-mono text-ink-base">₹{(bill.amount || 0).toLocaleString('en-IN')}</span>
                    {bill.status === 'Unpaid' && (
                      <button
                        onClick={() => settleBill(bill)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
