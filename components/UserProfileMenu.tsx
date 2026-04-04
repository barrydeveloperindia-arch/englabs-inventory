import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Key, LogOut, Shield, ChevronRight, Mail, Fingerprint, Calendar, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUserProfile } from '../hooks/useUserProfile';

interface UserProfileMenuProps {
    currentStaffId: string | null;
    onViewProfile?: () => void;
    onSettings?: () => void;
    onChangePassword?: () => void;
    onProfileChange?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
    currentStaffId,
    onViewProfile,
    onSettings,
    onChangePassword,
    onProfileChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: profile, loading, error, actions } = useUserProfile(currentStaffId);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    const menuVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring' as const, damping: 20, stiffness: 300 }
        },
        exit: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: { duration: 0.2 }
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all relative overflow-hidden group select-none shadow-sm",
                    isOpen ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-900" : "hover:scale-105 active:scale-95",
                    "bg-gradient-to-br from-primary-600 to-primary-700 text-white border-t border-white/20"
                )}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="User Profile Menu"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {profile?.photo ? (
                    <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="relative z-10">{initials}</span>
                )}
                {/* Active Status Dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden z-50 origin-top-right"
                        role="menu"
                        aria-orientation="vertical"
                    >
                        {loading && !profile ? (
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-neutral-100 dark:bg-white/5 rounded-full animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="w-32 h-4 bg-neutral-100 dark:bg-white/5 rounded animate-pulse" />
                                        <div className="w-24 h-3 bg-neutral-100 dark:bg-white/5 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-white/5">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-full h-10 bg-neutral-100 dark:bg-white/5 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center">
                                <p className="text-sm text-rose-500 font-bold">{error}</p>
                                <button
                                    onClick={() => actions.refetch()}
                                    className="mt-2 text-xs font-black text-primary-600 uppercase tracking-widest hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* User Info Header */}
                                <div className="p-6 bg-neutral-50/50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-xl shadow-lg border-t border-white/20 overflow-hidden">
                                            {profile?.photo ? <img src={profile.photo} alt="" className="w-full h-full object-cover" /> : initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-base font-black text-neutral-900 dark:text-white truncate">{profile?.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{profile?.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                            <Mail className="w-3.5 h-3.5 opacity-60" />
                                            <span className="truncate">{profile?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                            <Fingerprint className="w-3.5 h-3.5 opacity-60" />
                                            <span className="font-mono">ID: {profile?.employeeId}</span>
                                        </div>
                                        {profile?.department && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                                <Shield className="w-3.5 h-3.5 opacity-60" />
                                                <span>{profile.department}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider pt-1">
                                            <Calendar className="w-3 h-3 opacity-60" />
                                            <span>Last Activity: Just Now</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action List */}
                                <div className="p-2">
                                    <MenuButton
                                        icon={Pencil}
                                        label="Profile Change"
                                        onClick={() => { setIsOpen(false); onProfileChange?.(); }}
                                    />
                                    <MenuButton
                                        icon={User}
                                        label="View Full Profile"
                                        onClick={() => { setIsOpen(false); onViewProfile?.(); }}
                                    />
                                    <MenuButton
                                        icon={Settings}
                                        label="Account Settings"
                                        onClick={() => { setIsOpen(false); onSettings?.(); }}
                                    />
                                    <MenuButton
                                        icon={Key}
                                        label="Change Password"
                                        onClick={() => { setIsOpen(false); onChangePassword?.(); }}
                                    />

                                    <div className="my-2 border-t border-neutral-100 dark:border-white/5" />

                                    <button
                                        onClick={actions.logout}
                                        className="w-full flex items-center justify-between p-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold">Sign Out</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </button>
                                </div>

                                {/* Footer Insight */}
                                <div className="px-6 py-3 bg-neutral-50 dark:bg-white/5 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-center">
                                    UK Production Environment
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MenuButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition-all group"
    >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-500/20 group-hover:text-primary-600 transition-colors">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </button>
);
