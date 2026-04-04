import React, { useState } from 'react';
import { Upload as UploadIcon, CheckCircle, AlertCircle, X, Server, ShieldCheck, ArrowRight } from 'lucide-react';

interface ShopMateIntegrationProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<void>;
}

export const ShopMateIntegration: React.FC<ShopMateIntegrationProps> = ({ isOpen, onClose, onImport }) => {
    const [activeTab, setActiveTab] = useState<'csv' | 'api'>('csv');
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                await onImport(file);
                // We rely on the parent to handle alerts/reloads, but we can show success here potentially
            } catch (err) {
                console.error(err);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[1300] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-[#0b2169] p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Server className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">ShopMate Integration</h2>
                            </div>
                            <p className="text-primary-200 text-xs font-medium max-w-md">
                                Connect your ENGLABS INVENTORY Command OS with existing EPoS infrastructure for unified inventory intelligence.
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all
                            ${activeTab === 'csv' ? 'text-[#0b2169] border-b-2 border-[#0b2169] bg-primary-50/50' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        Phase 1: CSV Bridge
                    </button>
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all
                            ${activeTab === 'api' ? 'text-[#0b2169] border-b-2 border-[#0b2169] bg-primary-50/50' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        Phase 2: Real-Time API
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px]">
                    {activeTab === 'csv' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-900">Bridge Active</h4>
                                    <p className="text-xs text-emerald-700 mt-1">
                                        Your system is ready to ingest ShopMate daily reports. This will synchronize stock levels and prices using the specific ShopMate CSV format.
                                    </p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#0b2169] hover:bg-slate-50 transition-all group relative">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-[#0b2169] transition-colors">
                                    {isUploading ? (
                                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <UploadIcon className="w-8 h-8 text-slate-400 group-hover:text-white" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <h5 className="font-bold text-slate-700 mb-1">Upload 'ProductList.csv'</h5>
                                    <p className="text-xs text-slate-400">Export from ShopMate Back Office &rarr; Products &rarr; Export</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 text-[10px] text-slate-500 space-y-2">
                                <p className="font-bold uppercase tracking-wider text-slate-400">Synchronization Logic:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Matches items by <strong>Barcode (EAN)</strong> first, then SKU.</li>
                                    <li>Updates <strong>Selling Price</strong> and <strong>Stock Level</strong>.</li>
                                    <li>New items found in ShopMate export will be <strong>Created</strong> automatically.</li>
                                    <li>Leaves 'Authorized Signature' stamps intact for audit trails.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900">Partner Access Required</h4>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Real-time synchronization requires an API Key from The Retail Data Partnership.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 opacity-50 pointer-events-none">
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">ShopMate Store ID</label>
                                    <input type="text" placeholder="e.g. 99281" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">API Secret Key</label>
                                    <div className="relative">
                                        <input type="password" value="••••••••••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 p-6 bg-primary-50 rounded-xl border border-primary-100">
                                <h4 className="text-sm font-bold text-[#0b2169]">How to get connected:</h4>
                                <ol className="list-decimal pl-4 text-xs text-primary-800 space-y-2 leading-relaxed">
                                    <li>Contact <strong>help@retaildata.co.uk</strong> or call your ShopMate representative.</li>
                                    <li>Request <strong>"Third-Party API Integration"</strong> for your store management dashboard.</li>
                                    <li>When you receive your credentials, this screen will be unlocked for input.</li>
                                </ol>
                                <a
                                    href="https://www.shopmate.co.uk/contact-us/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800"
                                >
                                    Contact Support <ArrowRight className="w-3 h-3" />
                                </a>
                            </div>

                            <button disabled className="w-full bg-slate-200 text-slate-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest cursor-not-allowed">
                                Connect API (Locked)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
