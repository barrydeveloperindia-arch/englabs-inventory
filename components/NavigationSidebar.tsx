import React, { useState, useEffect } from 'react';
import { ViewType, UserRole } from '../types';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Landmark,
    FileText,
    Truck,
    LogOut,
    Bot,
    Info,
    HelpCircle,
    LineChart,
    ChevronLeft,
    ChevronRight,
    Settings,
    Eye,
    Briefcase,
    Lightbulb,
    FlaskConical,
    Activity,
    Camera,
    Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BrandLogo } from './Logo';

interface NavigationSidebarProps {
    activeView: ViewType;
    setActiveView: (view: ViewType) => void;
    userRole: UserRole;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    onLock: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    roleLimit?: UserRole[];
}

interface NavGroup {
    category: string;
    items: MenuItem[];
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
    activeView,
    setActiveView,
    userRole,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    onLock
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navGroups: NavGroup[] = [
        {
            category: 'Core System',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'inventory', label: 'Inventory', icon: Package },
                { id: 'vendors', label: 'Vendors', icon: Truck },
                { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
                { id: 'stock', label: 'Stock Ops', icon: Activity },
                { id: 'reports', label: 'Reports', icon: LineChart },
                { id: 'documents', label: 'Documents', icon: FileText },
            ]
        }
    ];

    const footerItems = [
        { id: 'support', label: 'Support', icon: HelpCircle },
    ];

    const [isShort, setIsShort] = useState(window.innerHeight < 500);

    // Responsive Handling
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsCollapsed(false);
            setIsShort(window.innerHeight < 500);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderNavItem = (item: MenuItem) => {
        if (item.roleLimit && !item.roleLimit.includes(userRole)) return null;
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
            <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => {
                    setActiveView(item.id as ViewType);
                    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                }}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-lg transition-all duration-200 outline-none relative group",
                    isActive
                        ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold shadow-sm ring-1 ring-primary-500/20"
                        : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5",
                    isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : ''}
                aria-current={isActive ? 'page' : undefined}
            >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-600 dark:text-primary-400" : "text-neutral-400 group-hover:text-neutral-600")} />
                {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                {isActive && !isCollapsed && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                )}
            </button>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300",
                    isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 bottom-0 bg-emerald-950 text-white border-r border-white/5 z-[110] transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Brand Header */}
                {!isShort && (
                    <div className={cn("p-8 flex flex-col items-center gap-4 shrink-0 transition-all", isCollapsed && "justify-center px-4")}>
                        <div className={cn(
                             "flex items-center justify-center bg-white rounded-2xl shadow-xl shadow-black/20 shrink-0 transition-all duration-500",
                             isCollapsed ? "w-12 h-12" : "w-16 h-16"
                        )}>
                            <BrandLogo size={isCollapsed ? "sm" : "md"} className="scale-110" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col items-center text-center">
                                <span className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                                    ENGLABS
                                </span>
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[.4em] mt-1.5 opacity-80">
                                    Engineering Portal
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
                    {navGroups
                        .map(group => ({
                            ...group,
                            allowedItems: group.items.filter(item => !item.roleLimit || item.roleLimit.includes(userRole))
                        }))
                        .filter(group => group.allowedItems.length > 0)
                        .map((group, idx) => (
                            <div key={group.category} className={cn("mb-8", idx === 0 && "mt-2")}>
                                {!isCollapsed && (
                                    <h3 className="px-3 mb-3 text-[10px] font-black text-emerald-500/50 uppercase tracking-[.25em]">
                                        {group.category}
                                    </h3>
                                )}
                                {group.allowedItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveView(item.id as ViewType);
                                                if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 my-1 rounded-xl transition-all duration-300 group relative",
                                                isActive
                                                    ? "bg-emerald-600/20 text-white font-bold ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-900/40"
                                                    : "text-emerald-100/60 hover:text-white hover:bg-white/5",
                                                isCollapsed && "justify-center px-0 items-center"
                                            )}
                                        >
                                            <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-emerald-400" : "text-emerald-500/40 group-hover:text-emerald-400")} />
                                            {!isCollapsed && <span className="text-[13px] tracking-tight">{item.label}</span>}
                                            {isActive && !isCollapsed && (
                                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52,211,153)]"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
                    {/* Role / Context */}
                    {!isCollapsed && (
                        <div className="px-3 py-3 mb-2 rounded-xl bg-emerald-900/30 border border-white/5">
                            <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest leading-none mb-1.5">Context</p>
                            <p className="text-[11px] font-bold text-white tracking-wide uppercase">{userRole}</p>
                        </div>
                    )}

                    {footerItems.map(item => {
                         const Icon = item.icon;
                         const isActive = activeView === item.id;
                         return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id as ViewType)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                                    isActive ? "bg-white/10 text-white" : "text-emerald-100/40 hover:text-emerald-100 hover:bg-white/5",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>}
                            </button>
                         );
                    })}

                    <button
                        onClick={onLock}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 mt-4 rounded-xl text-rose-400 hover:bg-rose-500/10 font-black transition-all text-[11px] uppercase tracking-[.2em]",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>End Session</span>}
                    </button>
                </div>
            </aside>

        </>
    );
};
