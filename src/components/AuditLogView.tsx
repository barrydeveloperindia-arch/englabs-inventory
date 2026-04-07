import React, { useEffect, useState } from 'react';
import { FileText, Shield, User, Clock, AlertTriangle, Monitor, Filter, Download } from 'lucide-react';
import { subscribeToAuditLogs } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export function AuditLogView({ userId }: { userId: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [filterModule, setFilterModule] = useState<string>('All');
    const [filterSeverity, setFilterSeverity] = useState<string>('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!userId) return;

        const unsub = subscribeToAuditLogs(userId, (data) => {
            setLogs(data);
        });
        return () => unsub();
    }, [userId]);

    const filteredLogs = logs.filter(l => {
        if (filterModule !== 'All' && l.module !== filterModule) return false;
        if (filterSeverity !== 'All' && l.severity !== filterSeverity) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                l.action.toLowerCase().includes(q) ||
                l.details?.details?.toLowerCase().includes(q) ||
                l.staffName?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const exportLogs = () => {
        const data = filteredLogs.map(l => ({
            Time: new Date(l.timestamp?.seconds * 1000 || l.timestamp).toLocaleString(),
            Action: l.action,
            Module: l.module,
            Severity: l.severity,
            User: l.staffName,
            Role: l.userRole,
            Details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details)
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
        XLSX.writeFile(wb, `Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary-600" />
                        Compliance Audit Trail
                    </h2>
                    <p className="text-slate-400 font-bold mt-1">Immutable record of all system actions.</p>
                </div>
                <button
                    onClick={exportLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 flex-1 min-w-[200px]">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        className="bg-transparent font-bold text-slate-700 outline-none w-full text-sm"
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                    >
                        <option value="All">All Modules</option>
                        <option value="inventory">Inventory</option>
                        <option value="sales">Sales</option>
                        <option value="staff">Staff</option>
                        <option value="financials">Financials</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 flex-1 min-w-[200px]">
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                    <select
                        className="bg-transparent font-bold text-slate-700 outline-none w-full text-sm"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                    >
                        <option value="All">All Severities</option>
                        <option value="Info">Info</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[300px]">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg font-bold outline-none focus:ring-2 focus:ring-primary-500/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filteredLogs.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="font-bold">No logs found matching criteria</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Time</th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Acted By</th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Module</th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-primary-50/30 transition-colors">
                                        <td className="p-4 w-[180px]">
                                            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs font-bold">
                                                <Clock className="w-3 h-3" />
                                                {log.timestamp?.seconds
                                                    ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                                                    : new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{log.staffName || 'System'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{log.userRole}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 w-[200px]">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                                                log.severity === 'Critical' ? "bg-rose-100 text-rose-700" :
                                                    log.severity === 'Warning' ? "bg-amber-100 text-amber-700" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 w-[120px]">
                                            <span className="text-xs font-bold text-slate-500 capitalize flex items-center gap-1">
                                                <Monitor className="w-3 h-3" />
                                                {log.module}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                {typeof log.details === 'string' ? log.details :
                                                    (log.details?.details || JSON.stringify(log.details))}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
