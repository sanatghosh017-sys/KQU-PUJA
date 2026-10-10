import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { formatINR } from '../data/pujaData';

interface SaveJpgModalProps {
  currentUnit: string;
  unitsData: Record<string, [string, number][]>;
  paymentState: Record<string, any>;
  onClose: () => void;
}

export const SaveJpgModal: React.FC<SaveJpgModalProps> = ({
  currentUnit,
  unitsData,
  paymentState,
  onClose,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

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
    return { t, c, p, n: list.length };
  };

  useEffect(() => {
    generateCanvasJpg();
  }, [currentUnit, unitsData, paymentState]);

  const generateCanvasJpg = () => {
    setIsGenerating(true);
    const W = 880;
    const RH = 46;
    const isSummary = currentUnit === 'ALL';
    const keys = isSummary ? Object.keys(unitsData) : null;
    const listLength = keys ? keys.length + 2 : (unitsData[currentUnit]?.length || 0);
    const H = 220 + listLength * RH + 40;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Header gradient background
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.5, '#831843');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 84);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Plus Jakarta Sans", Arial, sans-serif';
    const unitTitle = isSummary
      ? 'All Units Summary Report'
      : currentUnit === 'MISC'
      ? 'MISC Unit'
      : `Unit ${currentUnit} Collection Sheet`;
    ctx.fillText(`DURGA PUJA 2026 KQU - ${unitTitle}`, 28, 42);

    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#fef3c7';
    ctx.fillText('President: SANJOY KUMAR DAS   Treasurer: DHANANJAY KUMAR   Place: KQU PWI OFFICE', 28, 68);

    // Calculate totals
    let totalBudget = 0;
    let totalCollected = 0;

    if (isSummary) {
      Object.keys(unitsData).forEach((u) => {
        const x = calculateUnitTot(u);
        totalBudget += x.t;
        totalCollected += x.c;
      });
    } else {
      const x = calculateUnitTot(currentUnit);
      totalBudget = x.t;
      totalCollected = x.c;
    }

    const pending = totalBudget - totalCollected;

    // Stats bar container
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, 96, W - 40, 68);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 96, W - 40, 68);

    // Total Budget
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('TOTAL TARGET', 36, 120);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(`₹${formatINR(totalBudget)}`, 36, 148);

    // Collected
    ctx.fillStyle = '#16a34a';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('COLLECTED (PAID)', 310, 120);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(`₹${formatINR(totalCollected)}`, 310, 148);

    // Pending
    ctx.fillStyle = '#dc2626';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('PENDING BALANCE', 580, 120);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(`₹${formatINR(pending)}`, 580, 148);

    // Timestamp
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    const timestampStr = `Generated on ${new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    ctx.fillText(timestampStr, 28, 192);

    let y = 206;

    // Table Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, y, W - 40, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(isSummary ? 'UNIT / CATEGORY' : 'MEMBER NAME', 32, y + 23);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT', W - 110, y + 23);
    ctx.fillText('STATUS', W - 40, y + 23);
    ctx.textAlign = 'left';

    y += 36;

    const drawLine = (name: string, amt: string, isPaid: boolean | null, isEven: boolean) => {
      // Row background
      if (isPaid === true) {
        ctx.fillStyle = '#ecfdf5';
      } else if (isEven) {
        ctx.fillStyle = '#f8fafc';
      }

      // Separator line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, y + RH);
      ctx.lineTo(W - 20, y + RH);
      ctx.stroke();

      // Text
      ctx.fillStyle = '#1e293b';
      ctx.font = '15px Arial, sans-serif';
      ctx.fillText(name, 32, y + 28);
      ctx.textAlign = 'right';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText(amt, W - 110, y + 28);
      ctx.textAlign = 'left';

      // Status mark
      if (isPaid !== null) {
        const boxX = W - 66;
        const boxY = y + 10;
        const boxSize = 24;
        if (isPaid) {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxSize, boxSize, 5);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(boxX + 5, boxY + 12);
          ctx.lineTo(boxX + 10, boxY + 17);
          ctx.lineTo(boxX + 19, boxY + 7);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxSize, boxSize, 5);
          ctx.stroke();
        }
      }

      y += RH;
    };

    if (keys) {
      // Summary mode
      keys.forEach((u, i) => {
        const x = calculateUnitTot(u);
        const name = `${u === 'MISC' ? 'MISC' : `Unit ${u}`} (${x.p} of ${x.n} Paid)`;
        const amt = `₹${formatINR(x.c)} / ₹${formatINR(x.t)}`;
        drawLine(name, amt, null, i % 2 === 0);
      });

      // Total row
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, y, W - 40, RH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('GRAND TOTAL', 32, y + 29);
      ctx.textAlign = 'right';
      ctx.fillText(`₹${formatINR(totalCollected)} / ₹${formatINR(totalBudget)}`, W - 110, y + 29);
      ctx.fillText(`${Math.round((totalCollected / (totalBudget || 1)) * 100)}%`, W - 40, y + 29);
      ctx.textAlign = 'left';
    } else {
      // Unit members list
      const list = unitsData[currentUnit] || [];
      list.forEach((r, i) => {
        const key = `${currentUnit}-${i}`;
        const isPaid = Boolean(paymentState[key]?.paid);
        drawLine(`${i + 1}. ${r[0]}`, `₹${formatINR(r[1])}`, isPaid, i % 2 === 0);
      });
    }

    const url = canvas.toDataURL('image/jpeg', 0.95);
    setDataUrl(url);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Durga_Puja_${currentUnit === 'ALL' ? 'Summary' : `Unit_${currentUnit}`}_${new Date().toISOString().slice(0, 10)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/jpeg': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-100 dark:bg-stone-800 px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
              Export Sheet as JPG · {currentUnit === 'ALL' ? 'Summary' : `Unit ${currentUnit}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 text-center bg-stone-50 dark:bg-stone-950">
          {isGenerating ? (
            <div className="py-12 text-stone-500">Generating high-resolution JPG image...</div>
          ) : dataUrl ? (
            <div className="space-y-3">
              <div className="border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden shadow-md inline-block max-w-full">
                <img
                  src={dataUrl}
                  alt="Durga Puja Subscription Sheet"
                  className="max-h-[60vh] object-contain mx-auto"
                />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tip for mobile: You can press and hold the image to save directly to your gallery or tap Download below.
              </p>
            </div>
          ) : (
            <div className="py-12 text-red-500">Failed to generate image.</div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-stone-100 dark:bg-stone-800/80 px-4 py-3 border-t border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Image' : 'Copy'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs sm:text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download JPG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
