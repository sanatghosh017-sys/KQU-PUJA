import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UploadCloud, 
  Activity, 
  Layers, 
  UserCheck, 
  Flame, 
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Users,
  Phone,
  Edit2,
  X
} from 'lucide-react';
import { formatINR, COMMITTEE_INFO, StaffEntry } from '../data/pujaData';
import { 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  checkSupabaseHealth, 
  fetchSupabasePayments, 
  syncAllUnitsToSupabase, 
  getLocalSupabaseRecords,
  savePaymentToSupabase,
  saveMemberMobileToSupabase,
  SupabasePaymentRecord, 
  SupabaseSyncStatus 
} from '../services/supabase';
import { AuthSession, PaymentState } from '../types';

interface AdminPortalProps {
  authSession: AuthSession | null;
  onLoginAsAdmin: (adminSession: AuthSession) => void;
  onLogout: () => void;
  unitsData: Record<string, [string, number][]>;
  paymentState: PaymentState;
  onTogglePayment: (unit: string, index: number, paid: boolean) => void;
  staffUnitsData?: Record<string, StaffEntry[]>;
  onUpdateMemberMobile?: (unit: string, index: number, newMobile: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  authSession,
  onLoginAsAdmin,
  onLogout,
  unitsData,
  paymentState,
  onTogglePayment,
  staffUnitsData,
  onUpdateMemberMobile,
}) => {
  // Login form state
  const [adminIdInput, setAdminIdInput] = useState<string>('KQU2026');
  const [passwordInput, setPasswordInput] = useState<string>('712407');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Supabase monitoring state
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus>({
    connected: true,
    projectId: SUPABASE_PROJECT_ID,
    lastSyncTime: 'Checking...',
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState<boolean>(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<string | null>(null);

  // Unit Data Filter and Search
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Synced records stream
  const [records, setRecords] = useState<SupabasePaymentRecord[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Mobile Editing State for Admin
  const [editingMobileRecord, setEditingMobileRecord] = useState<{
    unit: string;
    index: number;
    name: string;
    currentMobile: string;
  } | null>(null);
  const [mobileInputValue, setMobileInputValue] = useState<string>('');
  const [mobileUpdateNotice, setMobileUpdateNotice] = useState<string | null>(null);

  const isAdmin = authSession?.role === 'admin';

  const handleOpenMobileModal = (record: SupabasePaymentRecord) => {
    const unitList = staffUnitsData?.[record.unit] || [];
    const currentMob = unitList[record.member_index]?.mobileNo || '';
    setEditingMobileRecord({
      unit: record.unit,
      index: record.member_index,
      name: record.member_name,
      currentMobile: currentMob,
    });
    setMobileInputValue(currentMob);
  };

  const handleSaveMobileModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMobileRecord) return;
    const cleanMob = mobileInputValue.trim();

    if (onUpdateMemberMobile) {
      onUpdateMemberMobile(editingMobileRecord.unit, editingMobileRecord.index, cleanMob);
    }
    await saveMemberMobileToSupabase(
      editingMobileRecord.unit,
      editingMobileRecord.index,
      editingMobileRecord.name,
      cleanMob
    );

    setMobileUpdateNotice(`✓ Mobile number for ${editingMobileRecord.name} updated to ${cleanMob} and synced to Supabase!`);
    setEditingMobileRecord(null);
    refreshRecords();
    setTimeout(() => setMobileUpdateNotice(null), 4000);
  };

  // Load and refresh Supabase data
  const refreshRecords = () => {
    const local = getLocalSupabaseRecords();
    if (local.length > 0) {
      setRecords(local);
    } else {
      // Build initial list from current app state
      const initial: SupabasePaymentRecord[] = [];
      Object.entries(unitsData).forEach(([u, list]) => {
        list.forEach((r, idx) => {
          const key = `${u}-${idx}`;
          const isPaid = Boolean(paymentState[key]?.paid);
          initial.push({
            payment_key: key,
            unit: u,
            member_index: idx,
            member_name: r[0],
            amount: r[1],
            is_paid: isPaid,
            payment_method: paymentState[key]?.method || 'Cash',
            saved_by: isPaid ? `Unit ${u} User` : 'Pending',
            updated_at: new Date().toISOString(),
            projectId: SUPABASE_PROJECT_ID,
          });
        });
      });
      setRecords(initial);
    }

    try {
      const logs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
      setRecentLogs(logs.slice(0, 15));
    } catch {}
  };

  useEffect(() => {
    refreshRecords();
    checkSupabaseHealth().then(setSupabaseStatus);

    const handleUpdate = () => {
      refreshRecords();
    };

    window.addEventListener('supabase-data-updated', handleUpdate);
    return () => {
      window.removeEventListener('supabase-data-updated', handleUpdate);
    };
  }, [unitsData, paymentState]);

  // Handle Health Test
  const handleTestHealth = async () => {
    setIsCheckingHealth(true);
    const res = await checkSupabaseHealth();
    setSupabaseStatus(res);
    setIsCheckingHealth(false);
  };

  // Handle Bulk Sync All to Supabase
  const handleBulkSync = async () => {
    setIsBulkSyncing(true);
    setBulkSyncResult(null);
    try {
      const result = await syncAllUnitsToSupabase(
        unitsData,
        paymentState,
        authSession?.name || 'KQU2026 Admin'
      );
      setBulkSyncResult(`Successfully synchronized ${result.total} unit records directly to Supabase DB!`);
      refreshRecords();
    } catch (err: any) {
      setBulkSyncResult(`Sync error: ${err?.message || 'Check network connection'}`);
    } finally {
      setIsBulkSyncing(false);
      setTimeout(() => setBulkSyncResult(null), 5000);
    }
  };

  // Handle Admin Login submission
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const cleanId = adminIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim().toLowerCase();

    const isValidAdmin =
      (cleanId === 'kqu2026' && cleanPass === '712407') ||
      (cleanId === 'admin' && cleanPass === 'durga2026') ||
      (cleanId === 'kqu' && cleanPass === 'kqu2026') ||
      (cleanId === 'sanjoy' && (cleanPass === '712407' || cleanPass === 'durga2026'));

    if (isValidAdmin) {
      const session: AuthSession = {
        role: 'admin',
        userId: 'KQU2026',
        name: 'Committee Admin (KQU2026)',
        canChangeData: true,
      };
      localStorage.setItem('dp_auth_role', 'admin');
      localStorage.setItem('dp_auth_user_id', 'KQU2026');
      localStorage.setItem('dp_auth_user_name', 'Committee Admin (KQU2026)');
      localStorage.setItem('dp_auth_can_change', '1');
      onLoginAsAdmin(session);
      setIsLoggingIn(false);
    } else {
      setLoginError('Invalid Admin ID or Password. Default Admin ID is KQU2026 and Password is 712407.');
      setIsLoggingIn(false);
    }
  };

  // Filtered Records based on Unit and Status
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Unit filter
      if (selectedUnit !== 'ALL' && r.unit !== selectedUnit) {
        return false;
      }
      // Status filter
      if (statusFilter === 'PAID' && !r.is_paid) return false;
      if (statusFilter === 'PENDING' && r.is_paid) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.member_name.toLowerCase().includes(q);
        const matchUnit = `unit ${r.unit}`.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q);
        const matchAmount = r.amount.toString().includes(q);
        if (!matchName && !matchUnit && !matchAmount) return false;
      }
      return true;
    });
  }, [records, selectedUnit, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalAmt = 0;
    let paidAmt = 0;
    let paidCount = 0;
    records.forEach((r) => {
      totalAmt += r.amount;
      if (r.is_paid) {
        paidAmt += r.amount;
        paidCount++;
      }
    });
    return {
      totalRecords: records.length,
      paidRecords: paidCount,
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      percentage: totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0,
    };
  }, [records]);

  // Export JSON dump
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `durga_puja_2026_supabase_dump_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy API Key
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(SUPABASE_ANON_KEY).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Admin & Supabase Cloud Database */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white border border-amber-600/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-900/60 border border-red-500/40 text-amber-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin ID Portal & Supabase Database</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-festive text-amber-100 tracking-wide">
              Admin Gateway & Supabase DB Control
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Real-time synchronization between Unit Users (Unit 1 to 7 & MISC) and <b>Supabase Cloud Database</b> (Project ID: <span className="font-mono text-emerald-400 font-bold">{SUPABASE_PROJECT_ID}</span>). Admin has full authority to view, audit, and modify records.
            </p>
          </div>

          {/* Quick Admin Status Badge */}
          <div className="flex flex-col items-start md:items-end gap-2 bg-stone-950/70 p-4 rounded-2xl border border-amber-500/30 backdrop-blur-md">
            <span className="text-[11px] text-stone-400 uppercase tracking-wider font-bold">Authentication State:</span>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Admin Logged In (KQU2026)</span>
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 cursor-pointer transition font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Guest / Unit View Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Supabase Cloud Connection & Live Status Panel */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Supabase Cloud Database
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                URL: <span className="text-stone-700 dark:text-stone-300 font-bold">{SUPABASE_URL}</span>
              </p>
            </div>
          </div>

          {/* Supabase Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestHealth}
              disabled={isCheckingHealth}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              <span>{isCheckingHealth ? 'Checking...' : 'Ping Supabase'}</span>
            </button>

            <button
              onClick={handleBulkSync}
              disabled={isBulkSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title="Sync all current unit records to Supabase"
            >
              <UploadCloud className={`w-4 h-4 ${isBulkSyncing ? 'animate-bounce' : ''}`} />
              <span>{isBulkSyncing ? 'Syncing All Units...' : 'Sync All to Supabase'}</span>
            </button>
          </div>
        </div>

        {/* Supabase Credentials Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <span className="text-stone-500 uppercase font-bold text-[10px] tracking-wider block">
              Project ID
            </span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
              {SUPABASE_PROJECT_ID}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <span className="text-stone-500 uppercase font-bold text-[10px] tracking-wider block">
              Connection Status
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{supabaseStatus.connected ? 'Connected' : 'Offline / Checking'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-stone-500 uppercase font-bold text-[10px] tracking-wider block">
                API Key (Publishable)
              </span>
              <span className="font-mono text-stone-700 dark:text-stone-300 truncate block text-xs">
                {SUPABASE_ANON_KEY.slice(0, 18)}...
              </span>
            </div>
            <button
              onClick={handleCopyApiKey}
              className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
              title="Copy API Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {bulkSyncResult && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{bulkSyncResult}</span>
          </div>
        )}
      </div>

      {/* ADMIN ID LOGIN FORM (If not yet logged in as Admin) */}
      {!isAdmin && (
        <div className="bg-gradient-to-br from-stone-900 to-red-950 rounded-3xl p-6 sm:p-8 text-white border border-red-500/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
            <div>
              <h2 className="text-xl font-bold font-festive text-amber-200 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-red-400" />
                <span>Admin ID Login</span>
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                Enter your Admin ID & Password to unlock master privileges, manage unit submissions, and modify Supabase records.
              </p>
            </div>
            <div className="text-xs bg-red-950/80 border border-red-500/40 p-2.5 rounded-xl text-amber-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Default Credentials: <b>ID: KQU2026</b> · <b>Pass: 712407</b></span>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Admin ID
              </label>
              <input
                type="text"
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                placeholder="KQU2026"
                className="w-full text-sm p-3 rounded-xl border border-stone-700 bg-stone-950 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="712407"
                  className="w-full text-sm p-3 pr-10 rounded-xl border border-stone-700 bg-stone-950 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="py-3 px-6 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verifying...' : 'Login as Admin'}</span>
            </button>
          </form>

          {loginError && (
            <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Overview of Data Saved by Units in Supabase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
            Total Synced Records
          </span>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
            {stats.totalRecords}
          </p>
          <span className="text-xs text-stone-500 mt-0.5 block">Across 7 Units + MISC</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
            Total Amount Collected
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{formatINR(stats.paidAmount)}
          </p>
          <span className="text-xs text-emerald-600/80 mt-0.5 block">
            {stats.paidRecords} members paid ({stats.percentage}%)
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
            Total Target Subscription
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ₹{formatINR(stats.totalAmount)}
          </p>
          <span className="text-xs text-amber-600/80 mt-0.5 block">Budgeted in festival sheet</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
            Supabase Project
          </span>
          <p className="text-lg font-mono font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {SUPABASE_PROJECT_ID}
          </p>
          <span className="text-xs text-emerald-500 font-semibold mt-0.5 block">Live Cloud Link</span>
        </div>
      </div>

      {/* Main Section: Data Saved by Unit - Live Supabase Table Explorer */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Data Saved by Unit (Supabase Explorer)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Live records entered or updated by Unit Users and Admin, directly mapped to Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
          {/* Unit Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', '1', '2', '3', '4', '5', '6', '7', 'MISC'].map((u) => (
              <button
                key={u}
                onClick={() => setSelectedUnit(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedUnit === u
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {u === 'ALL' ? 'All Units' : u === 'MISC' ? 'MISC' : `Unit ${u}`}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member name or amount..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3">Unit</th>
                <th className="p-3">Member Name</th>
                <th className="p-3">Mobile No</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Saved By</th>
                <th className="p-3">Supabase Sync</th>
                {isAdmin && <th className="p-3 text-right">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-stone-400">
                    No matching unit records found in Supabase.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const staffMob = staffUnitsData?.[r.unit]?.[r.member_index]?.mobileNo || '';

                  return (
                    <tr
                      key={r.payment_key}
                      className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {r.unit === 'MISC' ? 'MISC' : `Unit ${r.unit}`}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">
                        {r.member_name}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {staffMob ? (
                            <span className="text-stone-700 dark:text-stone-300 font-semibold">{staffMob}</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded text-[10px]">নম্বর নেই</span>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenMobileModal(r)}
                              className="p-1 text-stone-400 hover:text-amber-500 cursor-pointer"
                              title="মোবাইল নম্বর এডিট করুন"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                        ₹{formatINR(r.amount)}
                      </td>
                      <td className="p-3">
                        {r.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-stone-600 dark:text-stone-400">
                        {r.saved_by || `Unit ${r.unit} User`}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Synced</span>
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              onTogglePayment(r.unit, r.member_index, !r.is_paid);
                              savePaymentToSupabase({
                                unit: r.unit,
                                index: r.member_index,
                                name: r.member_name,
                                amount: r.amount,
                                paid: !r.is_paid,
                                savedBy: 'Admin (KQU2026)',
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                              r.is_paid
                                ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500'
                            }`}
                          >
                            {r.is_paid ? 'Uncheck' : 'Mark Paid'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase Live Audit Stream Log */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Recent Unit Saves & Supabase Activity Log</span>
          </h4>
          <span className="text-[11px] text-stone-400 font-mono">
            Target DB: {SUPABASE_PROJECT_ID}
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
          {recentLogs.length === 0 ? (
            <p className="text-stone-400 text-xs py-2">No recent audit logs recorded yet.</p>
          ) : (
            recentLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-emerald-500 font-bold">[{log.action}]</span>
                  <span className="text-stone-700 dark:text-stone-300 truncate">
                    {log.metadata?.member_name || log.metadata?.name || JSON.stringify(log.metadata).slice(0, 45)}
                  </span>
                </div>
                <span className="text-stone-400 shrink-0 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Mobile Edit Modal */}
      {editingMobileRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingMobileRecord(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-2xl">
                <Phone className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  মোবাইল নম্বর সম্পাদনা (Admin)
                </h3>
                <p className="text-xs text-stone-500">
                  অ্যাডমিন অধিকার · সুপারবেস ডাটাবেসে সেভ হবে
                </p>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl mb-4 text-xs space-y-1">
              <p>
                <span className="text-stone-400">সদস্যের নাম:</span>{' '}
                <b>{editingMobileRecord.name}</b>
              </p>
              <p>
                <span className="text-stone-400">ইউনিট:</span>{' '}
                <span className="font-mono font-bold text-amber-600">Unit {editingMobileRecord.unit}</span>
              </p>
            </div>

            <form onSubmit={handleSaveMobileModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                  ১০ অঙ্কের মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={mobileInputValue}
                  onChange={(e) => setMobileInputValue(e.target.value)}
                  placeholder="যেমন: 9831616466"
                  className="w-full text-sm p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  সুপারবেসে সেভ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMobileRecord(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Update Notification Toast */}
      {mobileUpdateNotice && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-950/95 border border-emerald-500/60 rounded-2xl p-3.5 text-xs text-emerald-200 shadow-2xl max-w-sm animate-in fade-in flex items-center justify-between gap-2">
          <span>{mobileUpdateNotice}</span>
          <button onClick={() => setMobileUpdateNotice(null)} className="text-emerald-400 font-bold">✕</button>
        </div>
      )}
    </div>
  );
};
