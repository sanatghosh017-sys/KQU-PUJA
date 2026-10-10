import React, { useState, useMemo } from 'react';
import { Receipt, Search, Filter, Printer, MessageCircle, CheckCircle2 } from 'lucide-react';
import { formatINR, getWebsiteHttpsUrl, COMMITTEE_INFO } from '../data/pujaData';
import { PaymentState } from '../types';

interface ReceiptsListProps {
  unitsData: Record<string, [string, number][]>;
  paymentState: PaymentState;
  onOpenReceipt: (member: { name: string; amount: number; unit: string; index: number }) => void;
  onOpenWhatsAppReceipt?: (member: { name: string; amount: number; unit: string; index: number; paidDate?: string; method?: string }) => void;
}

export const ReceiptsList: React.FC<ReceiptsListProps> = ({
  unitsData,
  paymentState,
  onOpenReceipt,
  onOpenWhatsAppReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  const unitKeys = Object.keys(unitsData);

  const paidMembers = useMemo(() => {
    const list: {
      name: string;
      amount: number;
      unit: string;
      index: number;
      receiptNo: string;
      paidAt?: string;
      method: string;
    }[] = [];

    const unitsToInspect = selectedUnit === 'ALL' ? unitKeys : [selectedUnit];

    unitsToInspect.forEach((u) => {
      const items = unitsData[u] || [];
      items.forEach((r, i) => {
        const key = `${u}-${i}`;
        if (paymentState[key]?.paid) {
          list.push({
            name: r[0],
            amount: r[1],
            unit: u,
            index: i,
            receiptNo: `DP-2026-U${u}-${String(i + 1).padStart(3, '0')}`,
            paidAt: paymentState[key]?.paidAt,
            method: paymentState[key]?.method || 'Cash',
          });
        }
      });
    });

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.receiptNo.toLowerCase().includes(q) ||
          m.amount.toString().includes(q)
      );
    }

    return list;
  }, [unitsData, paymentState, selectedUnit, search, unitKeys]);

  const totalCollectedFromPaid = paidMembers.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg sm:text-xl font-bold font-festive text-stone-900 dark:text-stone-100">
              Sharadotsav Receipt Book
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Complete register of all {paidMembers.length} verified and issued chanda payment receipts.
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl text-right">
          <p className="text-[10px] uppercase font-bold text-emerald-600">Total in Book</p>
          <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">
            ₹{formatINR(totalCollectedFromPaid)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt number, donor name, or amount..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
        </div>

        {/* Unit Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-auto font-medium"
          >
            <option value="ALL">All Units</option>
            {unitKeys.map((u) => (
              <option key={u} value={u}>
                {u === 'MISC' ? 'MISC Unit' : `Unit ${u}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Receipts Grid */}
      {paidMembers.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center text-stone-500 space-y-2">
          <Receipt className="w-10 h-10 mx-auto text-stone-300" />
          <p className="text-sm font-semibold">No paid receipts found</p>
          <p className="text-xs text-stone-400">
            Check off members as paid in the Unit Tracker to automatically issue and store their receipts here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paidMembers.map((m) => (
            <div
              key={m.receiptNo}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm hover:border-amber-400 transition space-y-3 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {m.receiptNo}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
                    {m.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {m.unit === 'MISC' ? 'MISC' : `Unit ${m.unit}`} · Mode: {m.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                    ₹{formatINR(m.amount)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PAID</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs gap-2">
                <span className="text-stone-400 text-[11px] truncate">
                  {m.paidAt ? new Date(m.paidAt).toLocaleDateString('en-IN') : 'Receipt Issued'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (onOpenWhatsAppReceipt) {
                        onOpenWhatsAppReceipt({
                          name: m.name,
                          amount: m.amount,
                          unit: m.unit,
                          index: m.index,
                          paidDate: m.paidAt,
                          method: m.method
                        });
                      } else {
                        const websiteUrl = getWebsiteHttpsUrl();
                        const text = `🌸 *${COMMITTEE_INFO.bengaliName}*\n*${COMMITTEE_INFO.name}*\n*PUJA RECEIPT:* ${m.receiptNo}\n*Donor:* ${m.name}\n*Unit:* ${m.unit}\n*Amount:* ₹${formatINR(m.amount)}\n*Date:* ${m.paidAt ? new Date(m.paidAt).toLocaleDateString('en-IN') : 'Paid'}\n*Mode:* ${m.method}\n*Status:* PAID 🙏\n*Portal:* ${websiteUrl}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-[#25D366]/15 text-emerald-700 dark:text-emerald-300 hover:bg-[#25D366]/25 border border-emerald-500/40 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Send Receipt via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => onOpenReceipt(m)}
                    className="px-2.5 py-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
