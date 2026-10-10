import React from 'react';
import { Download, Printer, BarChart3 } from 'lucide-react';
import { formatINR } from '../data/pujaData';
import { PaymentState } from '../types';

interface SummaryTableProps {
  unitsData: Record<string, [string, number][]>;
  paymentState: PaymentState;
  onOpenSaveJpg: (unit: string) => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  unitsData,
  paymentState,
  onOpenSaveJpg,
}) => {
  const unitKeys = Object.keys(unitsData);

  const calculateUnitTot = (u: string) => {
    let t = 0;
    let c = 0;
    let p = 0;
    const list = unitsData[u] || [];
    list.forEach((r, i) => {
      t += r[1];
      const key = `${u}-${i}`;
      if (paymentState[key]?.paid) {
        c += r[1];
        p++;
      }
    });
    return {
      total: t,
      collected: c,
      pending: t - c,
      totalCount: list.length,
      paidCount: p,
      percentage: t > 0 ? Math.round((c / t) * 100) : 0,
    };
  };

  let grandTotal = 0;
  let grandCollected = 0;
  let grandTotalCount = 0;
  let grandPaidCount = 0;

  const rows = unitKeys.map((u) => {
    const stats = calculateUnitTot(u);
    grandTotal += stats.total;
    grandCollected += stats.collected;
    grandTotalCount += stats.totalCount;
    grandPaidCount += stats.paidCount;
    return {
      unit: u,
      label: u === 'MISC' ? 'MISC Unit' : `Unit ${u}`,
      ...stats,
    };
  });

  const grandPending = grandTotal - grandCollected;
  const grandPercentage = grandTotal > 0 ? Math.round((grandCollected / grandTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg sm:text-xl font-bold font-festive text-stone-900 dark:text-stone-100">
              Unit-wise Financial Report & Status
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Consolidated overview across all 8 collection divisions with targets and completion rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs sm:text-sm hover:bg-stone-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => onOpenSaveJpg('ALL')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Summary JPG</span>
          </button>
        </div>
      </div>

      {/* Highlights Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Subscription Budget</p>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
            ₹{formatINR(grandTotal)}
          </p>
          <p className="text-xs text-stone-500 mt-1">{grandTotalCount} total contributors</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-emerald-500/20 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Collected</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
            ₹{formatINR(grandCollected)}
          </p>
          <p className="text-xs text-emerald-600/80 mt-1">{grandPaidCount} receipts generated</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-rose-500/20 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Pending Amount</p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
            ₹{formatINR(grandPending)}
          </p>
          <p className="text-xs text-rose-600/80 mt-1">{grandTotalCount - grandPaidCount} donors pending</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-amber-500/20 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Overall Progress</p>
          <p className="text-2xl font-black text-amber-600 mt-0.5">
            {grandPercentage}%
          </p>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${grandPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                <th className="py-3.5 px-4">Unit / Division</th>
                <th className="py-3.5 px-4 text-center">Paid Status</th>
                <th className="py-3.5 px-4 text-right">Target Total (₹)</th>
                <th className="py-3.5 px-4 text-right">Collected (₹)</th>
                <th className="py-3.5 px-4 text-right">Pending (₹)</th>
                <th className="py-3.5 px-4 text-center">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
              {rows.map((row, idx) => (
                <tr
                  key={row.unit}
                  className={`hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition ${
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-stone-50/40 dark:bg-stone-800/30'
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>{row.label}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        row.paidCount === row.totalCount
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {row.paidCount}/{row.totalCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold">
                    ₹{formatINR(row.total)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{formatINR(row.collected)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-rose-700 dark:text-rose-400">
                    ₹{formatINR(row.pending)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 sm:w-24 bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-400 w-8">
                        {row.percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-900 text-white font-bold border-t-2 border-amber-500">
                <td className="py-4 px-4 font-black text-sm uppercase tracking-wider">
                  Grand Total
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="bg-stone-800 px-2.5 py-1 rounded-full text-xs text-amber-300">
                    {grandPaidCount}/{grandTotalCount}
                  </span>
                </td>
                <td className="py-4 px-4 text-right font-bold text-base text-stone-200">
                  ₹{formatINR(grandTotal)}
                </td>
                <td className="py-4 px-4 text-right font-bold text-base text-emerald-400">
                  ₹{formatINR(grandCollected)}
                </td>
                <td className="py-4 px-4 text-right font-bold text-base text-rose-300">
                  ₹{formatINR(grandPending)}
                </td>
                <td className="py-4 px-4 text-center font-bold text-amber-400 text-sm">
                  {grandPercentage}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
