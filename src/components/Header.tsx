import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  Flame, 
  FileCode, 
  Download, 
  Camera, 
  LogOut, 
  LogIn, 
  MessageCircle, 
  Globe, 
  Copy, 
  Check, 
  Mic,
  Database,
  Phone,
  Clock,
  Languages,
  HardHat,
  Radio,
  Tv
} from 'lucide-react';
import { formatINR, getWebsiteHttpsUrl, COMMITTEE_INFO } from '../data/pujaData';
import { SUPABASE_PROJECT_ID } from '../services/supabase';
import { AuthSession, AppTab, Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  totalCollected: number;
  totalBudget: number;
  paidCount: number;
  totalCount: number;
  isUnlocked: boolean;
  authSession?: AuthSession | null;
  onToggleLock: () => void;
  onLogout: () => void;
  onOpenSaveJpg: (unit: string) => void;
  onOpenDownload?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenVoiceModal?: () => void;
  lang: Language;
  onSetLang: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalCollected,
  totalBudget,
  paidCount,
  totalCount,
  isUnlocked,
  authSession,
  onToggleLock,
  onLogout,
  onOpenSaveJpg,
  onOpenDownload,
  onOpenWhatsAppModal,
  onOpenVoiceModal,
  lang,
  onSetLang,
}) => {
  const percentage = totalBudget > 0 ? Math.round((totalCollected / totalBudget) * 100) : 0;
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = getWebsiteHttpsUrl();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }).catch(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="relative bg-gradient-to-r from-red-950 via-rose-950 to-stone-900 text-white shadow-xl border-b border-amber-600/30 overflow-hidden">
      {/* Decorative traditional pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 relative z-10 space-y-3">
        {/* Top utility row with Language Selector, Target KPI, Share, and Login */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-amber-500/20 pb-2.5">
          {/* Logo brand & Bengali title */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-amber-300">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            </span>
            <div>
              <p className="text-xs tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                <span>DURGA PUJA 2026 KQU</span>
                <span className="text-amber-500/60">·</span>
                <span className="text-stone-300 font-normal">শারদোৎসব ২০২৬ / ১৪৩৩</span>
              </p>
            </div>
          </div>

          {/* Center/Right utilities: 3-Language Selector, Target chip, WhatsApp, Login */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 3-Language Selector */}
            <div className="flex items-center bg-stone-900/80 border border-amber-500/40 rounded-full p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onSetLang('bn')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition text-[11px] cursor-pointer ${
                  lang === 'bn' 
                    ? 'bg-amber-500 text-stone-950 shadow-sm' 
                    : 'text-stone-300 hover:text-white'
                }`}
                title="বাংলা (Default)"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onSetLang('en')}
                className={`px-2 py-0.5 rounded-full font-bold transition text-[11px] cursor-pointer ${
                  lang === 'en' 
                    ? 'bg-amber-500 text-stone-950 shadow-sm' 
                    : 'text-stone-300 hover:text-white'
                }`}
                title="English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onSetLang('hi')}
                className={`px-2 py-0.5 rounded-full font-bold transition text-[11px] cursor-pointer ${
                  lang === 'hi' 
                    ? 'bg-amber-500 text-stone-950 shadow-sm' 
                    : 'text-stone-300 hover:text-white'
                }`}
                title="हिन्दी"
              >
                हिन्दी
              </button>
            </div>

            {/* Target Budget KPI Pill */}
            <div className="hidden lg:flex items-center gap-2 bg-stone-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 text-xs">
              <span className="text-stone-400">{getTranslation(lang, 'targetBudget')}:</span>
              <span className="font-bold text-amber-200">₹{formatINR(totalBudget)}</span>
              <span className="text-amber-500/40">|</span>
              <span className="text-emerald-400 font-medium">{paidCount}/{totalCount} ({percentage}%)</span>
            </div>

            {/* Live Option - Live Broadcast & Gemini 3.8 AI Voice Companion */}
            <button
              onClick={() => setActiveTab('ai-voice')}
              className="text-xs px-3 py-1 rounded-full border border-red-400/80 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/40 transition active:scale-95 animate-pulse"
              title="🔴 Live Option - উৎসব লাইভ সম্প্রচার ও এআই ভয়েস সঙ্গী"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <Radio className="w-3.5 h-3.5 text-white" />
              <span>LIVE</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono font-normal hidden sm:inline">ভয়েস ও দর্শন</span>
            </button>

            {/* Share Website Link Button */}
            <button
              onClick={handleCopyLink}
              className="text-xs px-2.5 py-1 rounded-full border border-emerald-400/50 bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900/80 transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Copy official website link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* WhatsApp Link */}
            <button
              onClick={() => {
                if (onOpenWhatsAppModal) {
                  onOpenWhatsAppModal();
                } else {
                  const url = getWebsiteHttpsUrl();
                  const text = `🌸 *${COMMITTEE_INFO.bengaliName}*\n*${COMMITTEE_INFO.name}*\nPlace: *${COMMITTEE_INFO.place}*\n\nSubho Sharadiya! Explore our Puja portal & contribute chanda:\n👉 ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }
              }}
              className="text-xs px-2.5 py-1 rounded-full border border-emerald-400/50 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Open WhatsApp Sharing"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366]" />
              <span className="font-bold text-white">WhatsApp</span>
            </button>

            {/* Login / Role indicator */}
            {isUnlocked && authSession ? (
              <div className="flex items-center gap-1.5">
                {authSession.role === 'admin' ? (
                  <button
                    onClick={() => setActiveTab('admin-portal')}
                    className="text-[11px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold hover:bg-emerald-900/80 cursor-pointer"
                    title="Open Admin & Supabase Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin ({authSession.userId.slice(0, 8)})</span>
                  </button>
                ) : (
                  <span className="text-[11px] bg-amber-950/80 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{authSession.name ? authSession.name.split(' ')[0] : authSession.userId.slice(0, 8)}</span>
                  </span>
                )}
                <button
                  onClick={onLogout}
                  className="text-xs px-2.5 py-1 rounded-full border border-red-500/50 bg-red-950/70 text-red-200 hover:bg-red-900/80 transition flex items-center gap-1 cursor-pointer"
                  title="Log out of this device"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleLock}
                className="text-xs px-2.5 py-1 rounded-full border border-amber-500/50 bg-amber-950/70 text-amber-200 hover:bg-amber-900/80 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Login with Unit ID or Admin"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'login')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Title, Committee Leadership (President: Biswajit Mondal, Secretary: Sanjoy Kumar Das, Treasurer: Dhananjay Kumar) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-3xl font-bold font-festive tracking-wide text-amber-100 flex items-center gap-2">
                <span>🪔</span>
                <span>{COMMITTEE_INFO.name}</span>
              </h1>
              <span className="text-sm font-bengali text-amber-300 font-semibold hidden md:inline">
                {COMMITTEE_INFO.bengaliName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/90 mt-1 leading-relaxed">
              স্থান: <span className="font-semibold text-amber-300">{COMMITTEE_INFO.place}</span> ·{' '}
              <span className="text-emerald-300 font-bold">সভাপতি: {COMMITTEE_INFO.presidentBengali}</span> ·{' '}
              <span className="text-amber-300 font-bold">সম্পাদক: {COMMITTEE_INFO.secretaryBengali}</span> ·{' '}
              <span className="text-amber-300 font-bold">কোষাধ্যক্ষ: {COMMITTEE_INFO.treasurerBengali}</span>
            </p>
          </div>

          {/* Quick Collection KPI chip */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-amber-950/80 to-stone-900/90 border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-inner self-start sm:self-auto">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-300/80 font-medium">
                {getTranslation(lang, 'collectedSoFar')}
              </p>
              <p className="text-lg sm:text-xl font-black text-amber-400">₹{formatINR(totalCollected)}</p>
            </div>
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-stone-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-amber-200">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2 pt-1 border-t border-amber-500/20 overflow-x-auto pb-1 scrollbar-none text-xs">
          {/* 1. Website */}
          <button
            onClick={() => setActiveTab('website')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'website'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-md shadow-amber-400/30'
                : 'bg-white/10 text-amber-200 hover:text-white hover:bg-white/15 border border-amber-400/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{getTranslation(lang, 'tabWebsite')}</span>
          </button>

          {/* 2. Tracker (7 Units & MISC) */}
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'tabTracker')}</span>
          </button>

          {/* 3. Summary */}
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'tabSummary')}</span>
          </button>

          {/* 4. Puja Nirghonto (Schedule) */}
          <button
            onClick={() => setActiveTab('nirghonto')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'nirghonto'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-600/30'
                : 'text-amber-200 hover:text-white hover:bg-white/10 border border-amber-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{getTranslation(lang, 'tabNirghonto')}</span>
          </button>

          {/* 5. Contractor & Contacter Tab */}
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/30'
                : 'text-amber-200 hover:text-white hover:bg-white/10 border border-amber-500/40 bg-amber-950/20'
            }`}
          >
            <HardHat className="w-3.5 h-3.5 text-amber-400" />
            <span>কন্ট্রাক্টর ও যোগাযোগ (Contractor)</span>
          </button>

          {/* 6. Admin & Supabase */}
          <button
            onClick={() => setActiveTab('admin-portal')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'admin-portal'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-md shadow-red-700/40 ring-1 ring-amber-400'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/40 bg-emerald-950/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{getTranslation(lang, 'tabAdminPortal')}</span>
          </button>

          {/* 7. Pandals Gallery */}
          <button
            onClick={() => setActiveTab('pandals')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pandals'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-amber-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'tabPandals')}</span>
          </button>

          {/* 8. AI Studio */}
          <button
            onClick={() => setActiveTab('ai-studio')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'ai-studio'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-bold shadow-md'
                : 'text-amber-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{getTranslation(lang, 'tabAiStudio')}</span>
          </button>

          {/* 9. Receipts */}
          <button
            onClick={() => setActiveTab('receipts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'tabReceipts')}</span>
          </button>

          {/* 10. Standalone HTML */}
          <button
            onClick={() => setActiveTab('html-version')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'html-version'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-amber-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'tabHtmlVersion')}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
