import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Check, 
  Receipt, 
  Download, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Info,
  Database,
  Phone,
  MessageCircle,
  Edit2,
  ExternalLink,
  Share2,
  X,
  Flame,
  HardHat,
  Wrench
} from 'lucide-react';
import { formatINR, COMMITTEE_INFO, getWebsiteHttpsUrl } from '../data/pujaData';
import { SUPABASE_PROJECT_ID } from '../services/supabase';
import { PaymentState, AuthSession, Language } from '../types';
import { StaffEntry } from '../data/pujaData';
import { getTranslation } from '../utils/i18n';

interface SubscriptionTrackerProps {
  staffUnitsData: Record<string, StaffEntry[]>;
  paymentState: PaymentState;
  onTogglePayment: (unit: string, index: number, paid: boolean) => void;
  onOpenReceipt: (member: { name: string; amount: number; unit: string; index: number; mobileNo?: string; slNo?: number }) => void;
  onOpenSaveJpg: (unit: string) => void;
  onClearAll: () => void;
  onOpenAddMember: (unit: string) => void;
  onUpdateMemberMobile: (unit: string, index: number, newMobile: string) => void;
  isUnlocked: boolean;
  authSession?: AuthSession | null;
  onOpenAuth: () => void;
  onNavigateToContact?: () => void;
  lang?: Language;
}

export const SubscriptionTracker: React.FC<SubscriptionTrackerProps> = ({
  staffUnitsData,
  paymentState,
  onTogglePayment,
  onOpenReceipt,
  onOpenSaveJpg,
  onClearAll,
  onOpenAddMember,
  onUpdateMemberMobile,
  isUnlocked,
  authSession,
  onOpenAuth,
  onNavigateToContact,
  lang = 'bn',
}) => {
  const [currentUnit, setCurrentUnit] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'amount-desc' | 'amount-asc' | 'name-asc' | 'sl-asc'>('default');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Modal to edit mobile number (Admin privilege)
  const [editingMember, setEditingMember] = useState<{
    unit: string;
    index: number;
    name: string;
    slNo: number;
    currentMobile: string;
  } | null>(null);
  const [mobileInput, setMobileInput] = useState<string>('');

  const unitKeys = ['1', '2', '3', '4', '5', '6', '7', 'MISC'];

  // Default to user's assigned unit if logged in as unit user
  React.useEffect(() => {
    if (authSession?.role === 'unit' && authSession.unit) {
      if (staffUnitsData[authSession.unit]) {
        setCurrentUnit(authSession.unit);
      }
    }
  }, [authSession?.role, authSession?.unit, staffUnitsData]);

  // Statistics calculation
  const currentStats = useMemo(() => {
    let total = 0;
    let collected = 0;
    let totalMembers = 0;
    let paidMembers = 0;

    const listUnits = currentUnit === 'ALL' ? unitKeys : [currentUnit];
    listUnits.forEach((u) => {
      const items = staffUnitsData[u] || [];
      items.forEach((item, i) => {
        total += item.amount;
        totalMembers++;
        const key = `${u}-${i}`;
        if (paymentState[key]?.paid) {
          collected += item.amount;
          paidMembers++;
        }
      });
    });

    const pending = total - collected;
    const percentage = total > 0 ? Math.round((collected / total) * 100) : 0;

    return { total, collected, pending, totalMembers, paidMembers, percentage };
  }, [currentUnit, staffUnitsData, paymentState]);

  // Flattened and filtered member rows
  const displayMembers = useMemo(() => {
    const list: {
      slNo: number;
      name: string;
      mobileNo: string;
      amount: number;
      unit: string;
      index: number;
      isPaid: boolean;
      paidAt?: string;
      method?: string;
    }[] = [];

    const listUnits = currentUnit === 'ALL' ? unitKeys : [currentUnit];
    listUnits.forEach((u) => {
      const items = staffUnitsData[u] || [];
      items.forEach((item, i) => {
        const key = `${u}-${i}`;
        const isPaid = Boolean(paymentState[key]?.paid);

        const record = {
          slNo: item.slNo || i + 1,
          name: item.name,
          mobileNo: item.mobileNo || '',
          amount: item.amount,
          unit: u,
          index: i,
          isPaid,
          paidAt: paymentState[key]?.paidAt,
          method: paymentState[key]?.method || 'Cash',
        };

        // Filter by payment status
        if (statusFilter === 'paid' && !isPaid) return;
        if (statusFilter === 'pending' && isPaid) return;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = record.name.toLowerCase().includes(q);
          const matchUnit = `unit ${record.unit}`.toLowerCase().includes(q) || record.unit.toLowerCase().includes(q);
          const matchAmount = record.amount.toString().includes(q);
          const matchMobile = record.mobileNo.includes(q);
          const matchSl = record.slNo.toString() === q;
          if (!matchName && !matchUnit && !matchAmount && !matchMobile && !matchSl) return;
        }

        list.push(record);
      });
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'sl-asc') return a.slNo - b.slNo;
      return a.slNo - b.slNo;
    });

    return list;
  }, [currentUnit, staffUnitsData, paymentState, statusFilter, searchQuery, sortBy]);

  // Checkbox toggle logic enforcing role rules
  const handleCheckboxClick = (unit: string, index: number, currentlyPaid: boolean) => {
    // 1. Not logged in -> Prompt login
    if (!authSession) {
      onOpenAuth();
      return;
    }

    // 2. Unit User rule: Can only enter pending data once. Cannot untick or change!
    if (authSession.role === 'unit') {
      if (currentlyPaid) {
        setLockedNotice(
          `🔒 ইউনিট ইউজার এন্ট্রি লক করা আছে। একবার চাঁদা এন্ট্রি করার পর ইউনিট আইডি থেকে পরিবর্তন বা আনটিক করা যায় না। শুধুমাত্র অ্যাডমিন (KQU2026) এটি পরিবর্তন করতে পারবেন।`
        );
        return;
      }
    }

    // Toggle payment
    onTogglePayment(unit, index, !currentlyPaid);
  };

  // WhatsApp receipt link generation
  const handleSendWhatsAppReceipt = (member: {
    name: string;
    mobileNo: string;
    amount: number;
    unit: string;
    index: number;
    isPaid: boolean;
  }) => {
    // Check permission: Unit users cannot send receipts, only admin can send
    if (authSession?.role === 'unit') {
      setLockedNotice(
        '⚠️ ইউনিট ইউজার মোডে রসিদ পাঠানোর অনুমতি নেই। শুধুমাত্র অ্যাডমিন (KQU2026) হোয়াটসঅ্যাপ রসিদ পাঠাতে পারবেন।'
      );
      return;
    }

    const cleanMobile = (member.mobileNo || '').replace(/\D/g, '').slice(-10);
    const receiptNo = `KQU-2026-U${member.unit}-${member.index + 1}`;
    const url = getWebsiteHttpsUrl();

    const text = `🌸 *${COMMITTEE_INFO.bengaliName}*\n*${COMMITTEE_INFO.name}*\nস্থান: *${COMMITTEE_INFO.place}*\nসভাপতি: *${COMMITTEE_INFO.presidentBengali}* | সম্পাদক: *${COMMITTEE_INFO.secretaryBengali}* | কোষাধ্যক্ষ: *${COMMITTEE_INFO.treasurerBengali}*\n\nশ্রদ্ধেয় *${member.name}* মহাশয়,\nদুর্গাপূজা ২০২৬ উপলক্ষে আপনার ইউনিট ${member.unit}-এর চাঁদা রসিদ বিবরণ:\n\n📄 রসিদ নং: *${receiptNo}*\n💰 চাঁদার পরিমাণ: *₹${formatINR(member.amount)}*\n✅ স্ট্যাটাস: *${member.isPaid ? 'পরিশোধিত (PAID)' : 'বাকি (PENDING)'}*\n\nমা দুর্গার চরণে আপনার ও আপনার পরিবারের সর্বাঙ্গীন মঙ্গল কামনা করি।\n👉 অফিসিয়াল উৎসব পোর্টাল: ${url}`;

    if (cleanMobile.length === 10) {
      window.open(`https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(text)}`, '_blank');
    } else {
      // If mobile number is missing, open general WhatsApp share
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Open edit mobile dialog for Admin
  const handleOpenEditMobile = (member: { unit: string; index: number; name: string; slNo: number; mobileNo: string }) => {
    if (authSession?.role !== 'admin') {
      setLockedNotice(
        '⚠️ মোবাইল নম্বর যোগ বা এডিট করার অধিকার শুধুমাত্র অ্যাডমিন (KQU2026)-এর রয়েছে।'
      );
      return;
    }
    setEditingMember({
      unit: member.unit,
      index: member.index,
      name: member.name,
      slNo: member.slNo,
      currentMobile: member.mobileNo,
    });
    setMobileInput(member.mobileNo || '');
  };

  const handleSaveMobile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    onUpdateMemberMobile(editingMember.unit, editingMember.index, mobileInput.trim());
    setEditingMember(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Supabase Cloud Database Realtime Status Ribbon */}
      <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200 shadow-md">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>
            <b>সুপারবেস সার্ভার সিঙ্ক:</b>{' '}
            <span className="font-mono text-emerald-300 font-bold">{SUPABASE_PROJECT_ID}</span>
          </span>
          <span className="hidden sm:inline text-stone-500">·</span>
          <span className="hidden sm:inline text-[11px] text-stone-300">
            ইউনিট আইডি দিয়ে করা সমস্ত এন্ট্রি ও মোবাইল নম্বর স্বয়ংক্রিয়ভাবে সুপারবেসে সেভ হচ্ছে।
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800/80 border border-emerald-400/50 text-white flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Supabase Live</span>
        </span>
      </div>

      {/* Role Banner: Unit User (Entry Only) vs Admin (Master Control) */}
      <div className="rounded-2xl p-4 shadow-sm border transition-all text-xs sm:text-sm">
        {authSession?.role === 'unit' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  ইউনিট ইউজার মোড সক্রিয় ({authSession.userId}) - শুধু এন্ট্রি করার অনুমতি
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  আপনি বকেয়া চাঁদা সংগ্রহ টিক করে এন্ট্রি করতে পারবেন। <strong>একবার এন্ট্রি করার পর কোনো কিছু এডিট বা সেন্ড করা যাবে না</strong>।
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-900 text-stone-100 hover:bg-stone-800 transition whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              অ্যাডমিন লগইন করুন
            </button>
          </div>
        ) : authSession?.role === 'admin' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  অ্যাডমিন মাস্টার মোড সক্রিয় ({authSession.userId}) - সর্বময় ক্ষমতা
                </p>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  ইউনিট আইডির সমস্ত এন্ট্রি দেখা, যেকোনো পরিবর্তন, যাদের মোবাইল নম্বর নেই তাদের নম্বর যোগ করা এবং হোয়াটসঅ্যাপ রসিদ পাঠানোর পূর্ণ অধিকার রয়েছে।
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-600 text-white rounded-full self-start sm:self-auto shadow-sm">
              Master Admin Active
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                <Info className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-stone-800 dark:text-stone-200">
                  গেস্ট ভিউয়ার মোড (সংরক্ষণ দেখতে লগইন করুন)
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  ইউনিট আইডি (ID: <code>UNIT1..7</code>, Pass: <code>KQU</code>) দিয়ে শুধু এন্ট্রি করা যাবে। অ্যাডমিন (ID: <code>KQU2026</code>, Pass: <code>712407</code>) সমস্ত ডেটা নিয়ন্ত্রণ করতে পারবেন।
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              লগইন করুন
            </button>
          </div>
        )}
      </div>

      {/* Temporary locked alert notification */}
      {lockedNotice && (
        <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-4 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-200">অনুমতি সীমাবদ্ধ (Permission Restriction)</p>
              <p className="mt-0.5 leading-relaxed">{lockedNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setLockedNotice(null)}
            className="text-red-500 hover:text-red-700 font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 7 Units, MISC, and Contacter Tabs Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {unitKeys.map((u) => {
          const count = staffUnitsData[u]?.length || 0;
          return (
            <button
              key={u}
              onClick={() => setCurrentUnit(u)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUnit === u
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-400'
              }`}
            >
              <span>{u === 'MISC' ? 'মিসলেনিয়াস (MISC)' : `ইউনিট ${u}`}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  currentUnit === u
                    ? 'bg-amber-800/60 text-amber-100'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Contractor / Contacter Tab directly after MISC tab */}
        {onNavigateToContact && (
          <button
            onClick={onNavigateToContact}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-600/30 to-amber-700/30 text-amber-300 border border-amber-500/50 hover:bg-amber-600 hover:text-white cursor-pointer shadow-sm"
            title="Edit Contractor / Contacter tab"
          >
            <HardHat className="w-3.5 h-3.5 text-amber-400" />
            <span>কন্ট্রাক্টর (Contractor)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 font-mono">৭ জন</span>
          </button>
        )}

        {/* All Units Consolidated */}
        <button
          onClick={() => setCurrentUnit('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            currentUnit === 'ALL'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-400'
          }`}
        >
          <span>সকল ইউনিট (১৬৭ জন)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              মোট চাঁদা লক্ষ্যমাত্রা
            </p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              ₹{formatINR(currentStats.total)}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentStats.totalMembers} জন কর্মী তালিকাভুক্ত
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              সংগৃহীত চাঁদা (পরিশোধিত)
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              ₹{formatINR(currentStats.collected)}
            </p>
            <p className="text-xs text-emerald-600/80 mt-0.5">
              {currentStats.paidMembers} জন দিয়েছেন · {currentStats.percentage}% সংগৃহীত
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              বকেয়া চাঁদা
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
              ₹{formatINR(currentStats.pending)}
            </p>
            <p className="text-xs text-rose-600/80 mt-0.5">
              {currentStats.totalMembers - currentStats.paidMembers} জন কর্মী বাকি
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, মোবাইল নম্বর, ক্র.নং বা পরিমাণ দিয়ে খুঁজুন..."
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              সকল ({currentStats.totalMembers})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>পরিশোধিত ({currentStats.paidMembers})</span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>বাকি ({currentStats.totalMembers - currentStats.paidMembers})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="default">ক্রমিক নম্বর অনুসারে (SL NO)</option>
              <option value="amount-desc">চাঁদা: বেশি থেকে কম</option>
              <option value="amount-asc">চাঁদা: কম থেকে বেশি</option>
              <option value="name-asc">নাম: অ থেকে হ (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenSaveJpg(currentUnit)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>JPG হিসেবে ডাউনলোড</span>
            </button>

            {authSession?.role === 'admin' && currentUnit !== 'ALL' && (
              <button
                onClick={() => onOpenAddMember(currentUnit)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            )}
          </div>

          {authSession?.role === 'admin' && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 text-stone-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>রিসেট / পরিষ্কার</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Staff Subscription Table with Checkbox, Mobile No, and WhatsApp Receipt Link */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-stone-800/90 text-stone-600 dark:text-stone-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">পরিশোধ</th>
                <th className="p-3 w-16">ক্র.নং</th>
                <th className="p-3">কর্মীর নাম</th>
                <th className="p-3">মোবাইল নম্বর</th>
                <th className="p-3">ইউনিট</th>
                <th className="p-3">চাঁদা</th>
                <th className="p-3">অবস্থা</th>
                <th className="p-3 text-right">রসিদ ও হোয়াটসঅ্যাপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {displayMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-stone-400">
                    কোনো কর্মীর রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                displayMembers.map((member) => {
                  const isUnitMode = authSession?.role === 'unit';
                  const isAdminMode = authSession?.role === 'admin';
                  const isLockedForUnit = isUnitMode && member.isPaid;
                  const hasMobile = Boolean(member.mobileNo && member.mobileNo.trim());

                  return (
                    <tr
                      key={`${member.unit}-${member.index}`}
                      className={`hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${
                        member.isPaid ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        {isLockedForUnit ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-600 cursor-not-allowed"
                            title="লক করা: ইউনিট এন্ট্রি হয়ে গেছে। পরিবর্তন করতে পারবেন না।"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={member.isPaid}
                            onChange={() => handleCheckboxClick(member.unit, member.index, member.isPaid)}
                            className="w-5 h-5 rounded text-emerald-600 border-stone-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            title={
                              !authSession
                                ? 'লগইন করে এন্ট্রি করুন'
                                : isAdminMode
                                ? 'অ্যাডমিন: ক্লিক করে পেইড/বাকি পরিবর্তন করুন'
                                : 'ইউনিট ইউজার: ক্লিক করে এন্ট্রি করুন'
                            }
                          />
                        )}
                      </td>

                      {/* SL NO */}
                      <td className="p-3 font-mono font-bold text-stone-500">
                        #{member.slNo}
                      </td>

                      {/* Staff Name */}
                      <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                        {member.name}
                      </td>

                      {/* Mobile No & Edit for Admin */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {hasMobile ? (
                            <span className="font-mono text-stone-700 dark:text-stone-300 font-semibold">
                              {member.mobileNo}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                              মোবাইল নম্বর নেই
                            </span>
                          )}

                          {/* Admin Edit Button to add or change mobile number */}
                          {isAdminMode && (
                            <button
                              onClick={() => handleOpenEditMobile(member)}
                              className="p-1 text-stone-400 hover:text-amber-500 transition cursor-pointer"
                              title="মোবাইল নম্বর যোগ/সম্পাদনা করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px]">
                          {member.unit === 'MISC' ? 'MISC' : `Unit ${member.unit}`}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                        ₹{formatINR(member.amount)}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        {member.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>পরিশোধিত</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                            <span>বাকি</span>
                          </span>
                        )}
                      </td>

                      {/* Receipt & WhatsApp Link */}
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Official E-Receipt Modal Button */}
                          <button
                            onClick={() => onOpenReceipt(member)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold flex items-center gap-1 cursor-pointer transition text-[11px]"
                            title="রসিদ দেখুন"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">রসিদ</span>
                          </button>

                          {/* WhatsApp Link Receipt Button */}
                          <button
                            onClick={() => handleSendWhatsAppReceipt(member)}
                            className="px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold border border-[#25D366]/40 flex items-center gap-1 cursor-pointer transition text-[11px]"
                            title="হোয়াটসঅ্যাপে রসিদ পাঠান"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]/20" />
                            <span className="hidden sm:inline">হোয়াটসঅ্যাপ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Edit / Add Mobile Number Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingMember(null)}
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
                  মোবাইল নম্বর যোগ / এডিট
                </h3>
                <p className="text-xs text-stone-500">
                  অ্যাডমিন অধিকার · স্বয়ংক্রিয়ভাবে সুপারবেসে সেভ হবে
                </p>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl mb-4 text-xs space-y-1">
              <p>
                <span className="text-stone-400">কর্মী:</span>{' '}
                <b>{editingMember.name}</b> (SL #{editingMember.slNo})
              </p>
              <p>
                <span className="text-stone-400">ইউনিট:</span>{' '}
                <span className="font-mono font-bold text-amber-600">Unit {editingMember.unit}</span>
              </p>
            </div>

            <form onSubmit={handleSaveMobile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                  ১০ অঙ্কের মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
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
                  সংরক্ষণ করুন (Save to Supabase)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
