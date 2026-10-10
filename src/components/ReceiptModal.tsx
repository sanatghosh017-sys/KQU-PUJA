import React, { useRef, useState } from 'react';
import { X, Printer, CheckCircle2, Copy, Check, MessageCircle, Share2 } from 'lucide-react';
import { formatINR, numberToWordsIndian, COMMITTEE_INFO, getWebsiteHttpsUrl } from '../data/pujaData';

interface ReceiptModalProps {
  member: {
    name: string;
    amount: number;
    unit: string;
    index: number;
    mobileNo?: string;
    slNo?: number;
  } | null;
  paidDate?: string;
  paymentMethod?: string;
  onClose: () => void;
  onOpenWhatsAppModal?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  member,
  paidDate,
  paymentMethod = 'Cash',
  onClose,
  onOpenWhatsAppModal,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const receiptNo = `DP-2026-U${member.unit}-${String(member.index + 1).padStart(3, '0')}`;
  const displayDate = paidDate ? new Date(paidDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppReceiptText = () => {
    const websiteUrl = getWebsiteHttpsUrl();
    return `🌸 *${COMMITTEE_INFO.bengaliName}* 🌸\n*${COMMITTEE_INFO.name}*\nPlace: *${COMMITTEE_INFO.place}*\n----------------------------------------\n📜 *PUJA SUBSCRIPTION RECEIPT*\n*Receipt No:* ${receiptNo}\n*Member:* ${member.name}\n*Unit:* ${member.unit}\n*Amount:* ₹${formatINR(member.amount)} (${numberToWordsIndian(member.amount)})\n*Date:* ${displayDate}\n*Payment Mode:* ${paymentMethod}\n*Status:* PAID / পরিশোধিত\n*Official Website:* ${websiteUrl}\n----------------------------------------\nThank you for your generous contribution towards Sharadotsav 2026! May Maa Durga bless your family. 🙏🪔`;
  };

  const handleShareWhatsApp = () => {
    const text = getWhatsAppReceiptText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    const text = getWhatsAppReceiptText();
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
      <div className="bg-white dark:bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden my-auto">
        {/* Modal Controls (No print) */}
        <div className="no-print bg-stone-100 dark:bg-stone-800/80 px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Official Puja Chanda Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Share via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleCopyWhatsAppText}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Copy WhatsApp Receipt Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            {onOpenWhatsAppModal && (
              <button
                onClick={onOpenWhatsAppModal}
                className="p-1.5 rounded-lg text-[#25D366] hover:bg-emerald-950/50 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Open WhatsApp Dispatcher"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Dispatch</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Card */}
        <div ref={receiptRef} className="p-6 bg-[#fffefb] dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans print:p-8">
          {/* Ornate decorative border */}
          <div className="border-4 border-double border-amber-800/40 p-5 rounded-xl bg-gradient-to-b from-amber-50/20 via-transparent to-amber-50/20 dark:from-stone-800/20 dark:to-stone-800/20">
            {/* Header */}
            <div className="text-center border-b-2 border-amber-800/30 pb-3 mb-4">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 font-bengali tracking-wide">
                ॥ শ্রীশ্রী দুর্গায়ৈ নমঃ ॥
              </p>
              <h2 className="text-xl sm:text-2xl font-bold font-festive text-red-900 dark:text-amber-400 tracking-wider uppercase mt-0.5">
                {COMMITTEE_INFO.name}
              </h2>
              <p className="text-xs font-bengali text-amber-900 dark:text-amber-200/90 font-medium">
                {COMMITTEE_INFO.bengaliName}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {COMMITTEE_INFO.address} · Reg: {COMMITTEE_INFO.regNo}
              </p>
              <div className="mt-2 inline-block bg-amber-800 text-amber-50 dark:bg-amber-600 dark:text-stone-950 font-bold px-3 py-0.5 rounded text-xs uppercase tracking-wider">
                Subscription Receipt (চাঁদার রসিদ)
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 text-xs gap-2 mb-4 border-b border-dashed border-amber-800/30 pb-3">
              <div>
                <span className="text-stone-500 dark:text-stone-400">Receipt No: </span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{receiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 dark:text-stone-400">Date: </span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{displayDate}</span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Unit / Division: </span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {member.unit === 'MISC' ? 'MISC' : `Unit ${member.unit}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 dark:text-stone-400">Place: </span>
                <span className="font-bold text-amber-800 dark:text-amber-400">{COMMITTEE_INFO.place}</span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Payment Mode: </span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{paymentMethod}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 dark:text-stone-400">Status: </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">PAID / পরিশোধিত</span>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-3 text-xs sm:text-sm mb-5">
              <div className="bg-amber-50/60 dark:bg-stone-800/50 p-3 rounded-lg border border-amber-200 dark:border-stone-700">
                <p className="text-stone-600 dark:text-stone-400 text-xs">Received with thanks from:</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-wide">
                    {member.name}
                  </p>
                  {member.mobileNo && (
                    <span className="text-xs font-mono text-stone-600 dark:text-stone-300 font-semibold bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded">
                      Mob: {member.mobileNo}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-950/5 dark:bg-amber-950/20 border border-red-900/10 dark:border-amber-500/20 rounded-lg">
                <span className="text-stone-600 dark:text-stone-300 font-medium">Subscription Amount:</span>
                <span className="text-xl sm:text-2xl font-black text-red-800 dark:text-amber-400">
                  ₹{formatINR(member.amount)}
                </span>
              </div>

              <div className="text-xs text-stone-600 dark:text-stone-400 italic">
                <span className="font-medium not-italic text-stone-500">In Words: </span>
                {numberToWordsIndian(member.amount)}
              </div>
            </div>

            {/* Stamp & Signatures */}
            <div className="pt-4 border-t border-amber-800/30 grid grid-cols-4 gap-1.5 items-end text-xs">
              {/* President */}
              <div className="text-left">
                <div className="h-7 flex items-end">
                  <span className="font-festive italic text-stone-800 dark:text-stone-200 text-xs font-bold truncate">
                    {COMMITTEE_INFO.president}
                  </span>
                </div>
                <p className="border-t border-stone-400 dark:border-stone-600 pt-1 text-[9px] font-semibold text-stone-600 dark:text-stone-400">
                  President
                </p>
              </div>

              {/* Secretary */}
              <div className="text-center">
                <div className="h-7 flex items-end justify-center">
                  <span className="font-festive italic text-stone-800 dark:text-stone-200 text-xs font-bold truncate">
                    {COMMITTEE_INFO.secretary}
                  </span>
                </div>
                <p className="border-t border-stone-400 dark:border-stone-600 pt-1 text-[9px] font-semibold text-stone-600 dark:text-stone-400">
                  Secretary
                </p>
              </div>

              {/* Official Seal */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full border-2 border-red-700/60 flex flex-col items-center justify-center p-0.5 text-center text-[6px] text-red-700 dark:text-red-400 font-bold uppercase rotate-[-8deg] bg-red-50/40 dark:bg-transparent">
                  <span>KQU PWI</span>
                  <span>2026</span>
                </div>
                <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ VERIFIED</span>
              </div>

              {/* Treasurer */}
              <div className="text-right">
                <div className="h-7 flex items-end justify-end">
                  <span className="font-festive italic text-stone-800 dark:text-stone-200 text-xs font-bold truncate">
                    {COMMITTEE_INFO.treasurer}
                  </span>
                </div>
                <p className="border-t border-stone-400 dark:border-stone-600 pt-1 text-[9px] font-semibold text-stone-600 dark:text-stone-400">
                  Treasurer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA (No print) */}
        <div className="no-print bg-stone-50 dark:bg-stone-800/80 px-4 py-3 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center text-xs">
          <span className="text-stone-500 dark:text-stone-400">
            Press Print to save as PDF or physical receipt
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
