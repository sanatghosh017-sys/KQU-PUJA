import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  MessageCircle, 
  Phone, 
  Heart
} from 'lucide-react';
import { COMMITTEE_INFO, formatINR, numberToWordsIndian, getWebsiteHttpsUrl } from '../data/pujaData';
import { PaymentState } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitsData: Record<string, [string, number][]>;
  paymentState: PaymentState;
  preselectedMember?: {
    name: string;
    amount: number;
    unit: string;
    index: number;
    paidDate?: string;
    method?: string;
  } | null;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  unitsData,
  paymentState,
  preselectedMember = null
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receipt' | 'website' | 'committee'>('receipt');
  const [donorPhone, setDonorPhone] = useState('');
  const [copied, setCopied] = useState(false);

  // Selected donor state (default to preselected or first paid member)
  const paidMembers = React.useMemo(() => {
    const list: {
      name: string;
      amount: number;
      unit: string;
      index: number;
      receiptNo: string;
      paidAt?: string;
      method: string;
    }[] = [];
    Object.entries(unitsData).forEach(([unit, items]) => {
      items.forEach((item, idx) => {
        const key = `${unit}-${idx}`;
        if (paymentState[key]?.paid) {
          list.push({
            name: item[0],
            amount: item[1],
            unit,
            index: idx,
            receiptNo: `DP-2026-U${unit}-${String(idx + 1).padStart(3, '0')}`,
            paidAt: paymentState[key]?.paidAt,
            method: paymentState[key]?.method || 'Cash'
          });
        }
      });
    });
    return list;
  }, [unitsData, paymentState]);

  const [selectedDonorKey, setSelectedDonorKey] = useState<string>(
    preselectedMember 
      ? `${preselectedMember.unit}-${preselectedMember.index}` 
      : paidMembers[0] ? `${paidMembers[0].unit}-${paidMembers[0].index}` : ''
  );

  const currentDonor = React.useMemo(() => {
    if (preselectedMember && (!selectedDonorKey || selectedDonorKey === `${preselectedMember.unit}-${preselectedMember.index}`)) {
      return {
        name: preselectedMember.name,
        amount: preselectedMember.amount,
        unit: preselectedMember.unit,
        index: preselectedMember.index,
        receiptNo: `DP-2026-U${preselectedMember.unit}-${String(preselectedMember.index + 1).padStart(3, '0')}`,
        paidAt: preselectedMember.paidDate,
        method: preselectedMember.method || 'Cash'
      };
    }
    const found = paidMembers.find(m => `${m.unit}-${m.index}` === selectedDonorKey);
    return found || paidMembers[0] || null;
  }, [preselectedMember, selectedDonorKey, paidMembers]);

  if (!isOpen) return null;

  const websiteUrl = getWebsiteHttpsUrl();

  const getReceiptWhatsAppMessage = () => {
    if (!currentDonor) {
      return `*${COMMITTEE_INFO.bengaliName}*\n*${COMMITTEE_INFO.name}*\nPlace: *${COMMITTEE_INFO.place}*\n\nSubho Sharadiya! Explore our Puja portal & contribute chanda:\n👉 ${websiteUrl}`;
    }
    const displayDate = currentDonor.paidAt 
      ? new Date(currentDonor.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return `🌸 *${COMMITTEE_INFO.bengaliName}* 🌸\n*${COMMITTEE_INFO.name}*\nPlace: *${COMMITTEE_INFO.place}*\n========================================\n📜 *OFFICIAL PUJA CHANDA RECEIPT*\n*Receipt No:* ${currentDonor.receiptNo}\n*Donor / Member:* ${currentDonor.name}\n*Unit:* ${currentDonor.unit === 'MISC' ? 'General / Misc' : `Unit ${currentDonor.unit}`}\n*Amount Paid:* ₹${formatINR(currentDonor.amount)} (${numberToWordsIndian(currentDonor.amount)})\n*Date:* ${displayDate}\n*Payment Mode:* ${currentDonor.method}\n*Status:* PAID / পরিশোধিত\n========================================\n🙏 May Maa Durga bless your home with peace, happiness, and prosperity!\n🌐 *Official Portal:* ${websiteUrl}\nSubho Sharadotsav 2026! 🪔`;
  };

  const getWebsiteWhatsAppMessage = () => {
    return `🌸 *${COMMITTEE_INFO.bengaliName}* (১৪৩৩)\n*${COMMITTEE_INFO.name}*\n🏛️ *Place:* ${COMMITTEE_INFO.place}\n👤 *President:* ${COMMITTEE_INFO.president}\n👤 *Treasurer:* ${COMMITTEE_INFO.treasurer}\n\nWarm greetings for Durga Puja 2026! Access our official digital website for:\n✨ Live Puja Subscription Tracker\n📄 Instant Official Receipts\n📸 Pandal & Idol Photo Gallery\n🙏 Secure Online Chanda Contribution\n\n🌐 *Official Website:* ${websiteUrl}\n\nSubho Sharadiya to all family & friends! 🪔`;
  };

  const handleOpenWhatsApp = (type: 'receipt' | 'website') => {
    const text = type === 'receipt' ? getReceiptWhatsAppMessage() : getWebsiteWhatsAppMessage();
    let url = '';
    const cleanPhone = donorPhone.replace(/\D/g, '');
    if (type === 'receipt' && cleanPhone.length >= 10) {
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyText = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-emerald-500/40 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-emerald-300/30 flex items-center justify-center text-emerald-200 shadow-inner">
              <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366]/20" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>WhatsApp Connect</span>
              </h3>
              <p className="text-xs text-emerald-200/90">
                Send receipts, invite members & connect with puja leaders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveSubTab('receipt')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'receipt'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Receipt</span>
          </button>
          <button
            onClick={() => setActiveSubTab('website')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'website'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Website Link</span>
          </button>
          <button
            onClick={() => setActiveSubTab('committee')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'committee'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Committee Contact</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-4">
          
          {/* TAB 1: SEND RECEIPT */}
          {activeSubTab === 'receipt' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Select Paid Member / Donor:
                </label>
                {paidMembers.length === 0 ? (
                  <div className="text-xs text-stone-500 italic p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
                    No subscriptions marked as paid yet. Mark members paid in Subscription Tracker to send receipts.
                  </div>
                ) : (
                  <select
                    value={selectedDonorKey}
                    onChange={(e) => setSelectedDonorKey(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {paidMembers.map((m) => (
                      <option key={`${m.unit}-${m.index}`} value={`${m.unit}-${m.index}`}>
                        {m.name} · Unit {m.unit} (₹{formatINR(m.amount)}) [{m.receiptNo}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Donor WhatsApp Mobile Number (Optional):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210 (Leave blank to choose from WhatsApp contacts)"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Enter 10-digit number to launch direct chat, or open WhatsApp to pick any contact/group.
                </p>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    WhatsApp Message Preview:
                  </label>
                  <button
                    onClick={() => handleCopyText(getReceiptWhatsAppMessage())}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="bg-stone-900 text-emerald-300 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-emerald-900/50 leading-relaxed shadow-inner">
                  {getReceiptWhatsAppMessage()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleOpenWhatsApp('receipt')}
                  disabled={!currentDonor}
                  className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Send via WhatsApp</span>
                </button>
                <button
                  onClick={() => handleCopyText(getReceiptWhatsAppMessage())}
                  className="py-3 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SHARE WEBSITE LINK */}
          {activeSubTab === 'website' && (
            <div className="space-y-4">
              <div className="bg-stone-900/90 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
                  Verified Official Link
                </span>
                <p className="font-mono text-xs text-amber-200 break-all select-all font-semibold bg-black/50 p-2.5 rounded-lg border border-stone-800">
                  {websiteUrl}
                </p>
                <p className="text-[11px] text-stone-400">
                  Devotees can browse festival schedule, see pandal gallery, check unit subscriptions, and contribute chanda securely.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  WhatsApp Invitation & Portal Message:
                </label>
                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-44 overflow-y-auto border border-stone-800 leading-relaxed shadow-inner">
                  {getWebsiteWhatsAppMessage()}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleOpenWhatsApp('website')}
                  className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={() => handleCopyText(websiteUrl)}
                  className="py-3 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COMMITTEE LEADERSHIP CONTACT */}
          {activeSubTab === 'committee' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Connect directly with the Puja Executive Officers via WhatsApp for chanda queries, unit allotments, and cultural event details:
              </p>

              {/* President */}
              <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {COMMITTEE_INFO.president}
                  </h4>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    President · Durga Puja 2026
                  </p>
                  <p className="text-[11px] text-stone-400">PWI Office Ground Celebrations</p>
                </div>
                <button
                  onClick={() => {
                    const text = `Namaskar Sanjoy Da,\nI am reaching out regarding Durga Puja 2026 (KQU PWI Ground).\n\nPortal: ${websiteUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Treasurer */}
              <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {COMMITTEE_INFO.treasurer}
                  </h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Treasurer · Subscriptions & Accounts
                  </p>
                  <p className="text-[11px] text-stone-400">Official Receipts & Financial Verification</p>
                </div>
                <button
                  onClick={() => {
                    const text = `Namaskar Dhananjay Ji,\nI would like to inquire about Durga Puja 2026 Chanda / Subscription.\n\nPortal: ${websiteUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Community Link */}
              <div className="bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-emerald-200 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    <span>Devotees WhatsApp Group</span>
                  </h4>
                  <p className="text-[11px] text-stone-300">
                    Share puja photos, anjali timings & bhog announcements
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = `🌸 Join our Durga Puja 2026 (KQU) WhatsApp Community:\n${websiteUrl}\nSubho Sharadiya! 🪔`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Invite Link</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
