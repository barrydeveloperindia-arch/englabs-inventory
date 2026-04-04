
import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    title?: string;
}

interface NotificationContextType {
    showToast: (message: string, type: ToastType, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType, title?: string) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type, title }]);
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 max-w-md w-full">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-rose-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-primary-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-100',
        error: 'bg-rose-50 border-rose-100',
        warning: 'bg-amber-50 border-amber-100',
        info: 'bg-primary-50 border-primary-100',
    };

    return (
        <div
            className={cn(
                "flex items-start gap-4 p-4 rounded-2xl border shadow-xl animate-in slide-in-from-right-10 duration-300",
                bgColors[toast.type]
            )}
        >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                {toast.title && <h4 className="text-sm font-black uppercase tracking-tight text-ink-base mb-1">{toast.title}</h4>}
                <p className="text-xs font-bold text-slate-600 leading-relaxed">{toast.message}</p>
            </div>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-slate-400" />
            </button>
        </div>
    );
};
