/**
 * ENGLABS Inventory Management - Main Application Entry Point
 * 
 * This is the root component that handles:
 * 1. Authentication State (Firebase) - Manages User Login/Logout
 * 2. Data Synchronization (Firestore) - Real-time listeners for Inventory, Transactions, Ledger
 * 3. Routing/Navigation - Switching between Dashboard, Inventory, Staff, and Financial views
 * 4. Context Provision - Passes global state down to child components
 * 
 * @module App
 * @author Antigravity
 * @version 1.2.0 (Production)
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { subscribeToInventory, subscribeToTransactions, subscribeToStaff, subscribeToAttendance, subscribeToLedger, subscribeToSuppliers, subscribeToBills, subscribeToExpenses, subscribeToPurchases, subscribeToSalaries, markNotificationRead, subscribeToNotifications, addLedgerEntry, addAttendanceRecord, updateAttendanceRecord } from './lib/firestore';
import { ViewType, Bill, Expense, Purchase, SalaryRecord, InventoryItem, StaffMember, AttendanceRecord, Supplier, UserRole, AuditEntry, Transaction, LedgerEntry, SystemSnapshot, Notification, ShopTask } from './types';
import { INITIAL_STAFF, INITIAL_SUPPLIERS, INITIAL_CATEGORIES } from './constants';
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const InventoryView = React.lazy(() => import('./components/InventoryView'));
const HelpSupportView = React.lazy(() => import('./components/HelpSupportView'));
const SuppliersView = React.lazy(() => import('./components/SuppliersView'));
const PurchasesView = React.lazy(() => import('./components/PurchasesView'));
const ReportsView = React.lazy(() => import('./components/ReportsView'));
import SplashScreen from './components/SplashScreen'; // Keep direct for initial load
import { subscribeToTasks } from './lib/firestore';

const AuthView = React.lazy(() => import('./components/AuthView'));
import { NavigationSidebar } from './components/NavigationSidebar';
import { Menu, Bell, LogOut, Search, ShoppingCart, Package } from 'lucide-react';
import { cn } from './lib/utils';
import { AccessTerminal } from './components/AccessTerminal'; // Keep AccessTerminal synchronous for security lock
import { UserProfileMenu } from './components/UserProfileMenu';

const TERMINAL_ID = "ENGLABS-IND-01";



import { EnvironmentBanner } from './components/EnvironmentBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { ThemeToggle } from './components/ThemeToggle';
import { trackPerformance } from './lib/monitoring';
import { SystemHealthView } from './components/SystemHealthView';
import { BackgroundAgents } from './lib/backgroundAgents';
import { TeslaInventoryOS } from './components/TeslaInventoryOS';

interface AppProps {
  initialShowSplash?: boolean;
  initialLocked?: boolean;
}

const App: React.FC<AppProps> = ({ initialShowSplash = true, initialLocked }) => {
  const [showSplash, setShowSplash] = useState(initialShowSplash);

  // REAL AUTH STATE
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // BYPASS LOCK IN TEST MODE: Check URL param or testing flags
  const isTest = useMemo(() => {
    return typeof window !== 'undefined' && window.location?.search?.includes('test=true');
  }, []);

  const [isLocked, setIsLocked] = useState(initialLocked ?? false); // Streamlined: Default to Unlocked after PIN login

  // DEFAULT SAFE (Least Privilege - 'Cashier')
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Cashier');
  const [currentStaffId, setCurrentStaffId] = useState<string>('');
  const [forceEditStaffId, setForceEditStaffId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // SHARED SHOP ID (Environment variable or fallback)
  const shopId = useMemo(() => import.meta.env.VITE_USER_ID || 'englabs-enterprise', []);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [history, setHistory] = useState<SystemSnapshot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<ShopTask[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // RBAC LOGIC: Determine Role dynamically
  useEffect(() => {
    if (!user) return;

    // GUARD: If a PIN session is active (currentStaffId set), prioritize it.
    if (currentStaffId) return;

    // 1. Check Personal Storage for PIN Login Identity (Primary)
    const storedIdentity = localStorage.getItem('englabs_identity');
    if (storedIdentity && staff.length > 0) {
      const matched = staff.find(s => s.id === storedIdentity);
      if (matched) {
        setCurrentUserRole(matched.role);
        setCurrentStaffId(matched.id);
        console.log('✅ [RBAC] PIN Login Identity Verified:', matched.name, '(', matched.role, ')');
        return;
      }
    }

    // 2. Check Staff List by Email (Legacy/MFA Identity)
    if (staff.length > 0 && user?.email) {
      const authEmail = user!.email!.toLowerCase();
      const matched = staff.find(s => s.email?.toLowerCase() === authEmail);
      
      if (matched) {
        setCurrentUserRole(matched.role);
        setCurrentStaffId(matched.id);
        console.log('✅ [RBAC] Email Identity Verified:', matched.role);
        return;
      }
    }

    // 3. Fallback: If no match found, limit to Cashier (Least Privilege)
    console.log('⚠️ [RBAC] Unrecognized Identity. Initializing as Guest/Cashier.');
    setCurrentUserRole('Cashier');
  }, [user, staff, currentStaffId]);

  const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';

  useEffect(() => {
    // Benchmark bootstrap performance
    const startTime = performance.now();

    if (isTest) {
      console.log("ℹ️ [App] Test Mode Detected. Background Agents Suspended.");
      return;
    }

    console.log(`[App] Bootstrapping with Shop: ${shopId}, DB: ${dbId}`);
    BackgroundAgents.start(shopId);

    // Log performance after start
    trackPerformance(performance.now() - startTime, 'app-bootstrap');

    return () => BackgroundAgents.stop();
  }, [shopId, dbId, isTest]);

  useEffect(() => {
    BackgroundAgents.updateState(inventory, transactions);
  }, [inventory, transactions, staff, user]);

  // Auth Listener
  useEffect(() => {
    let unsubscribeData: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setAuthChecked(true);
        // ALWAYS use the Shared Shop ID from useMemo scope
        console.log(`[App] Syncing data for Shared Shop ID: ${shopId}`);
        unsubscribeData = await syncInitialData(shopId);
      } else {
        // No user? Auto-login anonymously to support Kiosk/Terminal State
        console.log('[App] No user session. Initiating Kiosk Anonymous Login...');
        import('firebase/auth').then(({ signInAnonymously }) => {
          signInAnonymously(auth).catch(err => {
            console.error("🔥 Anonymous Login Failed:", err);
            setAuthChecked(true); // Release block anyway to show UI (likely error state)
          });
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeData) unsubscribeData();
    };
  }, []);

  // Simple Hash Listener for Automation/Testability
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validViews: ViewType[] = ['dashboard', 'inventory', 'vendors', 'purchases', 'reports', 'stock', 'documents', 'support'];

      if (validViews.includes(hash as any)) {
        setActiveView(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const syncInitialData = async (uid: string) => {
    const startTime = performance.now();
    let collectionsSynced = 0;
    const TOTAL_COLLECTIONS = 11;

    const checkSyncComplete = () => {
      collectionsSynced++;
      if (collectionsSynced === TOTAL_COLLECTIONS) {
        const duration = performance.now() - startTime;
        trackPerformance(duration, 'InitialDataSync');
        console.log(`[App] Initial Data Sync Complete in ${duration.toFixed(0)}ms`);
      }
    };

    const unsubInventory = subscribeToInventory(uid, (items) => { setInventory(items); checkSyncComplete(); });
    const unsubTransactions = subscribeToTransactions(uid, (txs) => { setTransactions(txs); checkSyncComplete(); });

    const unsubStaff = subscribeToStaff(uid, (items) => { setStaff(items); checkSyncComplete(); });
    const unsubAttendance = subscribeToAttendance(uid, (items) => { setAttendance(items); checkSyncComplete(); });
    const unsubLedger = subscribeToLedger(uid, (items) => { setLedgerEntries(items); checkSyncComplete(); });
    const unsubSuppliers = subscribeToSuppliers(uid, (items) => { setSuppliers(items); checkSyncComplete(); });
    const unsubBills = subscribeToBills(uid, (items) => { setBills(items); checkSyncComplete(); });
    const unsubPurchases = subscribeToPurchases(uid, (items) => { setPurchases(items); checkSyncComplete(); });
    const unsubExpenses = subscribeToExpenses(uid, (items) => { setExpenses(items); checkSyncComplete(); });
    const unsubSalaries = subscribeToSalaries(uid, (records) => { setSalaries(records); checkSyncComplete(); });
    const unsubTasks = subscribeToTasks(uid, (items) => { setTasks(items); checkSyncComplete(); });

    return () => {
      unsubInventory();
      unsubTransactions();
      unsubStaff();
      unsubAttendance();
      unsubLedger();
      unsubSuppliers();
      unsubBills();
      unsubPurchases();
      unsubExpenses();
      unsubSalaries();
      unsubTasks();
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Notifications Subscription
  useEffect(() => {
    if (!user) return;
    const userId = shopId;

    const unsubscribe = subscribeToNotifications(userId, (all) => {
      const mine = all.filter(n => n.recipientId === currentStaffId);
      setNotifications(mine);
    });

    return () => {
      unsubscribe();
    };
  }, [user, currentStaffId]);

  const handleNotificationClick = async (n: Notification) => {
    if (!user) return;
    const userId = shopId;

    if (!n.read) {
      const { markNotificationRead } = await import('./lib/firestore');
      await markNotificationRead(userId, n.id);
    }
    setShowNotifications(false);

    // Navigation Logic based on notification type/link
    if (n.link) {
      if (n.link.startsWith('/staff')) setActiveView('dashboard');
      else if (n.link.startsWith('/inventory')) setActiveView('inventory');
      else if (n.link.startsWith('/sales')) setActiveView('dashboard');
      else if (n.link.startsWith('/dashboard')) setActiveView('dashboard');
    }
  };

  const activeStaffName = useMemo(() => {
    // If user is Owner/Admin, they might not be in the staff list under that specific ID
    const found = staff.find(s => s.id === currentStaffId);
    return found ? found.name : "Shop Owner";
  }, [staff, currentStaffId]);

  const logAction = useCallback(async (action: string, module: ViewType, details: string, severity: AuditEntry['severity'] = 'Info') => {
    // 1. Local State Update (Instant Feedback)
    setAuditLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action, userRole: currentUserRole, staffName: activeStaffName, terminalId: TERMINAL_ID, module, details, severity
    }, ...prev].slice(0, 1000));

    // 2. Persist to Firestore Audit Log (Compliance)
    if (user) {
      const { logAudit } = await import('./lib/firestore');
      const userId = shopId;
      // Map legacy severity/action to new AuditAction types if needed, or use generic
      // For now, we cast reasonably or use a generic 'SYSTEM_CONFIG_CHANGE' if unknown
      // But better to just log it with the generic payload

      await logAudit(
        userId,
        'SYSTEM_CONFIG_CHANGE', // Default bucket for generic logs
        currentStaffId || 'system',
        currentUserRole as any,
        { action, module, details, severity }
      );
    }
  }, [currentUserRole, activeStaffName, user, currentStaffId]);

  const postToLedger = useCallback(async (entries: Omit<LedgerEntry, 'id' | 'timestamp'>[]) => {
    if (!user) return;
    const { addLedgerEntry } = await import('./lib/firestore');
    const timestamp = new Date().toISOString();
    const userId = shopId;

    for (const entry of entries) {
      await addLedgerEntry(userId, { ...entry, id: crypto.randomUUID(), timestamp });
    }
  }, [user]);

  if (!authChecked) return null; // Wait for Firebase to check session
  if (!user) return <React.Suspense fallback={<div className="h-screen w-full bg-neutral-900" />}><AuthView /></React.Suspense>;

  if (showSplash && !isTest) {
    return <SplashScreen />;
  }

  const renderContent = () => {
    return (
        <React.Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" /></div>}>
          {(() => {
            switch (activeView) {
              case 'dashboard': return <Dashboard userId={shopId} transactions={transactions} inventory={inventory} role={currentUserRole} staff={staff} attendance={attendance} bills={bills} />;
              case 'inventory': return <InventoryView userId={shopId} inventory={inventory} setInventory={setInventory} categories={INITIAL_CATEGORIES} setCategories={() => { }} suppliers={suppliers} userRole={currentUserRole} logAction={logAction} postToLedger={postToLedger} />;
              case 'vendors': return <SuppliersView userId={shopId} suppliers={suppliers} setSuppliers={setSuppliers} bills={bills} setBills={setBills} logAction={logAction} />;
              case 'purchases': return <PurchasesView userId={shopId} purchases={purchases} setPurchases={setPurchases} suppliers={suppliers} setSuppliers={setSuppliers} logAction={logAction} inventory={inventory} setInventory={setInventory} bills={bills} setBills={setBills} activeStaffName={activeStaffName} postToLedger={postToLedger} transactions={transactions} />;
              case 'reports': return <ReportsView transactions={transactions} refunds={[]} inventory={inventory} purchases={purchases} expenses={expenses} salaries={salaries} bills={bills} />;
              case 'support': return <HelpSupportView />;
              case 'stock':
              case 'documents':
                return <div className="text-neutral-500 font-bold p-10 mx-auto text-center mt-20">Coming Soon: {activeView.toUpperCase()}</div>;
              default: return <div className="text-neutral-500 font-bold p-10 mx-auto text-center mt-20">Under maintenance. Core functionality only is active.</div>;
            }
          })()}
        </React.Suspense>
    );
  };

  const handleAuthenticate = async (staffId: string, method: string, proof?: string, intent?: 'UNLOCK' | 'CLOCK_OUT') => {
    const matched = staff.find(s => s.id === staffId);
    if (!matched) throw new Error("Staff Member Not Found");

    // 1. Update App Session
    setCurrentStaffId(matched.id);
    setCurrentUserRole(matched.role);
    localStorage.setItem('englabs_identity', matched.id);

    // 2. Attendance/Shift Logic
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (intent === 'CLOCK_OUT') {
      const openShift = attendance.find(a => a.staffId === staffId && !a.clockOut && a.date === today);
      if (openShift) {
        await updateAttendanceRecord(shopId, openShift.id, {
          clockOut: nowTime,
          status: 'Present'
        });
        alert(`Goodbye ${matched.name}! Shift ended at ${nowTime}`);
      }
    }
    // No Auto-Clock-In on UNLOCK intent as per Mobile E2E Scenario 1 stability standards. 
    // Shift management continues through specific CLOCK_OUT intent or intra-app staff controls.

    setIsLocked(false);
    if (matched.role === 'Cashier') setActiveView('inventory');
    logAction('Authentication', 'dashboard', `${matched.name} Verified via ${method}`, 'Info');
  };


  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-emerald-950/20 font-sans overflow-hidden text-neutral-900 dark:text-neutral-100 selection:bg-emerald-500 selection:text-white">
      <EnvironmentBanner />
      <NavigationSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        userRole={currentUserRole}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLock={() => setIsLocked(true)}
      />

      <main className="flex-1 lg:pl-64 relative flex flex-col min-h-0 overflow-hidden transition-all duration-300">
        {/* Topbar - Industrial Premium Styling */}
        <header className="h-16 border-b border-neutral-200 dark:border-white/5 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-12 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-6 flex-1">
            {/* Mobile Menu Trigger */}
            <button
              data-testid="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-all"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Interface */}
            <div className="hidden md:flex items-center max-w-lg w-full relative group">
              <Search className="absolute left-4 w-4 h-4 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Audit Engine Search..."
                className="w-full bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold tracking-tight outline-none transition-all placeholder:text-neutral-400 placeholder:uppercase placeholder:tracking-widest"
              />
              <div className="absolute right-4 flex items-center gap-1.5 opacity-40">
                <kbd className="px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-white/10 text-[9px] font-black text-neutral-500 bg-white dark:bg-neutral-800">CMD</kbd>
                <kbd className="px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-white/10 text-[9px] font-black text-neutral-500 bg-white dark:bg-neutral-800">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            {/* Quick Actions (Desktop) */}
            <div className="hidden xl:flex items-center gap-2 pr-6 border-r border-neutral-200 dark:border-white/5">
              <button className="p-2.5 text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all" title="Live Transactions">
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button className="p-2.5 text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all" title="Master Inventory">
                <Package className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
               <ThemeToggle />

               {/* Notification Bell */}
               <div className="relative">
                 <button
                   aria-label="Notifications"
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-all relative group"
                 >
                   <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm animate-pulse"></span>
                   )}
                 </button>

                 {/* Enhanced Dashboard Notifications */}
                 {showNotifications && (
                   <div className="fixed inset-x-4 top-20 lg:absolute lg:inset-auto lg:top-14 lg:right-0 lg:w-[400px] bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                     <div className="p-6 border-b border-neutral-100 dark:border-white/5 font-black text-neutral-900 dark:text-white flex justify-between items-center bg-neutral-50/50 dark:bg-white/5">
                       <span className="text-[10px] uppercase tracking-[.25em]">Critical Feed</span>
                       <span className="text-[9px] px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full uppercase tracking-widest font-black">
                         {notifications.filter(n => !n.read).length} PENDING
                       </span>
                     </div>
                     <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                       {notifications.length === 0 ? (
                         <div className="p-16 text-center">
                           <div className="w-16 h-16 bg-neutral-50 dark:bg-white/2 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100 dark:border-white/5">
                             <Bell className="w-6 h-6 text-neutral-200" />
                           </div>
                           <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">System Clear</p>
                         </div>
                       ) : (
                         notifications.map(n => (
                           <div
                             key={n.id}
                             className={cn(
                               "p-6 border-b border-neutral-50 dark:border-white/2 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer transition-all relative group",
                               !n.read && "bg-emerald-50/20 dark:bg-emerald-500/5"
                             )}
                             onClick={() => handleNotificationClick(n)}
                           >
                             {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                             <div className="flex justify-between items-start gap-4">
                               <div className="space-y-1">
                                 <h5 className={cn("text-xs font-black uppercase tracking-tight", !n.read ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-500')}>{n.title}</h5>
                                 <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium line-clamp-2">{n.message}</p>
                                 <div className="flex items-center gap-2 mt-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
                                   <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                     <div className="p-4 bg-neutral-50 dark:bg-white/5 border-t border-neutral-100 dark:border-white/5">
                       <button className="w-full py-3 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[.2em] hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all">Audit Center</button>
                     </div>
                   </div>
                 )}
               </div>

               {/* User Profile Menu */}
               <div className="flex items-center gap-4 pl-4 border-l border-neutral-200 dark:border-white/5">
                 <div className="text-right hidden xl:block">
                   <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">{currentUserRole}</p>
                   <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter italic">{activeStaffName.split(' ')[0]}</p>
                 </div>
                 <UserProfileMenu
                   currentStaffId={currentStaffId}
                   onViewProfile={() => setActiveView('dashboard')}
                   onSettings={() => setActiveView('support')}
                   onChangePassword={() => alert('Secure terminal change initiated.')}
                   onProfileChange={() => {
                     setForceEditStaffId(currentStaffId);
                     setActiveView('dashboard');
                   }}
                 />
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 scroll-smooth bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/30 via-transparent to-transparent">
          <div data-testid="staff-sync-count" className="hidden">{staff.length}</div>
          <div data-testid="attendance-sync-count" className="hidden">{attendance.length}</div>
          <div className="max-w-[1800px] mx-auto space-y-8 pb-32">
            {renderContent()}
          </div>
        </div >


        {/* AI Assistants Overlay */}
        <div className="fixed bottom-6 right-6 z-30 flex gap-4">
          {/* Placeholder for future chat bot triggers */}
        </div>

        {/* Lock Screen Overlay */}
        {isLocked && (
          <AccessTerminal 
            isOpen={isLocked} 
            onClose={() => setIsLocked(false)} 
            staff={staff} 
            onAuthenticate={handleAuthenticate} 
            userRole={currentUserRole}
            isLockMode={true}
          />
        )}

      </main>

      {/* Mobile Floating Menu Trigger (Bottom Left) */}
      {!isLocked && !isMobileMenuOpen && (
          <button
            data-testid="fab-menu-button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-6 z-[120] lg:hidden bg-primary-600 text-white w-14 h-14 rounded-full shadow-2xl border border-white/10 flex items-center justify-center active:scale-95 transition-all"
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )
      }
      <OfflineBanner />
    </div >
  );
};

export default App;
