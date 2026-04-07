
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { read, utils, writeFile } from 'xlsx';
import { IDCard } from './IDCard';
import { AccessTerminal } from './AccessTerminal';
import { FaceAuth } from './FaceAuth';

import { RegistersView } from './RegistersView';
import { StaffMember, AttendanceRecord, ViewType, UserRole, LeaveRequest, LeaveType, LeaveStatus, RotaShift, RotaPreference, ShopTask, InventoryItem, SalaryRecord, ContractType } from '../types';

import { auth, db } from '../lib/firebase';
import { doc, setDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Trash2, Plus, Calendar, Settings, Clock, UserCheck, Shield, ShieldOff, Lock, ChevronLeft, ChevronRight, Download, Upload, Filter, Search, Award, Briefcase, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, DollarSign, PieChart, BarChart3, TrendingUp, Users, Edit2, MoreVertical, Mail, Phone, Pencil, IdCard as IdCardIcon, ZoomIn, ZoomOut, RotateCcw, Maximize, Move, ArrowDown, ArrowLeftRight, ClipboardList, X, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { AttendanceSystem } from '../features/staff/components/AttendanceSystem';
import { AttendanceAnalytics } from '../features/staff/components/AttendanceAnalytics';
import { StaffAttendanceTable } from '../features/staff/components/StaffAttendanceTable';
import { addAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord, updateStaffMember, deleteStaffMember, subscribeToLeaves, addLeaveRequest, updateLeaveRequest, publishRota, saveRotaPreference, subscribeToRota, subscribeToRotaPreferences, subscribeToTasks, addTask, addBatchTasks, updateTask, addNotification, processPayrollBatch, subscribeToShopSettings, getStaffDocRef } from '../lib/firestore';
import { hasPermission } from '../lib/rbac'; // Import RBAC
import { calculatePayroll, calculateTaxAndNI } from '../lib/payroll_logic';
import { SHOP_OPERATING_HOURS, CLEANING_ROTA } from '../constants';


interface StaffViewProps {
  userId: string;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
  userRole: UserRole;
  currentStaffId: string;
  inventory: InventoryItem[];
  activeStaffName: string;
  navigateToProcurement: () => void;
  forceEditStaffId?: string | null;
  onClearForceEdit?: () => void;
}

/**
 * StaffView Component
 * 
 * The central dashboard for Workforce Management in ENGLABS INVENTORY.
 * 
 * CORE FEATURES:
 * - **Staff Registry**: List and Grid views of all staff with status indicators.
 * - **Attendance Tracking**: Real-time clock-in/out, lateness tracking, and overtime calculation.
 * - **Rota Management**: Drag-and-drop shift scheduler with improved availability tracking and conflict detection.
 * - **Leave Management**: Leave request submission and approval workflows with RBAC (Role-Based Access Control).
 * - **Performance Metrics**: Visualizes delay rates, attendance rates, and on-time performance.
 * 
 * ARCHITECTURE:
 * - Uses Firebase Firestore for real-time data synchronization.
 * - Implements optimisitic UI updates for swifter interactions.
 * - Includes client-side deduplication safeguards (`validPreferences`) to handle potential backend data inconsistencies.
 * 
 * @param {StaffViewProps} props - The component props including Staff, Attendance, and Routing functions.
 */
function StaffView({
  userId,
  staff,
  setStaff,
  attendance,
  setAttendance,
  logAction,
  userRole,
  currentStaffId,
  inventory,
  activeStaffName,
  navigateToProcurement,
  forceEditStaffId,
  onClearForceEdit
}: StaffViewProps) {
  const [activeTab, setActiveTab] = useState<'registry' | 'attendance' | 'calendar' | 'files' | 'requests' | 'chart' | 'rota' | 'preferences' | 'compliance' | 'payroll'>('attendance');
  const [calendarMode, setCalendarMode] = useState<'individual' | 'roster'>('roster');
  const [viewPeriod, setViewPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Shop Hours State (Dynamic from DB with fallback)
  const [shopHours, setShopHours] = useState(SHOP_OPERATING_HOURS);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToShopSettings(userId, (settings) => {
      if (settings && settings.timings) {
        setShopHours(settings.timings);
      }
    });
    return () => unsub();
  }, []);

  // --- AUTO CHECKOUT SAFETY NET ---
  // Automatically clocks out staff if they forget, defaulting to the Shop's Closing Time.
  useEffect(() => {
    const runAutoCheckout = async () => {
      // 1. Guard Clauses
      if (attendance.length === 0 || !shopHours) return;

      const SHOP_ID = userId;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 2. Identify Stale Records (Open shifts from previous days OR way past closing)
      const staleRecords = attendance.filter(r => !r.clockOut && r.clockIn && r.date);

      for (const r of staleRecords) {
        if (!r.date || !r.clockIn) continue;

        const recordDate = new Date(r.date);
        const recordDayName = recordDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Get Closing Time for that specific day (Default to 23:00 if unknown)
        const timings = shopHours[recordDayName] || { start: '08:00', end: '23:00' };
        const closingTime = timings.end;

        let shouldAutoClockOut = false;

        // Condition A: Shift is from a previous day
        if (r.date < todayStr) {
          shouldAutoClockOut = true;
        }
        // Condition B: Shift is today, but it is now 4+ hours past closing time (e.g. 3 AM)
        else if (r.date === todayStr) {
          const [shutH, shutM] = closingTime.split(':').map(Number);
          const shiftCloseDate = new Date(today);
          shiftCloseDate.setHours(shutH, shutM, 0);

          const bufferMs = 4 * 60 * 60 * 1000; // 4 Hours Buffer
          if (today.getTime() > shiftCloseDate.getTime() + bufferMs) {
            shouldAutoClockOut = true;
          }
        }

        // 3. Execute Auto-Checkout
        if (shouldAutoClockOut) {
          const sName = staff.find(s => s.id === r.staffId)?.name || 'Unknown Staff';
          console.log(`[Auto-Checkout] Closing Stale Shift for ${sName} (${r.date}): ${r.clockIn} -> ${closingTime}`);

          // Calculate Hours (Simplified)
          const [sH, sM] = r.clockIn.split(':').map(Number);
          const [eH, eM] = closingTime.split(':').map(Number);
          let hours = (eH + eM / 60) - (sH + sM / 60);
          if (hours < 0) hours = 0; // Prevention

          try {
            // Use imported update function
            await updateAttendanceRecord(SHOP_ID, r.id, {
              clockOut: closingTime,
              hoursWorked: parseFloat(hours.toFixed(2)),
              notes: 'Auto-Checkout by System (Shift Limit Exceeded)'
            });

            // Log it
            logAction('Attendance', 'staff', `System auto-closed shift for ${sName}`, 'Warning');
          } catch (err) {
            console.error("[Auto-Checkout] Failed:", err);
          }
        }
      }
    };

    // Run periodically (every 5 mins) and on mount
    if (import.meta.env.MODE === 'test') return; // Prevent vitest hang

    const interval = setInterval(runAutoCheckout, 5 * 60 * 1000);
    const initialTimer = setTimeout(runAutoCheckout, 5000); // 5s delay on boot

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [attendance, shopHours]);



  // Rota State
  const [resetConfirm, setResetConfirm] = useState(false);
  // Default to CURRENT WEEK (Monday) instead of hardcoded past date
  const [rotaDate, setRotaDate] = useState(() => {
    const today = new Date();
    // Calculate Monday of current week
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });
  const [rotaPreferences, setRotaPreferences] = useState<RotaPreference[]>([]);
  const [shifts, setShifts] = useState<RotaShift[]>([]);

  // --- CLIENT-SIDE DEDUPLICATION ---
  // The 'validPreferences' memoized value is CRITICAL for Rota stability.
  // It filters the raw 'rotaPreferences' from Firestore to ensure that each Staff Member
  // has exactly ONE availability record for the current week.
  // This prevents UI glitches where a staff member might appear twice in the Rota Planner
  // if the backend accidentally sends duplicate or ghost records.
  // Strategy: Group by StaffID, use a Map to enforce uniqueness.
  const validPreferences = useMemo(() => {
    const weekStart = rotaDate.toISOString().split('T')[0];
    const currentWeekPrefs = rotaPreferences.filter((p: RotaPreference) => p.weekStart === weekStart);

    const unique = new Map();
    currentWeekPrefs.forEach((p: RotaPreference) => {
      if (!unique.has(p.staffId)) {
        unique.set(p.staffId, p);
      }
    });
    return Array.from(unique.values());
  }, [rotaPreferences, rotaDate]);

  // Dashboard Calendar State
  const [dashboardDate, setDashboardDate] = useState(new Date());
  const [dashboardMonth, setDashboardMonth] = useState(new Date());

  // Registry State
  const [registryViewMode, setRegistryViewMode] = useState<'grid' | 'list'>('list');
  const [registrySearch, setRegistrySearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- ORG CHART ZOOM & PAN STATE ---
  const [orgZoom, setOrgZoom] = useState(0.9);
  const [orgPan, setOrgPan] = useState({ x: 0, y: 0 });
  const [isOrgDragging, setIsOrgDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const orgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset zoom/pan when switching to chart tab
    if (activeTab === 'chart') {
      // Responsive Initial Zoom for Mobile Visibility
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        setOrgZoom(isMobile ? 0.40 : 0.85);
      } else {
        setOrgZoom(0.85);
      }
      setOrgPan({ x: 0, y: 0 });
    }
  }, [activeTab]);

  // Force Edit Handler (Triggers from UserProfileMenu)
  useEffect(() => {
    if (forceEditStaffId) {
      const target = staff.find(s => s.id === forceEditStaffId);
      if (target) {
        setEditingStaff(target);
        setStaffModalTab('details');
        setAddStaffModalOpen(true);
      }
      onClearForceEdit?.();
    }
  }, [forceEditStaffId, staff, onClearForceEdit]);

  const handleOrgMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsOrgDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleOrgMouseMove = (e: React.MouseEvent) => {
    if (!isOrgDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setOrgPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleOrgMouseUp = () => {
    setIsOrgDragging(false);
  };

  const handleOrgLeave = () => {
    setIsOrgDragging(false);
  };

  // Enhanced Scroll-to-Zoom with Passive: false for smoother UX
  useEffect(() => {
    const container = orgContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Smoother zoom steps (0.05) vs button clicks (0.1)
      if (e.deltaY < 0) {
        setOrgZoom(prev => Math.min(prev + 0.05, 2.5));
      } else {
        setOrgZoom(prev => Math.max(prev - 0.05, 0.3));
      }
    };

    // Attach with passive: false to allow preventDefault (stops page scroll)
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [activeTab]); // Re-bind if tab switches/component re-mounts

  const handleZoomIn = () => setOrgZoom(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setOrgZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleResetView = () => {
    setOrgZoom(0.85);
    setOrgPan({ x: 0, y: 0 });
  };

  // Navigation Scroll Helper
  const navScrollRef = useRef<HTMLDivElement>(null);
  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  // Rota Subscriptions
  useEffect(() => {
    // if (!auth.currentUser) return;
    const SHOP_ID = import.meta.env.VITE_SHOP_ID || (auth.currentUser?.uid || 'englabs-inventory-');

    // Subscribe to Rota (Published Shifts)
    const unsubRota = subscribeToRota(SHOP_ID, (liveShifts) => {
      setShifts(liveShifts);
    });

    // Subscribe to Preferences (Staff Availability)
    const unsubPrefs = subscribeToRotaPreferences(SHOP_ID, (livePrefs) => {
      setRotaPreferences(livePrefs);
    });

    return () => {
      unsubRota();
      unsubPrefs();
    }
  }, []);

  const handleSyncRoles = async () => {
    if (!userId) {
      alert("Cannot sync roles: User ID missing");
      return;
    }

    if (!confirm("This will match LIVE Staff Records by Name (Salil, Parth, Nayan...) and update their roles. Continue?")) return;

    try {
      const batch = writeBatch(db);
      let updateCount = 0;

      // Iterate only the LIVE staff records loaded in the view
      for (const s of staff) {
        const name = s.name.toUpperCase();
        let newRole: UserRole | null = null;

        if (name.includes('SALIL')) newRole = 'Business Coordinator';
        else if (name.includes('PARTH')) newRole = 'Business Coordinator';
        else if (name.includes('NAYAN')) newRole = 'Shop Assistant';
        else if (name.includes('NISHA')) newRole = 'Shop Assistant';

        // Only update if role is different and newRole is defined
        if (newRole && s.role !== newRole) {
          // USE CENTRALIZED PATH HELPER - Prevents "Ghost Writes" to wrong paths
          const docRef = getStaffDocRef(userId, s.id);
          batch.update(docRef, { role: newRole });
          updateCount++;
          console.log(`Queueing update for ${s.name}: ${s.role} -> ${newRole}`);
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        alert(`✅ Synced ${updateCount} roles successfully! Refreshing...`);
        window.location.reload();
      } else {
        alert("No role updates were needed (All names match their target roles).");
      }

    } catch (e) {
      console.error(e);
      alert("Sync Failed: " + e);
    }
  };


  // --- FINANCIALS CALCULATION (Memoized) ---



  const renderOrgChart = () => {
    // Custom Role Mapper for Org Chart Display
    const getDisplayRole = (s: StaffMember) => {
      const name = s.name.toUpperCase();
      if (name.includes('SALIL')) return 'BUSINESS COORDINATOR';
      if (name.includes('PARTH')) return 'BUSINESS COORDINATOR';
      if (name.includes('PARAS')) return 'MANAGER';
      if (name.includes('NISHA')) return 'SHOP ASSISTANT';
      if (name.includes('NAYAN')) return 'SHOP ASSISTANT';
      return s.role; // Fallback
    };

    // 1. Management Group (Salil, Parth, Paras)
    const management = staff.filter(s =>
      s.name.toLowerCase().includes('salil') ||
      s.name.toLowerCase().includes('parth') ||
      s.name.toLowerCase().includes('paras')
    );

    // 2. Management Support Group (Bharat, Gaurav)
    const support = staff.filter(s =>
      s.name.toLowerCase().includes('bharat') ||
      s.name.toLowerCase().includes('gaurav')
    );

    // 3. Employees (Everyone else)
    const employees = staff.filter(s =>
      !s.name.toLowerCase().includes('salil') &&
      !s.name.toLowerCase().includes('parth') &&
      !s.name.toLowerCase().includes('paras') &&
      !s.name.toLowerCase().includes('bharat') &&
      !s.name.toLowerCase().includes('gaurav')
    );

    const Card = ({ s, color, noJobTitleUpdate, scale = 1 }: { s: StaffMember, color: string, noJobTitleUpdate?: boolean, scale?: number }) => (
      <div
        className={`bg-white p-4 rounded-2xl shadow-sm border-2 ${color} w-60 relative group hover:-translate-y-1 transition-transform duration-300`}
        // Prevent click bubble up triggering drag if clicking card actions
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Connection Dot Top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-200 rounded-full border-4 border-slate-50 z-10"></div>
        {/* Connection Dot Bottom */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-200 rounded-full border-4 border-slate-50 z-10"></div>

        {/* ADMIN ACTIONS */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={(e) => { e.stopPropagation(); setEditingStaff(s); setAddStaffModalOpen(true); }}
              className="w-7 h-7 bg-white border border-slate-100 text-slate-400 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm"
              title="Edit Details"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Are you sure you want to remove ${s.name} from the organization? This cannot be undone.`)) return;
                const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
                if (userId) {
                  await deleteStaffMember(userId, s.id);
                  // Notify Admins
                  const admins = staff.filter(m => ['Owner', 'Director', 'Manager', 'Business Coordinator'].includes(m.role));
                  for (const admin of admins) {
                    if (admin.id === currentStaffId) continue;
                    await addNotification(userId, {
                      id: crypto.randomUUID(), recipientId: admin.id,
                      title: 'Staff Removal', message: `${s.name} was removed from the organization by ${activeStaffName}.`,
                      type: 'warning', read: false, createdAt: new Date().toISOString(), link: '/staff'
                    });
                  }
                  alert(`${s.name} has been removed.`);
                }
              }}
              className="w-7 h-7 bg-white border border-slate-100 text-slate-400 rounded-lg flex items-center justify-center hover:bg-error-50 hover:text-error-600 hover:border-error-100 transition-all shadow-sm"
              title="Remove Staff"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
            {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm truncate w-[130px]">{s.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate w-[130px]">{noJobTitleUpdate ? s.role : getDisplayRole(s)}</p>
            {/* Show Founder badge for Salil/Bharat/Parth */}
            {(s.name.toLowerCase().includes('salil') || s.name.toLowerCase().includes('bharat') || s.name.toLowerCase().includes('parth')) && <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-[9px] font-black rounded-full">FOUNDER</span>}
          </div>
        </div>
      </div>
    );

    return (
      <div className="animate-in fade-in zoom-in duration-500 w-full h-[calc(100vh-200px)] flex flex-col relative overflow-hidden bg-slate-50/30 rounded-3xl border border-slate-200">

        {/* Controls Toolbar */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 bg-white/90 backdrop-blur shadow-lg border border-slate-100 p-2 rounded-2xl">
          <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
          <div className="h-px bg-slate-200 w-full my-0.5"></div>
          <button onClick={handleResetView} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Reset View"><RotateCcw className="w-4 h-4" /></button>
          {canManageUsers && (
            <button onClick={handleSyncRoles} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-primary-600 transition-colors mt-2 border-t border-slate-100 pt-3" title="Sync Roles">
              <Maximize className="w-4 h-4" />
              <span className="sr-only">Sync Roles</span>
            </button>
          )}
        </div>

        {/* Info Badge */}
        <div className="absolute top-4 left-4 z-50 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
          <Move className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Drag to Pan • Scroll to Zoom</span>
        </div>

        {/* Mobile Vertical Stack (Visible ONLY on very small screens, integrated into zoomable view essentially, but layout changes) */}
        {/* To satisfy "Entire Org Chart Visible Irrespective of Screen Size", we will use the desktop tree for all, but allow zooming. 
            The previous mobile-only stack is good for lists, but the user asked for "The Org Chart". 
            Let's keep the Unified Tree View for everything now, as it scales. 
        */}

        <div
          ref={orgContainerRef}
          className={`w-full h-full overflow-hidden cursor-${isOrgDragging ? 'grabbing' : 'grab'} flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]`}
          onMouseDown={handleOrgMouseDown}
          onMouseMove={handleOrgMouseMove}
          onMouseUp={handleOrgMouseUp}
          onMouseLeave={handleOrgLeave}

        >
          <div
            style={{
              transform: `translate(${orgPan.x}px, ${orgPan.y}px) scale(${orgZoom})`,
              transformOrigin: 'center center',
              transition: isOrgDragging ? 'none' : 'transform 0.3s ease-out'
            }}
            className="flex items-center justify-center min-w-max min-h-max p-20"
          >
            {/* --- TREE CONTENT START --- */}
            <div className="flex flex-col items-center gap-16">

              {/* CORE MANAGEMENT ROW */}
              <div className="relative">
                {/* Dashed Border Container for Management */}
                <div className="absolute -top-16 -left-12 -right-12 h-[260px] border-4 border-dashed border-primary-200/60 rounded-[3rem] bg-primary-50/20 -z-10">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-primary-800 text-lg font-black tracking-widest px-8 py-2 rounded-full uppercase border-2 border-primary-100 shadow-md whitespace-nowrap">
                    Core Management
                  </div>
                </div>

                <div className="flex items-start gap-12">

                  {/* 1. PARAS (Operations) */}
                  <div className="flex flex-col items-center">
                    {management.filter(s => s.name.toUpperCase().includes('PARAS')).map(s => (
                      <Card key={s.id} s={s} color="border-primary-500 ring-4 ring-primary-50" />
                    ))}

                    {/* EMPLOYEES TREE (Under Paras) */}
                    <div className="relative flex flex-col items-center mt-16">
                      {/* Master Connector from Paras */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center text-primary-600">
                        <div className="h-8 w-1.5 bg-primary-600 rounded-full"></div>
                        <ArrowDown className="w-8 h-8 -mt-2" strokeWidth={3} />
                      </div>

                      {/* Employees Container */}
                      <div className="flex justify-center flex-wrap gap-10 max-w-[1200px]">
                        {employees.map(e => (
                          <div key={e.id} className="relative group flex flex-col items-center">
                            {/* Individual Arrows for visibility */}
                            <div className="mb-2 text-primary-400 opacity-50">
                              <ArrowDown className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <div className="scale-100">
                              <Card s={e} color="border-success-500 border-2 shadow-md ring-4 ring-success-50/50" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-12">
                        <span className="text-[10px] font-black tracking-widest text-success-500 uppercase bg-success-500/10 px-4 py-2 rounded-full border border-success-100 shadow-sm">
                          Frontline Team
                        </span>
                      </div>
                    </div>
                  </div>


                  {/* ARROW: Paras <-> Parth */}
                  <div className="mt-8 text-primary-700">
                    <ArrowLeftRight className="w-14 h-14" strokeWidth={3} />
                  </div>

                  {/* 2. PARTH (Coordination) */}
                  <div className="flex flex-col items-center">
                    {management.filter(s => s.name.toUpperCase().includes('PARTH')).map(s => (
                      <Card key={s.id} s={s} color="border-primary-500 ring-4 ring-primary-50" />
                    ))}
                  </div>

                  {/* ARROW: Parth <-> Salil */}
                  <div className="mt-8 text-primary-700">
                    <ArrowLeftRight className="w-14 h-14" strokeWidth={3} />
                  </div>

                  {/* 3. SALIL (Strategy) */}
                  <div className="flex flex-col items-center">
                    {management.filter(s => s.name.toUpperCase().includes('SALIL')).map(s => (
                      <Card key={s.id} s={s} color="border-primary-500 ring-4 ring-primary-50" />
                    ))}

                    {/* SUPPORT GROUP (Under Salil) */}
                    <div className="relative flex flex-col items-center mt-16">
                      {/* Connector Implementation */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center text-primary-400">
                        <div className="h-8 w-1.5 bg-primary-300 rounded-full"></div>
                        <ArrowDown className="w-8 h-8 -mt-2" strokeWidth={3} />
                      </div>

                      <div className="relative p-8 border-4 border-dashed border-slate-300/80 rounded-[2.5rem] bg-white/80">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-slate-600 text-xs font-black px-4 py-1.5 rounded-full border border-slate-200 shadow-sm uppercase tracking-widest">
                          Management Support
                        </div>
                        <div className="flex gap-8">
                          {support.map(s => <div key={s.id} className="scale-90"><Card s={s} color="border-slate-300" /></div>)}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
            {/* --- TREE CONTENT END --- */}

          </div>
        </div>
      </div>
    );
  };

  const [weekOffset, setWeekOffset] = useState(0);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dayDetails, setDayDetails] = useState<{ date: string, records: AttendanceRecord[] } | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentStaffId || staff[0]?.id || '');

  useEffect(() => {
    if (currentStaffId) setSelectedStaffId(currentStaffId);
  }, [currentStaffId]);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);

  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '', role: 'Cashier' as UserRole, pin: '',
    niNumber: '', taxCode: '', photo: '', email: '', phone: '',
    address: '', dateOfBirth: '', bloodGroup: '',
    contractType: 'Full-time' as ContractType, department: '',
    hourlyRate: 11.44, dailyRate: 0, monthlyRate: 0,
    status: 'Active' as 'Active' | 'Inactive' | 'Pending Approval',
    faceDescriptor: undefined as number[] | undefined,
    validUntil: '', joinedDate: new Date().toISOString().split('T')[0]
  });

  // RBAC Permissions
  const canManageUsers = hasPermission(userRole, 'users.manage') || ['Manager', 'Store Management', 'Store In-charge', 'Owner', 'Director'].includes(userRole);

  // STRICT ACCESS: Owner, Director, Manager, Store In-charge, Store Management
  const isAdmin = canManageUsers; // Enforcing RBAC: Only those with users.manage can perform admin actions

  if (import.meta.env.MODE === 'test') {
    console.log(`[DEBUG RBAC] userRole: ${userRole}, canManageUsers: ${canManageUsers}, isAdmin: ${isAdmin}`);
  }

  // --- AUTO-ASSIGN AVATARS UTILITY REMOVED TO PREVENT DATA OVERWRITE ---

  const handleCleanupTestStaff = async () => {
    if (!isAdmin) return;
    if (!confirm("⚠️ ADMIN ACTION: This will PERMANENTLY DELETE staff members with names like 'Test', 'Oooo', 'Shop Owner'.\n\nProceed?")) return;

    if (!userId) { alert("User ID missing"); return; }

    const targets = staff.filter(s => {
      const n = s.name.toUpperCase();
      return n.includes('TEST') || n.includes('OOOO') || n.includes('SHOP OWNER') || n.includes('RECRUIT');
    });

    if (targets.length === 0) {
      alert("No test staff found matching criteria.");
      return;
    }

    try {
      let count = 0;
      for (const s of targets) {
        await deleteStaffMember(userId, s.id);
        count++;
      }
      alert(`✅ Deleted ${count} test staff records.`);
    } catch (e) {
      console.error(e);
      alert("Cleanup failed: " + e);
    }
  };

  // Sync selectedStaffId with currentStaffId when it loads (Fix for "My Availability" showing wrong user on load)
  React.useEffect(() => {
    if (currentStaffId) {
      setSelectedStaffId(currentStaffId);
    }
  }, [currentStaffId]);

  // Auto-correct selectedStaffId if invalid (e.g. stale default)
  React.useEffect(() => {
    if (staff.length > 0) {
      const exists = staff.find(s => s.id === selectedStaffId);
      if (!exists) {
        // Prefer current user as fallback if available
        const fallback = (currentStaffId && staff.find(s => s.id === currentStaffId))
          ? currentStaffId
          : staff[0].id;

        console.log(`[StaffView] Auto-correcting selection from ${selectedStaffId} to ${fallback}`);
        setSelectedStaffId(fallback);
      }
    }
  }, [staff, selectedStaffId, currentStaffId]);

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [idCardStaff, setIdCardStaff] = useState<StaffMember | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [faceAuthMode, setFaceAuthMode] = useState<'enroll' | 'authenticate' | null>(null);
  const [staffModalTab, setStaffModalTab] = useState<'details' | 'financials'>('details');
  const [financialMonth, setFinancialMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // --- FINANCIALS CALCULATION (Memoized) ---
  const financialData = useMemo(() => {
    if (!editingStaff || staffModalTab !== 'financials') return null;

    const [year, month] = financialMonth.split('-').map(Number);

    const records = attendance.filter(a => {
      const d = new Date(a.date);
      return a.staffId === editingStaff.id && d.getMonth() + 1 === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rosteredShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return s.staff_id === editingStaff.id && d.getMonth() + 1 === month && d.getFullYear() === year && s.status !== 'rejected';
    });

    // Calculate Totals
    let totalHours = 0;
    let overtimeHours = 0;

    records.forEach(r => {
      totalHours += (r.hoursWorked || 0);
      overtimeHours += (r.overtime || 0);
    });

    const hourlyRate = editingStaff.hourlyRate || 0;
    // Standard: (Regular Hours * Rate) + (Overtime Hours * Rate).
    const regularHours = Math.max(0, totalHours - overtimeHours);
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * (hourlyRate); // No multiplier yet

    const grossPay = regularPay + overtimePay;
    const advance = editingStaff.advance || 0;
    const netPay = grossPay - advance;

    return {
      records,
      rosteredShifts,
      totalHours,
      overtimeHours,
      regularHours,
      hourlyRate,
      regularPay,
      overtimePay,
      grossPay,
      advance,
      netPay
    };
  }, [editingStaff, staffModalTab, financialMonth, attendance, shifts]);

  const handleFaceEnroll = async (descriptor: number[]) => {
    const SHOP_ID = userId;

    if (editingStaff) {
      // Update existing staff
      try {
        await updateStaffMember(userId, editingStaff.id, { faceDescriptor: descriptor });
        setEditingStaff(prev => ({ ...prev!, faceDescriptor: descriptor }));
        alert("Face ID Enrolled Successfully!");
      } catch (e) {
        console.error(e);
        alert("Failed to save Face ID");
      }
    } else {
      // New staff (in form state)
      setNewStaffForm(prev => ({ ...prev, faceDescriptor: descriptor }));
      alert("Face ID Captured! Please confirm to finish creating the profile.");
    }
    setFaceAuthMode(null);
  };

  // --- Task Management State ---
  const [tasks, setTasks] = useState<ShopTask[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ShopTask | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Subscribe to Tasks
  useEffect(() => {
    // if (!auth.currentUser) return;
    const SHOP_ID = import.meta.env.VITE_SHOP_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    const unsub = subscribeToTasks(SHOP_ID, (data) => setTasks(data));
    return () => unsub();
  }, []);



  const handleTaskPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, task: ShopTask) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showNotification("Compressing & Uploading...", 'info');
      const { compressImage } = await import('../lib/storage_utils');
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // Append to existing photos logic
        const currentPhotos = task.proofPhotos || [];
        // Support legacy single photo if exists and not in array
        if (task.proofPhoto && !currentPhotos.includes(task.proofPhoto)) {
          currentPhotos.push(task.proofPhoto);
        }

        const updatedPhotos = [...currentPhotos, base64String];

        const performer = staff.find(s => s.id === selectedStaffId);

        await updateTask(userId, task.id, {
          proofPhotos: updatedPhotos,
          proofPhoto: base64String,
          status: 'Completed',
          completedBy: performer?.name || 'Staff',
          completedAt: new Date().toISOString()
        });

        // Update local state for immediate UI feedback
        setSelectedTask(prev => prev ? ({
          ...prev,
          status: 'Completed',
          proofPhotos: updatedPhotos,
          proofPhoto: base64String,
          completedBy: performer?.name || 'Staff',
          completedAt: new Date().toISOString()
        }) : null);

        showNotification("Proof added!", 'success');
        // Don't close modal to allow more uploads
        // setTaskModalOpen(false); 
      };
      reader.readAsDataURL(compressedFile);
    } catch (e) {
      console.error(e);
      showNotification("Upload failed", 'error');
    }
  };
  const [notes, setNotes] = useState([
    { id: 1, title: 'Resilience in hospitals', date: '05/05/2023', content: 'Talking about resilience in nursing', pinned: true },
    { id: 2, title: 'The most important KPI', date: '30/06/2023', content: 'Rules about KPI', pinned: true }
  ]);
  const [breakActive, setBreakActive] = useState(false); // Local state for break UI

  // --- Leave Management State ---
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState<Partial<LeaveRequest>>({ type: 'Annual', startDate: '', endDate: '' });

  // Leave Subscription
  React.useEffect(() => {
    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    if (userId) {
      const unsub = subscribeToLeaves(userId, setLeaves);
      return () => unsub();
    }
  }, []);

  // --- Logic Helpers (Preserved) ---

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { compressImage } = await import('../lib/storage_utils');
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEdit && editingStaff) {
          setEditingStaff(prev => prev ? ({ ...prev, photo: base64String }) : null);
        } else {
          setNewStaffForm(prev => ({ ...prev, photo: base64String }));
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Photo processing failed", err);
      alert("Photo processing failed. Please try a smaller image.");
    }
  };

  const handleAddNewStaff = async () => {
    // if (!auth.currentUser) return;
    if (!newStaffForm.name || !newStaffForm.pin) {
      alert("Name and PIN are required");
      return;
    }

    try {
      // --- PIN UNIQUENESS CHECK ---
      const pins = staff.map(s => s.pin);
      if (pins.includes(newStaffForm.pin)) {
        alert("SECURITY ALERT: This PIN is already assigned to another professional. Please choose a unique credential.");
        return;
      }

      const { addStaffMember } = await import('../lib/firestore');
      const newId = crypto.randomUUID();
      const newStaff: StaffMember = {
        id: newId,
        name: newStaffForm.name.toUpperCase(),
        role: newStaffForm.role,
        pin: newStaffForm.pin,
        photo: newStaffForm.photo,
        email: newStaffForm.email,
        phone: newStaffForm.phone,
        address: newStaffForm.address,
        dateOfBirth: newStaffForm.dateOfBirth,
        bloodGroup: newStaffForm.bloodGroup,
        contractType: newStaffForm.contractType,
        department: newStaffForm.department,
        hourlyRate: newStaffForm.hourlyRate,
        dailyRate: newStaffForm.dailyRate,
        monthlyRate: newStaffForm.monthlyRate,
        joinedDate: newStaffForm.joinedDate || new Date().toISOString(),
        validUntil: newStaffForm.validUntil || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        loginBarcode: `STAFF-${Math.floor(Math.random() * 10000)}`,
        status: newStaffForm.status,
        niNumber: newStaffForm.niNumber || 'PENDING',
        taxCode: newStaffForm.taxCode || '1257L',
        rightToWork: true,
        emergencyContact: '',
        advance: 0,
        holidayEntitlement: 28,
        accruedHoliday: 0,
        faceDescriptor: newStaffForm.faceDescriptor
      };

      const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
      await addStaffMember(userId, newStaff);

      logAction('Recruitment', 'staff', `Authorized Enrollment: ${newStaff.name}`, 'Info');
      setAddStaffModalOpen(false);
      setNewStaffForm({
        name: '', role: 'Cashier', pin: '', niNumber: '', taxCode: '', photo: '', email: '', phone: '',
        address: '', dateOfBirth: '', bloodGroup: '', contractType: 'Full-time', department: '',
        hourlyRate: 11.44, dailyRate: 0, monthlyRate: 0, joinedDate: '', validUntil: '',
        status: 'Active',
        faceDescriptor: undefined
      });
      alert("Staff Enrolled & Authorized Successfully!");

    } catch (e) {
      console.error(e);
      alert("Enrollment Error: " + e);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return; // if (!auth.currentUser || !editingStaff) return;
    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    try {
      const { updateStaffMember, addStaffMember } = await import('../lib/firestore');

      // Construct updates object carefully to avoid overwriting with empty strings
      const updates: any = {
        name: editingStaff.name.toUpperCase(),
        role: editingStaff.role,
        pin: editingStaff.pin,
        niNumber: editingStaff.niNumber,
        status: editingStaff.status,
      };

      // Only update these fields if they have a value
      if (editingStaff.photo) updates.photo = editingStaff.photo;
      if (editingStaff.email) updates.email = editingStaff.email;
      if (editingStaff.phone) updates.phone = editingStaff.phone;

      // New Profile Fields
      if (editingStaff.dateOfBirth) updates.dateOfBirth = editingStaff.dateOfBirth;
      if (editingStaff.bloodGroup) updates.bloodGroup = editingStaff.bloodGroup;
      if (editingStaff.address) updates.address = editingStaff.address;
      if (editingStaff.joinedDate) updates.joinedDate = editingStaff.joinedDate;
      if (editingStaff.validUntil) updates.validUntil = editingStaff.validUntil;
      if (editingStaff.emergencyContact) updates.emergencyContact = editingStaff.emergencyContact;

      // Financial Updates
      updates.hourlyRate = editingStaff.hourlyRate ?? 0;
      updates.monthlyRate = editingStaff.monthlyRate ?? 0;
      updates.advance = editingStaff.advance ?? 0;

      try {
        await updateStaffMember(userId, editingStaff.id, updates);
      } catch (innerErr: any) {
        if (innerErr.code === 'not-found' || innerErr.toString().includes('not-found')) {
          if (confirm(`Database Record Missing for "${editingStaff.name}".\n\nRe-create this personnel file?`)) {
            await addStaffMember(userId, editingStaff);
            logAction('Personnel Restore', 'staff', `Restored Ghost Record: ${editingStaff.name}`, 'Warning');
            alert("Record Restored & Updated.");
            setEditingStaff(null);
            return;
          }
        }
        throw innerErr;
      }

      logAction('Personnel Update', 'staff', `Updated Record: ${editingStaff.name}`, 'Warning');

      // Notify Admins
      const admins = staff.filter(m => ['Owner', 'Director', 'Manager', 'Business Coordinator'].includes(m.role));
      for (const admin of admins) {
        if (admin.id === currentStaffId) continue;
        await addNotification(userId, {
          id: crypto.randomUUID(), recipientId: admin.id,
          title: 'Staff Profile Update', message: `${editingStaff.name} details were updated by ${activeStaffName}.`,
          type: 'info', read: false, createdAt: new Date().toISOString(), link: '/staff'
        });
      }
      // Notify Target
      if (editingStaff.id !== currentStaffId) {
        await addNotification(userId, {
          id: crypto.randomUUID(), recipientId: editingStaff.id,
          title: 'Profile Updated', message: `Your profile details were updated by ${activeStaffName}.`,
          type: 'info', read: false, createdAt: new Date().toISOString(), link: '/staff'
        });
      }
      setEditingStaff(null);
      alert("Staff Record Updated Successfully");
    } catch (e) {
      console.error(e);
      alert("Update Failed: " + e);
    }
  };

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += (24 * 60); // Handle midnight crossing
    return Math.max(0, parseFloat((diff / 60).toFixed(2)));
  };

  const handleAttendanceAction = async (type: 'IN' | 'OUT') => {
    // if (!auth.currentUser) return;

    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false });
    const targetStaff = staff.find(s => s.id === selectedStaffId);

    if (!targetStaff) return;

    if (type === 'IN') {
      // Fix: Only block if already checked in TODAY. Ignore stale open shifts from past.
      const alreadyIn = attendance.some(a => a.staffId === selectedStaffId && a.date === today && !a.clockOut);
      if (alreadyIn) {
        showNotification(`${targetStaff.name} is already checked in. Please clock out first.`, 'error');
        return;
      }

      // Cooldown Check (Manual)
      const lastClosed = attendance.filter(a => a.staffId === selectedStaffId && a.clockOut)
        .sort((a, b) => new Date(b.date + 'T' + b.clockOut).getTime() - new Date(a.date + 'T' + a.clockOut).getTime())[0];

      if (lastClosed && lastClosed.date === today && lastClosed.clockOut === time) {
        showNotification("You just checked out! Please wait a minute before checking in again.", 'error');
        return;
      }

      const newRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        staffId: selectedStaffId,
        date: today,
        status: 'Present',
        clockIn: time,
        notes: 'Manual Console Entry'
      };

      try {
        await addAttendanceRecord(userId, newRecord);
        logAction('Staff Check-in', 'staff', `Authorized entry for ${targetStaff.name} at ${time}`, 'Info');
        showNotification(`✅ Check-In Successful: ${targetStaff.name} at ${time}`, 'success');
      } catch (err) {
        console.error("Error checking in:", err);
        showNotification("Failed to check in " + err, 'error');
      }

    } else {
      // Find ANY active shift (latest one)
      const recordToUpdate = attendance.filter(a => a.staffId === selectedStaffId && !a.clockOut)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (!recordToUpdate) {
        showNotification(`No active shift found for ${targetStaff.name}`, 'error');
        return;
      }

      const updates = {
        clockOut: time,
        hoursWorked: calculateHours(recordToUpdate.clockIn || '00:00', time)
      };

      try {
        await updateAttendanceRecord(userId, recordToUpdate.id, updates);
        logAction('Staff Check-out', 'staff', `Authorized exit for ${targetStaff.name} at ${time}`, 'Info');
        showNotification(`✅ Check-Out Successful: ${targetStaff.name} at ${time}`, 'success');
      } catch (err) {
        console.error("Error checking out:", err);
        showNotification("Failed to check out.", 'error');
      }
    }
  };

  const handleTerminalAuth = async (staffId: string, method: 'QR' | 'BIO' | 'FACE' | 'PIN', proof?: string) => {
    const s = staff.find(st => st.id === staffId);
    if (!s) return; // if (!s || !auth.currentUser) return;

    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false });

    // Close ANY open shift, preferably latest
    const openShift = attendance.filter(a => a.staffId === staffId && !a.clockOut)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    try {
      // LOGIC: If a shift is OPEN (no Clock Out), we must CLOSE it.
      // If no shift is open, we OPEN a new one (regardless of past shifts today).
      if (openShift) {
        // CLOSE EXISTING SHIFT
        const hours = calculateHours(openShift.clockIn || '00:00', time);
        await updateAttendanceRecord(userId, openShift.id, {
          clockOut: time,
          hoursWorked: hours,
          notes: openShift.notes ? openShift.notes + ` | [${method}] OUT` : `[${method}] Verified Checkout`
        });
        logAction('Terminal Exit', 'staff', `${s.name} clocked OUT via ${method}`, 'Info');
      } else {
        // Find recently closed shift to prevent "0 minute" ghost shifts (Double Scan Protection)
        const lastClosed = attendance.filter(a => a.staffId === staffId && a.date === today && a.clockOut)
          .sort((a, b) => (b.clockOut || '').localeCompare(a.clockOut || ''))[0];

        if (lastClosed && lastClosed.clockOut === time) {
          logAction('Terminal Action Blocked', 'staff', `Prevented rapid re-entry for ${s.name} (Cooldown)`, 'Warning');
          // Do nothing / Shake UI
          return;
        }

        // OPEN NEW SHIFT (Supports Multiple Shifts)
        const newId = crypto.randomUUID();
        await addAttendanceRecord(userId, {
          id: newId,
          staffId: s.id,
          date: today,
          status: 'Present',
          clockIn: time,
          notes: `[${method}] Shift Start`
        });
        logAction('Terminal Entry', 'staff', `${s.name} clocked IN via ${method}`, 'Info');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const saveRecordUpdate = async () => {
    if (!editingRecord) return; // if (!editingRecord || !auth.currentUser) return;
    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');

    let updatedRecord = { ...editingRecord };
    if (updatedRecord.clockIn && updatedRecord.clockOut) {
      updatedRecord.hoursWorked = calculateHours(updatedRecord.clockIn, updatedRecord.clockOut);
    }

    try {
      if (isAddMode) {
        await addAttendanceRecord(userId, updatedRecord);
        logAction('Attendance Update', 'staff', `Manually created record for ${staff.find(s => s.id === updatedRecord.staffId)?.name || 'Unknown'} on ${updatedRecord.date}`, 'Warning');
      } else {
        await updateAttendanceRecord(userId, updatedRecord.id, updatedRecord);
        logAction('Attendance Update', 'staff', `Modified record #${updatedRecord.id.slice(0, 8)} for ${staff.find(s => s.id === updatedRecord.staffId)?.name}`, 'Warning');
      }

      setEditingRecord(null);
      setIsAddMode(false);
    } catch (err) {
      console.error("Error saving attendance record:", err);
      alert("Failed to save record. Please try again.");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return;
    try {
      const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
      await deleteAttendanceRecord(userId, recordId);
      logAction('Attendance Update', 'staff', `Deleted record #${recordId.slice(0, 8)}`, 'Warning');
    } catch (e) {
      console.error(e);
      alert("Failed to delete record.");
    }
  };

  const formatTime = (isoDateStr: string | undefined) => {
    if (!isoDateStr) return '--:--';
    if (isoDateStr.includes(':') && isoDateStr.length === 5) return isoDateStr;
    return '--:--';
  }

  const getTargetStaff = () => staff.find(s => s.id === selectedStaffId);

  const getTodayRecord = () => {
    const today = new Date().toISOString().split('T')[0];
    const todays = attendance.filter(a => a.staffId === selectedStaffId && a.date === today);
    const active = todays.find(a => !a.clockOut);
    const last = [...todays].sort((a, b) => (b.clockIn || '').localeCompare(a.clockIn || ''))[0];
    return active || last;
  };

  const getStaffStats = () => {
    const sId = selectedStaffId;
    const myRecs = attendance.filter(a => a.staffId === sId);
    if (myRecs.length === 0) return { avgHours: '0h 0m', avgIn: '--:--', avgOut: '--:--', onTime: '0%' };

    const totalHours = myRecs.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0);
    const avgH = myRecs.length ? totalHours / myRecs.length : 0;
    const h = Math.floor(avgH);
    const m = Math.round((avgH - h) * 60);

    const inTimes = myRecs.map(r => r.clockIn).filter(Boolean) as string[];
    let avgInStr = '--:--';
    if (inTimes.length) {
      const totalInMins = inTimes.reduce((acc, t) => {
        const [hh, mm] = t.split(':').map(Number);
        return acc + (hh * 60) + mm;
      }, 0);
      const avgInMins = totalInMins / inTimes.length;
      const ih = Math.floor(avgInMins / 60);
      const im = Math.round(avgInMins % 60);
      avgInStr = `${ih.toString().padStart(2, '0')}:${im.toString().padStart(2, '0')}`;
    }

    const onTimeCount = myRecs.filter(r => {
      if (!r.clockIn) return false;
      const [hh, mm] = r.clockIn.split(':').map(Number);
      return (hh < 9) || (hh === 9 && mm <= 15);
    }).length;
    const onTimePct = ((onTimeCount / myRecs.length) * 100).toFixed(1);

    return {
      avgHours: `${h}h ${m}m`,
      avgIn: avgInStr,
      avgOut: '--',
      onTime: `${onTimePct}%`
    };
  };

  const handleBreakAction = async () => {
    if (!selectedStaffId) return; // if (!auth.currentUser || !selectedStaffId) return;
    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    const today = new Date().toISOString().split('T')[0];
    // Find ALL records for today and sort by clockIn desc (latest first)
    // This fixes the issue where break actions applied to old/completed shifts if multiple existed
    const todaysRecords = attendance.filter(a => a.staffId === selectedStaffId && a.date === today);
    const record = todaysRecords.sort((a, b) => (b.clockIn || '').localeCompare(a.clockIn || ''))[0];

    if (!record) {
      showNotification("You must clock in first!", 'error');
      return;
    }

    const time = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      if (record.breakStart) {
        // End Break
        await updateAttendanceRecord(userId, record.id, { breakStart: '', breakEnd: time }); // Use empty string to clear or null if backend supports
        // Ideally fields should be nullable, but using empty string for 'not on break' simplification provided types are string
        // Actually, let's just use string | undefined. We can delete field or sets to null.
        // Firestore update with deleteField() is cleaner but let's stick to null/empty convention for now.
        // Actually, let's just set breakStart to null (if type allows) or undefined.
        // Types says string | undefined.
        // Let's pass null casted as any to remove it, or just empty string if we treat empty as falsy.
        // Let's toggle it.
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await updateDoc(doc(db, 'shops', userId, 'attendance', record.id), {
          breakStart: null, // Clear it
          breakEnd: time
        });
        showNotification("Welcome back!", 'success');
      } else {
        // Start Break
        await updateAttendanceRecord(userId, record.id, { breakStart: time });
        showNotification("Break started.", 'info');
      }
    } catch (e) {
      console.error(e);
      showNotification("Failed to toggle break", 'error');
    }
  };

  const sortedAttendance = useMemo(() => {
    const getSortValue = (rec: AttendanceRecord) => {
      let val = new Date(rec.date).getTime();
      if (isNaN(val)) val = 0;
      const timeStr = (rec.clockIn || '00:00').trim().toUpperCase();
      let hours = 0; let minutes = 0;
      try {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0]) || 0;
        minutes = parseInt(parts[1]) || 0;
      } catch (e) { }
      val += (hours * 3600000) + (minutes * 60000);
      return val;
    };
    return [...attendance].sort((a, b) => getSortValue(b) - getSortValue(a));
  }, [attendance]);



  const dashboardStats = useMemo(() => getStaffStats(), [attendance, selectedStaffId]);
  const targetStaffName = getTargetStaff()?.name || 'Staff';
  const todayRecord = getTodayRecord();
  const isCheckedIn = !!(todayRecord && !todayRecord.clockOut);

  // --- STAFF PULSE WIDGET ---
  const renderStaffPulse = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    const presentToday = staff.filter((s: StaffMember) =>
      attendance.some((a: AttendanceRecord) => a.staffId === s.id && a.date === todayStr && a.clockIn && !a.clockOut)
    );

    const scheduledToday = staff.filter((s: StaffMember) =>
      shifts.some((sh: RotaShift) => sh.staff_id === s.id && sh.date === todayStr && sh.status !== 'rejected')
    );

    const onVacation = staff.filter((s: StaffMember) =>
      !presentToday.some((p: StaffMember) => p.id === s.id) &&
      leaves.some((l: LeaveRequest) =>
        l.staffId === s.id &&
        l.status === 'Approved' &&
        l.type === 'Annual' &&
        l.startDate <= todayStr &&
        l.endDate >= todayStr
      )
    );

    const cannotCome = staff.filter((s: StaffMember) =>
      !presentToday.some((p: StaffMember) => p.id === s.id) &&
      (
        attendance.some((a: AttendanceRecord) => a.staffId === s.id && a.date === todayStr && a.status === 'Sick') ||
        leaves.some((l: LeaveRequest) =>
          l.staffId === s.id &&
          l.status === 'Approved' &&
          (l.type === 'Sick' || l.type === 'Compassionate') &&
          l.startDate <= todayStr &&
          l.endDate >= todayStr
        )
      )
    );

    const PulseCard = ({ title, count, items, colorClass, icon: Icon, emptyText }: { title: string, count: number, items: StaffMember[], colorClass: string, icon: any, emptyText: string }) => (
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{count}</span>
        </div>
        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">{title}</h4>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-[10px] text-neutral-400 font-bold italic opacity-60">{emptyText}</p>
          ) : (
            items.slice(0, 10).map((s: StaffMember) => {
              const myRecords = attendance.filter((a: AttendanceRecord) => a.staffId === s.id && a.date === todayStr);
              const rec = myRecords.sort((a, b) => (b.clockIn || '').localeCompare(a.clockIn || ''))[0];
              const isFinished = !!rec?.clockOut;
              const isOnBreak = !!rec?.breakStart;

              return (
                <div key={s.id} className={cn("flex items-center gap-3 transition-all", isFinished && "opacity-50")}>
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 overflow-hidden border border-neutral-200/50 dark:border-white/5 relative">
                    {s.photo ? (
                      <img src={s.photo} className={cn("w-full h-full object-cover", isFinished && "grayscale")} alt={s.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>
                    )}
                    {isFinished && <div className="absolute inset-0 bg-black/10"></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{s.name}</p>
                      {isFinished && <span className="text-[8px] font-black text-neutral-500 bg-neutral-100 dark:bg-white/5 px-1 rounded uppercase">Released</span>}
                    </div>
                    {/* Show Status Details */}
                    {(() => {
                      if (rec?.clockIn && !isFinished) {
                        return (
                          <p className={cn("text-[9px] font-bold flex items-center gap-1", isOnBreak ? "text-amber-500" : "text-success-500")}>
                            <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                            {isOnBreak ? `On Break (${rec.breakStart})` : `Clocked: ${rec.clockIn}`}
                          </p>
                        );
                      }

                      // Show Leave Type if on Vacation/Unavailable
                      const leave = leaves.find(l => l.staffId === s.id && l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr);
                      if (leave) {
                        return <p className="text-[9px] font-bold text-primary-600 dark:text-primary-400">{leave.type}</p>;
                      }

                      // Show Shift Time if Scheduled
                      const shift = shifts.find(sh => sh.staff_id === s.id && sh.date === todayStr && sh.status !== 'rejected');
                      if (shift) {
                        return <p className="text-[9px] font-bold text-primary-500 dark:text-primary-400">{shift.start_time} - {shift.end_time}</p>;
                      }

                      return null;
                    })()}
                  </div>
                </div>
              );
            })
          )}
          {items.length > 10 && (
            <p className="text-[9px] font-bold text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">+ {items.length - 10} more</p>
          )}
        </div>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <PulseCard
          title="In Store Today"
          count={presentToday.length}
          items={presentToday}
          colorClass="bg-success-500/10 text-success-500"
          icon={UserCheck}
          emptyText="No active sessions"
        />
        <PulseCard
          title="Scheduled"
          count={scheduledToday.length}
          items={scheduledToday}
          colorClass="bg-primary-500/10 text-primary-500"
          icon={Calendar}
          emptyText="No shifts listed"
        />
        <PulseCard
          title="On Vacation"
          count={onVacation.length}
          items={onVacation}
          colorClass="bg-primary-500/10 text-primary-500"
          icon={Award}
          emptyText="None today"
        />
        <PulseCard
          title="Unavailable"
          count={cannotCome.length}
          items={cannotCome}
          colorClass="bg-error-500/10 text-error-500"
          icon={AlertCircle}
          emptyText="None today"
        />
      </div>
    );
  };

  /* --- PAYROLL TAB IMPLEMENTATION --- */
  const [payrollPeriod, setPayrollPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const renderPayroll = () => {
    // 1. Calculate Payroll Data for ALL Staff
    const [year, month] = payrollPeriod.split('-').map(Number);
    const payrollData = staff.map(s => {
      // Filter Attendance for this Month
      const records = attendance.filter(a => {
        const d = new Date(a.date);
        return a.staffId === s.id && (d.getMonth() + 1) === month && d.getFullYear() === year;
      });

      // Calculate Hours
      let regHours = 0;
      let otHours = 0;
      records.forEach(r => {
        // Simple Separation: > 8 hours/day is OT? or Total > 40?
        // Current Logic in StaffView uses >8 daily.
        // However, let's use the provided calculatePayroll logic
        const worked = r.hoursWorked || 0;
        // Assuming Daily OT for simplicity as per existing logic
        if (worked > 8) {
          regHours += 8;
          otHours += (worked - 8);
        } else {
          regHours += worked;
        }
      });

      const payroll = calculatePayroll(s, regHours, otHours);
      const tax = calculateTaxAndNI(payroll.grossPay, s.taxCode || '1257L');

      // Deduct Advance
      // For now, assume 's.advance' is the TOTAL OUTSTANDING.
      // In a real run, we might deduct X amount.
      // Let's assume we deduct 100% of outstanding up to Net Pay?
      // Or just show it as a separate column "Advance Balance".
      // User Requirement: "appropriate salary, advance, payout".
      let advanceDeduction = s.advance || 0;
      const postTaxPay = payroll.grossPay - tax.totalDeductions;

      // Cap deduction at available pay (prevent negative salary)
      if (advanceDeduction > postTaxPay) {
        advanceDeduction = postTaxPay;
      }

      const netPay = postTaxPay - advanceDeduction;

      return {
        staff: s,
        records: records.length,
        ...payroll,
        ...tax,
        overtimeHours: otHours,
        netPay
      };
    });

    // Totals
    const totalPayout = payrollData.reduce((acc, curr) => acc + curr.netPay, 0);

    const handleProcessPayroll = async () => {
      if (!confirm(`Are you sure you want to process payroll for ${payrollData.length} staff members?\n\nTotal Payout: ₹${totalPayout.toLocaleString('en-IN')}\nPeriod: ${payrollPeriod}`)) {
        return;
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert("Error: No user logged in.");
        return;
      }

      try {
        const records: Partial<SalaryRecord>[] = payrollData.map(row => ({
          staffId: row.staff.id,
          employeeName: row.staff.name,
          month: payrollPeriod,
          payDate: new Date().toISOString(),
          status: 'Paid',
          basePay: Number((row.grossPay - row.overtimePay).toFixed(2)),
          overtimePay: Number(row.overtimePay.toFixed(2)),
          grossPay: Number(row.grossPay.toFixed(2)),
          totalHours: Number(row.totalHours.toFixed(2)),
          totalOvertime: Number(row.overtimeHours.toFixed(2)),
          incomeTax: Number(row.tax.toFixed(2)),
          nationalInsurance: Number(row.ni.toFixed(2)),
          pension: Number(row.pension.toFixed(2)),
          deductions: Number((row.grossPay - row.netPay).toFixed(2)), // Gross - Net to capture all deductions including Advance
          totalAmount: Number(row.netPay.toFixed(2)),
          taxCode: row.staff.taxCode || '1257L',
          niNumber: row.staff.niNumber || 'Unknown'
        }));

        await processPayrollBatch(userId, records);
        alert(`✅ Successfully processed payroll for ${payrollPeriod}!`);
      } catch (error) {
        console.error("Payroll Error:", error);
        alert("Failed to process payroll. Check console for details.");
      }
    };

    const handleGeneratePayslip = async (row: any) => {
      try {
        const { generatePayslip } = await import('../lib/pdf_generator');

        // Format Period (YYYY-MM -> Month YYYY)
        const [y, m] = payrollPeriod.split('-');
        const periodName = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        const regularHours = row.totalHours - row.overtimeHours;
        const regularAmount = row.grossPay - row.overtimePay;
        const advance = Number((row.staff.advance || 0).toFixed(2));

        generatePayslip({
          period: periodName,
          payDate: new Date().toLocaleDateString(),
          staff: row.staff,
          earnings: {
            regularHours: Number(regularHours.toFixed(2)),
            overtimeHours: Number(row.overtimeHours.toFixed(2)),
            regularAmount: Number(regularAmount.toFixed(2)),
            overtimeAmount: Number(row.overtimePay.toFixed(2)),
            grossPay: Number(row.grossPay.toFixed(2))
          },
          deductions: {
            tax: Number(row.tax.toFixed(2)),
            ni: Number(row.ni.toFixed(2)),
            pension: Number((row.pension || 0).toFixed(2)),
            advance: advance,
            total: Number((row.totalDeductions + advance).toFixed(2))
          },
          netPay: Number(row.netPay.toFixed(2))
        });

      } catch (e) {
        console.error(e);
        alert("Failed to generate PDF. See console.");
      }
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Payroll & HR <span className="text-sm font-bold bg-primary-100 text-primary-600 px-3 py-1 rounded-full uppercase tracking-widest align-middle ml-3">Admin Only</span></h1>
            <p className="text-slate-400 font-bold mt-2">Generate timesheets and process salaries.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Period</span>
              <input
                type="month"
                value={payrollPeriod}
                onChange={e => setPayrollPeriod(e.target.value)}
                className="font-black text-slate-900 outline-none"
              />
            </div>
            <button
              onClick={handleProcessPayroll}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all"
            >
              Process All (₹{totalPayout.toLocaleString('en-IN')})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]" data-testid="payroll-table">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Shifts</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Hours</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Rate</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Gross</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Tax/NI</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Advance</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right text-emerald-600">Net Pay</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payrollData.map(row => (
                <tr key={row.staff.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                        {row.staff.photo ? <img src={row.staff.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{row.staff.name}</p>
                        <p className="text-xs font-bold text-slate-400">{row.staff.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center font-bold text-slate-600">{row.records}</td>
                  <td className="p-6 text-right">
                    <div className="font-bold text-slate-900">{Number(row.totalHours).toFixed(2)} <span className="text-slate-300 text-xs">hrs</span></div>
                    {row.overtimePay > 0 && <div className="text-[10px] font-bold text-primary-500">+{Number(row.overtimeHours).toFixed(2)} OT</div>}
                  </td>
                  <td className="p-6 text-right font-mono text-xs font-bold text-slate-500">₹{row.staff.hourlyRate?.toFixed(2)}</td>
                  <td className="p-6 text-right font-mono font-bold text-slate-900">₹{row.grossPay.toFixed(2)}</td>
                  <td className="p-6 text-right">
                    <div className="font-mono font-bold text-rose-500">-₹{row.totalDeductions.toFixed(2)}</div>
                  </td>
                  <td className="p-6 text-right">
                    {row.staff.advance > 0 ? (
                      <div className="font-mono font-bold text-orange-500" title="Total Outstanding">-₹{row.staff.advance.toFixed(2)}</div>
                    ) : <span className="text-slate-200 font-bold">-</span>}
                  </td>
                  <td className="p-6 text-right">
                    <div className="font-mono font-black text-emerald-600 text-lg">₹{row.netPay.toFixed(2)}</div>
                  </td>
                  <td className="p-6 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStaffId(row.staff.id);
                        setActiveTab('attendance');
                      }}
                      className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-primary-50"
                      title="Edit Timesheet"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleGeneratePayslip(row)}
                      className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-primary-50"
                      title="Download Payslip"
                    >
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const generateDailyTasks = async () => {
    if (!['Owner', 'Director', 'Manager'].includes(userRole)) {
      alert("Only Managers can generate daily tasks.");
      return;
    }

    if (!confirm("Generate daily cleaning tasks for today?")) return;

    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');
    if (!userId) return;

    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

      const newTasks: ShopTask[] = [];

      // 1. Daily Tasks
      CLEANING_ROTA.daily.forEach((taskStr: string) => {
        newTasks.push({
          id: crypto.randomUUID(),
          title: taskStr,
          assignedTo: '', // Unassigned
          status: 'Pending',
          priority: 'Medium',
          date: dateStr,
          createdAt: new Date().toISOString(),
          description: "Generated from Daily Cleaning Rota"
        });
      });

      // 2. Weekly Task
      const weeklyTask = (CLEANING_ROTA.weekly as any)[dayName];
      if (weeklyTask) {
        newTasks.push({
          id: crypto.randomUUID(),
          title: `WEEKLY: ${weeklyTask}`,
          assignedTo: '',
          status: 'Pending',
          priority: 'High',
          date: dateStr,
          createdAt: new Date().toISOString(),
          description: "Weekly Deep Clean Task"
        });
      }

      // 3. Monthly Tasks (On the 1st of every month)
      if (today.getDate() === 1) {
        CLEANING_ROTA.monthly.forEach((monthTask: string) => {
          newTasks.push({
            id: crypto.randomUUID(),
            title: `MONTHLY: ${monthTask}`,
            assignedTo: '',
            status: 'Pending',
            priority: 'High',
            date: dateStr,
            createdAt: new Date().toISOString(),
            description: "Monthly Hygiene & Maintenance Check"
          });
        });
      }

      // Deduplicate against existing tasks to prevent double-generation
      const uniqueTasks = newTasks.filter(nt =>
        !tasks.some(existing => existing.title === nt.title && existing.date === nt.date)
      );

      if (uniqueTasks.length === 0) {
        alert("Daily tasks for today already exist.");
        return;
      }

      await addBatchTasks(userId, uniqueTasks);
      alert(`Generated ${uniqueTasks.length} tasks for ${dayName}.`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate tasks.");
    }
  };

  const handleSyncHours = async () => {
    console.log("G-Sync Clicked");
    console.log("Current Role:", userRole);
    console.log("User ID:", import.meta.env.VITE_USER_ID || auth.currentUser?.uid);

    if (!['Owner', 'Director', 'Manager'].includes(userRole)) {
      alert(`Permission Denied. You are '${userRole}'. Only Owner/Manager can sync.`);
      return;
    }
    if (!confirm("Update Shop Operating Hours from official Google Listing?\n\n(Mon-Thu: 8-9pm, Fri-Sat: 8-11pm, Sun: 8-8pm)")) return;


    const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
    if (!userId) {
      alert("Critial Error: User ID not found.");
      return;
    }

    // Hardcoded from verified Google Listing (Feb 2026)
    const GOOGLE_HOURS = {
      Monday: { start: '08:00', end: '21:00' },
      Tuesday: { start: '08:00', end: '21:00' },
      Wednesday: { start: '08:00', end: '21:00' },
      Thursday: { start: '08:00', end: '21:00' },
      Friday: { start: '08:00', end: '23:00' },
      Saturday: { start: '08:00', end: '23:00' },
      Sunday: { start: '08:00', end: '20:00' }
    };

    try {
      const ref = doc(db, 'shops', userId, 'settings', 'general');
      await setDoc(ref, { timings: GOOGLE_HOURS, lastSynced: new Date().toISOString() }, { merge: true });
      alert("✅ Shop Hours Successfully Updated From Google Listing.");
    } catch (e) {
      console.error("Sync Error:", e);
      alert("Failed to sync hours: " + e);
    }
  };

  const renderDashboard = () => {
    // Metrics Calculation
    const myRecords = attendance.filter((a: AttendanceRecord) => a.staffId === selectedStaffId);
    const totalWorkingDays = 20;
    const presentDays = myRecords.filter((r: AttendanceRecord) => r.status === 'Present').length;
    const attendanceRate = Math.min(100, Math.round((presentDays / totalWorkingDays) * 100));

    const lateArrivals = myRecords.filter(r => {
      if (!r.clockIn || !r.date) return false;
      const dayName = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      const startTime = shopHours[dayName]?.start || '08:00';
      const [targetH, targetM] = startTime.split(':').map(Number);
      const targetMins = targetH * 60 + targetM + 5;

      const [h, m] = r.clockIn.split(':').map(Number);
      const actualMins = h * 60 + m;
      return actualMins > targetMins;
    }).length;
    const delayRate = myRecords.length ? Math.round((lateArrivals / myRecords.length) * 100) : 0;

    let overtimeMins = 0;
    let negativeMins = 0;
    myRecords.forEach((r: AttendanceRecord) => {
      if (r.hoursWorked) {
        const diff = r.hoursWorked - 8;
        if (diff > 0) overtimeMins += diff * 60;
        else negativeMins += Math.abs(diff) * 60;
      }
    });

    return (
      <div className="space-y-12 pb-20 font-sans" data-testid="attendance-dashboard">
        <AttendanceSystem 
          userId={userId}
          staff={staff}
          attendance={attendance}
          selectedStaffId={selectedStaffId}
          logAction={logAction}
          delayRate={delayRate}
          attendanceRate={attendanceRate}
          overtimeMins={overtimeMins}
          leaves={leaves}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AttendanceAnalytics 
              attendance={attendance}
              selectedStaffId={selectedStaffId}
            />
            <StaffAttendanceTable 
              records={myRecords.filter((r: AttendanceRecord) => {
                if (!r.date) return false;
                const d = new Date(r.date);
                const today = new Date();
                return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
              })}
              shopHours={shopHours}
              onEdit={(record) => { setEditingRecord(record); setIsAddMode(false); }}
            />
        </div>
      </div>
    );
  };

  const renderRegistry = () => {
    // 1. Calculate Metrics
    const todayStr = new Date().toISOString().split('T')[0];
    const totalStaff = staff.length;
    const presentCount = staff.filter(s => attendance.some(a => a.staffId === s.id && a.date === todayStr && a.clockIn && !a.clockOut)).length;
    const leaveCount = staff.filter(s =>
      leaves.some(l => l.staffId === s.id && l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr)
    ).length;
    const lateCount = staff.filter(s =>
      attendance.some(a => {
        if (a.staffId !== s.id || a.date !== todayStr || !a.clockIn) return false;
        // Fix: Use T00:00:00 to ensure we get the correct Day Name from YYYY-MM-DD
        const dayName = new Date(todayStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        const startTime = shopHours[dayName]?.start || '08:00';
        const [targetH, targetM] = startTime.split(':').map(Number);
        const targetMins = targetH * 60 + targetM + 5; // 5 Minute Grace Period
        const [h, m] = a.clockIn.split(':').map(Number);
        return (h * 60 + m) > targetMins;
      })
    ).length;

    // 2. Search & Filter
    const q = registrySearch.toLowerCase();
    const visibleStaff = canManageUsers ? staff : staff.filter(s => s.id === currentStaffId);
    const filteredStaff = visibleStaff.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    ).sort((a, b) => {
      const priority: Record<string, number> = { 'Owner': 1, 'Director': 1, 'Manager': 2, 'Store In-charge': 3 };
      return (priority[a.role] || 99) - (priority[b.role] || 99);
    });

    const RegistryMetric = ({ title, value, icon: Icon, colorClass, trend }: any) => (
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className="text-[10px] font-black text-success-600 bg-success-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{trend}</span>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{value}</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans" data-testid="registry-view">
        {/* Header Segment */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Workforce Ledger</h1>
            <p className="text-sm text-neutral-500 font-medium">Enterprise personnel management & structural audit</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl border border-neutral-200/50 dark:border-white/5 shadow-inner">
              <button
                data-testid="view-mode-list"
                onClick={() => setRegistryViewMode('list')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  registryViewMode === 'list' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                List
              </button>
              <button
                data-testid="view-mode-grid"
                onClick={() => setRegistryViewMode('grid')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  registryViewMode === 'grid' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                Grid
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={() => setAddStaffModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Add Professional
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RegistryMetric title="Total Workforce" value={totalStaff} icon={Users} colorClass="bg-neutral-100 dark:bg-white/5 text-neutral-500" />
          <RegistryMetric title="On-Duty Logic" value={presentCount} icon={UserCheck} colorClass="bg-success-500/10 text-success-500" trend="+2 New" />
          <RegistryMetric title="Late Compliance" value={lateCount} icon={AlertCircle} colorClass="bg-error-500/10 text-error-500" />
          <RegistryMetric title="Leave Pool" value={leaveCount} icon={Calendar} colorClass="bg-primary-500/10 text-primary-500" />
        </div>

        {/* Search & Audit Tools */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Audit personnel by name, role, email or ID..."
            value={registrySearch}
            onChange={e => setRegistrySearch(e.target.value)}
            data-testid="staff-search-input"
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* List View / Data Table */}
        {registryViewMode === 'list' && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="staff-table">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-white/5 border-b border-neutral-100 dark:border-white/10">
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Personnel Member</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Designation</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Contact Identity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Operational Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {filteredStaff.map((s) => {
                    const myRecords = attendance.filter(a => a.staffId === s.id && a.date === todayStr);
                    const rec = myRecords.sort((a, b) => (b.clockIn || '').localeCompare(a.clockIn || ''))[0];
                    const active = !!(rec && !rec.clockOut);
                    const onLeave = leaves.some(l => l.staffId === s.id && l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr);
                    const scheduled = shifts.some(sh => sh.staff_id === s.id && sh.date === todayStr && sh.status !== 'rejected');

                    return (
                      <tr key={s.id} data-testid={`staff-row-${s.id}`} className="group hover:bg-neutral-50/50 dark:hover:bg-white/2 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 overflow-hidden border border-neutral-200/50 dark:border-white/5 relative shadow-sm group-hover:scale-105 transition-transform">
                              {s.photo ? (
                                <img src={s.photo} className="w-full h-full object-cover" alt={s.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                              )}
                              {active && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-success-500 border-2 border-white dark:border-neutral-900 rounded-full" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-neutral-900 dark:text-white">{s.name}</p>
                              <p className="text-[10px] font-mono text-neutral-400 tracking-tighter">ID: {s.id.toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border",
                            s.role === 'Owner' ? "bg-primary-500 text-white border-primary-400" : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border-transparent"
                          )}>
                            {s.role}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                              <Mail className="w-3 h-3 opacity-50" />
                              <span className="truncate max-w-[150px]">{s.email || 'No Email'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                              <Phone className="w-3 h-3 opacity-50" />
                              <span>{s.phone || 'No Phone'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {s.status === 'Inactive' ? (
                            <span className="flex items-center gap-2 text-[10px] font-black text-error-700 uppercase tracking-widest bg-error-50/50 px-2 py-1 rounded-lg">
                              <ShieldOff className="w-3 h-3" />
                              Deactivated
                            </span>
                          ) : active ? (
                            <span data-testid="status-present" className="flex items-center gap-2 text-[10px] font-black text-success-600 uppercase tracking-widest">
                              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                              Live in Store
                            </span>
                          ) : onLeave ? (
                            <span data-testid={`status-leave-${leaves.find(l => l.staffId === s.id && l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr)?.type.toLowerCase()}`} className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                              <span className="w-2 h-2 rounded-full bg-primary-500" />
                              On Vacation
                            </span>
                          ) : scheduled ? (
                            <span data-testid="status-scheduled" className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                              <span className="w-2 h-2 rounded-full bg-primary-500" />
                              Scheduled Today
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">
                              <span className="w-2 h-2 rounded-full bg-neutral-300" />
                              Off Duty
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingStaff(s); setStaffModalTab('details'); setAddStaffModalOpen(true); }}
                              className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all"
                              title="Audit File"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setIdCardStaff(s)}
                              className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all"
                              title="Generate Identity"
                            >
                              <IdCardIcon className="w-4 h-4" />
                            </button>
                            {(isAdmin || s.id === currentStaffId) && (
                              <button
                                data-testid={`menu-btn-${s.id}`}
                                onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                                className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-all"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Overflow Menu */}
                          {openMenuId === s.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <button onClick={(e) => { e.stopPropagation(); setIdCardStaff(s); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                <IdCardIcon className="w-4 h-4" /> View ID Card
                              </button>

                              <button onClick={(e) => { e.stopPropagation(); setEditingStaff(s); setAddStaffModalOpen(true); setOpenMenuId(null); }} data-testid={`edit-btn-${s.id}`} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-t border-slate-100">
                                <Pencil className="w-4 h-4" /> Edit Details
                              </button>

                              {canManageUsers && (
                                <button onClick={async (e) => {
                                  e.stopPropagation(); setOpenMenuId(null);
                                  const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
                                  if (confirm(`${s.status === 'Active' ? 'Deactivate' : 'Reactivate'} ${s.name}?`)) {
                                    const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
                                    if (userId) await updateStaffMember(userId, s.id, { status: nextStatus });
                                  }
                                }} className={cn(
                                  "w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 border-t border-slate-100 transition-colors",
                                  s.status === 'Active' ? "text-error-600 hover:bg-error-50" : "text-success-600 hover:bg-success-50"
                                )}>
                                  {s.status === 'Active' ? <ShieldOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                  {s.status === 'Active' ? 'Deactivate User' : 'Reactivate User'}
                                </button>
                              )}
                            </div>
                          )}
                          {/* Backdrop to close menu */}
                          {openMenuId === s.id && <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View / Professional Identity Cards */}
        {registryViewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStaff.map((s: StaffMember) => {
              const myRecords = attendance.filter((a: AttendanceRecord) => a.staffId === s.id && a.date === todayStr);
              const rec = myRecords.sort((a: AttendanceRecord, b: AttendanceRecord) => (b.clockIn || '').localeCompare(a.clockIn || ''))[0];
              const active = !!(rec && !rec.clockOut);
              const onLeave = leaves.some((l: LeaveRequest) => l.staffId === s.id && l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr);

              return (
                <div key={s.id} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                  {/* Decorative Gradient Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-all" />

                  <div className="flex flex-col items-center text-center relative z-10 flex-1">
                    <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-white/5 overflow-hidden border border-neutral-200/50 dark:border-white/5 mb-4 shadow-md group-hover:scale-110 transition-transform relative">
                      {s.photo ? (
                        <img src={s.photo} className="w-full h-full object-cover" alt={s.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                      )}
                      {active && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-success-500 border-4 border-white dark:border-neutral-900 rounded-full" />}
                    </div>

                    <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-0.5">{s.name}</h3>
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-white/20" />
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{s.role}</span>
                    </div>

                    <div className="w-full space-y-2 mb-6 text-left bg-neutral-50/50 dark:bg-white/2 p-3 rounded-2xl border border-neutral-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-neutral-400 uppercase tracking-wider">Status</span>
                        <span className={cn(
                          "flex items-center gap-1.5 font-black uppercase tracking-widest",
                          active ? "text-success-500" : onLeave ? "text-primary-500" : "text-neutral-400"
                        )}>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                          {active ? 'Live' : onLeave ? 'On Vacation' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-neutral-400 uppercase tracking-wider">Contract</span>
                        <span className="text-neutral-600 dark:text-neutral-300">{s.contractType}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-neutral-400 uppercase tracking-wider">NI ID</span>
                        <span className="text-neutral-600 dark:text-neutral-300 font-mono text-[9px]">{s.niNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2 relative z-10">
                    <button
                      onClick={() => { setEditingStaff(s); setStaffModalTab('details'); setAddStaffModalOpen(true); }}
                      className="flex-1 py-2 bg-neutral-100 dark:bg-white/5 text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest rounded-xl hover:bg-primary-500 hover:text-white transition-all border border-transparent"
                    >
                      Audit
                    </button>
                    <button
                      onClick={() => setIdCardStaff(s)}
                      className="p-2 bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 rounded-xl hover:bg-primary-500 hover:text-white transition-all"
                    >
                      <IdCardIcon className="w-4 h-4" />
                    </button>
                    {(isAdmin || s.id === currentStaffId) && (
                      <button
                        data-testid={`menu-btn-${s.id}`}
                        onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                        className="p-2 bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 rounded-xl hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Menu Popover */}
                    {openMenuId === s.id && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button onClick={() => { setSelectedStaffId(s.id); setActiveTab('attendance'); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center gap-3">
                          <TrendingUp className="w-4 h-4" /> Analytics
                        </button>
                        <button onClick={() => { setEditingStaff(s); setStaffModalTab('financials'); setAddStaffModalOpen(true); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center gap-3 border-t border-neutral-100 dark:border-white/5">
                          <DollarSign className="w-4 h-4" /> Payroll
                        </button>
                        <button onClick={() => { setOpenMenuId(null); if (confirm(`Terminate Record ${s.name}?`)) deleteStaffMember(import.meta.env.VITE_USER_ID || auth.currentUser?.uid || 'englabs-inventory-', s.id); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 flex items-center gap-3 border-t border-neutral-100 dark:border-white/5">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div >
    );
  };

  const handleLeaveSubmit = async () => {
    if (!newLeave.startDate || !newLeave.endDate) return; // if (!auth.currentUser...)
    const userId = import.meta.env.VITE_USER_ID || (auth.currentUser?.uid || 'englabs-inventory-');

    // Validate
    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    if (end < start) { alert("End date cannot be before start date"); return; }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const req: LeaveRequest = {
      id: crypto.randomUUID(),
      staffId: selectedStaffId,
      type: newLeave.type as LeaveType,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      totalDays: diffDays,
      status: 'Pending',
      reason: newLeave.reason || '',
      approvedBy: '',
      approvedAt: '',
      createdAt: new Date().toISOString(),
      requestedAt: new Date().toISOString()
    };

    try {
      await addLeaveRequest(userId, req);
      alert("Leave Request Submitted");
      setLeaveModalOpen(false);
      setNewLeave({ type: 'Annual', startDate: '', endDate: '' });
    } catch (e) {
      console.error(e);
      alert("Failed to submit request");
    }
  };

  const renderLeaveModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300 border border-white/10 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Request Absences</h3>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-1">Personnel Leave Logic</p>
            </div>
            <button onClick={() => setLeaveModalOpen(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-3">Absence Classification</label>
              <div className="flex gap-2">
                {['Annual', 'Sick', 'Unpaid'].map(t => (
                  <button
                    key={t}
                    onClick={() => setNewLeave(p => ({ ...p, type: t as any }))}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      newLeave.type === t
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent shadow-lg scale-[1.02]"
                        : "bg-white dark:bg-white/5 text-neutral-500 border-neutral-200 dark:border-white/10 hover:border-neutral-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase">Start Date</label>
                <input type="date" value={newLeave.startDate || ''} onChange={e => setNewLeave(p => ({ ...p, startDate: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase">End Date</label>
                <input type="date" value={newLeave.endDate || ''} onChange={e => setNewLeave(p => ({ ...p, endDate: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase">Reason (Optional)</label>
              <textarea
                value={newLeave.reason || ''}
                onChange={e => setNewLeave(p => ({ ...p, reason: e.target.value }))}
                className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold mt-1 h-20 resize-none"
                placeholder="Family vacation, appointment, etc..."
              />
            </div>

            <button onClick={handleLeaveSubmit} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg mt-4">
              Submit Request
            </button>
            <button onClick={() => setLeaveModalOpen(false)} className="w-full text-neutral-400 font-bold text-xs uppercase tracking-widest mt-4">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {

    const getDates = () => {
      const d = [];
      const start = new Date(currentDate);

      if (viewPeriod === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        for (let i = 0; i < 7; i++) {
          d.push(new Date(start));
          start.setDate(start.getDate() + 1);
        }
      } else if (viewPeriod === 'month') {
        start.setDate(1);
        const month = start.getMonth();
        while (start.getMonth() === month) {
          d.push(new Date(start));
          start.setDate(start.getDate() + 1);
        }
      }
      return d;
    };

    const dates = getDates();

    const handleExportTimesheet = () => {
      const exportData: any[] = [];

      // Determine which staff to export (All in Roster mode, specific one in Individual mode)
      const calendarStaff = staff.filter(s => (s.hourlyRate || 0) > 0 || (s.monthlyRate || 0) > 0 || (s.dailyRate || 0) > 0);
      const targetStaff = calendarMode === 'roster' ? calendarStaff : [calendarStaff.find(s => s.id === selectedStaffId) || calendarStaff[0]];

      targetStaff.forEach((s: StaffMember) => {
        dates.forEach((d: Date) => {
          const dateStr = d.toISOString().split('T')[0];
          const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });

          // 1. Get Roster/Shift Data
          const shift = shifts.find((sh: RotaShift) => sh.staff_id === s.id && sh.date === dateStr && sh.status !== 'rejected');

          // 2. Get Attendance/Actual Data
          const record = attendance.find((a: AttendanceRecord) => a.staffId === s.id && a.date === dateStr);

          // 3. Get Leave Data
          const leave = leaves.find((l: LeaveRequest) => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const check = new Date(d);
            check.setHours(12, 0, 0, 0);
            return l.staffId === s.id && l.status === 'Approved' && check >= start && check <= end;
          });

          // Build Row
          exportData.push({
            'Staff Name': s.name,
            'Role': s.role,
            'Date': dateStr,
            'Day': dayName,
            'Roster Start': shift?.start_time || '-',
            'Roster End': shift?.end_time || '-',
            'Roster Hours': shift?.total_hours || 0,
            'Clock In': record?.clockIn || '-',
            'Clock Out': record?.clockOut || '-',
            'Break Start': record?.breakStart || '-',
            'Actual Hours': record?.hoursWorked || 0,
            'Status': leave ? `${leave.type} Leave` : record?.status || (shift ? 'Scheduled' : 'Off'),
            'Notes': record?.notes || leave?.reason || shift?.conflict_reason || ''
          });
        });
      });

      // Generate Excel
      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Timesheet Export");

      const fileName = `Timesheet_Export_${dates[0].toISOString().split('T')[0]}_to_${dates[dates.length - 1].toISOString().split('T')[0]}.xlsx`;
      writeFile(wb, fileName);
    };

    const handlePrev = () => {
      const newDa = new Date(currentDate);
      if (viewPeriod === 'week') newDa.setDate(newDa.getDate() - 7);
      if (viewPeriod === 'month') newDa.setMonth(newDa.getMonth() - 1);
      if (viewPeriod === 'year') newDa.setFullYear(newDa.getFullYear() - 1);
      setCurrentDate(newDa);
    };

    const handleNext = () => {
      const newDa = new Date(currentDate);
      if (viewPeriod === 'week') newDa.setDate(newDa.getDate() + 7);
      if (viewPeriod === 'month') newDa.setMonth(newDa.getMonth() + 1);
      if (viewPeriod === 'year') newDa.setFullYear(newDa.getFullYear() + 1);
      setCurrentDate(newDa);
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-neutral-100 flex items-center justify-between">
           <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
             <button data-testid="view-mode-list" onClick={() => setCalendarMode('individual')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${calendarMode === 'individual' ? 'bg-white dark:bg-neutral-800 shadow-sm text-primary-600' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>My Schedule</button>
             <button data-testid="view-mode-grid" onClick={() => setCalendarMode('roster')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${calendarMode === 'roster' ? 'bg-white dark:bg-neutral-800 shadow-sm text-primary-600' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>Team Roster</button>
           </div>

           <div className="flex items-center gap-4">
             <button onClick={handlePrev} className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors">←</button>
             <div className="text-center min-w-[120px]">
               <span className="block text-sm font-black uppercase text-neutral-900 dark:text-white">{viewPeriod === 'year' ? currentDate.getFullYear() : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
               {viewPeriod === 'week' && <span className="block text-[10px] font-bold text-neutral-400">Week {Math.ceil(currentDate.getDate() / 7)}</span>}
             </div>
             <button onClick={handleNext} className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors">→</button>
           </div>

           <div className="flex items-center gap-2">
             <button onClick={handleExportTimesheet} className="bg-success-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md hover:bg-success-700 transition-all flex items-center gap-2">
               <span>📊</span> Export
             </button>
             <button onClick={() => setLeaveModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md hover:bg-primary-700 transition-all">+ Request Leave</button>
             <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
               {['week', 'month', 'year'].map(v => (
                 <button key={v} onClick={() => setViewPeriod(v as any)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewPeriod === v ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>
                   {v}
                 </button>
               ))}
             </div>
           </div>
         </div>

         <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden p-6 relative min-h-[400px]">
           {viewPeriod === 'year' && (
             <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                 <thead>
                   <tr>
                     <th className="p-4 text-left min-w-[200px] sticky left-0 bg-white dark:bg-neutral-900 z-10">
                       <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Personnel</span>
                     </th>
                     {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                       <th key={i} className="p-2 text-center min-w-[60px] border-l border-neutral-100 dark:border-white/5">
                         <span className="text-[10px] font-black uppercase text-neutral-300 dark:text-neutral-700">{m}</span>
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                   {(() => {
                     const calendarStaff = staff.filter(s => (s.hourlyRate || 0) > 0 || (s.monthlyRate || 0) > 0 || (s.dailyRate || 0) > 0);
                     return (calendarMode === 'roster' ? calendarStaff : [calendarStaff.find(s => s.id === selectedStaffId) || calendarStaff[0]]).map((s) => (
                       <tr key={s.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/2 transition-colors group">
                         <td className="p-4 sticky left-0 bg-white dark:bg-neutral-900 group-hover:bg-neutral-50/50 dark:group-hover:bg-white/2 transition-colors z-10 border-r border-neutral-100 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 overflow-hidden border border-neutral-200/50 dark:border-white/5">
                               {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : null}
                             </div>
                             <span className="text-xs font-black uppercase text-neutral-900 dark:text-white">{s.name.split(' ')[0]}</span>
                           </div>
                         </td>
                         {Array.from({ length: 12 }).map((_, monthIdx) => {
                           const relevantRecords = attendance.filter(a => {
                             // Robust String Parsing (YYYY-MM-DD) matches Unit Test Logic
                             if (!a.date) return false;
                             const [y, m] = a.date.split('-'); // ['2026', '02', '03']
                             const recordYear = parseInt(y);
                             const recordMonth = parseInt(m) - 1; // 0-indexed

                             return a.staffId === s.id &&
                               recordMonth === monthIdx &&
                               recordYear === currentDate.getFullYear();
                           });
                           const count = new Set(relevantRecords.map(r => r.date)).size;

                           return (
                             <td key={monthIdx} className="p-2 border-l border-neutral-100 dark:border-white/5 text-center">
                               {count > 0 ? (
                                 <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${count > 20 ? 'bg-success-500/10 text-success-600' : count > 10 ? 'bg-primary-500/10 text-primary-600' : 'bg-neutral-100 dark:bg-white/5 text-neutral-500'}`}>
                                   {count}d
                                 </div>
                               ) : <span className="text-neutral-200 dark:text-neutral-800">-</span>}
                             </td>
                           );
                         })}
                       </tr>
                     ));
                   })()}
                 </tbody>
               </table>
             </div>
           )}

           {viewPeriod !== 'year' && (
             <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                 <thead>
                   <tr>
                     <th className="p-4 text-left min-w-[150px] sticky left-0 bg-white dark:bg-neutral-900 z-10">
                       <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Personnel</span>
                     </th>
                     {dates.map((d, i) => (
                       <th key={i} className={`p-2 text-center min-w-[100px] border-l border-neutral-100 dark:border-white/5 ${d.toDateString() === new Date().toDateString() ? 'bg-primary-500/5' : ''}`}>
                         <div className="flex flex-col items-center">
                           <span className="text-[10px] font-black uppercase text-neutral-300 dark:text-neutral-700">{d.toLocaleString('default', { weekday: 'short' })}</span>
                           <span className={`text-sm font-black ${d.toDateString() === new Date().toDateString() ? 'text-primary-600' : 'text-neutral-700 dark:text-neutral-300'}`}>{d.getDate()}</span>
                         </div>
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                   {(() => {
                     const calendarStaff = staff.filter(s => (s.hourlyRate || 0) > 0 || (s.monthlyRate || 0) > 0 || (s.dailyRate || 0) > 0);
                     return (calendarMode === 'roster' ? calendarStaff : [calendarStaff.find(s => s.id === selectedStaffId) || calendarStaff[0]]).map(s => (
                       <tr key={s.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/2 transition-colors group">
                         <td className="p-4 sticky left-0 bg-white dark:bg-neutral-900 group-hover:bg-neutral-50/50 dark:group-hover:bg-white/2 transition-colors z-10 border-r border-neutral-100 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/5 overflow-hidden border border-neutral-200/50 dark:border-white/5">
                               {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : null}
                             </div>
                             <div>
                               <p className="text-xs font-black uppercase text-neutral-900 dark:text-white">{s.name.split(' ')[0]}</p>
                               <p className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tight">{s.role}</p>
                             </div>
                           </div>
                         </td>
                         {dates.map((d: Date, i: number) => {
                           const dateStr = d.toISOString().split('T')[0];
                           const records = attendance.filter(a => a.staffId === s.id && a.date === dateStr).sort((a, b) => (a.clockIn || '').localeCompare(b.clockIn || ''));
                           const isToday = dateStr === new Date().toISOString().split('T')[0];

                           // Check Leave
                           const leave = leaves.find((l: LeaveRequest) => {
                             const start = new Date(l.startDate);
                             const end = new Date(l.endDate);
                             start.setHours(0, 0, 0, 0);
                             end.setHours(23, 59, 59, 999);
                             const check = new Date(d);
                             check.setHours(12, 0, 0, 0);

                             return l.staffId === s.id && l.status === 'Approved' && check >= start && check <= end;
                           });

                           return (
                             <td key={i} className={`p-2 border-l border-neutral-100 dark:border-white/5 text-center relative ${isToday ? 'bg-primary-500/5' : ''}`}>
                               <div className="flex flex-col gap-1 items-center justify-center min-h-[40px]">
                                 {/* 1. Leave Badge */}
                                 {leave && (
                                   <div className={`px-2 py-1.5 rounded-lg inline-flex flex-col items-center w-full max-w-[80px] ${leave.type === 'Sick' ? 'bg-error-500/10 text-error-600' : 'bg-primary-500/10 text-primary-600'}`}>
                                     <span className="text-[10px] font-black uppercase text-center leading-none mb-0.5">{leave.type === 'Annual' ? 'Annual' : leave.type}</span>
                                   </div>
                                 )}

                                 {/* 2. Attendance Badges (Can coexist with Leave) */}
                                 {records.length > 0 && records.map(rec => (
                                   <div key={rec.id} className="bg-success-500/10 text-success-600 px-2 py-1.5 rounded-lg inline-flex flex-col items-center w-full max-w-[80px] shadow-sm border border-success-500/20">
                                     <span className="text-[10px] font-black uppercase leading-none mb-0.5">Present</span>
                                     <span className="text-[8px] font-mono opacity-80 leading-none whitespace-nowrap">{rec.clockIn} - {rec.clockOut || 'Now'}</span>
                                   </div>
                                 ))}

                                 {/* 3. Shift Badge (Only if NO Attendance) */}
                                 {records.length === 0 && (() => {
                                   const planned = shifts.find(p => p.staff_id === s.id && p.date === dateStr);
                                   if (planned) {
                                     return (
                                       <div className={`px-2 py-1.5 rounded-lg inline-flex flex-col items-center w-full max-w-[80px] border ${leave ? 'bg-neutral-50 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border-neutral-100 dark:border-white/5 opacity-50' : 'bg-primary-500/10 text-primary-600 border-primary-500/20'}`}>
                                         <span className="text-[9px] font-black uppercase tracking-wide leading-none mb-0.5">Shift</span>
                                         <span className="text-[8px] font-mono leading-none whitespace-nowrap">{planned.start_time}-{planned.end_time}</span>
                                       </div>
                                     );
                                   }
                                   // Spacer dot for empty days
                                   if (!leave && records.length === 0) return <span className="w-1.5 h-1.5 rounded-full bg-neutral-100 dark:bg-white/5 inline-block mt-1"></span>;
                                   return null;
                                 })()}
                               </div>
                             </td>
                           );
                         })}
                       </tr>
                     ));
                   })()}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      </div>
    );
  };

  const renderLeaveRequests = () => {
    const pendingRequests = leaves.filter((l: LeaveRequest) => l.status === 'Pending').sort((a: LeaveRequest, b: LeaveRequest) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const handleAction = async (req: LeaveRequest, status: 'Approved' | 'Rejected') => {
      const currentUserId = auth.currentUser?.uid || 'englabs-inventory-';
      const userId = import.meta.env.VITE_USER_ID || currentUserId;
      await updateLeaveRequest(userId, req.id, {
        status,
        approvedBy: currentUserId,
        approvedAt: new Date().toISOString()
      });
      alert(`Request ${status} Successfully`);
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="font-black text-2xl text-neutral-900 tracking-tight mb-6">Pending Requests ({pendingRequests.length})</h3>

        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-neutral-200 rounded-[2rem]">
            <span className="text-4xl">🏝️</span>
            <p className="mt-4 font-bold text-neutral-400">No pending leave requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map((req: LeaveRequest) => {
              const s = staff.find((st: StaffMember) => st.id === req.staffId);
              return (
                <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">✈️</div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden">
                      {s?.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div>
                      <h4 className="font-black text-neutral-900">{s?.name}</h4>
                      <span className="text-xs font-bold text-neutral-400 uppercase">{req.type} Leave</span>
                    </div>
                  </div>

                  <div className="my-6 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-neutral-500 uppercase">Duration</span>
                      <span className="font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">{req.totalDays} Days</span>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="flex justify-between text-sm font-bold text-neutral-900">
                        <span>{new Date(req.startDate).toLocaleDateString()}</span>
                        <span className="text-neutral-300">➜</span>
                        <span>{new Date(req.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {req.reason && <p className="mt-3 text-xs font-medium text-neutral-500 italic">"{req.reason}"</p>}
                  </div>

                  <div className="flex gap-3 relative z-10">
                    {/* STRICT APPROVAL LOGIC */}
                    {(() => {
                      const canApprove = (approver: UserRole, approverName: string | undefined, reqStaffName: string | undefined) => {
                        if (!approverName || !reqStaffName) return false;
                        const aName = approverName.toUpperCase();
                        const rName = reqStaffName.toUpperCase();

                        // 1. Self-Check
                        if (aName === rName) return false;

                        // 2. Classify Requester Group
                        const isCoreMgmt = rName.includes('SALIL') || rName.includes('PARTH') || rName.includes('PARAS');
                        const isSupport = rName.includes('BHARAT') || rName.includes('GAURAV');
                        const isEmployee = !isCoreMgmt && !isSupport;

                        // 3. Define Rules
                        if (isEmployee) {
                          // Employees report to PARAS
                          if (aName.includes('PARAS')) return true;
                          // Fallback: Salil/Parth can also approve if Paras is away (Super-Admin override)
                          if (aName.includes('SALIL') || aName.includes('PARTH')) return true;
                        }

                        if (rName.includes('PARAS')) {
                          // Paras reports to Salil or Parth
                          if (aName.includes('SALIL') || aName.includes('PARTH')) return true;
                        }

                        if (isSupport) {
                          // Bharat/Gaurav report to Salil (based on Chart)
                          if (aName.includes('SALIL')) return true;
                        }

                        if (rName.includes('SALIL') || rName.includes('PARTH')) {
                          // Top level cross-approval (e.g. Bharat can approve them?)
                          // Based on chart, they are top, so maybe Bharat (Owner) approves them.
                          if (approver === 'Owner') return true;
                        }

                        return false;
                      };

                      const iCanApprove = canApprove(userRole, staff.find(s => s.id === currentStaffId)?.name, s?.name);

                      return iCanApprove ? (
                        <>
                          <button onClick={() => handleAction(req, 'Rejected')} className="flex-1 py-3 bg-white border border-neutral-200 text-neutral-400 font-black uppercase text-xs rounded-xl hover:bg-error-50 hover:text-error-600 hover:border-error-100 transition-all">Reject</button>
                          <button onClick={() => handleAction(req, 'Approved')} className="flex-1 py-3 bg-neutral-900 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:bg-success-600 transition-all">Approve</button>
                        </>
                      ) : (
                        <div className="w-full py-3 bg-neutral-50 border border-neutral-100 text-neutral-400 font-bold uppercase text-xs rounded-xl text-center">
                          {req.staffId === currentStaffId ? "Awaiting Approval" : "View Only"}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  const renderAvailabilityForm = () => {
    // 1. Determine Edit Permissions
    const isSelf = selectedStaffId === currentStaffId;
    const currentUser = staff.find(s => s.id === currentStaffId);
    const isSalil = currentUser?.name.toUpperCase().includes('SALIL');
    const canEditAvailability = isSelf || !!isSalil;

    // Team Availability Visualizer Component
    const TeamAvailabilityVisualizer = () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      return (
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-neutral-900">Team Availability Overview</h3>
              <p className="text-sm font-bold text-neutral-400">Week of {rotaDate.toLocaleDateString()}</p>
            </div>
            <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-success-400"></div> Available</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-primary-400"></div> Partial</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-neutral-200"></div> Unavailable</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-[10px] font-black uppercase text-neutral-400 tracking-widest border-b border-neutral-100 min-w-[150px]">Staff Member</th>
                  {days.map(d => (
                    <th key={d} className="p-2 text-center text-[10px] font-black uppercase text-neutral-300 border-b border-neutral-100 min-w-[80px]">{d.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {staff.map(s => {
                  const pref = validPreferences.find(p => p.staffId === s.id); // Use validPreferences for deduplication

                  return (
                    <tr key={s.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                            {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                          </div>
                          <div>
                            <p className="text-xs font-black text-neutral-700">{s.name.split(' ')[0]}</p>
                            <p className="text-[9px] font-bold text-neutral-400">{s.role}</p>
                          </div>
                        </div>
                      </td>
                      {days.map(day => {
                        const status = pref?.availability?.[day]?.status || 'available'; // Default to available if not set
                        const specificStart = pref?.availability?.[day]?.start;
                        const specificEnd = pref?.availability?.[day]?.end;

                        let colorClass = 'bg-success-100 text-success-600'; // Available
                        let icon = '✓';

                        if (status === 'unavailable') {
                          colorClass = 'bg-neutral-100 text-neutral-300';
                          icon = '✕';
                        } else if (status === 'specific') {
                          colorClass = 'bg-primary-100 text-primary-600';
                          icon = '⏱';
                        }

                        return (
                          <td key={day} className="p-2 text-center">
                            <div className="flex justify-center group/cell relative">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${colorClass}`}>
                                {icon}
                              </div>

                              {/* Hover Tooltip for Specific Hours */}
                              {status === 'specific' && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neutral-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {specificStart} - {specificEnd}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 font-sans" data-testid="staff-view-container">
        {/* 1. Team Overview Matrix (Visual) */}
        <TeamAvailabilityVisualizer />

        {/* 2. Individual Editor Form */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-neutral-900 mb-2">Editor</h2>
            <p className="text-neutral-500 font-bold text-sm">Update preferences for specific staff.</p>
          </div>

          {/* Admin Staff Selector */}
          {canManageUsers && (
            <div className="mb-8 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
              <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400 mb-2 block">Select Staff Member</label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none text-sm"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
                <ChevronRight className="w-4 h-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90" />
              </div>
            </div>
          )}

          <AvailabilityForm
            currentStaffId={selectedStaffId}
            rotaDate={rotaDate}
            rotaPreferences={rotaPreferences}
            canEditAvailability={canEditAvailability}
          />
        </div>
      </div>
    );
  };

  const AvailabilityForm = ({
    currentStaffId,
    rotaDate,
    rotaPreferences,
    canEditAvailability
  }: {
    currentStaffId: string;
    rotaDate: Date;
    rotaPreferences: RotaPreference[];
    canEditAvailability: boolean;
  }) => {
    const existingPref = rotaPreferences.find(p => p.staffId === currentStaffId && p.weekStart === rotaDate.toISOString().split('T')[0]);
    const [targetHours, setTargetHours] = useState(existingPref?.targetBoardHours || 40);
    const [dailyAvailability, setDailyAvailability] = useState<Record<string, any>>(existingPref?.availability || {});

    // Effect to update local state when prefs change (e.g. seeded)
    useEffect(() => {
      if (existingPref) {
        setTargetHours(existingPref.targetBoardHours);
        setDailyAvailability(existingPref.availability || {});
      } else {
        // Reset if viewing a new person with no prefs
        setTargetHours(40);
        setDailyAvailability({});
      }
    }, [existingPref, currentStaffId]); // Added currentStaffId to force reset on switch

    const handleDailyChange = (day: string, field: string, value: any) => {
      if (!canEditAvailability) return;
      setDailyAvailability((prev: any) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
          ...(field === 'status' && value === 'specific' && !prev[day]?.start ? { start: '09:00', end: '17:00' } : {})
        }
      }));
    };

    const handleSubmitAvailability = async () => {
      const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
      if (!userId) return;

      const weekStart = rotaDate.toISOString().split('T')[0];
      const deterministicId = `pref_${currentStaffId}_${weekStart}`;

      const newPref: RotaPreference = {
        id: deterministicId,
        staffId: currentStaffId,
        weekStart: weekStart,
        targetBoardHours: targetHours,
        availability: dailyAvailability
      };

      try {
        await saveRotaPreference(userId, newPref);
        alert("Availability Updated! Your manager will see your detailed preferences.");
      } catch (e) {
        console.error(e);
        alert("Failed to save preference.");
      }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
      <>
        <h3 className="text-xl font-black text-neutral-900 mb-2">My Availability</h3>
        <p className="text-sm text-neutral-500 mb-6 font-bold">Set your desired working hours for the week starting {rotaDate.toLocaleDateString()}.</p>

        <div className="space-y-4 mb-6">
          <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Target Weekly Hours</label>
          <input
            type="number"
            value={targetHours}
            disabled={!canEditAvailability}
            onChange={(e) => setTargetHours(Number(e.target.value))}
            className={`w-full p-4 bg-neutral-50 rounded-xl font-black text-2xl outline-none focus:ring-2 ring-success-500/20 ${!canEditAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-neutral-400 mb-2">Daily Preferences</h4>
          {days.map(day => (
            <div key={day} className="p-3 border border-neutral-100 rounded-xl bg-neutral-50/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-neutral-700">{day}</span>
                <select
                  value={dailyAvailability[day]?.status || 'available'}
                  disabled={!canEditAvailability}
                  onChange={(e) => handleDailyChange(day, 'status', e.target.value)}
                  className={`text-xs font-bold bg-white border border-neutral-200 rounded-lg p-1.5 outline-none ${!canEditAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="specific">Specific Hours</option>
                </select>
              </div>
              {dailyAvailability[day]?.status === 'specific' && (
                <div className="flex gap-2">
                  <input type="time" disabled={!canEditAvailability} value={dailyAvailability[day]?.start || '09:00'} onChange={e => handleDailyChange(day, 'start', e.target.value)} className={`w-full p-2 bg-white rounded-lg text-xs font-mono font-bold border border-neutral-200 ${!canEditAvailability ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  <span className="self-center text-neutral-400">-</span>
                  <input type="time" disabled={!canEditAvailability} value={dailyAvailability[day]?.end || '17:00'} onChange={e => handleDailyChange(day, 'end', e.target.value)} className={`w-full p-2 bg-white rounded-lg text-xs font-mono font-bold border border-neutral-200 ${!canEditAvailability ? 'opacity-50 cursor-not-allowed' : ''}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmitAvailability}
          disabled={!canEditAvailability}
          className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all ${canEditAvailability ? 'bg-success-500 hover:bg-success-600 text-white shadow-success-500/20' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}
        >
          {canEditAvailability ? 'Submit Preferences' : 'View Only (Specific to Salil/Self)'}
        </button>
      </>
    );

  };

  const renderRotaBuilder = () => {
    const toMinutes = (time: string) => {
      const parts = time.split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(rotaDate);
      d.setDate(d.getDate() + i);
      return d;
    });

    const handleDrop = async (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      if (!e.dataTransfer) return;

      const staffId = e.dataTransfer.getData('staffId');
      if (!staffId) return;

      const foundStaff = staff.find((s: StaffMember) => s.id === staffId);

      const start = '09:00';
      const end = '17:00';

      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
      const newStart = toMinutes(start);
      const newEnd = toMinutes(end);

      const newShift: any = {
        id: crypto.randomUUID(),
        staff_id: staffId,
        staff_name: foundStaff?.name || 'Staff',
        date: dateStr,
        week_start: rotaDate.toISOString().split('T')[0],
        start_time: start,
        end_time: end,
        total_hours: 8,
        status: 'published',
        conflict: false
      };

      // Conflict Check: Operating Hours
      const hours = shopHours[dayName];
      if (hours) {
        const shopOpen = toMinutes(hours?.start || '08:00');
        const shopClose = toMinutes(hours?.end || '22:00');
        if (newStart < shopOpen || newEnd > shopClose) {
          newShift.conflict = true;
          newShift.conflict_reason = `Outside shop hours (${hours?.start || '08:00'}-${hours?.end || '22:00'})`;
        }
      }

      const existingShifts = shifts.filter((s: RotaShift) => s.staff_id === staffId && s.date === dateStr && s.status !== 'rejected');

      for (const existing of existingShifts) {
        const existingStart = toMinutes(existing.start_time);
        const existingEnd = toMinutes(existing.end_time);

        if (existingStart < newEnd && newStart < existingEnd) {
          newShift.conflict = true;
          newShift.conflict_reason = 'Overlapping shift';
          break;
        }
      }

      // Conflict Check: Weekly Limit (Preference or Default >40)
      const weeklyHours = shifts
        .filter((s: RotaShift) => s.staff_id === staffId && s.week_start === newShift.week_start && s.status !== 'rejected')
        .reduce((sum: number, s: RotaShift) => sum + s.total_hours, 0);

      // Calculate staff preference
      const pref = rotaPreferences.find((p: RotaPreference) => p.staffId === staffId && p.weekStart === newShift.week_start);
      const maxHours = pref ? pref.targetBoardHours : 40;

      if (weeklyHours + newShift.total_hours > maxHours) {
        newShift.conflict = true;
        newShift.conflict_reason = `Weekly limit exceeded (> ${maxHours}h)`;
      }

      const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;

      setShifts(prev => [...prev, newShift]);

      // Persist to Firestore immediately so it can be deleted later
      if (userId) {
        setDoc(doc(db, 'shops', userId, 'rota', newShift.id), newShift)
          .catch(e => console.error("Failed to save shift:", e));
      }

      logAction('Rota Update', 'staff', `Assigned shift to ${newShift.staff_name} on ${dateStr}`, 'Info');
    };

    const resetRota = async () => {
      // Logic split: Validation happens in UI now. This function runs the ACTION.
      setResetConfirm(false); // Close UI

      let shiftsToDelete: RotaShift[] = [];
      try {
        const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
        if (!userId) {
          alert("Error: You are not authenticated (No Shop ID). Please reload or login.");
          return;
        }

        const startStr = weekDates[0].toISOString().split('T')[0];
        const endStr = weekDates[6].toISOString().split('T')[0];

        // Debug: Log the range
        console.log(`Resetting Rota for range: ${startStr} to ${endStr}`);

        // Aggressive Filter
        shiftsToDelete = shifts.filter((s: RotaShift) => {
          if (s.week_start === startStr) return true;
          if (s.date >= startStr && s.date <= endStr) return true;
          return false;
        });

        if (shiftsToDelete.length === 0) {
          alert("No shifts found to delete for this week.");
          return;
        }

        const batch = writeBatch(db);
        shiftsToDelete.forEach((s: RotaShift) => {
          const ref = doc(db, 'shops', userId, 'rota', s.id);
          batch.delete(ref);
        });
        await batch.commit();

        setShifts(prev => prev.filter((s: RotaShift) => !shiftsToDelete.find((d: RotaShift) => d.id === s.id)));
        logAction('Rota Reset', 'staff', `Cleared ${shiftsToDelete.length} shifts for week ${startStr}`, 'Warning');
        alert(`Successfully deleted ${shiftsToDelete.length} shifts.`);
      } catch (e: any) {
        console.error("Reset Failed:", e);
        // Rollback: Re-add the deleted shifts
        setShifts(prev => [...prev, ...shiftsToDelete]);
        alert(`Failed to reset rota: ${e.message}`);
      }
    };

    const generateAutoRota = async () => {
      // 1. Define Slots Dynamically based on Shop Hours
      // We will generate slots day-by-day inside the loop, 
      // but if we need a standard structure, we can try to average it. 
      // Better: Generate shifts specifically for each day's hours.

      const weekStart = weekDates[0].toISOString().split('T')[0];
      const weekEnd = weekDates[6].toISOString().split('T')[0];

      let newShifts: RotaShift[] = [];

      // 2. Iterate Days
      weekDates.forEach((date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }); // 'Monday'

        // Get Open Hours
        const hours = shopHours[dayName] || { start: '08:00', end: '22:00' };
        const [openH, openM] = hours.start.split(':').map(Number);
        const [closeH, closeM] = hours.end.split(':').map(Number);

        const openMins = openH * 60 + openM;
        const closeMins = closeH * 60 + closeM;
        const totalDurationMins = closeMins - openMins;

        // Strategy: Divide day into 4-hour chunks approximately?
        // Or 3 shifts: Opening (08-16), Middle (12-20), Closing (16-Close)
        // Let's generate slots covering the full duration

        const SLOTS: { start: string, end: string, hours: number }[] = [];

        // Opening Shift (4 hrs)
        SLOTS.push({
          start: hours.start,
          end: `${(openH + 4).toString().padStart(2, '0')}:${openM.toString().padStart(2, '0')}`,
          hours: 4
        });

        // Mid Shift (Start at Open + 4)
        SLOTS.push({
          start: `${(openH + 4).toString().padStart(2, '0')}:${openM.toString().padStart(2, '0')}`,
          end: `${(openH + 8).toString().padStart(2, '0')}:${openM.toString().padStart(2, '0')}`,
          hours: 4
        });

        // Closing Shift (Start at Close - 5 or 6? Let's say Close - 4)
        SLOTS.push({
          start: `${(closeH - 4).toString().padStart(2, '0')}:${closeM.toString().padStart(2, '0')}`,
          end: hours.end,
          hours: 4
        });

        // Tracker for daily shifts per person to enforce max 2 shifts
        const dailyShiftCounts: Record<string, number> = {};

        SLOTS.forEach((slot: { start: string, end: string, hours: number }) => {
          // Shuffle Staff for Fairness (Randomize distribution)
          const shuffledStaff = [...staff].sort(() => Math.random() - 0.5);

          // Find Candidate
          const candidate = shuffledStaff.find((s: StaffMember) => {
            // Rule 1: Max 2 shifts per day
            if ((dailyShiftCounts[s.id] || 0) >= 2) return false;

            // Rule 2: Check Availability Preference
            const pref = validPreferences.find((p: RotaPreference) => p.staffId === s.id);
            if (pref && pref.availability) {
              const dayPref = pref.availability[dayName];
              if (dayPref && dayPref.status === 'unavailable') return false;
            }

            // Rule 3: Avoid double-booking in exact same slot
            if (newShifts.some((ns: RotaShift) => ns.staff_id === s.id && ns.date === dateStr && ns.start_time === slot.start)) return false;

            return true;
          });

          if (candidate) {
            dailyShiftCounts[candidate.id] = (dailyShiftCounts[candidate.id] || 0) + 1;

            newShifts.push({
              id: crypto.randomUUID(),
              staff_id: candidate.id,
              staff_name: candidate.name,
              week_start: weekStart,
              day: dayName,
              start_time: slot.start,
              end_time: slot.end,
              total_hours: slot.hours,
              status: 'pending',
              date: dateStr
            });
          }
        });
      });

      // 3. Commit - Robust Clear & Set
      const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;

      // Identify OLD shifts that conflict (for deletion) to ensure clean slate
      const conflictingOldShifts = shifts.filter(s => s.week_start === weekStart || (s.date >= weekStart && s.date <= weekEnd));

      // Update Local State (Remove old conflicts, Add new)
      setShifts(prev => [...prev.filter(s => !conflictingOldShifts.find(c => c.id === s.id)), ...newShifts]);

      // Update Firestore
      if (userId) {
        const batch = writeBatch(db);
        // Delete Old Conflicts
        conflictingOldShifts.forEach(s => {
          const ref = doc(db, 'shops', userId, 'rota', s.id);
          batch.delete(ref);
        });
        // Add New Shifts
        newShifts.forEach(s => {
          const ref = doc(db, 'shops', userId, 'rota', s.id);
          batch.set(ref, s);
        });
        await batch.commit();
      }
      alert(`Auto-Generated ${newShifts.length} shifts (Cleared ${conflictingOldShifts.length} old shifts)!`);
    };


    const handleRemoveShift = async (shiftId: string) => {
      if (!confirm("Delete this shift?")) return;

      const shiftToRestore = shifts.find(s => s.id === shiftId);
      if (!shiftToRestore) return; // Should not happen

      // Optimistic Update
      setShifts(prev => prev.filter(s => s.id !== shiftId));

      try {
        const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
        if (userId) {
          await deleteDoc(doc(db, 'shops', userId, 'rota', shiftId));
        }
        logAction('Rota Update', 'staff', 'Removed shift', 'Warning');
      } catch (e) {
        console.error("Failed to delete shift:", e);
        // Rollback
        setShifts(prev => [...prev, shiftToRestore]);
        alert("Failed to delete shift from server. It may reappear on refresh.");
      }
    };


    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-200px)] flex flex-col md:flex-row gap-6">

        {/* Left: Staff Source */}
        <div className="w-full md:w-64 bg-white rounded-[2rem] border border-neutral-100 p-4 md:p-6 flex flex-col shadow-sm shrink-0">
          <h3 className="font-black text-neutral-900 mb-4 px-2">Staff List</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-2 md:gap-0 md:space-y-3 pb-0">
            {staff.map((s: StaffMember) => {
              const weekStart = rotaDate.toISOString().split('T')[0];
              const hours = shifts
                .filter((shift: RotaShift) => shift.staff_id === s.id && shift.week_start === weekStart && shift.status !== 'rejected')
                .reduce((sum: number, shift: RotaShift) => sum + shift.total_hours, 0);

              const pref = rotaPreferences.find((p: RotaPreference) => p.staffId === s.id && p.weekStart === weekStart);
              const maxHours = pref ? pref.targetBoardHours : 40;

              return (
                <div key={s.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('staffId', s.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="bg-neutral-50 p-2 md:p-3 rounded-xl border border-neutral-100 hover:border-primary-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative"
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 overflow-hidden shrink-0">
                      {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="text-xs font-black text-neutral-900 leading-tight">{s.name}</p>
                      <p className="text-[9px] font-bold text-neutral-400 uppercase">{s.role}</p>
                    </div>
                  </div>
                  <div className={`absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-black border ${hours > maxHours ? 'bg-error-100 text-error-700 border-error-200' : 'bg-primary-50 text-primary-700 border-primary-100'}`}>
                    {hours}h / {maxHours}h
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-400 font-bold">
            Drag staff to the calendar →
          </div>
        </div>

        {/* Right: Calendar Grid */}
        <div className="flex-1 bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm flex flex-col min-w-0">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
            <h3 className="font-black text-xl text-neutral-900">
              Week of {weekDates[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </h3>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button onClick={() => { const d = new Date(rotaDate); d.setDate(d.getDate() - 7); setRotaDate(d); }} className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center">←</button>
              <button onClick={() => { const d = new Date(rotaDate); d.setDate(d.getDate() + 7); setRotaDate(d); }} className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center">→</button>
              <button onClick={async () => {
                const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
                if (userId) {
                  await publishRota(userId, shifts);
                  alert('Rota Published to Server!');
                }
              }} className="ml-4 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-success-600 transition-colors">Publish Rota</button>

              <button onClick={generateAutoRota} className="ml-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-primary-700 transition-colors flex items-center gap-2">
                ✨ Auto-Fill
              </button>

              {!resetConfirm ? (
                <button onClick={() => setResetConfirm(true)} className="ml-2 bg-error-50 text-error-600 border border-error-100 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-error-100 transition-colors">
                  Reset
                </button>
              ) : (
                <div className="flex gap-2 ml-2 animate-in slide-in-from-right-4 duration-300">
                  <button onClick={resetRota} className="bg-error-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-error-700 shadow-md">
                    Confirm?
                  </button>
                  <button onClick={() => setResetConfirm(false)} className="bg-neutral-100 text-neutral-600 px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-neutral-200">
                    X
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SPLIT LAYOUT: Fixed Header/Staging + Scrollable Timeline */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-200">

            {/* 1. STAGING HEADER (Dates + Availability Pool) - FIXED at top */}
            <div className="flex flex-shrink-0 bg-white border-b border-neutral-200 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] z-20 overflow-x-auto custom-scrollbar">
              <div className="w-16 flex-shrink-0 bg-white border-r border-neutral-100"></div>
              <div className="flex-1 flex min-w-[800px]">
                {weekDates.map((date: Date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const dayShifts = shifts.filter((s: RotaShift) => s.date === dateStr && s.status !== 'rejected');

                  return (
                    <div key={dateStr} className={`flex-1 min-w-[120px] border-r border-neutral-100 flex flex-col ${isToday ? 'bg-primary-50/20' : ''}`}>
                      <div className={`h-12 border-b border-neutral-50 flex flex-col items-center justify-center ${isToday ? 'bg-primary-50 text-primary-700' : 'bg-white'}`}>
                        <span className="text-[10px] font-bold uppercase text-neutral-400">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className="text-sm font-black leading-none">{date.getDate()}</span>
                      </div>
                      <div className="p-1 min-h-[40px] max-h-24 overflow-y-auto custom-scrollbar flex flex-wrap content-start gap-1 bg-neutral-50/50">
                        {validPreferences
                          .filter((p: RotaPreference) => {
                            const status = p.availability?.[date.toLocaleDateString('en-US', { weekday: 'long' })]?.status;
                            return status === 'available' || status === 'specific';
                          })
                          .map((p: RotaPreference) => {
                            const s = staff.find((st: StaffMember) => st.id === p.staffId);
                            if (!s) return null;
                            const isScheduled = dayShifts.some((shift: RotaShift) => shift.staff_id === s.id);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                            const avail = p.availability?.[dayName];
                            if (isScheduled) return null;
                            return (
                              <div key={p.id} draggable onDragStart={(e) => { e.dataTransfer.setData('staffId', s.id); e.dataTransfer.effectAllowed = 'copy'; }} className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-md px-1.5 py-1 cursor-grab active:cursor-grabbing hover:border-success-400 hover:shadow-sm transition-all shadow-sm w-full">
                                {s.photo ? (
                                  <div className="w-4 h-4 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                                    <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-success-500 shrink-0"></div>
                                )}
                                <span className="text-[9px] font-bold text-neutral-700 truncate flex-1">{s.name.split(' ')[0]}</span>
                                {avail?.start && <span className="text-[8px] text-neutral-400 font-mono tracking-tight">{avail.start}-{avail.end}</span>}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SCROLLABLE TIMELINE (Time Axis + Grid) */}
            <div className="flex-1 overflow-y-auto overflow-x-auto flex relative min-h-0 bg-neutral-50/30">
              <div className="w-16 flex-shrink-0 bg-white border-r border-neutral-100 sticky left-0 z-30 select-none">
                {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => (
                  <div key={hour} className="h-[60px] border-b border-neutral-50 text-[10px] font-bold text-neutral-400 flex items-start justify-center pt-1">{hour}:00</div>
                ))}
              </div>
              <div className="flex-1 flex min-w-[800px]">
                {weekDates.map((date: Date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
                  const dayShifts = shifts.filter((s: RotaShift) => s.date === dateStr && s.status !== 'rejected');
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  const checkCoverage = (hour: number) => {
                    const timings = (shopHours as any)[dayName];
                    if (!timings) return true;
                    const [openH] = (timings?.start || '08:00').split(':').map(Number);
                    const [closeH] = (timings?.end || '22:00').split(':').map(Number);
                    if (hour < openH || hour >= closeH) return true;
                    return dayShifts.some((s: RotaShift) => {
                      const [sH] = s.start_time.split(':').map(Number);
                      const [eH] = s.end_time.split(':').map(Number);
                      return hour >= sH && hour < eH;
                    });
                  };

                  return (
                    <div key={dateStr}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-primary-50/30'); }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-primary-50/30'); }}
                      onDrop={(e) => { e.currentTarget.classList.remove('bg-primary-50/30'); handleDrop(e, dateStr); }}
                      className={`flex-1 min-w-[120px] border-r border-neutral-100 relative ${isToday ? 'bg-primary-50/5' : ''}`}
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => {
                        const isCovered = checkCoverage(hour);
                        return (
                          <div key={hour} className={`h-[60px] border-b border-neutral-100 box-border relative ${!isCovered ? 'bg-error-50/40 pattern-diagonal-lines' : ''}`}>
                            {!isCovered && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[8px] font-black uppercase text-error-300 tracking-widest opacity-40">No Coverage</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayShifts.map((shift: RotaShift) => {
                        const staffMember = staff.find((s: StaffMember) => s.id === shift.staff_id);
                        const [startH, startM] = shift.start_time.split(':').map(Number);
                        const [endH, endM] = shift.end_time.split(':').map(Number);
                        const startOffset = ((startH - 8) * 60) + startM;
                        const duration = ((endH * 60 + endM) - (startH * 60 + startM));
                        return (
                          <div key={shift.id} data-testid={`rota-shift-${shift.id}`} style={{ top: `${startOffset}px`, height: `${duration}px` }} className={`absolute left-1 right-1 rounded-lg border shadow-sm p-1.5 flex flex-col justify-start z-10 hover:z-50 hover:shadow-xl transition-all cursor-pointer overflow-hidden group/shift ${shift.conflict ? 'bg-error-50 border-error-300 ring-2 ring-error-200' : 'bg-white border-primary-200 hover:border-primary-400'}`}>
                            <button onClick={(e) => { e.stopPropagation(); if (shift.id) handleRemoveShift(shift.id); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error-500 text-white flex items-center justify-center opacity-0 group-hover/shift:opacity-100 transition-opacity z-50 shadow-sm">×</button>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                                {staffMember?.photo && <img src={staffMember.photo} className="w-full h-full object-cover" />}
                              </div>
                              <span className="text-[10px] font-black text-neutral-900 leading-tight truncate">{staffMember?.name.split(' ')[0]}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-50 px-1 rounded hover:bg-neutral-100" onClick={() => {
                                if (userRole !== 'Owner' && userRole !== 'Manager') return;
                                const newTime = prompt('Enter shift time:', `${shift.start_time}-${shift.end_time}`);
                                if (newTime) {
                                  const [s, e] = newTime.split('-');
                                  if (s && e) setShifts(prev => prev.map(ps => ps.id === shift.id ? { ...ps, start_time: s, end_time: e } : ps));
                                }
                              }}>{shift.start_time}-{shift.end_time}</span>
                              {shift.conflict && <span className="text-[10px]" title={shift.conflict_reason}>⚠️</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Permissions for UI Tabs
  const canPlanRota = hasPermission(userRole, 'rota.plan');
  const canViewCompliance = hasPermission(userRole, 'reports.view');

  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-24 relative selection:bg-primary-100" data-testid="staff-view-container" data-role={userRole}>
      {/* Toast */}
      {
        notification && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${notification!.type === 'success' ? 'bg-success-600' : notification!.type === 'error' ? 'bg-error-600' : 'bg-primary-600'} text-white`}>
            <span className="text-xl">{notification!.type === 'success' ? '✅' : notification!.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{notification!.type === 'success' ? 'Success' : notification!.type === 'error' ? 'Alert' : 'Info'}</p>
              <p className="font-bold text-sm">{notification!.message}</p>
            </div>
          </div>
        )
      }

      {/* Top Navigation */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-hidden">
          <button onClick={() => scrollNav('left')} className="hidden md:flex w-10 h-10 shrink-0 bg-white rounded-full shadow-sm border border-neutral-200 items-center justify-center text-neutral-600 active:scale-95 transition-all hover:bg-neutral-50 hover:text-neutral-900">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div ref={navScrollRef} className="flex bg-white px-2 py-2 rounded-2xl shadow-sm border border-neutral-100 flex-wrap justify-center gap-y-2 md:gap-y-0 md:flex-nowrap md:justify-start md:overflow-x-auto max-w-full scroll-smooth no-scrollbar flex-1 items-center">
            {[
              { id: 'attendance', label: isAdmin ? 'Dashboard' : 'Attendance' },
              { id: 'registry', label: 'Staff Registry' },
              { id: 'calendar', label: 'Availability' },
              ...(canPlanRota ? [{ id: 'rota', label: 'Rota Planner' }] : []),
              ...(canViewCompliance ? [{ id: 'compliance', label: 'Compliance' }] : []),
              { id: 'chart', label: 'Organization' },
              { id: 'preferences', label: 'My Availability' },
              ...(isAdmin ? [{ id: 'requests', label: 'Requests' }, { id: 'payroll', label: 'Staff Payroll' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}
              >
                {tab.label}
                {tab.id === 'requests' && isAdmin && (
                  <span className="ml-2 bg-error-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    {leaves.filter(l => l.status === 'Pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button onClick={() => scrollNav('right')} className="hidden md:flex w-10 h-10 shrink-0 bg-white rounded-full shadow-sm border border-neutral-200 items-center justify-center text-neutral-600 active:scale-95 transition-all hover:bg-neutral-50 hover:text-neutral-900">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>



        {/* Admin Controls */}
        <div className="flex items-center gap-3">


          <div className="relative">
            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              disabled={!isAdmin}
              className="bg-white border border-neutral-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none shadow-sm min-w-[200px]"
            >
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">▼</div>
          </div>
          {isAdmin && <button data-testid="terminal-toggle" onClick={() => setTerminalOpen(true)} className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-black transition-all">🛂</button>}
          {isAdmin && <button onClick={() => {
            setEditingStaff(null);
            setIsAddMode(true);
            setEditingRecord({
              id: crypto.randomUUID(),
              staffId: selectedStaffId || (staff[0]?.id || ''),
              date: new Date().toISOString().split('T')[0],
              status: 'Present',
              clockIn: '',
              clockOut: '',
              notes: ''
            });
          }} className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-700 transition-all">+</button>}
        </div>
      </div>

      {activeTab === 'attendance' && renderDashboard()}
      {activeTab === 'registry' && renderRegistry()}
      {activeTab === 'calendar' && renderCalendar()}
      {activeTab === 'requests' && renderLeaveRequests()}
      {activeTab === 'preferences' && renderAvailabilityForm()}
      {activeTab === 'chart' && renderOrgChart()}
      {activeTab === 'rota' && renderRotaBuilder()}
      {activeTab === 'payroll' && renderPayroll()}
      {activeTab === 'compliance' && (
        <RegistersView
          userId={userId}
          staff={staff}
          inventory={inventory}
          logAction={logAction}
          navigateToProcurement={navigateToProcurement}
          activeStaffName={activeStaffName}
          userRole={userRole}
          currentStaffId={currentStaffId}
        />
      )}

      {/* Modals */}
      {
        terminalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-5xl">
              <button onClick={() => setTerminalOpen(false)} className="absolute -top-12 right-0 text-white font-black uppercase">Close</button>
              <AccessTerminal isOpen={terminalOpen} onAuthenticate={handleTerminalAuth} staff={staff} onClose={() => setTerminalOpen(false)} />
            </div>
          </div>
        )
      }

      {
        (isAddMode || editingRecord) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-black text-neutral-900 mb-6">{isAddMode ? 'Quick Entry' : 'Edit Entry'}</h3>
              {/* Logic for quick entry form here if needed, or re-use editingRecord fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase">Date</label>
                  <input
                    type="date"
                    value={editingRecord?.date || ''}
                    onChange={e => setEditingRecord(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold text-neutral-900 outline-primary-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase">Staff Member</label>
                  <select
                    disabled={!isAddMode}
                    value={editingRecord?.staffId}
                    onChange={e => setEditingRecord(prev => prev ? ({ ...prev, staffId: e.target.value }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold text-neutral-900 outline-primary-500 mt-1"
                  >
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 uppercase">Clock In</label>
                    <input
                      type="time"
                      value={editingRecord?.clockIn || ''}
                      onChange={e => setEditingRecord(prev => prev ? ({ ...prev, clockIn: e.target.value }) : null)}
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold text-neutral-900 outline-primary-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-400 uppercase">Clock Out</label>
                    <input
                      type="time"
                      value={editingRecord?.clockOut || ''}
                      onChange={e => setEditingRecord(prev => prev ? ({ ...prev, clockOut: e.target.value }) : null)}
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm font-bold text-neutral-900 outline-primary-500 mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setIsAddMode(false); setEditingRecord(null); }}
                    className="flex-1 bg-neutral-100 text-neutral-600 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all border border-neutral-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveRecordUpdate}
                    className="flex-[2] bg-neutral-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* TASK MODAL */}
      {taskModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-neutral-900 leading-tight">{selectedTask.title}</h3>
                <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-wide">Assigned to: {staff.find(s => s.id === selectedTask.assignedTo)?.name}</p>
              </div>
              <button onClick={() => setTaskModalOpen(false)} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-200 transition-colors">✕</button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${selectedTask.status === 'Completed' ? 'bg-success-100 text-success-600' : 'bg-orange-100 text-orange-600'}`}>
                {selectedTask.status}
              </span>
            </div>

            {/* Description (Static for now) */}
            <p className="text-sm font-medium text-neutral-600 mb-8 leading-relaxed">
              Please complete this task and upload a photo as proof.
            </p>

            {/* Notes / Comments */}
            <div className="mb-6">
              <label className="text-xs font-bold text-neutral-400 uppercase">Values / Comments</label>
              <textarea
                className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm mt-1 outline-primary-500 font-bold text-neutral-700"
                rows={2}
                placeholder="e.g. Fridge Temp 4°C, Floor damaged..."
                defaultValue={selectedTask.notes || ''}
                onBlur={(e) => {
                  const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
                  if (userId) updateTask(userId, selectedTask.id, { notes: e.target.value });
                }}
              />
            </div>

            {/* Upload / Proof Section */}
            {/* Upload / Proof Section */}
            <div className="space-y-4">

              {/* Photo Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Legacy Support */}
                {selectedTask.proofPhoto && !selectedTask.proofPhotos && (
                  <div className="rounded-xl overflow-hidden border-2 border-success-500 relative group aspect-video">
                    <img src={selectedTask.proofPhoto} className="w-full h-full object-cover" />
                  </div>
                )}
                {/* New Array Support */}
                {selectedTask.proofPhotos?.map((photo, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border-2 border-success-500 relative group aspect-video">
                    <img src={photo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-[10px]">Proof #{idx + 1}</p>
                    </div>
                  </div>
                ))}

                {/* Add Button */}
                <label className="block w-full h-full min-h-[100px] border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-neutral-50 transition-all group aspect-video">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleTaskPhotoUpload(e, selectedTask)} />
                  <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-1 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 group-hover:text-primary-600 transition-colors">Add Photo</span>
                </label>
              </div>

              {selectedTask.status === 'Completed' ? (
                <div className="flex items-center justify-center gap-2 text-xs text-success-600 font-bold bg-success-50 py-3 rounded-xl border border-success-100">
                  <span>✓</span> Task Completed
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-orange-500 font-bold bg-orange-50 py-2 rounded-lg">
                  <span>⚠️</span> Photo required to complete
                </div>
              )}
            </div>

          </div>
        </div>
      )}




      {
        addStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900 leading-none">{editingStaff ? 'Employee Profile' : 'Recruit Personnel'}</h3>
                  {editingStaff && <p className="text-sm font-bold text-neutral-400 mt-1 uppercase tracking-widest">{editingStaff.name}</p>}
                </div>

                {/* Tabs */}
                {editingStaff && (
                  <div className="flex bg-neutral-200/50 p-1 rounded-xl">
                    <button onClick={() => setStaffModalTab('details')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${staffModalTab === 'details' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}>Profile</button>
                    {import.meta.env.MODE === 'test' ? (console.log(`[DEBUG MODAL] canManageUsers: ${canManageUsers}`), null) : null}
                    {canManageUsers && (
                      <button onClick={() => setStaffModalTab('financials')} data-testid="tab-financials" className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${staffModalTab === 'financials' ? 'bg-white text-success-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}>Timesheet & Pay</button>
                    )}
                  </div>
                )}

                {!editingStaff && <div />} {/* Spacer */}

                <button onClick={() => { setAddStaffModalOpen(false); setEditingStaff(null); }} className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:bg-error-50 dark:hover:bg-error-500/10 hover:text-error-600 transition-colors shadow-sm">✕</button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-neutral-50">

                {/* TAB: DETAILS */}
                {(staffModalTab === 'details' || !editingStaff) && (
                  <div className="space-y-6 max-w-2xl mx-auto pb-10">
                    {/* 1. Identity & Contact */}
                     <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="w-1 h-4 bg-primary-500 rounded-full" />
                         <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Identity & Contact</h4>
                       </div>

                      {/* Profile Photo Experience */}
                      <div className="flex flex-col items-center justify-center py-4 border-b border-slate-50 mb-6">
                        <div className="relative group">
                          <div className="w-40 h-40 rounded-3xl bg-slate-100 border-4 border-white shadow-2xl overflow-hidden relative">
                            {(editingStaff?.photo || newStaffForm.photo) ? (
                              <img
                                src={editingStaff?.photo || newStaffForm.photo}
                                className="w-full h-full object-cover"
                                alt="Profile"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Users size={64} />
                              </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Upload className="text-white mb-2" size={24} />
                              <span className="text-xs font-black text-white uppercase tracking-tight">Upload New Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, !!editingStaff)}
                              />
                            </label>
                          </div>
                          <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary-600 rounded-2xl border-4 border-white dark:border-neutral-900 flex items-center justify-center text-white shadow-xl">
                            <Camera size={20} />
                          </div>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Global Fleet Identity Image</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Full Name</label>
                          <input placeholder="Ex: John Doe" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? editingStaff.name : newStaffForm.name} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff!, name: e.target.value }) : setNewStaffForm({ ...newStaffForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Primary Email</label>
                          <input placeholder="Ex: john@englabs.in" type="email" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? (editingStaff.email || '') : newStaffForm.email} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff!, email: e.target.value }) : setNewStaffForm({ ...newStaffForm, email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Contact Number</label>
                          <input placeholder="Ex: 07123 456789" type="tel" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? (editingStaff.phone || '') : newStaffForm.phone} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff!, phone: e.target.value }) : setNewStaffForm({ ...newStaffForm, phone: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Date of Birth</label>
                          <input type="date" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? (editingStaff.dateOfBirth || '') : newStaffForm.dateOfBirth} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, dateOfBirth: e.target.value }) : setNewStaffForm({ ...newStaffForm, dateOfBirth: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1 text-primary-600">Personnel Status</label>
                          <select className="w-full bg-neutral-50 dark:bg-white/5 border border-primary-100 dark:border-primary-500/20 p-3 rounded-xl outline-primary font-black text-sm uppercase tracking-tight" value={editingStaff ? editingStaff.status : newStaffForm.status} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, status: e.target.value as any }) : setNewStaffForm({ ...newStaffForm, status: e.target.value as any })}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Deactivated</option>
                            <option value="Pending Approval">Pending Approval</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Residential Address</label>
                        <textarea placeholder="Full home address including postcode" rows={2} className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? (editingStaff.address || '') : newStaffForm.address} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, address: e.target.value }) : setNewStaffForm({ ...newStaffForm, address: e.target.value })} />
                      </div>
                    </div>

                    {/* 2. Professional & Legal */}
                     <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="w-1 h-4 bg-success-500 rounded-full" />
                         <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Professional & Legal</h4>
                       </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">NI Number (UK)</label>
                          <input placeholder="Ex: QQ 12 34 56 C" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm font-mono uppercase" value={editingStaff ? (editingStaff.niNumber || '') : newStaffForm.niNumber} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, niNumber: e.target.value.toUpperCase() }) : setNewStaffForm({ ...newStaffForm, niNumber: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Tax Code</label>
                          <input placeholder="Ex: 1257L" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm font-mono uppercase" value={editingStaff ? (editingStaff.taxCode || '') : newStaffForm.taxCode} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, taxCode: e.target.value.toUpperCase() }) : setNewStaffForm({ ...newStaffForm, taxCode: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Contract Type</label>
                          <select className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? editingStaff.contractType : newStaffForm.contractType} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, contractType: e.target.value as any }) : setNewStaffForm({ ...newStaffForm, contractType: e.target.value as any })}>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Zero-hour">Zero-hour</option>
                            <option value="Contractor">Contractor</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Role / Grade</label>
                          <select className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? editingStaff.role : newStaffForm.role} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff!, role: e.target.value as any }) : setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}>
                            <option value="Cashier">Cashier</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                            <option value="Director">Director</option>
                            <option value="Accounts Officer">Accounts Officer</option>
                            <option value="Store In-charge">Store In-charge</option>
                            <option value="Till Manager">Till Manager</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Joined Date</label>
                          <input type="date" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? (editingStaff.joinedDate?.split('T')[0] || '') : newStaffForm.joinedDate} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, joinedDate: e.target.value }) : setNewStaffForm({ ...newStaffForm, joinedDate: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Expiry (ID Card)</label>
                          <input type="date" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm" value={editingStaff ? (editingStaff.validUntil?.split('T')[0] || '') : newStaffForm.validUntil} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, validUntil: e.target.value }) : setNewStaffForm({ ...newStaffForm, validUntil: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Security & Access */}
                    <div className="bg-white p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                        <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Security & Access</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Access PIN</label>
                          <input placeholder="4-6 Digit PIN" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-bold text-sm tracking-widest" value={editingStaff ? editingStaff.pin : newStaffForm.pin} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff!, pin: e.target.value }) : setNewStaffForm({ ...newStaffForm, pin: e.target.value })} />
                        </div>
                        <div className="flex flex-col justify-end">
                          <button
                            onClick={() => setFaceAuthMode('enroll')}
                            className={`w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${(editingStaff?.faceDescriptor || newStaffForm.faceDescriptor) ? 'bg-success-500/10 text-success-600 border-success-200' : 'bg-neutral-50 dark:bg-white/5 text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-primary-500 hover:text-white'}`}
                          >
                            {(editingStaff?.faceDescriptor || newStaffForm.faceDescriptor) ? '✓ Bio-Metric Active' : '+ Enroll Face ID'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Financial Meta */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-primary-500 rounded-full" />
                        <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Pay Scales</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Hourly Rate (₹)</label>
                          <input type="number" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-mono font-bold text-sm" value={editingStaff ? (editingStaff.hourlyRate || 0) : newStaffForm.hourlyRate} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, hourlyRate: parseFloat(e.target.value) || 0 }) : setNewStaffForm({ ...newStaffForm, hourlyRate: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Monthly Salary (₹)</label>
                          <input type="number" className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3 rounded-xl outline-primary font-mono font-bold text-sm" value={editingStaff ? (editingStaff.monthlyRate || 0) : newStaffForm.monthlyRate} onChange={e => editingStaff ? setEditingStaff({ ...editingStaff, monthlyRate: parseFloat(e.target.value) || 0 }) : setNewStaffForm({ ...newStaffForm, monthlyRate: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: FINANCIALS (Restricted to Managers) */}
                {staffModalTab === 'financials' && editingStaff && financialData && canManageUsers && (
                  <div className="space-y-6">

                    {/* Controls */}
                    <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm">
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-bold text-neutral-400 uppercase">Select Period:</label>
                        <input
                          type="month"
                          value={financialMonth}
                          onChange={e => setFinancialMonth(e.target.value)}
                          className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-bold font-mono outline-primary"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase">Timesheet Status</p>
                        <p className="text-sm font-black text-success-600">LIVE / {financialData.records.length} Records</p>
                      </div>
                    </div>

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-primary-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={48} /></div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Hours</h4>
                        <div className="mt-2 text-3xl font-mono font-black">{financialData.totalHours.toFixed(1)} <span className="text-sm text-primary-200 font-sans">hrs</span></div>
                        <div className="mt-1 text-xs font-bold text-success-400">{financialData.overtimeHours.toFixed(1)} Overtime</div>
                      </div>

                      <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Calculated Gross</h4>
                        <div className="mt-2 text-3xl font-mono font-black text-neutral-900 dark:text-white">₹{financialData.grossPay.toFixed(2)}</div>
                        <div className="mt-1 text-xs font-bold text-neutral-400">@ ₹{financialData.hourlyRate}/hr</div>
                        <input
                          type="number"
                          placeholder="Update Rate"
                          className="mt-2 w-full text-xs p-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded"
                          value={editingStaff.hourlyRate}
                          onChange={(e) => setEditingStaff({ ...editingStaff, hourlyRate: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Advance Taken</h4>
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-xl font-mono font-bold text-error-500">-₹</span>
                          <input
                            type="number"
                            value={editingStaff.advance || 0}
                            onChange={(e) => setEditingStaff({ ...editingStaff, advance: parseFloat(e.target.value) || 0 })}
                            className="w-full text-3xl font-mono font-black text-error-600 outline-none bg-transparent placeholder-error-200"
                          />
                        </div>
                        <p className="text-[9px] text-neutral-400 mt-1">Updates profile immediately</p>
                      </div>

                      <div className="bg-success-500 text-white p-6 rounded-2xl shadow-lg shadow-success-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardList size={48} /></div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80">Net Payable</h4>
                        <div className="mt-2 text-3xl font-mono font-black">₹{financialData.netPay.toFixed(2)}</div>
                        <button onClick={editingStaff ? handleUpdateStaff : handleAddNewStaff} className="mt-3 w-full bg-white/20 hover:bg-white/30 py-1.5 rounded-lg text-xs font-bold uppercase transition-all">
                          Update & Save
                        </button>
                      </div>
                    </div>

                    {/* DATA TABLE */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Timesheet History</h4>
                      </div>
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-left">
                          <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Clock In</th>
                            <th className="p-4">Clock Out</th>
                            <th className="p-4 text-right">Hours</th>
                            <th className="p-4 text-right">Overtime</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                          {financialData.records.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-neutral-400 dark:text-neutral-500 font-bold italic">No attendance records found for this period.</td>
                            </tr>
                          ) : (
                            financialData.records.map(r => (
                              <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-white/2 transition-colors group">
                                <td className="p-4 font-mono font-bold text-neutral-700 dark:text-neutral-300">
                                  {new Date(r.date).toLocaleDateString()}
                                  <span className="block text-[9px] text-neutral-400 font-sans uppercase">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${r.status === 'Present' ? 'bg-success-500/10 text-success-600' : 'bg-error-500/10 text-error-600'}`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="p-4 font-mono font-medium text-neutral-600 dark:text-neutral-400">{r.clockIn || '-'}</td>
                                <td className="p-4 font-mono font-medium text-neutral-600 dark:text-neutral-400">{r.clockOut || '-'}</td>
                                <td className="p-4 font-mono font-bold text-neutral-900 dark:text-white text-right">{r.hoursWorked?.toFixed(1) || '-'}</td>
                                <td className="p-4 font-mono font-bold text-error-600 dark:text-error-400 text-right">{(r.overtime || 0) > 0 ? `+${r.overtime}` : '-'}</td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => { setEditingRecord(r); setIsAddMode(false); }}
                                      className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                                      title="Edit Record"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(r.id)}
                                      className="p-1.5 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                                      title="Delete Record"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-white border-t border-neutral-200 dark:border-white/10">
                          <tr>
                            <td colSpan={4} className="p-4 text-right uppercase tracking-widest text-[10px] text-neutral-500">Total Hours Tracked</td>
                            <td className="p-4 text-right font-mono text-sm">{financialData.totalHours.toFixed(1)}</td>
                            <td className="p-4 text-right font-mono text-sm text-error-500">{financialData.overtimeHours.toFixed(1)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-4 border-t border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900/50 flex gap-4">
                {editingStaff && (
                  <button onClick={() => {
                    const userId = import.meta.env.VITE_USER_ID || auth.currentUser?.uid;
                    if (confirm('Delete this user?') && userId) {
                      deleteStaffMember(userId, editingStaff.id);
                      setEditingStaff(null);
                      setAddStaffModalOpen(false);
                    }
                  }} className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Delete Personnel</button>
                )}
                <button onClick={editingStaff ? handleUpdateStaff : handleAddNewStaff} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20">
                  {editingStaff ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        idCardStaff && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative">
              <button onClick={() => setIdCardStaff(null)} className="absolute -top-12 right-0 text-white font-bold">Close</button>
              <IDCard staff={idCardStaff} onClose={() => setIdCardStaff(null)} />
            </div>
          </div>
        )
      }

      {leaveModalOpen && renderLeaveModal()}

      {
        faceAuthMode && (
          <FaceAuth
            mode={faceAuthMode}
            onClose={() => setFaceAuthMode(null)}
            onEnroll={handleFaceEnroll}
          />
        )
      }
    </div>
  );
}

export default StaffView;
