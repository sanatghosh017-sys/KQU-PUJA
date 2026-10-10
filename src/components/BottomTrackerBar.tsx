import React from 'react';
import { 
  Calendar, 
  BarChart3, 
  Camera, 
  Receipt, 
  Download, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  MessageCircle,
  Mic,
  Clock,
  Phone,
  HardHat,
  Radio
} from 'lucide-react';
import { AuthSession, AppTab } from '../types';

interface BottomTrackerBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenDownload: () => void;
  onOpenWhatsApp?: () => void;
  isUnlocked: boolean;
  authSession?: AuthSession | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const BottomTrackerBar: React.FC<BottomTrackerBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDownload,
  onOpenWhatsApp,
  isUnlocked,
  authSession,
  onLoginClick,
  onLogoutClick,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-xl border-t border-amber-500/30 shadow-[0_-8px_25px_rgba(0,0,0,0.5)]">
      {/* Top tiny sync status ticker on medium/large devices */}
      <div className="hidden md:flex items-center justify-between px-6 py-1 bg-stone-900/90 border-b border-amber-500/10 text-[11px] text-stone-400">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-medium">DURGA PUJA 2026 KQU</span>
          <span className="text-stone-600">·</span>
          <span>Place: KQU PWI OFFICE · Sharadotsav 2026 / ১৪৩৩</span>
        </div>
        <div className="flex items-center gap-3">
          {isUnlocked && authSession ? (
            authSession.role === 'admin' ? (
              <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin ({authSession.userId.slice(0, 8)})</span>
              </span>
            ) : (
              <span className="text-amber-300 flex items-center gap-1 font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>User: {authSession.name ? authSession.name.split(' ')[0] : authSession.userId.slice(0, 8)}</span>
              </span>
            )
          ) : (
            <span className="text-stone-400">Guest Viewer Mode (Login with Google / ID)</span>
          )}
        </div>
      </div>

      {/* Main Bottom Tracker Navigation Dock */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex-1 flex items-center justify-around sm:justify-start sm:gap-2">
          
          {/* 0. Festival Website */}
          <button
            onClick={() => setActiveTab('website')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'website'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-stone-950 shadow-md shadow-amber-400/40'
                : 'text-amber-300 hover:text-white hover:bg-stone-900'
            }`}
            title="DURGA PUJA 2026 KQU Festival Website"
          >
            <Sparkles className="w-4 h-4 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs">Website</span>
          </button>

          {/* AI Live Voice Tab */}
          <button
            onClick={() => setActiveTab('ai-voice')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ai-voice'
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-400/40'
                : 'text-red-400 hover:text-white hover:bg-stone-900'
            }`}
            title="Gemini 3.8 Live Voice Companion"
          >
            <Mic className="w-4 h-4 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs">AI Voice</span>
          </button>

          {/* 1. Tracker */}
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/40'
                : 'text-stone-300 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="text-[11px] sm:text-xs">Tracker</span>
          </button>

          {/* 2. Summary */}
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/40'
                : 'text-stone-300 hover:text-white hover:bg-stone-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="text-[11px] sm:text-xs">Summary</span>
          </button>

          {/* Puja Nirghonto */}
          <button
            onClick={() => setActiveTab('nirghonto')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'nirghonto'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-600/40'
                : 'text-amber-200 hover:text-white hover:bg-stone-900'
            }`}
            title="পুজো নির্ঘণ্ট"
          >
            <Clock className="w-4 h-4 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs">নির্ঘণ্ট</span>
          </button>

          {/* Contractor & Contacter Directory */}
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40'
                : 'text-amber-200 hover:text-white hover:bg-stone-900'
            }`}
            title="কন্ট্রাক্টর ও যোগাযোগ"
          >
            <HardHat className="w-4 h-4 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs">কন্ট্রাক্টর</span>
          </button>

          {/* LIVE Option Button */}
          <button
            onClick={() => setActiveTab('ai-voice')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ai-voice'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40 ring-1 ring-amber-300'
                : 'text-red-300 hover:text-white hover:bg-stone-900 animate-pulse'
            }`}
            title="লাইভ অপশন - ভয়েস ও দর্শন"
          >
            <Radio className="w-4 h-4 sm:w-4 sm:h-4 text-red-400" />
            <span className="text-[11px] sm:text-xs font-black">LIVE</span>
          </button>

          {/* 3. Add Pic with Pandals */}
          <button
            onClick={() => setActiveTab('pandals')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pandals'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-amber-300 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Camera className="w-4 h-4 sm:w-4 sm:h-4" />
            <div className="flex items-center gap-1">
              <span className="text-[11px] sm:text-xs">Pandals</span>
            </div>
          </button>

          {/* 4. Receipt */}
          <button
            onClick={() => setActiveTab('receipts')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/40'
                : 'text-stone-300 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Receipt className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="text-[11px] sm:text-xs">Receipt</span>
          </button>

          {/* Admin ID & Supabase Database */}
          <button
            onClick={() => setActiveTab('admin-portal')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'admin-portal'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/40'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/30'
            }`}
            title="Admin ID Login & Supabase Cloud Database"
          >
            <ShieldCheck className="w-4 h-4 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Admin & DB</span>
          </button>

          {/* 5. WhatsApp Link & Connect */}
          <button
            onClick={onOpenWhatsApp}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition text-[#25D366] hover:text-white hover:bg-[#25D366]/20 border border-[#25D366]/30 bg-[#25D366]/10 cursor-pointer"
            title="WhatsApp Receipts & Sharing"
          >
            <MessageCircle className="w-4 h-4 sm:w-4 sm:h-4 fill-[#25D366]/30 text-[#25D366]" />
            <span className="text-[11px] sm:text-xs">WhatsApp</span>
          </button>

          {/* 6. Download Option */}
          <button
            onClick={onOpenDownload}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30 bg-emerald-950/20 cursor-pointer"
            title="Download Reports, JPG, CSV, and Offline HTML"
          >
            <Download className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="text-[11px] sm:text-xs">Download</span>
          </button>
        </div>

        {/* Right side: Device Login & Logout Option */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-stone-800">
          {isUnlocked && authSession ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  authSession.role === 'admin' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {authSession.role === 'admin' ? 'Admin Active' : 'Connected'}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  {authSession.userId.slice(0, 10)}
                </span>
              </div>
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                title="Log out from this device"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px] sm:text-xs">Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 border border-amber-400 text-xs font-black transition cursor-pointer shadow-sm shadow-amber-600/30"
              title="Connect Device with Google, Unit ID, or Admin"
            >
              <LogIn className="w-3.5 h-3.5 text-stone-950" />
              <span className="text-[11px] sm:text-xs">Login</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
