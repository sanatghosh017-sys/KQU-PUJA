import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileImage, 
  FileCode, 
  Printer, 
  Check, 
  Flame, 
  Share2 
} from 'lucide-react';
import { COMMITTEE_INFO } from '../data/pujaData';
import { PaymentState } from '../types';

interface DownloadModalProps {
  unitsData: Record<string, [string, number][]>;
  paymentState: PaymentState;
  onClose: () => void;
  onOpenSaveJpg: (unit: string) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  unitsData,
  paymentState,
  onClose,
  onOpenSaveJpg,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  // Generate CSV for current unit or ALL units
  const downloadCSV = () => {
    let rows: string[][] = [
      ['DURGA PUJA 2026 KQU - Subscription & Chanda Collection Register'],
      [`President: ${COMMITTEE_INFO.president}`, `Treasurer: ${COMMITTEE_INFO.treasurer}`, `Place: ${COMMITTEE_INFO.place}`, `Date: ${new Date().toLocaleDateString('en-IN')}`],
      [''],
      ['Unit', 'Sl No', 'Member Name', 'Subscription Amount (INR)', 'Payment Status', 'Receipt Number', 'Payment Method', 'Payment Date']
    ];

    const targetUnits = selectedUnit === 'ALL' ? Object.keys(unitsData) : [selectedUnit];
    let totalBudget = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let memberCount = 0;

    targetUnits.forEach((u) => {
      const list = unitsData[u] || [];
      list.forEach(([name, amount], idx) => {
        memberCount++;
        totalBudget += amount;
        const key = `${u}-${idx}`;
        const payment = paymentState[key];
        const isPaid = Boolean(payment?.paid);
        if (isPaid) {
          totalCollected += amount;
          paidCount++;
        }
        const receiptNo = isPaid ? `KQU-2026-U${u}-${String(idx + 1).padStart(3, '0')}` : 'N/A';
        const method = isPaid ? (payment.method || 'Cash') : 'Pending';
        const date = isPaid && payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : 'Pending';

        rows.push([
          u === 'MISC' ? 'MISC' : `Unit ${u}`,
          String(idx + 1),
          `"${name.replace(/"/g, '""')}"`,
          String(amount),
          isPaid ? 'PAID' : 'PENDING',
          receiptNo,
          method,
          date
        ]);
      });
    });

    rows.push(['']);
    rows.push(['TOTALS', '', '', String(totalBudget), `Collected: ${totalCollected} (${paidCount}/${memberCount})`, '', '', '']);

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DURGA_PUJA_2026_KQU_Subscriptions_${selectedUnit}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('CSV Spreadsheet exported successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download Standalone Offline HTML
  const downloadOfflineHtml = () => {
    const link = document.createElement('a');
    link.href = '/durga-puja-tracker.html';
    link.download = 'DURGA_PUJA_2026_KQU.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess('Offline standalone HTML downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenJpg = () => {
    onClose();
    onOpenSaveJpg(selectedUnit);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-amber-600/30 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Festive Header */}
        <div className="bg-gradient-to-r from-red-900 via-rose-950 to-amber-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-300">
              <Download className="w-7 h-7" />
            </span>
            <div>
              <h2 className="text-xl font-bold font-festive text-amber-100 flex items-center gap-2">
                <span>DURGA PUJA 2026 KQU</span>
              </h2>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Download & Export Center · All Formats
              </p>
            </div>
          </div>
        </div>

        {/* Body Options */}
        <div className="p-6 space-y-5">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Unit Scope Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
              Select Scope for Export:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedUnit('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                  selectedUnit === 'ALL'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-amber-400'
                }`}
              >
                All Units (Consolidated)
              </button>
              {Object.keys(unitsData).map((u) => (
                <button
                  key={u}
                  onClick={() => setSelectedUnit(u)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                    selectedUnit === u
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-amber-400'
                  }`}
                >
                  {u === 'MISC' ? 'MISC' : `Unit ${u}`}
                </button>
              ))}
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="space-y-3">
            {/* Option 1: JPG Summary Image */}
            <div 
              onClick={handleOpenJpg}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/60 bg-stone-50 dark:bg-stone-800/60 hover:bg-amber-500/5 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-105 transition">
                  <FileImage className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    Save as JPG Image
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    High-res visual table with KQU header & Treasurer details
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-stone-400 group-hover:text-amber-500 transition" />
            </div>

            {/* Option 2: Excel / CSV Spreadsheet */}
            <div 
              onClick={downloadCSV}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500/60 bg-stone-50 dark:bg-stone-800/60 hover:bg-emerald-500/5 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    Download Excel / CSV
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Full spreadsheet with member names, receipts, and payment dates
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition" />
            </div>

            {/* Option 3: Offline Standalone HTML */}
            <div 
              onClick={downloadOfflineHtml}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-blue-500/60 bg-stone-50 dark:bg-stone-800/60 hover:bg-blue-500/5 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-105 transition">
                  <FileCode className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Standalone Offline HTML File
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Self-contained single file that works 100% offline on any phone or PC
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-stone-400 group-hover:text-blue-500 transition" />
            </div>

            {/* Option 4: Print View */}
            <div 
              onClick={handlePrint}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-500/60 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-200/40 dark:hover:bg-stone-700/40 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-stone-500/10 border border-stone-500/30 text-stone-600 dark:text-stone-400 rounded-xl group-hover:scale-105 transition">
                  <Printer className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Print / Save as PDF
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Print collection register or save as PDF via system dialog
                  </p>
                </div>
              </div>
              <Share2 className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 dark:bg-stone-800/60 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Treasurer: {COMMITTEE_INFO.treasurer}</span>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
