import React, { useState } from 'react';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  ShieldCheck, 
  Search, 
  Copy, 
  Check, 
  Building2, 
  Users, 
  Edit2, 
  Plus, 
  X, 
  Lock,
  Wrench,
  Sparkles,
  Truck,
  HardHat,
  Music,
  Flame
} from 'lucide-react';
import { COMMITTEE_INFO } from '../data/pujaData';
import { Language, AuthSession } from '../types';

export interface ContractorContact {
  id: string;
  category: string;
  name: string;
  role: string;
  mobile: string;
  organization: string;
  status: string;
  notes?: string;
  iconName?: string;
}

const DEFAULT_CONTRACTORS: ContractorContact[] = [];

interface ContacterTabProps {
  lang: Language;
  authSession?: AuthSession | null;
  onOpenAuth?: () => void;
  onUpdateMemberMobile?: (unit: string, index: number, newMobile: string) => void;
}

export const ContacterTab: React.FC<ContacterTabProps> = ({ 
  lang, 
  authSession, 
  onOpenAuth 
}) => {
  const [activeSection, setActiveSection] = useState<'contractors' | 'committee' | 'emergency'>('contractors');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contractors State - Starts empty with only Add option as requested: "no contractor name only add option created"
  const [contractors, setContractors] = useState<ContractorContact[]>(() => {
    try {
      const saved = localStorage.getItem('dp_contractor_list');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Modal for editing/adding contractor
  const [editingContractor, setEditingContractor] = useState<ContractorContact | null>(null);
  const [isNewContractor, setIsNewContractor] = useState<boolean>(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const isAdmin = authSession?.role === 'admin';

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleDeleteContractor = (id: string) => {
    if (!isAdmin) {
      setAlertNotice('⚠️ শুধুমাত্র অ্যাডমিন (KQU2026) কন্ট্রাক্টর মুছে ফেলতে পারবেন।');
      return;
    }
    const updated = contractors.filter(c => c.id !== id);
    setContractors(updated);
    try {
      localStorage.setItem('dp_contractor_list', JSON.stringify(updated));
    } catch {}
    setAlertNotice('✓ কন্ট্রাক্টর সফলভাবে মুছে ফেলা হয়েছে।');
    setTimeout(() => setAlertNotice(null), 2500);
  };

  const handleSaveContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setAlertNotice('⚠️ শুধুমাত্র অ্যাডমিন (KQU2026) কন্ট্রাক্টর বা মোবাইল নম্বর এডিট করতে পারবেন।');
      return;
    }
    if (!editingContractor) return;

    let updated: ContractorContact[];
    if (isNewContractor) {
      updated = [...contractors, { ...editingContractor, id: `ct-${Date.now()}` }];
    } else {
      updated = contractors.map(c => c.id === editingContractor.id ? editingContractor : c);
    }

    setContractors(updated);
    try {
      localStorage.setItem('dp_contractor_list', JSON.stringify(updated));
    } catch {}

    setEditingContractor(null);
    setIsNewContractor(false);
    setAlertNotice('✓ কন্ট্রাক্টর ও মোবাইল নম্বর সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setAlertNotice(null), 3000);
  };

  const handleOpenEdit = (c: ContractorContact) => {
    if (!isAdmin) {
      onOpenAuth?.();
      setAlertNotice('⚠️ কন্ট্রাক্টর মোবাইল বা তথ্য এডিট করতে অ্যাডমিন হিসেবে লগইন করুন।');
      return;
    }
    setEditingContractor({ ...c });
    setIsNewContractor(false);
  };

  const handleOpenAddNew = () => {
    if (!isAdmin) {
      onOpenAuth?.();
      setAlertNotice('⚠️ নতুন কন্ট্রাক্টর যুক্ত করতে অ্যাডমিন হিসেবে লগইন করুন।');
      return;
    }
    setEditingContractor({
      id: '',
      category: 'প্যান্ডেল ও মণ্ডপ ডেকোরেটর',
      name: '',
      role: 'প্রধান কারিগর / সরবরাহকারী',
      mobile: '',
      organization: '',
      status: 'Confirmed',
      notes: '',
    });
    setIsNewContractor(true);
  };

  const keyContacts = [
    {
      roleBengali: 'পূজা সভাপতি (President)',
      name: COMMITTEE_INFO.presidentBengali,
      englishName: COMMITTEE_INFO.president,
      mobile: '9831616466',
      subTitle: 'সর্বাঙ্গীন পূজা পরিচালনা ও প্রশাসনিক প্রধান',
      badge: 'President',
      color: 'red',
    },
    {
      roleBengali: 'সাধারণ সম্পাদক (Secretary)',
      name: COMMITTEE_INFO.secretaryBengali,
      englishName: COMMITTEE_INFO.secretary,
      mobile: '9932401892',
      subTitle: 'মণ্ডপ প্রস্তুতি, কর্মী সমন্বয় ও যোগাযোগ প্রধান',
      badge: 'Secretary',
      color: 'amber',
    },
    {
      roleBengali: 'কোষাধ্যক্ষ (Treasurer)',
      name: COMMITTEE_INFO.treasurerBengali,
      englishName: COMMITTEE_INFO.treasurer,
      mobile: '9024222693',
      subTitle: 'অর্থ তহবিল, অনুদান ও রসিদ হিসাব নিয়ন্ত্রণ',
      badge: 'Treasurer',
      color: 'emerald',
    },
    {
      roleBengali: 'রেলওয়ে পি.ডব্লিউ.আই দপ্তর (SSE / PWAY / KQU)',
      name: 'PWI Office Control Room',
      englishName: 'SSE / PWAY KQU Office',
      mobile: '8961958385',
      subTitle: 'উৎসব মাঠ ও রেলওয়ে কার্যালয় যোগাযোগ কেন্দ্র',
      badge: 'Office HQ',
      color: 'blue',
    },
  ];

  const emergencyContacts = [
    { title: 'জরুরি অ্যাম্বুলেন্স (Ambulance)', contact: '102 / 9831068891', icon: '🚑' },
    { title: 'দমকল কেন্দ্র (Fire Station)', contact: '101', icon: '🚒' },
    { title: 'স্থানীয় পুলিশ সহায়তা (Police Helpdesk)', contact: '100 / 112', icon: '👮' },
    { title: 'উৎসব প্রাথমিক চিকিৎসা ও হেল্পডেস্ক', contact: '8967051470', icon: '🩺' },
  ];

  const filteredContractors = contractors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile.includes(searchQuery) ||
    c.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white border border-amber-600/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-900/60 border border-red-500/40 text-amber-300 text-xs font-semibold mb-3">
              <HardHat className="w-4 h-4 text-amber-400" />
              <span>Contacter / Contractor Tab (MISC ট্যাবের পাশে)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-festive text-amber-100 tracking-wide">
              কন্ট্রাক্টর ও পূজা আধিকারিক যোগাযোগ কেন্দ্র
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              DURGA PUJA 2026 KQU উৎসব মণ্ডপ নির্মাণ, প্রতিমা, লাইটিং, সাউন্ড, ঢাকী ও ক্যাটারিং কন্ট্রাক্টরদের বিস্তারিত তথ্য ও মোবাইল নম্বর। অ্যাডমিন যেকোনো মোবাইল নম্বর সম্পাদনা করতে পারেন।
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-amber-500/30 text-xs text-amber-200">
              <p className="font-bold flex items-center gap-1.5 text-white">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>KQU PWI OFFICE</span>
              </p>
              <p className="text-stone-400 mt-0.5">SSE / PWAY / KQU রেলওয়ে কলোনি মাঠ</p>
            </div>
            {isAdmin && (
              <button
                onClick={handleOpenAddNew}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন কন্ট্রাক্টর যোগ করুন</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Notice */}
      {alertNotice && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-300 flex items-center justify-between animate-in fade-in">
          <span>{alertNotice}</span>
          <button onClick={() => setAlertNotice(null)} className="text-amber-400 font-bold">✕</button>
        </div>
      )}

      {/* Segment Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('contractors')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition ${
            activeSection === 'contractors'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>কন্ট্রাক্টর ও সেবা সরবরাহকারী ({contractors.length} জন)</span>
        </button>

        <button
          onClick={() => setActiveSection('committee')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition ${
            activeSection === 'committee'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>কমিটি শীর্ষ আধিকারিক (Key Officials)</span>
        </button>

        <button
          onClick={() => setActiveSection('emergency')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition ${
            activeSection === 'emergency'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>জরুরি হেল্পডেস্ক (Emergency)</span>
        </button>
      </div>

      {/* SECTION 1: CONTRACTORS DIRECTORY (Edit Contractor Tab just after misc tab) */}
      {activeSection === 'contractors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <span>মণ্ডপ, লাইট, সাউন্ড ও প্রতিমা কন্ট্রাক্টরদের তালিকা</span>
              </h2>
              <p className="text-xs text-stone-500">
                {isAdmin ? 'অ্যাডমিন মোড: যেকোনো কন্ট্রাক্টরের মোবাইল নম্বর বা দায়িত্ব এডিট করুন।' : 'কন্ট্রাক্টরের সাথে সরাসরি ফোন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddNew}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন কন্ট্রাক্টর যোগ করুন (Add Contractor)</span>
              </button>

              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="কন্ট্রাক্টর বা বিভাগ খুঁজুন..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {filteredContractors.length === 0 ? (
            <div className="text-center py-12 px-6 bg-stone-900/40 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <HardHat className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-amber-100 font-festive">
                  কোনো কন্ট্রাক্টর নাম তালিকাভুক্ত নেই (No Contractor Added Yet)
                </h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                  মণ্ডপ, আলোকসজ্জা, মাইক, প্রতিমা বা ডেকোরেশনের কোনো কন্ট্রাক্টর যুক্ত করতে নিচে ক্লিক করুন।
                </p>
              </div>
              <button
                onClick={handleOpenAddNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন কন্ট্রাক্টর যোগ করুন (+ Add Contractor)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContractors.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {c.category}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      {c.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 font-festive">
                    {c.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {c.role}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    🏢 {c.organization}
                  </p>
                  {c.notes && (
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-2 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 leading-relaxed">
                      {c.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-800 dark:text-stone-200">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>+91 {c.mobile}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(c.mobile)}
                        className="p-1 hover:text-amber-500 text-stone-400 cursor-pointer"
                        title="Copy Phone"
                      >
                        {copiedPhone === c.mobile ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 text-amber-500 hover:text-amber-400 cursor-pointer"
                            title="কন্ট্রাক্টর বা মোবাইল নম্বর এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteContractor(c.id)}
                            className="p-1 text-red-500 hover:text-red-400 cursor-pointer"
                            title="কন্ট্রাক্টর মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:+91${c.mobile}`}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>কল করুন</span>
                    </a>

                    <a
                      href={`https://api.whatsapp.com/send?phone=91${c.mobile}&text=${encodeURIComponent(`নমস্কার ${c.name} মহাশয়, DURGA PUJA 2026 KQU উৎসবের ${c.category} সংক্রান্ত বিষয়ে যোগাযোগ করছি।`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: COMMITTEE OFFICIALS */}
      {activeSection === 'committee' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {contact.badge}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>

                <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {contact.roleBengali}
                </h3>
                <p className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100 font-festive mt-0.5">
                  {contact.name}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  {contact.subTitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-800 dark:text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>+91 {contact.mobile}</span>
                  </span>
                  <button
                    onClick={() => handleCopy(contact.mobile)}
                    className="p-1 hover:text-amber-500 text-stone-400 cursor-pointer"
                    title="Copy Phone"
                  >
                    {copiedPhone === contact.mobile ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:+91${contact.mobile}`}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল করুন</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?phone=91${contact.mobile}&text=${encodeURIComponent(`নমস্কার ${contact.englishName} মহাশয়, দুর্গাপূজা ২০২৬ KQU উৎসব ও চাঁদা সংক্রান্ত বিষয়ে যোগাযোগ করছি।`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: EMERGENCY CONTACTS */}
      {activeSection === 'emergency' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>উৎসব মণ্ডপ জরুরি হেল্পডেস্ক (Emergency Contacts)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {emergencyContacts.map((em, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{em.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{em.title}</p>
                    <p className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">{em.contact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Edit / Add Contractor (Only Admin) */}
      {editingContractor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingContractor(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-2xl">
                <HardHat className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {isNewContractor ? 'নতুন কন্ট্রাক্টর যোগ করুন' : 'কন্ট্রাক্টর ও মোবাইল এডিট'}
                </h3>
                <p className="text-xs text-stone-500">
                  অ্যাডমিন অধিকার (KQU2026) · স্বয়ংক্রিয়ভাবে সেভ হবে
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveContractor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  বিভাগ / ক্যাটাগরি *
                </label>
                <input
                  type="text"
                  value={editingContractor.category}
                  onChange={(e) => setEditingContractor({ ...editingContractor, category: e.target.value })}
                  placeholder="যেমন: মণ্ডপ ডেকোরেশন, আলোকসজ্জা, সাউন্ড..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  কন্ট্রাক্টরের নাম *
                </label>
                <input
                  type="text"
                  value={editingContractor.name}
                  onChange={(e) => setEditingContractor({ ...editingContractor, name: e.target.value })}
                  placeholder="যেমন: বিভূতি সর্দার"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  মোবাইল নম্বর (১০ ডিজিট) *
                </label>
                <input
                  type="text"
                  value={editingContractor.mobile}
                  onChange={(e) => setEditingContractor({ ...editingContractor, mobile: e.target.value })}
                  placeholder="যেমন: 9831068891"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  সংস্থা / প্রতিষ্ঠান
                </label>
                <input
                  type="text"
                  value={editingContractor.organization}
                  onChange={(e) => setEditingContractor({ ...editingContractor, organization: e.target.value })}
                  placeholder="যেমন: মা তারা ডেকোরেটর্স"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  কাজের বিবরণ / নোট
                </label>
                <textarea
                  value={editingContractor.notes || ''}
                  onChange={(e) => setEditingContractor({ ...editingContractor, notes: e.target.value })}
                  rows={2}
                  placeholder="কাজের দায়িত্ব, চুক্তির বিশেষ বিবরণ..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  সংরক্ষণ করুন (Save)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingContractor(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
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
