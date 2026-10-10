import React from 'react';
import { Calendar, Clock, Sparkles, MapPin, Share2, Flame, Flower2, BellRing, ChevronRight } from 'lucide-react';
import { PUJA_NIRGHONTO_DATA, COMMITTEE_INFO, getWebsiteHttpsUrl } from '../data/pujaData';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface PujaNirghontoProps {
  lang: Language;
}

export const PujaNirghontoView: React.FC<PujaNirghontoProps> = ({ lang }) => {
  const handleShareNirghonto = () => {
    const url = getWebsiteHttpsUrl();
    const text = `🌸 *${COMMITTEE_INFO.name}* (${COMMITTEE_INFO.year})\n*স্থান:* ${COMMITTEE_INFO.place}\n\nশ্রীশ্রী শারদীয়া দুর্গাপূজা ২০২৬ / ১৪৩৩ - সম্পূর্ণ পুজো নির্ঘণ্ট ও সময়সূচী:\n👉 ${url}\n\nসকলকে জানাই শারদীয়া দুর্গোৎসবের প্রীতি ও শুভেচ্ছা!`;
    if (navigator?.share) {
      navigator.share({ title: COMMITTEE_INFO.name, text, url }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white border border-amber-600/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-900/60 border border-red-500/40 text-amber-300 text-xs font-semibold mb-3">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{getTranslation(lang, 'tabNirghonto')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-festive text-amber-100 tracking-wide flex items-center gap-3">
              <span>🪔</span>
              <span>{getTranslation(lang, 'nirghontoTitle')}</span>
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              {COMMITTEE_INFO.place} প্রাঙ্গণে শারদীয়া দুর্গোৎসব ২০২৬ (১৪৩৩ বঙ্গাব্দ)-এর মহালয়া থেকে বিজয়া দশমী পর্যন্ত দেবীর আবাহন, পূজা ও আরতির পুণ্য নির্ঘণ্ট।
            </p>
          </div>

          <button
            onClick={handleShareNirghonto}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold flex items-center gap-2 text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer self-start md:self-center"
          >
            <Share2 className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে নির্ঘণ্ট শেয়ার করুন</span>
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PUJA_NIRGHONTO_DATA.map((item, idx) => (
          <div
            key={item.dayKey}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:border-amber-500/60 transition-all flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  দিন #{idx + 1}
                </span>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  {item.dateEnglish}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-festive flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                <span>{item.dayNameBengali}</span>
              </h3>

              <p className="text-xs text-amber-700 dark:text-amber-300 font-bengali font-semibold mt-0.5">
                {item.dateBengali}
              </p>

              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                {item.description}
              </p>

              {/* Rituals timeline list */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  প্রধান তিথি ও মাঙ্গলিক সময়সূচী:
                </span>
                {item.rituals.map((r, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-start gap-2 text-xs bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-200 block text-[11px]">
                        {r.time}
                      </span>
                      <span className="text-stone-600 dark:text-stone-400 text-xs">
                        {r.event}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1 text-[11px]">
                <MapPin className="w-3 h-3 text-red-500" />
                <span>{COMMITTEE_INFO.place}</span>
              </span>
              <span className="text-amber-500 font-bold text-[11px]">
                শারদোৎসব ২০২৬
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Committee Guidance Note */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-600 shrink-0">
            <BellRing className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-stone-900 dark:text-stone-100">
              পুষ্পাঞ্জলি ও কুমারী পূজা ভক্ত নির্দেশিকা
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              মহাষ্টমীর পুষ্পাঞ্জলি ও সন্ধিপূজায় অংশ নিতে সকাল ১০:০০ টার মধ্যে মণ্ডপ প্রাঙ্গণে উপস্থিত থাকার জন্য অনুরোধ জানানো হচ্ছে।
            </p>
          </div>
        </div>
        <div className="text-right text-xs shrink-0">
          <p className="font-bold text-amber-700 dark:text-amber-300">
            সভাপতি: {COMMITTEE_INFO.presidentBengali}
          </p>
          <p className="text-stone-500">
            সম্পাদক: {COMMITTEE_INFO.secretaryBengali} · কোষাধ্যক্ষ: {COMMITTEE_INFO.treasurerBengali}
          </p>
        </div>
      </div>
    </div>
  );
};
