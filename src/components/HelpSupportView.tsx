
import React, { useState } from 'react';
import { SHOP_INFO } from '../constants';

interface DocContent {
  title: string;
  description: string;
  steps: string[];
  notes?: string;
}

const DOCUMENTATION: Record<string, DocContent> = {
  "Staff Master OS Logic": {
    title: "Staff Master OS Logic (v1.0)",
    description: "Architectural overview of the biometric attendance and payroll pipeline.",
    steps: [
      "Neural Vision: Android front camera identifies staff via biometric embeddings.",
      "Attendance Logic: First daily detection logs In-Time; subsequent detection updates Out-Time.",
      "Automatic Accruals: Working hours and overtime (1.5x) are derived from verified clock cycles.",
      "HMRC Compliance: Payroll module applies 24/25 UK tax brackets and NI deductions automatically.",
      "Data Integrity: All personnel data is strictly managed within the Staff_Master directory."
    ],
    notes: "System strictly adheres to UK HMRC RTI and GDPR biometric privacy standards."
  },
  "End of Day Audit Protocol": {
    title: "End of Day (EOD) Audit Protocol",
    description: "Standard operating procedure for reconciling daily sales and verifying terminal integrity before close of business.",
    steps: [
      "Navigate to the Master Ledger to verify total captured sales.",
      "Count physical cash in till and compare against 'Cash in Hand' ledger balance.",
      "Verify card terminal settlement report against POS card transaction total.",
      "Generate the Daily Sales CSV export for external accounting backup.",
      "Review high-variance stock items and log adjustments if necessary."
    ],
    notes: "Critical: Any variance exceeding ₹5.00 must be reported to the Shop Manager immediately."
  },
  "HMRC Payroll Submission Guide": {
    title: "HMRC Payroll & RTI Submission Guide",
    description: "Guidelines for ensuring UK payroll compliance and Real Time Information (RTI) accuracy.",
    steps: [
      "Ensure all new staff have valid NI numbers and correct Tax Codes (default 1257L).",
      "Verify 'Right to Work' documentation is uploaded to the staff registry.",
      "Run the Payroll Cycle at the end of each calendar month.",
      "Deduct PAYE Tax and National Insurance (EE/ER) based on current tax year thresholds.",
      "Provide digital payslips to all personnel via the Staff Management module."
    ],
    notes: "RTI submissions must reach HMRC on or before the pay date."
  },
  "Inventory CSV Import Standards": {
    title: "Inventory CSV Import Standards",
    description: "Technical requirements for bulk asset ingestion via the Inventory module.",
    steps: [
      "Download the 'Standard Inventory Export' to use as a template.",
      "Ensure the following headers are present: ID, SKU, Barcode, Name, Brand, Category, Stock, Min Stock, Price, Cost, VAT, Origin, Location, SupplierID.",
      "VAT Rates must be numerical: 0, 5, or 20.",
      "Barcodes must be in EAN-13 or UPC format without leading spaces.",
      "Save the file as a UTF-8 encoded CSV before importing."
    ],
    notes: "Duplicate IDs in the CSV will overwrite existing records in the database."
  }
};

const HelpSupportView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  if (activeDoc && DOCUMENTATION[activeDoc]) {
    const doc = DOCUMENTATION[activeDoc];
    return (
      <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-20">
        <div className="bg-surface-elevated p-12 rounded-[3rem] border border-surface-highlight shadow-xl space-y-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-8">
            <div>
              <button
                onClick={() => setActiveDoc(null)}
                className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-800 transition-colors mb-4 block"
              >
                ← Back to Support Index
              </button>
              <h3 className="text-3xl font-black text-ink-base uppercase tracking-tight">{doc.title}</h3>
            </div>
            <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
              Standard Protocol
            </div>
          </div>

          <div className="space-y-10">
            <section className="space-y-4">
              <p className="text-lg text-ink-muted font-medium leading-relaxed italic border-l-4 border-primary-500 pl-6">
                "{doc.description}"
              </p>
            </section>

            <section className="space-y-6">
              <h4 className="text-[11px] font-black text-ink-base uppercase tracking-[0.3em]">Operational Steps</h4>
              <div className="space-y-4">
                {doc.steps.map((step, i) => (
                  <div key={i} className="flex gap-6 items-start p-6 bg-surface-elevated rounded-2xl border border-slate-100 group hover:border-primary-200 transition-colors">
                    <span className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg">
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold text-ink-base uppercase leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            {doc.notes && (
              <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Compliance Notice</p>
                <p className="text-sm font-bold text-rose-900 uppercase">{doc.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-[#0F172A] p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 scale-150 text-8xl">❓</div>
        <div className="relative z-10">
          <h3 className="text-4xl font-black uppercase tracking-tighter">Help & Support Center</h3>
          <p className="text-primary-300 text-[11px] font-black uppercase tracking-[0.4em] mt-4">Enterprise Support Protocol • Terminal OS v5.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-elevated p-10 rounded-[2.5rem] border border-surface-highlight shadow-sm space-y-6">
          <h4 className="text-lg font-black text-ink-base uppercase tracking-tight">Technical Assistance</h4>
          <p className="text-sm text-ink-muted leading-relaxed font-medium">
            For critical system failures, terminal lockouts, or database synchronization issues, please contact the EngLabs Support Team.
          </p>
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-4 bg-surface-elevated p-4 rounded-2xl border border-slate-100">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Line</p>
                <p className="text-sm font-black text-ink-base">{SHOP_INFO.whatsapp}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-elevated p-10 rounded-[2.5rem] border border-surface-highlight shadow-sm space-y-6">
          <h4 className="text-lg font-black text-ink-base uppercase tracking-tight">System Documentation</h4>
          <div className="space-y-4">
            {Object.keys(DOCUMENTATION).map((docTitle, i) => (
              <div
                key={i}
                onClick={() => setActiveDoc(docTitle)}
                className="flex justify-between items-center p-4 bg-surface-elevated rounded-2xl group cursor-pointer hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-100"
              >
                <span className="text-[11px] font-black text-ink-base uppercase group-hover:text-primary-600">{docTitle}</span>
                <span className="text-slate-300 group-hover:text-primary-400">→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-primary-50 p-10 rounded-[2.5rem] border border-primary-100 text-center space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-400">Shop Identity</p>
        <p className="text-sm font-black text-primary-900 uppercase">{SHOP_INFO.name}</p>
        <p className="text-[10px] font-bold text-primary-600/60 uppercase">{SHOP_INFO.address}</p>
      </div>
    </div>
  );
};

export default HelpSupportView;
