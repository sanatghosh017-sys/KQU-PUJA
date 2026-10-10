/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { SubscriptionTracker } from './components/SubscriptionTracker';
import { SummaryTable } from './components/SummaryTable';
import { ReceiptsList } from './components/ReceiptsList';
import { AIImageStudio } from './components/AIImageStudio';
import { PandalsGallery, PandalPhoto } from './components/PandalsGallery';
import { ReceiptModal } from './components/ReceiptModal';
import { SaveJpgModal } from './components/SaveJpgModal';
import { DownloadModal } from './components/DownloadModal';
import { AddMemberModal } from './components/AddMemberModal';
import { AuthModal } from './components/AuthModal';
import { HtmlVersionView } from './components/HtmlVersionView';
import { BottomTrackerBar } from './components/BottomTrackerBar';
import { PublicWebsite } from './components/PublicWebsite';
import { WhatsAppModal } from './components/WhatsAppModal';
import { LiveVoiceCompanion } from './components/LiveVoiceCompanion';
import { AdminPortal } from './components/AdminPortal';
import { MahalayaPlayer } from './components/MahalayaPlayer';
import { PujaNirghontoView } from './components/PujaNirghontoModal';
import { ContacterTab } from './components/ContacterTab';
import { INITIAL_UNITS, INITIAL_STAFF_UNITS, StaffEntry } from './data/pujaData';
import { PaymentState, AuthSession, AppTab, Language } from './types';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  savePaymentToSupabase, 
  saveMemberToSupabase, 
  saveDonationToSupabase, 
  saveMemberMobileToSupabase,
  SUPABASE_PROJECT_ID 
} from './services/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('website');
  const [lang, setLang] = useState<Language>('bn'); // Default language Bengali

  // 167 Staff Directory grouped into 7 Units + MISC
  const [staffUnitsData, setStaffUnitsData] = useState<Record<string, StaffEntry[]>>(() => {
    try {
      const saved = localStorage.getItem('dp_staff_units');
      return saved ? JSON.parse(saved) : INITIAL_STAFF_UNITS;
    } catch {
      return INITIAL_STAFF_UNITS;
    }
  });

  // Supabase Toast Notification State
  const [supabaseToast, setSupabaseToast] = useState<{
    message: string;
    unit: string;
    amount: number;
    paid: boolean;
  } | null>(null);

  // WhatsApp dispatch & connect state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppMember, setWhatsAppMember] = useState<{
    name: string;
    amount: number;
    unit: string;
    index: number;
    paidDate?: string;
    method?: string;
  } | null>(null);

  // Data states
  const [unitsData, setUnitsData] = useState<Record<string, [string, number][]>>(() => {
    try {
      const saved = localStorage.getItem('dp_units');
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });

  const [paymentState, setPaymentState] = useState<PaymentState>(() => {
    try {
      const saved = localStorage.getItem('dp_paid');
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized: PaymentState = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'number' || typeof v === 'boolean') {
            normalized[k] = { paid: Boolean(v), method: 'Cash' };
          } else if (typeof v === 'object' && v !== null) {
            normalized[k] = v as any;
          }
        });
        return normalized;
      }
      return {};
    } catch {
      return {};
    }
  });

  const [pandals, setPandals] = useState<PandalPhoto[]>([
    {
      id: 'pandal-1',
      title: 'KQU Main Pandal Entrance',
      description: 'Traditional bamboo and golden illumination at the main entrance pandal at KQU PWI Ground',
      url: 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=1200&q=80',
      uploadedAt: '2026-09-28T05:00:00.000Z',
      unit: 'General',
    },
    {
      id: 'pandal-2',
      title: 'Dhunuchi Naach & Evening Aarti',
      description: 'Evening devotees and traditional dhunuchi dance worship ceremony with fragrant incense',
      url: 'https://images.unsplash.com/photo-1570560258879-af7f8e1447ac?auto=format&fit=crop&w=1200&q=80',
      uploadedAt: '2026-09-28T05:10:00.000Z',
      unit: 'Aarti',
    }
  ]);

  // Auth Session State: Unit User (Enters Data Once) vs Admin (KQU2026, Master Control)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const role = localStorage.getItem('dp_auth_role') as 'admin' | 'unit' | null;
      const userId = localStorage.getItem('dp_auth_user_id');
      const name = localStorage.getItem('dp_auth_user_name');
      const unit = localStorage.getItem('dp_auth_unit');
      const canChangeData = localStorage.getItem('dp_auth_can_change') === '1';
      if (role && userId) {
        return {
          role,
          userId,
          unit,
          name: name || userId,
          canChangeData,
        };
      }
      if (localStorage.getItem('dp_auth_user') === '1') {
        return {
          role: 'admin',
          userId: 'KQU2026',
          name: 'Committee Admin (KQU2026)',
          canChangeData: true,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return Boolean(
        localStorage.getItem('dp_auth_role') ||
        localStorage.getItem('dp_auth_user') === '1' ||
        sessionStorage.getItem('dp_in') === '1'
      );
    } catch {
      return false;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);

  // Sync with Firebase Auth user if signed in via Google
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsUnlocked(true);
        const isAdmin = user.email === '17sanatghosh@gmail.com';
        setAuthSession({
          role: isAdmin ? 'admin' : 'unit',
          userId: user.uid,
          name: user.displayName || user.email || 'Devotee',
          canChangeData: isAdmin,
          email: user.email || undefined,
          photoURL: user.photoURL || undefined,
        });
      }
    });
    return () => unsub();
  }, []);

  // Modal states
  const [receiptMember, setReceiptMember] = useState<{
    name: string;
    amount: number;
    unit: string;
    index: number;
    paidDate?: string;
    method?: string;
  } | null>(null);

  const [saveJpgUnit, setSaveJpgUnit] = useState<string | null>(null);
  const [addMemberUnit, setAddMemberUnit] = useState<string | null>(null);

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('dp_paid', JSON.stringify(paymentState));
    } catch (e) {
      console.warn('Could not save payment state to localStorage:', e);
    }
  }, [paymentState]);

  useEffect(() => {
    try {
      localStorage.setItem('dp_units', JSON.stringify(unitsData));
    } catch (e) {
      console.warn('Could not save units data to localStorage:', e);
    }
  }, [unitsData]);

  // Overall Financial Calculations
  const { totalBudget, totalCollected, totalCount, paidCount } = useMemo(() => {
    let budget = 0;
    let collected = 0;
    let totalItems = 0;
    let paidItems = 0;

    Object.entries(unitsData).forEach(([u, list]) => {
      list.forEach((r, i) => {
        budget += r[1];
        totalItems++;
        const key = `${u}-${i}`;
        if (paymentState[key]?.paid) {
          collected += r[1];
          paidItems++;
        }
      });
    });

    return {
      totalBudget: budget,
      totalCollected: collected,
      totalCount: totalItems,
      paidCount: paidItems,
    };
  }, [unitsData, paymentState]);

  // Payment Toggle Handler - syncs to backend with role-based enter-once lock
  const handleTogglePayment = async (unit: string, index: number, paid: boolean) => {
    // If not authenticated, prompt login modal
    if (!authSession) {
      setAuthModalOpen(true);
      return;
    }

    const key = `${unit}-${index}`;
    const alreadyPaid = Boolean(paymentState[key]?.paid);

    // Enforce Enter-Once rule:
    // If unit user and entry was already paid, prevent unticking or changing!
    if (authSession.role === 'unit' && alreadyPaid && !paid) {
      return;
    }

    const nextState = { ...paymentState };
    if (paid) {
      nextState[key] = {
        paid: true,
        paidAt: new Date().toISOString(),
        method: 'Cash',
      };
    } else {
      delete nextState[key];
    }
    setPaymentState(nextState);

    // Save to Supabase Cloud Database (Project sgmjrhdfbwvzmkhsssjr)
    const staffItem = staffUnitsData[unit]?.[index];
    const memberName = staffItem?.name || unitsData[unit]?.[index]?.[0] || `Member ${index + 1}`;
    const amount = staffItem?.amount || unitsData[unit]?.[index]?.[1] || 0;
    const savedBy = authSession.role === 'admin' 
      ? 'Admin (KQU2026)' 
      : (authSession.name || `Unit ${unit} User`);

    savePaymentToSupabase({
      unit,
      index,
      name: memberName,
      amount,
      paid,
      savedBy,
    });

    setSupabaseToast({
      message: `Synced to Supabase DB (${SUPABASE_PROJECT_ID}): ${memberName}`,
      unit,
      amount,
      paid,
    });
    setTimeout(() => setSupabaseToast(null), 3500);

    // Optional server sync if backend route is mounted
    try {
      fetch('/api/sync/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit,
          index,
          paid,
          method: 'Cash',
          userRole: authSession.role,
        }),
      }).catch(() => {});
    } catch {}
  };

  // Update member mobile number (Admin privilege) - automatically saves to unit and Supabase!
  const handleUpdateMemberMobile = (unit: string, index: number, newMobile: string) => {
    const list = [...(staffUnitsData[unit] || [])];
    if (list[index]) {
      list[index] = {
        ...list[index],
        mobileNo: newMobile,
      };
      const updatedStaff = {
        ...staffUnitsData,
        [unit]: list,
      };
      setStaffUnitsData(updatedStaff);
      try {
        localStorage.setItem('dp_staff_units', JSON.stringify(updatedStaff));
      } catch {}

      // Save to Supabase Cloud Server
      saveMemberMobileToSupabase(unit, index, list[index].name, newMobile);

      setSupabaseToast({
        message: `মোবাইল নম্বর সংরক্ষণ ও সুপারবেসে সিঙ্ক: ${list[index].name} (${newMobile})`,
        unit,
        amount: list[index].amount,
        paid: Boolean(paymentState[`${unit}-${index}`]?.paid),
      });
      setTimeout(() => setSupabaseToast(null), 3500);
    }
  };

  // Clear All Handler (Admin only)
  const handleClearAll = async () => {
    if (authSession?.role !== 'admin') {
      setAuthModalOpen(true);
      return;
    }

    setPaymentState({});
    localStorage.removeItem('dp_paid');

    try {
      fetch('/api/sync/clear-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: 'admin' }),
      }).catch(() => {});
    } catch {}
  };

  // Add Member to Unit
  const handleAddMember = async (name: string, amount: number) => {
    if (!addMemberUnit) return;
    const currentList = unitsData[addMemberUnit] || [];
    const newMember: [string, number] = [name, amount];
    const updatedUnits = {
      ...unitsData,
      [addMemberUnit]: [...currentList, newMember],
    };
    setUnitsData(updatedUnits);

    const currentStaffList = staffUnitsData[addMemberUnit] || [];
    const newStaffItem: StaffEntry = {
      slNo: 167 + currentStaffList.length + 1,
      name,
      amount,
      mobileNo: '',
    };
    const updatedStaff = {
      ...staffUnitsData,
      [addMemberUnit]: [...currentStaffList, newStaffItem],
    };
    setStaffUnitsData(updatedStaff);
    try {
      localStorage.setItem('dp_staff_units', JSON.stringify(updatedStaff));
    } catch {}

    // Save to Supabase
    saveMemberToSupabase(
      addMemberUnit, 
      name, 
      amount, 
      authSession?.name || `Unit ${addMemberUnit} User`
    );

    setSupabaseToast({
      message: `New Member Synced to Supabase: ${name} (₹${amount})`,
      unit: addMemberUnit,
      amount,
      paid: false,
    });
    setTimeout(() => setSupabaseToast(null), 3500);

    try {
      fetch('/api/sync/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: addMemberUnit, newMember }),
      }).catch(() => {});
    } catch {}
  };

  // Add Pandal Photo
  const handleAddPandal = async (newPandalData: { title: string; description: string; url: string; unit: string }) => {
    const localPandal: PandalPhoto = {
      id: 'pandal-' + Date.now(),
      title: newPandalData.title,
      description: newPandalData.description,
      url: newPandalData.url,
      uploadedAt: new Date().toISOString(),
      unit: newPandalData.unit,
    };
    const updated = [localPandal, ...pandals];
    setPandals(updated);
  };

  const handleDeletePandal = async (id: string) => {
    const updated = pandals.filter(p => p.id !== id);
    setPandals(updated);
  };

  const handleRecordOnlineDonation = (donation: { name: string; amount: number; unit: string; phone?: string }) => {
    const targetUnit = donation.unit || 'MISC';
    const currentMembers = unitsData[targetUnit] || [];
    const newMember: [string, number] = [donation.name, donation.amount];
    const newIdx = currentMembers.length;
    const newMembers = [...currentMembers, newMember];
    const updatedUnits = {
      ...unitsData,
      [targetUnit]: newMembers,
    };
    
    setUnitsData(updatedUnits);

    const pKey = `${targetUnit}-${newIdx}`;
    const newPaymentInfo = {
      paid: true,
      paidAt: new Date().toISOString(),
      method: 'Online' as const,
      receivedBy: 'Online Devotee Portal',
    };

    const updatedPayments = {
      ...paymentState,
      [pKey]: newPaymentInfo,
    };

    setPaymentState(updatedPayments);

    // Save donation to Supabase
    const receiptNo = `KQU-2026-${Date.now().toString().slice(-5)}`;
    savePaymentToSupabase({
      unit: targetUnit,
      index: newIdx,
      name: donation.name,
      amount: donation.amount,
      paid: true,
      savedBy: 'Online Devotee Portal',
      method: 'Online',
    });
    saveDonationToSupabase({
      donorName: donation.name,
      amount: donation.amount,
      unit: targetUnit,
      phone: donation.phone,
      receiptNo,
    });

    setSupabaseToast({
      message: `Online Chanda Synced to Supabase: ${donation.name} (₹${donation.amount})`,
      unit: targetUnit,
      amount: donation.amount,
      paid: true,
    });
    setTimeout(() => setSupabaseToast(null), 3500);
  };

  const handleOpenReceipt = (member: { name: string; amount: number; unit: string; index: number }) => {
    const key = `${member.unit}-${member.index}`;
    const info = paymentState[key];
    setReceiptMember({
      ...member,
      paidDate: info?.paidAt,
      method: info?.method || 'Cash',
    });
  };

  const handleAuthSuccess = (sessionData?: { deviceId: string; user: any }) => {
    setIsUnlocked(true);
    if (sessionData?.user) {
      setAuthSession(sessionData.user);
      try {
        localStorage.setItem('dp_auth_role', sessionData.user.role);
        localStorage.setItem('dp_auth_user_id', sessionData.user.userId);
        localStorage.setItem('dp_auth_user_name', sessionData.user.name);
        if (sessionData.user.unit) {
          localStorage.setItem('dp_auth_unit', sessionData.user.unit);
        } else {
          localStorage.removeItem('dp_auth_unit');
        }
        localStorage.setItem('dp_auth_can_change', sessionData.user.canChangeData ? '1' : '0');
      } catch {}
    }
    try {
      sessionStorage.setItem('dp_in', '1');
      localStorage.setItem('dp_auth_user', '1');
    } catch {}
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    setIsUnlocked(false);
    setAuthSession(null);
    try {
      sessionStorage.removeItem('dp_in');
      localStorage.removeItem('dp_auth_user');
      localStorage.removeItem('dp_auth_role');
      localStorage.removeItem('dp_auth_user_id');
      localStorage.removeItem('dp_auth_user_name');
      localStorage.removeItem('dp_auth_unit');
      localStorage.removeItem('dp_auth_can_change');
    } catch {}
  };

  const handleToggleLock = () => {
    if (isUnlocked) {
      handleLogout();
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0a09] text-stone-100">
      {/* Header with 3 Languages & Leadership */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCollected={totalCollected}
        totalBudget={totalBudget}
        paidCount={paidCount}
        totalCount={totalCount}
        isUnlocked={isUnlocked}
        authSession={authSession}
        onToggleLock={handleToggleLock}
        onLogout={handleLogout}
        onOpenSaveJpg={(unit) => setSaveJpgUnit(unit)}
        onOpenDownload={() => setDownloadModalOpen(true)}
        onOpenWhatsAppModal={() => {
          setWhatsAppMember(null);
          setWhatsAppModalOpen(true);
        }}
        lang={lang}
        onSetLang={setLang}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-24">
        {/* PUBLIC FESTIVAL CELEBRATION WEBSITE */}
        {activeTab === 'website' && (
          <PublicWebsite
            pandals={pandals}
            onNavigateToTracker={() => setActiveTab('tracker')}
            onOpenReceipt={handleOpenReceipt}
            unitsData={unitsData}
            paymentState={paymentState}
            onRecordOnlineDonation={handleRecordOnlineDonation}
            onOpenVoiceCompanion={() => setActiveTab('ai-voice')}
          />
        )}

        {/* PUJA NIRGHONTO (পুজো নির্ঘণ্ট ও সময়সূচী) */}
        {activeTab === 'nirghonto' && (
          <PujaNirghontoView lang={lang} />
        )}

        {/* CONTACTER / CONTRACTOR TAB (কন্ট্রাক্টর ও কমিটি আধিকারিক) */}
        {activeTab === 'contact' && (
          <ContacterTab 
            lang={lang} 
            authSession={authSession}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {/* GEMINI 3.8 LIVE VOICE COMPANION TAB */}
        {activeTab === 'ai-voice' && (
          <LiveVoiceCompanion />
        )}

        {/* 7 UNITS & MISC SUBSCRIPTION TRACKER WITH MOBILE NUMBERS */}
        {activeTab === 'tracker' && (
          <SubscriptionTracker
            staffUnitsData={staffUnitsData}
            paymentState={paymentState}
            onTogglePayment={handleTogglePayment}
            onOpenReceipt={handleOpenReceipt}
            onOpenSaveJpg={(unit) => setSaveJpgUnit(unit)}
            onClearAll={handleClearAll}
            onOpenAddMember={(unit) => setAddMemberUnit(unit)}
            onUpdateMemberMobile={handleUpdateMemberMobile}
            isUnlocked={isUnlocked}
            authSession={authSession}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateToContact={() => setActiveTab('contact')}
            lang={lang}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTable
            unitsData={unitsData}
            paymentState={paymentState}
            onOpenSaveJpg={(unit) => setSaveJpgUnit(unit)}
          />
        )}

        {/* PANDALS GALLERY TAB */}
        {activeTab === 'pandals' && (
          <PandalsGallery
            pandals={pandals}
            onAddPandal={handleAddPandal}
            onDeletePandal={handleDeletePandal}
            isUnlocked={isUnlocked}
            onOpenAIStudio={() => setActiveTab('ai-studio')}
            authSession={authSession}
          />
        )}

        {activeTab === 'ai-studio' && (
          <AIImageStudio />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsList
            unitsData={unitsData}
            paymentState={paymentState}
            onOpenReceipt={handleOpenReceipt}
            onOpenWhatsAppReceipt={(member) => {
              setWhatsAppMember(member);
              setWhatsAppModalOpen(true);
            }}
          />
        )}

        {activeTab === 'html-version' && (
          <HtmlVersionView />
        )}

        {/* ADMIN ID & SUPABASE DATABASE PORTAL */}
        {activeTab === 'admin-portal' && (
          <AdminPortal
            authSession={authSession}
            onLoginAsAdmin={(session) => {
              setAuthSession(session);
              setIsUnlocked(true);
            }}
            onLogout={handleLogout}
            unitsData={unitsData}
            paymentState={paymentState}
            onTogglePayment={handleTogglePayment}
            staffUnitsData={staffUnitsData}
            onUpdateMemberMobile={handleUpdateMemberMobile}
          />
        )}
      </main>

      {/* Mahalaya Devotional Audio Player (Only Gallery Songs by Admin) */}
      <MahalayaPlayer 
        lang={lang} 
        authSession={authSession}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Decorative Ambient Floating Particles & Festive Lights */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-35">
        <div className="absolute top-1/4 left-5 w-2 h-2 rounded-full bg-amber-400 blur-[1px] animate-pulse" />
        <div className="absolute top-1/3 right-8 w-2.5 h-2.5 rounded-full bg-red-400 blur-[1px] animate-ping" />
        <div className="absolute bottom-1/4 left-12 w-1.5 h-1.5 rounded-full bg-yellow-300 blur-[0.5px] animate-pulse" />
        <div className="absolute top-2/3 right-16 w-2 h-2 rounded-full bg-amber-300 blur-[1px] animate-bounce" />
      </div>

      {/* Floating Supabase Real-time Sync Toast Notification */}
      {supabaseToast && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/95 text-emerald-100 border border-emerald-500/60 shadow-2xl rounded-2xl p-3.5 flex items-center gap-3 backdrop-blur-md max-w-sm ring-1 ring-emerald-400/30">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>⚡ Synced to Supabase DB</span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 px-1.5 py-0.2 rounded">
                  sgmjrhdfbwvzmkhsssjr
                </span>
              </p>
              <p className="text-emerald-300 mt-0.5 font-medium">
                Unit {supabaseToast.unit} · {supabaseToast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tracker Bar */}
      <BottomTrackerBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDownload={() => setDownloadModalOpen(true)}
        onOpenWhatsApp={() => {
          setWhatsAppMember(null);
          setWhatsAppModalOpen(true);
        }}
        isUnlocked={isUnlocked}
        authSession={authSession}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogoutClick={handleLogout}
      />

      {/* Modals */}
      {receiptMember && (
        <ReceiptModal
          member={receiptMember}
          paidDate={receiptMember.paidDate}
          paymentMethod={receiptMember.method}
          onClose={() => setReceiptMember(null)}
          onOpenWhatsAppModal={() => {
            const memberToShare = receiptMember;
            setReceiptMember(null);
            setWhatsAppMember(memberToShare);
            setWhatsAppModalOpen(true);
          }}
        />
      )}

      {/* WhatsApp Dispatch & Community Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        unitsData={unitsData}
        paymentState={paymentState}
        preselectedMember={whatsAppMember}
      />

      {saveJpgUnit && (
        <SaveJpgModal
          currentUnit={saveJpgUnit}
          unitsData={unitsData}
          paymentState={paymentState}
          onClose={() => setSaveJpgUnit(null)}
        />
      )}

      {downloadModalOpen && (
        <DownloadModal
          unitsData={unitsData}
          paymentState={paymentState}
          onClose={() => setDownloadModalOpen(false)}
          onOpenSaveJpg={(unit) => {
            setDownloadModalOpen(false);
            setSaveJpgUnit(unit);
          }}
        />
      )}

      {addMemberUnit && (
        <AddMemberModal
          unit={addMemberUnit}
          onAdd={handleAddMember}
          onClose={() => setAddMemberUnit(null)}
        />
      )}

      {authModalOpen && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
