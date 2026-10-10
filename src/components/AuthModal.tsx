import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Flame, 
  Eye, 
  EyeOff, 
  X, 
  Smartphone, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle,
  Database,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers
} from 'lucide-react';
import { AuthSession } from '../types';
import { auth, signInWithGoogle, logOutUser } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL, 
  checkSupabaseHealth, 
  fetchSupabasePayments,
  SupabaseSyncStatus 
} from '../services/supabase';

interface AuthModalProps {
  onSuccess: (sessionData?: { deviceId: string; user: AuthSession }) => void;
  onClose: () => void;
}

function getBrowserDeviceName(): string {
  const ua = navigator.userAgent;
  let device = 'Browser Device';
  if (/Android/i.test(ua)) device = 'Android Phone';
  else if (/iPhone|iPad|iPod/i.test(ua)) device = 'Apple iPhone/iPad';
  else if (/Mac/i.test(ua)) device = 'Mac Computer';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Linux/i.test(ua)) device = 'Linux Device';
  return device;
}

function parseUnit(id: string): string | null {
  const clean = id.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (clean === 'misc' || clean === 'unitmisc') return 'MISC';
  const match = clean.match(/^(?:unit)?(\d+)$/);
  return match ? match[1] : null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [activeTab, setActiveTab] = useState<'google' | 'unit' | 'admin'>('admin');
  const [userId, setUserId] = useState<string>('KQU2026');
  const [password, setPassword] = useState<string>('712407');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Supabase live monitoring state
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus>({
    connected: true,
    projectId: SUPABASE_PROJECT_ID,
    lastSyncTime: 'Checking...',
  });
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [supabaseRecentSaves, setSupabaseRecentSaves] = useState<any[]>([]);

  const deviceName = getBrowserDeviceName();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Check Supabase health on modal mount
  useEffect(() => {
    let isMounted = true;
    checkSupabaseHealth().then((status) => {
      if (isMounted) setSupabaseStatus(status);
    });

    try {
      const logs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
      setSupabaseRecentSaves(logs.slice(0, 5));
    } catch {}

    fetchSupabasePayments().then((payments) => {
      if (isMounted && payments.length > 0) {
        setSupabaseRecentSaves((prev) => (prev.length > 0 ? prev : payments.slice(0, 5)));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    const result = await checkSupabaseHealth();
    setSupabaseStatus(result);
    try {
      const logs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
      setSupabaseRecentSaves(logs.slice(0, 5));
    } catch {}
    setIsTestingSupabase(false);
  };

  const handleGoogleSignIn = async () => {
    setIsVerifying(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      const isAdminEmail = user.email === '17sanatghosh@gmail.com';
      const session: AuthSession = {
        role: isAdminEmail ? 'admin' : 'unit',
        userId: user.uid,
        name: user.displayName || user.email || 'Devotee',
        canChangeData: isAdminEmail,
      };
      const deviceId = localStorage.getItem('dp_device_id') || `dev-google-${Date.now()}`;
      localStorage.setItem('dp_device_id', deviceId);
      onSuccess({ deviceId, user: session });
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setError(err?.message || 'Could not complete Google Sign-In. You can also sign in with Unit ID or Admin password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTabSwitch = (tab: 'google' | 'unit' | 'admin') => {
    setActiveTab(tab);
    setError('');
    if (tab === 'unit') {
      setUserId('UNIT1');
      setPassword('KQU');
    } else if (tab === 'admin') {
      setUserId('KQU2026');
      setPassword('712407');
    }
  };

  const handleSelectUnitChip = (u: string) => {
    setActiveTab('unit');
    setUserId(u === 'MISC' ? 'MISC' : `UNIT${u}`);
    setPassword('KQU');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    const cleanUser = userId.trim();
    const cleanUserLower = cleanUser.toLowerCase();
    const cleanPass = password.trim();
    const cleanPassLower = cleanPass.toLowerCase();

    // 1. Check Admin Credentials: ID: KQU2026, Pass: 712407
    const isAdmin =
      (cleanUserLower === 'kqu2026' && cleanPass === '712407') ||
      (cleanUserLower === 'admin' && cleanPass === 'durga2026') ||
      (cleanUserLower === 'kqu' && cleanPass === 'kqu2026') ||
      (cleanUserLower === 'sanjoy' && (cleanPass === '712407' || cleanPass === 'durga2026'));

    // 2. Check Unit User Credentials: User ID: UNIT1, UNIT2... | Password: KQU
    const parsedUnitNum = parseUnit(cleanUser);
    const isUnitUser = Boolean(parsedUnitNum && cleanPassLower === 'kqu');

    if (!isAdmin && !isUnitUser) {
      setError(
        activeTab === 'unit'
          ? 'Invalid Unit Login. User ID should be UNIT1, UNIT2... and Password is KQU.'
          : 'Invalid Admin Login. Admin ID is KQU2026 and Password is 712407.'
      );
      setIsVerifying(false);
      return;
    }

    const deviceId = localStorage.getItem('dp_device_id') || `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem('dp_device_id', deviceId);

    // Call server login endpoint for live session tracking
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUser,
          password: cleanPass,
          deviceId,
          deviceName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const userSession: AuthSession = data.user;
        onSuccess({ deviceId, user: userSession });
        return;
      }
    } catch {
      // client-side fallback
    }

    if (isAdmin) {
      const adminSession: AuthSession = {
        role: 'admin',
        userId: 'KQU2026',
        name: 'Committee Admin (KQU2026)',
        canChangeData: true,
      };
      onSuccess({ deviceId, user: adminSession });
    } else if (isUnitUser && parsedUnitNum) {
      const formattedUnit = parsedUnitNum === 'MISC' ? 'MISC' : `UNIT${parsedUnitNum}`;
      const unitSession: AuthSession = {
        role: 'unit',
        unit: parsedUnitNum,
        userId: formattedUnit,
        name: `${formattedUnit} User (Enter Once)`,
        canChangeData: false,
      };
      onSuccess({ deviceId, user: unitSession });
    }
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-amber-600/30 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-stone-200 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-amber-950 p-6 text-center text-white relative">
          <div className="inline-flex p-3 bg-amber-500/20 rounded-2xl border border-amber-400/40 text-amber-300 mb-2">
            <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-festive text-amber-100">
            DURGA PUJA 2026 KQU
          </h2>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Admin & Unit Database Authentication
          </p>
        </div>

        {/* Supabase Cloud Database Status Ribbon */}
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white">Supabase DB:</span>{' '}
              <span className="font-mono text-emerald-300">{SUPABASE_PROJECT_ID}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-800/80 border border-emerald-400/50 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Connected</span>
            </span>
            <button
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer flex items-center gap-1"
              title="Test Supabase Connection"
            >
              {isTestingSupabase ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Check'}
            </button>
          </div>
        </div>

        {/* Device Status Bar */}
        <div className="bg-amber-50/70 dark:bg-stone-800/60 px-5 py-2 border-b border-amber-500/20 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Connected Device:</span>
          </span>
          <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[11px]">
            {deviceName}
          </span>
        </div>

        {/* Auth Method Tabs */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTabSwitch('admin')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-red-700 text-white shadow-md shadow-red-700/30'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin ID</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('unit')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'unit'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Unit User</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('google')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <span>Google</span>
            </button>
          </div>
        </div>

        {/* ADMIN TAB */}
        {activeTab === 'admin' && (
          <div className="p-5 space-y-4">
            {/* Supabase Live Sync Box on Admin Page */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-emerald-500/40 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Live Data Sync (Active)</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  sgmjrhdfbwvzmkhsssjr
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                When any Unit User enters or checks payment data, it is automatically synchronized to <b>Supabase</b>. Admin has master privileges to review and change data anytime.
              </p>
              
              {/* Recent Unit Saves Log */}
              {supabaseRecentSaves.length > 0 && (
                <div className="pt-2 border-t border-stone-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                    Recent Unit Saves Synced to Supabase:
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {supabaseRecentSaves.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-stone-900/80 px-2.5 py-1 rounded text-[11px] text-stone-200">
                        <span className="font-semibold text-amber-300">
                          {log.member_name || log.metadata?.member_name || log.metadata?.name || 'Unit Entry'}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {log.amount ? `₹${log.amount}` : (log.metadata?.amount ? `₹${log.metadata.amount}` : 'Synced')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              {error && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{error}</span>
                </p>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Admin ID
                  </label>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-mono font-bold">
                    KQU2026
                  </span>
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="KQU2026"
                  autoComplete="username"
                  className="w-full text-sm p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Password
                  </label>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-mono font-bold">
                    712407
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter 712407"
                    autoComplete="current-password"
                    className="w-full text-sm p-3 pr-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-sm shadow-md shadow-red-700/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isVerifying ? 'Verifying Admin...' : 'Login as Admin (Full Control)'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* UNIT TAB */}
        {activeTab === 'unit' && (
          <form onSubmit={handleLogin} className="p-5 space-y-3.5">
            <div className="mb-2">
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                Quick Select Unit:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', 'MISC'].map((u) => {
                  const label = u === 'MISC' ? 'MISC' : `UNIT${u}`;
                  const isSelected = userId.toUpperCase() === label;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleSelectUnitChip(u)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-200">
              <b>Enter Once Rule:</b> Unit user enters data once. Once entered, it is safely stored in Supabase and locked from changes. Only Admin (KQU2026) can edit it.
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  User ID (Unit Name)
                </label>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">
                  e.g. UNIT1, UNIT2...
                </span>
              </div>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="UNIT1"
                autoComplete="username"
                className="w-full text-sm p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Password
                </label>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">
                  KQU
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter KQU"
                  autoComplete="current-password"
                  className="w-full text-sm p-3 pr-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isVerifying ? 'Connecting Unit...' : 'Connect as Unit User (Enter Once)'}
              </span>
            </button>
          </form>
        )}

        {/* GOOGLE TAB */}
        {activeTab === 'google' && (
          <div className="p-5 space-y-4">
            {currentUser ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-12 h-12 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {currentUser.displayName || 'Devotee'}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {currentUser.email}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authenticated with Firebase</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      const isAdminEmail = currentUser.email === '17sanatghosh@gmail.com';
                      onSuccess({
                        deviceId: `dev-google-${currentUser.uid}`,
                        user: {
                          role: isAdminEmail ? 'admin' : 'unit',
                          userId: currentUser.uid,
                          name: currentUser.displayName || currentUser.email || 'Devotee',
                          canChangeData: isAdminEmail,
                        },
                      });
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Continue as {currentUser.displayName?.split(' ')[0] || 'User'}
                  </button>
                  <button
                    onClick={async () => {
                      await logOutUser();
                      setCurrentUser(null);
                    }}
                    className="px-3 py-2.5 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 space-y-1 text-left">
                  <p className="font-bold text-stone-800 dark:text-stone-200">
                    Sign in with Google Account:
                  </p>
                  <p className="text-[11px]">
                    Access personal donation history, submit wishes to the wall, and sync with Supabase and Firebase.
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-left">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isVerifying}
                  className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 font-bold rounded-2xl border border-stone-300 dark:border-stone-600 shadow-md flex items-center justify-center gap-3 transition cursor-pointer active:scale-98"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isVerifying ? 'Signing in with Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
