import React, { useState } from 'react';
import { 
  FileCode, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Share2, 
  Layers, 
  Maximize2 
} from 'lucide-react';

export const HtmlVersionView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/durga-puja-tracker.html');
      const htmlText = await response.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DURGA_PUJA_2026_KQU.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenNewTab = () => {
    window.open('/durga-puja-tracker.html', '_blank');
  };

  const handleCopyCode = async () => {
    try {
      const response = await fetch('/durga-puja-tracker.html');
      const htmlText = await response.text();
      await navigator.clipboard.writeText(htmlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy error:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-stone-900 border border-amber-600/30 rounded-2xl p-5 sm:p-6 text-amber-50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300">
                <FileCode className="w-5 h-5 text-amber-400" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-festive text-amber-100">
                Standalone HTML Version
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1 max-w-2xl">
              A 100% self-contained, single-file HTML version for <strong>DURGA PUJA 2026 KQU</strong> (President: <strong>SANJOY KUMAR DAS</strong>, Treasurer: <strong>DHANANJAY KUMAR</strong>) containing all 8 units, real-time calculations, receipt generator, JPG exporter, and offline LocalStorage persistence. Works completely offline on any smartphone, tablet, or PC without internet or dependencies.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-600/30 text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'Download .HTML File'}</span>
            </button>
            <button
              onClick={handleOpenNewTab}
              className="px-4 py-2.5 bg-stone-900/80 hover:bg-stone-900 text-white border border-amber-500/40 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Open in Full Tab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-2">
            <Smartphone className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">Offline & Zero Install</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Open directly in Safari, Chrome, Samsung Internet or Brave without an internet connection.
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2">
            <Share2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">Share via WhatsApp</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Send the file as a single WhatsApp document to other committee members or collectors.
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">All 8 Units & Receipts</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Pre-loaded with Unit 1-7 and MISC, interactive checkboxes, and print receipt generator.
          </p>
        </div>
      </div>

      {/* Live Interactive HTML Preview Frame */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            </div>
            <span className="text-xs font-mono font-semibold text-stone-600 dark:text-stone-300 ml-2">
              Preview: /durga-puja-tracker.html (Standalone)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold hover:bg-stone-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'HTML Copied' : 'Copy HTML Code'}</span>
            </button>
            <button
              onClick={handleOpenNewTab}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>

        {/* Iframe View */}
        <div className="w-full bg-stone-100 dark:bg-stone-950 p-2 sm:p-4">
          <div className="border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden shadow-inner bg-white dark:bg-stone-950">
            <iframe
              src="/durga-puja-tracker.html"
              title="Durga Puja Tracker Standalone HTML Version"
              className="w-full h-[620px] sm:h-[720px] border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
