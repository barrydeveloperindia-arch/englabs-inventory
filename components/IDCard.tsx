
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Share2, Mail, MessageCircle, Download, X, RefreshCcw, ShieldCheck, MapPin, Phone, Globe } from 'lucide-react';
import { StaffMember } from '../types';

interface IDCardProps {
    staff: StaffMember;
    onClose: () => void;
}

export const IDCard: React.FC<IDCardProps> = ({ staff, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    // Helpers for Text Sharing
    const getShareText = () => {
        return `*ENGLABS INVENTORY STAFF ID*\n\n` +
            `Name: ${staff.name}\n` +
            `Role: ${staff.role}\n` +
            `ID: ${staff.id}\n` +
            `Expires: ${staff.validUntil ? new Date(staff.validUntil).toLocaleDateString('en-GB') : 'N/A'}\n\n` +
            `Verified Personnel.`;
    };

    const generatePDF = async (): Promise<File | null> => {
        if (!cardRef.current) return null;
        try {
            // Wait for render stability
            await new Promise(r => setTimeout(r, 100));

            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // High resolution
                useCORS: true,
                backgroundColor: '#FFFFFF',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);
            const contentHeight = (canvas.height * contentWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);

            const blob = pdf.output('blob');
            const filename = `${(staff.name || 'ID').replace(/[^a-z0-9]/gi, '_').toUpperCase()}_ID.pdf`;
            return new File([blob], filename, { type: 'application/pdf' });
        } catch (e) {
            console.error("PDF Generation Failed", e);
            return null;
        }
    };

    const handleNativeShare = async (file: File, title: string, text: string) => {
        const nav = navigator as any;
        if (nav.canShare && nav.canShare({ files: [file] })) {
            try {
                await nav.share({ files: [file], title, text });
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

    const downloadFile = (file: File) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleWhatsApp = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const pdfFile = await generatePDF();
            if (pdfFile) {
                const shared = await handleNativeShare(pdfFile, 'Staff ID Card', `ID Card for ${staff.name}`);
                if (!shared) {
                    downloadFile(pdfFile);
                    const text = encodeURIComponent(getShareText());
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                }
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEmail = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const pdfFile = await generatePDF();
            if (pdfFile) {
                const shared = await handleNativeShare(pdfFile, 'Staff ID Card', `ID Card for ${staff.name}`);
                if (!shared) {
                    downloadFile(pdfFile);
                    const subject = encodeURIComponent(`Staff ID: ${staff.name}`);
                    const body = encodeURIComponent(getShareText());
                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                }
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShareOrDownload = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const pdfFile = await generatePDF();
            if (pdfFile) {
                const shared = await handleNativeShare(pdfFile, 'Staff ID Card', `ID Card for ${staff.name}`);
                if (!shared) downloadFile(pdfFile);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
            <div className="flex flex-col gap-4 items-center animate-in fade-in zoom-in duration-300 w-full max-w-sm my-auto">

                {/* ID Card Display Area */}
                <div ref={cardRef} className="w-full perspective-1000">
                    <div className={`relative transition-all duration-500 preserve-3d h-[540px] ${isFlipped ? 'rotate-y-180' : ''}`}>

                        {/* FRONT SIDE */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
                            {/* Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none z-0">
                                <img src="/shop_logo.png" className="w-full h-full object-contain grayscale" alt="" />
                            </div>

                            {/* Header */}
                            <div className="pt-8 pb-4 flex flex-col items-center gap-2 relative z-10">
                                <img src="/shop_logo.png" className="w-12 h-12 object-contain" alt="ENG" />
                                <h1 className="text-slate-900 text-lg font-black tracking-[0.2em] uppercase text-center leading-tight">ENGLABS<br />INVENTORY</h1>
                                <div className="h-1 w-10 bg-primary-500 rounded-full mt-1"></div>
                            </div>

                            {/* Photo */}
                            <div className="relative z-10 mx-auto mb-4">
                                <div className="w-32 h-32 bg-white rounded-2xl p-1 shadow-lg border border-slate-100 overflow-hidden">
                                    {staff.photo ? (
                                        <img src={staff.photo} className="w-full h-full object-cover rounded-xl" crossOrigin="anonymous" alt="Staff" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-3xl grayscale opacity-50 rounded-xl">👤</div>
                                    )}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md whitespace-nowrap">
                                    Authorised Personnel
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-6 pt-4 text-center relative z-10">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-0.5">{staff.name}</h2>
                                <p className="text-[11px] font-bold text-primary-500 uppercase tracking-[0.15em] mb-4">{staff.role}</p>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-3 border-t border-slate-100 pt-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-left">Staff ID</span>
                                        <span className="text-[11px] font-bold text-slate-800 font-mono text-left">{staff.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-left">Valid Until</span>
                                        <span className="text-[11px] font-bold text-slate-800 text-left">{staff.validUntil ? new Date(staff.validUntil).toLocaleDateString('en-GB') : 'DEC 2026'}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-left">DOB</span>
                                        <span className="text-[11px] font-bold text-slate-800 text-left">{staff.dateOfBirth || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-left">Blood</span>
                                        <span className="text-[11px] font-bold text-slate-800 text-left">{staff.bloodGroup || 'O+'}</span>
                                    </div>
                                    <div className="col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center">Home Address</span>
                                        <span className="text-[9px] font-bold text-slate-600 leading-tight text-center">{staff.address || 'No registered address'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-1.5 mt-auto bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500"></div>
                        </div>

                        {/* BACK SIDE */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 rotate-y-180">
                            <div className="p-8 flex flex-col items-center gap-6 h-full text-center">
                                <div className="w-24 h-24 opacity-10 mt-4">
                                    <img src="/shop_logo.png" className="w-full h-full object-contain grayscale" alt="" />
                                </div>

                                <div className="space-y-2">
                                    <ShieldCheck className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Property of ENGLABS Inventory</h3>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                        This identification card remains the property of ENGLABS Inventory Management. If found, please return to any store location or post to the address below.
                                    </p>
                                </div>

                                <div className="w-full space-y-3 pt-6 border-t border-slate-100">
                                    <div className="flex items-start gap-3 text-left">
                                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                        <p className="text-[9px] font-bold text-slate-600">1021-1022, Disha Arcade, MDC Sec-4<br />Panchkula, Haryana 134114</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                        <p className="text-[9px] font-bold text-slate-600">098764-57934</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left">
                                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                                        <p className="text-[9px] font-bold text-slate-600">englabscivil.com</p>
                                    </div>
                                </div>

                                <div className="mt-auto mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200">
                                        {/* Mock QR placeholder */}
                                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1 opacity-50">
                                            <div className="w-full h-1 bg-slate-400"></div>
                                            <div className="w-full h-1 bg-slate-400"></div>
                                            <div className="w-full h-1 bg-slate-400"></div>
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-black text-slate-400 mt-2 tracking-tighter">SECURED ID: {staff.id.toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-slate-900"></div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full flex flex-col gap-3">
                    <button
                        data-testid="id-card-flip-btn"
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="w-full py-2.5 bg-primary-50 text-primary-600 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-primary-100 transition-all flex items-center justify-center gap-2 border border-primary-100 shadow-sm"
                    >
                        <RefreshCcw className="w-3 h-3" /> Flip to {isFlipped ? 'Front' : 'Back'}
                    </button>

                    <div className="flex gap-2">
                        <button onClick={handleWhatsApp} className="flex-1 py-3 bg-[#25D366] text-white rounded-xl font-bold uppercase text-[9px] tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
                        </button>
                        <button onClick={handleEmail} className="flex-1 py-3 bg-white text-slate-700 rounded-xl font-bold uppercase text-[9px] tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2 border border-slate-100">
                            <Mail className="w-4 h-4" /> Email
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-5 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={handleShareOrDownload} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> {isGenerating ? 'Saving...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                @keyframes flip {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(180deg); }
                }
            `}</style>
        </div>
    );
};
