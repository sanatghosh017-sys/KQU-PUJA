import React, { useState, useMemo } from 'react';
import {
  Users,
  Phone,
  MessageCircle,
  Search,
  Copy,
  Check,
  Edit2,
  Plus,
  Trash2,
  Video,
  ShieldCheck,
  Building2,
  Briefcase,
  X,
  Lock,
  Sparkles
} from 'lucide-react';
import { SseJeClerkEntry, AuthSession, Language } from '../types';
import { INITIAL_SSE_JE_CLERK, COMMITTEE_INFO } from '../data/pujaData';

interface SseJeClerkTabProps {
  lang: Language;
  authSession?: AuthSession | null;
  onOpenAuth: () => void;
  onOpenLiveCameraModal?: (recipient?: { name: string; phone: string }) => void;
}

export const SseJeClerkTab: React.FC<SseJeClerkTabProps> = ({
  lang,
  authSession,
  onOpenAuth,
  onOpenLiveCameraModal,
}) => {
  const [entries, setEntries] = useState<SseJeClerkEntry[]>(() => {
    try {
      const saved = localStorage.getItem('dp_sse_je_clerk');
      if (saved) return JSON.parse(saved);
      return INITIAL_SSE_JE_CLERK;
    } catch {
      return INITIAL_SSE_JE_CLERK;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SSE' | 'JE' | 'Clerk' | 'Supervisor' | 'Office'>('ALL');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Edit / Add Modal State
  const [editingItem, setEditingItem] = useState<SseJeClerkEntry | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);

  const isAdmin = authSession?.role === 'admin';

  const handleCopy = (phone: string) => {
    const clean = phone.split('/')[0].trim();
    navigator.clipboard.writeText(clean);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenEdit = (item: SseJeClerkEntry) => {
    if (!isAdmin) {
      onOpenAuth();
      setAlertNotice('⚠️ নাম ও মোবাইল নম্বর এডিট করার জন্য অ্যাডমিন হিসেবে লগইন করুন।');
      return;
    }
    setEditingItem({ ...item });
    setIsNewEntry(false);
  };

  const handleOpenAddNew = () => {
    if (!isAdmin) {
      onOpenAuth();
      setAlertNotice('⚠️ নতুন স্টাফ যোগ করতে অ্যাডমিন হিসেবে লগইন করুন।');
      return;
    }
    setEditingItem({
      id: `sjc-${Date.now()}`,
      name: '',
      designationCategory: 'Clerk',
      designationTitle: 'Junior Clerk / Office Staff',
      mobileNo: '',
      department: 'Engineering / P.Way',
      officeLocation: 'KQU PWI Office',
      notes: '',
    });
    setIsNewEntry(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      setAlertNotice('⚠️ স্টাফ মুছে ফেলার অধিকার শুধুমাত্র অ্যাডমিন (KQU2026)-এর রয়েছে।');
      return;
    }
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    try {
      localStorage.setItem('dp_sse_je_clerk', JSON.stringify(updated));
    } catch {}
    setAlertNotice('✓ স্টাফ সফলভাবে তালিকা থেকে অপসারিত হয়েছে।');
    setTimeout(() => setAlertNotice(null), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setAlertNotice('⚠️ শুধুমাত্র অ্যাডমিন নাম ও মোবাইল নম্বর সংরক্ষণ করতে পারবেন।');
      return;
    }
    if (!editingItem || !editingItem.name.trim()) {
      setAlertNotice('দয়া করে স্টাফের নাম প্রদান করুন।');
      return;
    }

    let updated: SseJeClerkEntry[];
    if (isNewEntry) {
      updated = [...entries, editingItem];
    } else {
      updated = entries.map((item) => (item.id === editingItem.id ? editingItem : item));
    }

    setEntries(updated);
    try {
      localStorage.setItem('dp_sse_je_clerk', JSON.stringify(updated));
    } catch {}

    setEditingItem(null);
    setIsNewEntry(false);
    setAlertNotice('✓ নাম ও মোবাইল নম্বর সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setAlertNotice(null), 3000);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      if (filterCategory !== 'ALL' && item.designationCategory !== filterCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchMobile = item.mobileNo.includes(q);
        const matchDesig = item.designationTitle.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        const matchLoc = item.officeLocation.toLowerCase().includes(q);
        if (!matchName && !matchMobile && !matchDesig && !matchDept && !matchLoc) return false;
      }
      return true;
    });
  }, [entries, filterCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-red-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-amber-50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>রেলওয়ে পি.ওয়ে আধিকারিক ও দপ্তর কর্মী</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-festive text-amber-100 flex items-center gap-3">
              <span>SSE / JE / Clerk ডিরেক্টরি</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
              <strong>SSE/PW/KQU</strong> বিভাগের সিনিয়র সেকশন ইঞ্জিনিয়ার, জুনিয়র ইঞ্জিনিয়ার ও ক্লারিক্যাল অফিস কর্মীদের অফিসিয়াল তালিকা। 
              {isAdmin ? (
                <span className="text-emerald-400 font-bold ml-1">
                  (অ্যাডমিন মোড সক্রিয়: আপনি যে কোনো নাম ও মোবাইল নম্বর এডিট করতে পারবেন।)
                </span>
              ) : (
                <span className="text-stone-400 ml-1">
                  (অ্যাডমিন লগইন করে যে কোনো মোবাইল নম্বর ও নাম পরিবর্তন করা যাবে।)
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddNew}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black rounded-2xl shadow-xl shadow-amber-600/30 text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন নাম যোগ করুন (+ Add Staff)</span>
            </button>
            {!isAdmin && (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2.5 bg-stone-900/80 hover:bg-stone-900 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>অ্যাডমিন এডিট লগইন</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Notice */}
      {alertNotice && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-300 flex items-center justify-between animate-in fade-in">
          <span>{alertNotice}</span>
          <button onClick={() => setAlertNotice(null)} className="text-amber-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0 text-xs">
          {(['ALL', 'SSE', 'JE', 'Clerk', 'Supervisor', 'Office'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === cat
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              {cat === 'ALL' ? 'সকল আধিকারিক ও ক্লার্ক' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, পদবি বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map((item) => {
          const firstMobile = item.mobileNo.split('/')[0].trim().replace(/\D/g, '').slice(-10);
          return (
            <div
              key={item.id}
              className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Category Badge & Admin Edit Controls */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      item.designationCategory === 'SSE'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : item.designationCategory === 'JE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : item.designationCategory === 'Clerk'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : item.designationCategory === 'Supervisor'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {item.designationCategory}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                      title="নাম ও মোবাইল নম্বর এডিট করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                        title="স্টাফ মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Staff Name */}
                <h3 className="text-base sm:text-lg font-bold text-stone-100 font-festive flex items-center justify-between">
                  <span>{item.name}</span>
                </h3>

                {/* Designation & Office */}
                <p className="text-xs font-semibold text-amber-400 mt-0.5">
                  {item.designationTitle}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-2">
                  <Building2 className="w-3 h-3 text-stone-500 shrink-0" />
                  <span>{item.department} · {item.officeLocation}</span>
                </div>
                {item.notes && (
                  <p className="text-[11px] text-stone-400/90 mt-1.5 italic bg-stone-950/40 p-2 rounded-xl border border-stone-800">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Mobile, Call, WhatsApp and Live Camera Actions */}
              <div className="mt-4 pt-3 border-t border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.mobileNo ? `+91 ${item.mobileNo}` : 'মোবাইল যুক্ত নেই'}</span>
                  </span>
                  {item.mobileNo && (
                    <button
                      onClick={() => handleCopy(item.mobileNo)}
                      className="p-1 hover:text-amber-400 text-stone-400 cursor-pointer"
                      title="Copy Mobile"
                    >
                      {copiedPhone === item.mobileNo ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:+91${firstMobile}`}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল করুন</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?phone=91${firstMobile}&text=${encodeURIComponent(`নমস্কার ${item.name} মহাশয়, DURGA PUJA 2026 KQU উৎসব ও P.Way অফিসিয়াল যোগাযোগ করছি।`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* WhatsApp Live Camera Option */}
                {onOpenLiveCameraModal && (
                  <button
                    onClick={() => onOpenLiveCameraModal({ name: item.name, phone: firstMobile })}
                    className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span>হোয়াটসঅ্যাপে লাইভ ক্যামেরা শেয়ার করুন</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 px-6 bg-stone-900/40 border border-dashed border-stone-800 rounded-3xl space-y-3">
          <p className="text-stone-400 text-sm">কোনো তথ্য পাওয়া যায়নি।</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('ALL');
            }}
            className="text-xs text-amber-400 underline font-bold"
          >
            ফিল্টার রিসেট করুন
          </button>
        </div>
      )}

      {/* Edit / Add Modal (Available by Admin) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-stone-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>{isNewEntry ? 'নতুন স্টাফ যোগ করুন' : 'নাম ও মোবাইল নম্বর এডিট করুন'}</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                  স্টাফের পুরো নাম *
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="যেমন: Biswajit Mondal, Sanjoy Kumar Das..."
                  required
                  className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                  মোবাইল নম্বর * (Any Mobile Number Edit)
                </label>
                <input
                  type="text"
                  value={editingItem.mobileNo}
                  onChange={(e) => setEditingItem({ ...editingItem, mobileNo: e.target.value })}
                  placeholder="যেমন: 9831068891 / 9932401892"
                  required
                  className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={editingItem.designationCategory}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        designationCategory: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SSE">SSE (Sr. Section Eng.)</option>
                    <option value="JE">JE (Junior Engineer)</option>
                    <option value="Clerk">Clerk (অফিস কর্মী)</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Office">Office Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    দপ্তর / লোকেশন
                  </label>
                  <input
                    type="text"
                    value={editingItem.officeLocation}
                    onChange={(e) => setEditingItem({ ...editingItem, officeLocation: e.target.value })}
                    placeholder="যেমন: KQU PWI Office"
                    className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                  পদবি ও দায়িত্ব বিবরণী
                </label>
                <input
                  type="text"
                  value={editingItem.designationTitle}
                  onChange={(e) => setEditingItem({ ...editingItem, designationTitle: e.target.value })}
                  placeholder="যেমন: Senior Section Engineer (In-Charge)"
                  className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                  নোট বা মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="কমিটির ভূমিকা বা বিশেষ দায়িত্ব"
                  className="w-full p-2.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-stone-300 hover:text-white bg-stone-800 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-bold hover:from-amber-400 hover:to-yellow-400 cursor-pointer shadow-md"
                >
                  সংরক্ষণ করুন (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
