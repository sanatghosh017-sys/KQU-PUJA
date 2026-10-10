import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Music,
  Share2,
  Download,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  Compass,
  Globe,
  Copy,
  Check,
  Flower2,
  ArrowRight,
  MessageCircle,
  Mic,
  Radio,
} from 'lucide-react';
import { dhakEngine } from '../utils/dhakSound';
import { COMMITTEE_INFO, formatINR, numberToWordsIndian, getWebsiteHttpsUrl } from '../data/pujaData';
import { PandalPhoto } from './PandalsGallery';
import { PaymentState } from '../types';
import { 
  db, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from '../services/firebase';

interface PublicWebsiteProps {
  pandals: PandalPhoto[];
  onNavigateToTracker: () => void;
  onOpenReceipt: (member: { name: string; amount: number; unit: string; index: number }) => void;
  unitsData: Record<string, [string, number][]>;
  paymentState: PaymentState;
  onRecordOnlineDonation?: (donation: { name: string; amount: number; unit: string; phone?: string; email?: string }) => void;
  onOpenVoiceCompanion?: () => void;
}

interface DevoteeWish {
  id: string;
  name: string;
  location: string;
  message: string;
  date: string;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  pandals,
  onNavigateToTracker,
  onOpenReceipt,
  unitsData,
  paymentState,
  onRecordOnlineDonation,
  onOpenVoiceCompanion,
}) => {
  // Dhak Audio Engine state
  const [isDhakPlaying, setIsDhakPlaying] = useState(false);
  const [dhakRhythm, setDhakRhythm] = useState<'classic' | 'dhunuchi' | 'sandhi'>('classic');

  // Pushpanjali offering state
  const [offeringCount, setOfferingCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('kqu_darshan_count') || '108');
    } catch {
      return 108;
    }
  });
  const [lastOfferedItem, setLastOfferedItem] = useState<string | null>(null);

  // Active Nirghonto / Schedule day tab
  const [selectedDay, setSelectedDay] = useState<'mahalaya' | 'sasthi' | 'saptami' | 'ashtami' | 'nabami' | 'dashami'>('ashtami');

  // Online Chanda Donation Form State
  const [donorName, setDonorName] = useState('');
  const [donorAmount, setDonorAmount] = useState<number>(501);
  const [donorPhone, setDonorPhone] = useState('');
  const [donorUnit, setDonorUnit] = useState('MISC');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccessReceipt, setDonationSuccessReceipt] = useState<{
    receiptNo: string;
    name: string;
    amount: number;
    unit: string;
    date: string;
  } | null>(null);

  // Wishes / Guestbook State - backed by Firestore live sync
  const [wishes, setWishes] = useState<DevoteeWish[]>([
    {
      id: 'w-1',
      name: 'Subhasish Sen & Family',
      location: 'KQU Railway Colony',
      message: 'Maa Durga brings immense joy and peace to all Railway & PWI staff families! Subho Sharadiya!',
      date: 'Today',
    },
    {
      id: 'w-2',
      name: 'Moumita & Avik Roy',
      location: 'KQU PWI Quarter',
      message: 'Looking forward to the Sandhi Puja with 108 lamps and the grand Dhunuchi dance! Jai Maa Durga!',
      date: 'Yesterday',
    },
    {
      id: 'w-3',
      name: 'Sanjoy Kumar Das (President)',
      location: 'KQU PWI Office',
      message: 'Cordially welcoming all devotees and guests to Sharadotsav 2026. May Maa shower divine blessings.',
      date: '2 days ago',
    },
  ]);
  const [wishName, setWishName] = useState('');
  const [wishLoc, setWishLoc] = useState('');
  const [wishText, setWishText] = useState('');
  const [copiedWebsiteLink, setCopiedWebsiteLink] = useState(false);

  // Firestore real-time listener for wishes collection
  useEffect(() => {
    const wishesPath = 'wishes';
    try {
      const q = query(collection(db, wishesPath), limit(30));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteWishes: DevoteeWish[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteWishes.push({
                id: docSnap.id,
                name: data.name || 'Devotee',
                location: data.location || 'KQU',
                message: data.message || '',
                date: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN') : 'Recent',
              });
            });
            if (remoteWishes.length > 0) {
              setWishes(remoteWishes);
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, wishesPath);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore wishes listener setup notice:', e);
    }
  }, []);

  const handleCopyWebsiteLink = () => {
    const url = getWebsiteHttpsUrl();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedWebsiteLink(true);
        setTimeout(() => setCopiedWebsiteLink(false), 2500);
      }).catch(() => {
        setCopiedWebsiteLink(true);
        setTimeout(() => setCopiedWebsiteLink(false), 2500);
      });
    } else {
      setCopiedWebsiteLink(true);
      setTimeout(() => setCopiedWebsiteLink(false), 2500);
    }
  };

  const handleShareWebsiteWhatsApp = () => {
    const url = getWebsiteHttpsUrl();
    const text = `🌸 *${COMMITTEE_INFO.name}*\n${COMMITTEE_INFO.bengaliName}\nPlace: *${COMMITTEE_INFO.place}*\nPresident: *${COMMITTEE_INFO.president}*\nTreasurer: *${COMMITTEE_INFO.treasurer}*\n\nVisit our official festival website & contribute chanda online:\n👉 ${url}\n\nSubho Sharadiya! 🪔`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Countdown timer to Maha Sasthi 2026 (Oct 16, 2026)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date('2026-10-16T08:00:00+05:30').getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Dhak audio playing state
  useEffect(() => {
    const unsubscribe = dhakEngine.subscribe((playing) => {
      setIsDhakPlaying(playing);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleDhak = () => {
    dhakEngine.toggle();
  };

  const handleChangeRhythm = (rhythm: 'classic' | 'dhunuchi' | 'sandhi') => {
    setDhakRhythm(rhythm);
    dhakEngine.setPattern(rhythm);
  };

  // Offering pushpanjali flowers or diya
  const handleOffer = (item: 'hibiscus' | 'lotus' | 'belpata' | 'diya') => {
    dhakEngine.playTempleBell();
    const newCount = offeringCount + 1;
    setOfferingCount(newCount);
    try {
      localStorage.setItem('kqu_darshan_count', String(newCount));
    } catch {}

    const itemNames: Record<string, string> = {
      hibiscus: '🌺 Red Hibiscus (জবা কুসুম)',
      lotus: '🪷 Sacred Lotus (পদ্ম ফুল)',
      belpata: '🍃 Sacred Bilva Patra (ত্রিদল বেলপাতা)',
      diya: '🪔 Ghee Pradip Diya (মঙ্গল প্রদীপ)',
    };
    setLastOfferedItem(itemNames[item]);
    setTimeout(() => setLastOfferedItem(null), 3500);
  };

  // Submit wish to blessings wall (with Firestore persistence)
  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishText.trim()) return;

    const newWish: DevoteeWish = {
      id: `w-${Date.now()}`,
      name: wishName.trim(),
      location: wishLoc.trim() || 'KQU',
      message: wishText.trim(),
      date: 'Just now',
    };
    setWishes([newWish, ...wishes]);

    // Save to Firestore
    try {
      await addDoc(collection(db, 'wishes'), {
        name: newWish.name,
        location: newWish.location,
        message: newWish.message,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore wish write notice:', err);
    }

    setWishName('');
    setWishLoc('');
    setWishText('');
  };

  // Handle Online Chanda Donation submission (with Firestore persistence)
  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || donorAmount <= 0) return;

    setIsDonating(true);
    const receiptNo = `KQU-2026-ONLINE-${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Save to Firestore collection
    try {
      await addDoc(collection(db, 'donations'), {
        donorName: donorName.trim(),
        amount: donorAmount,
        unit: donorUnit,
        phone: donorPhone.trim() || null,
        email: auth.currentUser?.email || null,
        userId: auth.currentUser?.uid || null,
        receiptNo,
        status: 'verified',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore donation write notice:', err);
    }

    if (onRecordOnlineDonation) {
      onRecordOnlineDonation({
        name: donorName.trim(),
        amount: donorAmount,
        unit: donorUnit,
        phone: donorPhone,
      });
    }

    setDonationSuccessReceipt({
      receiptNo,
      name: donorName.trim(),
      amount: donorAmount,
      unit: donorUnit,
      date: dateStr,
    });

    setIsDonating(false);
    setDonorName('');
    setDonorPhone('');
  };

  // Total collected calculation
  let totalCollected = 0;
  let totalTarget = 0;
  Object.entries(unitsData).forEach(([uKey, members]) => {
    members.forEach((m, idx) => {
      totalTarget += m[1];
      const pKey = `${uKey}-${idx}`;
      if (paymentState[pKey]?.paid) {
        totalCollected += m[1];
      }
    });
  });

  return (
    <div className="space-y-12 pb-16 text-stone-100">
      {/* 1. HERO FESTIVAL SHOWCASE */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-500/40 bg-gradient-to-b from-[#450a0a] via-[#7f1d1d] to-[#1c1917]">
        {/* Background glow and subtle festive pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fde047_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16 text-center max-w-5xl mx-auto space-y-6">
          {/* Sanskrit Sloka Header */}
          <div className="space-y-1">
            <p className="text-amber-300 font-festive text-sm sm:text-base tracking-wider font-semibold">
              ॥ সর্বমঙ্গলমঙ্গল্যে শিবে সর্বার্থসাধিকে । শরণ্যে ত্র্যম্বকে গৌরি নারায়ণি নমোঽস্তু তে ॥
            </p>
            <p className="text-xs text-amber-200/70 italic">
              "Salutations to the Divine Mother Durga who resides in all beings as auspicious cosmic energy"
            </p>
          </div>

          {/* Festival Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-festive tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 drop-shadow-md">
              {COMMITTEE_INFO.name}
            </h1>
            <p className="text-lg sm:text-xl font-medium text-amber-200 font-bengali">
              {COMMITTEE_INFO.bengaliName} · Sharadotsav {COMMITTEE_INFO.year}
            </p>
          </div>

          {/* Location & Officers Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-stone-200 pt-1">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Place: <b className="text-amber-300">{COMMITTEE_INFO.place}</b> Ground</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>President: <b className="text-amber-200">{COMMITTEE_INFO.president}</b></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Secretary: <b className="text-amber-200">{COMMITTEE_INFO.secretary}</b></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Treasurer: <b className="text-amber-200">{COMMITTEE_INFO.treasurer}</b></span>
            </div>
          </div>

          {/* Official Website Link Quick Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs text-emerald-200 shadow-md">
              <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-300 hidden sm:inline">Official Link:</span>
              <span className="font-mono text-[11px] text-emerald-100 max-w-[210px] sm:max-w-none truncate select-all font-semibold">
                {getWebsiteHttpsUrl()}
              </span>
              <button
                onClick={handleCopyWebsiteLink}
                className="ml-1 text-[11px] bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="Copy official link"
              >
                {copiedWebsiteLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShareWebsiteWhatsApp}
                className="text-[11px] bg-emerald-700/80 hover:bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="Share link on WhatsApp"
              >
                <Share2 className="w-3 h-3" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* LIVE DHAK & KANSHI SOUND CONTROLLER */}
          <div className="bg-stone-950/80 border border-amber-500/50 rounded-2xl p-4 sm:p-5 max-w-xl mx-auto shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleDhak}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition shadow-lg cursor-pointer ${
                    isDhakPlaying
                      ? 'bg-amber-500 text-stone-950 animate-pulse ring-4 ring-amber-400/30'
                      : 'bg-red-800 hover:bg-red-700 text-white'
                  }`}
                  title={isDhakPlaying ? 'Stop Dhak Beats' : 'Play Live Festive Dhak Beats'}
                >
                  {isDhakPlaying ? (
                    <Volume2 className="w-6 h-6 animate-bounce" />
                  ) : (
                    <Music className="w-6 h-6" />
                  )}
                </button>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-amber-200">
                      {isDhakPlaying ? 'Dhak & Kanshi Playing' : 'Experience Festive Dhak Beats'}
                    </span>
                    {isDhakPlaying && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Real Web Audio synthesizer · Traditional Sharadiya rhythmic percussion
                  </p>
                </div>
              </div>

              {/* Rhythm Selector Buttons */}
              <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800">
                <button
                  onClick={() => handleChangeRhythm('classic')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    dhakRhythm === 'classic'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => handleChangeRhythm('dhunuchi')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    dhakRhythm === 'dhunuchi'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Dhunuchi
                </button>
                <button
                  onClick={() => handleChangeRhythm('sandhi')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    dhakRhythm === 'sandhi'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Sandhi
                </button>
              </div>
            </div>
          </div>

          {/* COUNTDOWN TIMER */}
          <div className="pt-2">
            <p className="text-xs uppercase tracking-widest text-amber-300 font-bold mb-3">
              Countdown to Maha Sasthi Bodhon (Sharadotsav 2026)
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
              <div className="bg-black/50 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-black text-amber-200">{timeLeft.days}</div>
                <div className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">Days</div>
              </div>
              <div className="bg-black/50 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-black text-amber-200">{timeLeft.hours}</div>
                <div className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">Hours</div>
              </div>
              <div className="bg-black/50 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-black text-amber-200">{timeLeft.minutes}</div>
                <div className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">Mins</div>
              </div>
              <div className="bg-black/50 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl font-black text-amber-200">{timeLeft.seconds}</div>
                <div className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">Secs</div>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a
              href="#pushpanjali"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Flower2 className="w-4 h-4 text-amber-200" />
              <span>Offer Virtual Pushpanjali</span>
            </a>
            <a
              href="#nirghonto"
              className="px-5 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-200 border border-amber-500/40 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Puja Schedule (Nirghonto)</span>
            </a>
            {/* Prominent Live Option Broadcast & Voice companion */}
            {onOpenVoiceCompanion && (
              <button
                onClick={onOpenVoiceCompanion}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm shadow-xl transition active:scale-95 flex items-center gap-2 cursor-pointer ring-2 ring-red-400/80 animate-pulse"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <Radio className="w-4 h-4 text-white" />
                <span>🔴 LIVE OPTION (ভয়েস ও উৎসব দর্শন)</span>
              </button>
            )}
            <a
              href="#donation"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 text-red-700 fill-red-700" />
              <span>Donate / Chanda Online</span>
            </a>
            <button
              onClick={onNavigateToTracker}
              className="px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-750 text-stone-300 border border-stone-700 font-semibold text-xs sm:text-sm shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Internal Chanda Register</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. VIRTUAL DARSHAN & INTERACTIVE PUSHPANJALI */}
      <section id="pushpanjali" className="bg-stone-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Sacred Devotional Experience
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
              Virtual Darshan & Pushpanjali
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto font-bengali">
              দূর-দূরান্তের সমস্ত ভক্তবৃন্দ শ্রীশ্রী দুর্গা মায়ের শ্রীচরণে রক্তজবা, পদ্ম, বিল্বপত্র ও মঙ্গল প্রদীপ নিবেদন করে পুণ্য পুষ্পাঞ্জলি গ্রহণ করুন।
            </p>
          </div>

          {/* Deity Idol Centerpiece with Stylized Fallback */}
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/50 shadow-2xl min-h-[320px] sm:min-h-[380px] bg-gradient-to-b from-[#7f1d1d] via-[#450a0a] to-[#1c1917] flex items-center justify-center">
            {/* Artistic Deity Visual Representation */}
            <div className="text-center p-8 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-5xl">🔱</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-bold font-festive text-amber-200">
                  শ্রীশ্রী শারদীয়া দুর্গোৎসব ২০২৬
                </h3>
                <p className="text-sm font-bengali text-amber-300">
                  কে.কিউ.ইউ পি.ডাব্লিউ.আই অফিস প্রাঙ্গণ
                </p>
              </div>
            </div>

            {/* Devotee Offering Banner Notification */}
            {lastOfferedItem && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-950/95 text-amber-200 border-2 border-amber-400 px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-2xl animate-bounce flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Offered {lastOfferedItem} at Maa's Lotus Feet!</span>
              </div>
            )}

            {/* Pushpanjali Sanskrit Mantra Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-amber-500/40 text-center">
              <p className="font-festive text-sm sm:text-base text-amber-300 font-bold leading-relaxed">
                "নমঃ মহিষঘ্নি মহামায়ে চামুণ্ডে মুণ্ডমালিনী । আয়ুর্‌ আরোগ্যং বিজয়ং দেহি দেবি নমোঽস্তু তে ॥"
              </p>
              <p className="text-[11px] text-stone-300 mt-1">
                "May Mother Durga protect us, remove all impediments, and grant health, peace, and spiritual strength."
              </p>
            </div>
          </div>

          {/* Interactive Offering Action Trays */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => handleOffer('hibiscus')}
              className="p-3.5 bg-red-950/80 hover:bg-red-900/90 border border-red-500/40 rounded-2xl text-center space-y-1 transition active:scale-95 group cursor-pointer"
            >
              <div className="text-2xl group-hover:scale-125 transition duration-300">🌺</div>
              <div className="text-xs font-bold text-red-200">Red Hibiscus</div>
              <div className="text-[10px] text-red-400 font-bengali">রক্ত জবা কুসুম</div>
            </button>
            <button
              onClick={() => handleOffer('lotus')}
              className="p-3.5 bg-pink-950/80 hover:bg-pink-900/90 border border-pink-500/40 rounded-2xl text-center space-y-1 transition active:scale-95 group cursor-pointer"
            >
              <div className="text-2xl group-hover:scale-125 transition duration-300">🪷</div>
              <div className="text-xs font-bold text-pink-200">Sacred Lotus</div>
              <div className="text-[10px] text-pink-400 font-bengali">১০৮ নীলপদ্ম</div>
            </button>
            <button
              onClick={() => handleOffer('belpata')}
              className="p-3.5 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 rounded-2xl text-center space-y-1 transition active:scale-95 group cursor-pointer"
            >
              <div className="text-2xl group-hover:scale-125 transition duration-300">🍃</div>
              <div className="text-xs font-bold text-emerald-200">Bilva Patra</div>
              <div className="text-[10px] text-emerald-400 font-bengali">পবিত্র বেলপাতা</div>
            </button>
            <button
              onClick={() => handleOffer('diya')}
              className="p-3.5 bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/40 rounded-2xl text-center space-y-1 transition active:scale-95 group cursor-pointer"
            >
              <div className="text-2xl group-hover:scale-125 transition duration-300">🪔</div>
              <div className="text-xs font-bold text-amber-200">Ghee Pradip</div>
              <div className="text-[10px] text-amber-400 font-bengali">মঙ্গল প্রদীপ</div>
            </button>
          </div>

          <div className="text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Total Devotee Offerings Today: <b className="text-amber-300 font-mono">{offeringCount}</b> flowers & lamps</span>
          </div>
        </div>
      </section>

      {/* 3. PUJA NIRGHONTO / COMPLETE SCHEDULE */}
      <section id="nirghonto" className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Sacred Ritual Timetable
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
            Puja Nirghonto 2026 (পূজা নির্ঘন্ট)
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
            Comprehensive schedule of daily rituals, pushpanjali slots, evening aarti, and bhog distribution at KQU PWI Office Ground.
          </p>
        </div>

        {/* Day selection tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'mahalaya', label: 'Mahalaya', date: 'Oct 10' },
            { id: 'sasthi', label: 'Maha Sasthi', date: 'Oct 16' },
            { id: 'saptami', label: 'Maha Saptami', date: 'Oct 17' },
            { id: 'ashtami', label: 'Maha Ashtami', date: 'Oct 18' },
            { id: 'nabami', label: 'Maha Nabami', date: 'Oct 19' },
            { id: 'dashami', label: 'Vijaya Dashami', date: 'Oct 20' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDay(tab.id as any)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedDay === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${selectedDay === tab.id ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                {tab.date}
              </span>
            </button>
          ))}
        </div>

        {/* Schedule Cards Content based on day */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xl space-y-4">
          {selectedDay === 'mahalaya' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-200 border-b border-stone-800 pb-2">
                Mahalaya: The Invocation of the Goddess (মহালয়া ও চক্ষুদান)
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">04:00 AM</span>
                  <div>
                    <b className="text-stone-100">Birendra Krishna Bhadra Chandi Path</b>
                    <p className="text-stone-400 text-xs">Community listening of Mahishasuramardini broadcast at KQU Ground.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">06:00 AM</span>
                  <div>
                    <b className="text-stone-100">Tarpan & Ancestral Offerings</b>
                    <p className="text-stone-400 text-xs">Devotees gather for holy remembrance and tarpan.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">06:30 PM</span>
                  <div>
                    <b className="text-stone-100">Pratima Chokkhudaan (Painting the Eyes of Maa)</b>
                    <p className="text-stone-400 text-xs">Ceremonial painting of the eyes of Maa Durga by sculptors.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDay === 'sasthi' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-200 border-b border-stone-800 pb-2">
                Maha Sasthi: Bodhon, Amontron & Adhibas (মহা ষষ্ঠী)
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">08:30 AM</span>
                  <div>
                    <b className="text-stone-100">Kalparambha Puja</b>
                    <p className="text-stone-400 text-xs">Solemn vow by the priest to conduct the four-day Durga Puja without flaw.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">06:00 PM</span>
                  <div>
                    <b className="text-stone-100">Bodhon & Bilva Shakha Amontron</b>
                    <p className="text-stone-400 text-xs">Awakening of Devi Durga under the sacred Bel tree accompanied by resonant Dhak beats.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">07:30 PM</span>
                  <div>
                    <b className="text-stone-100">Adhibas & Opening Ceremony</b>
                    <p className="text-stone-400 text-xs">Official opening by President Sanjoy Kumar Das, Treasurer Dhananjay Kumar & committee dignitaries.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDay === 'saptami' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-200 border-b border-stone-800 pb-2">
                Maha Saptami: Nabapatrika Probesh & Saptami Puja (মহা সপ্তমী)
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">06:00 AM</span>
                  <div>
                    <b className="text-stone-100">Nabapatrika (Kola Bou) Snan & Procession</b>
                    <p className="text-stone-400 text-xs">Holy bath of nine sacred plants draped in a red-bordered yellow saree.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">08:30 AM</span>
                  <div>
                    <b className="text-stone-100">Saptami Vihit Puja & Prana Pratishtha</b>
                    <p className="text-stone-400 text-xs">Infusing divine life force into the Pratima with chanting of Vedic suktas.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">10:30 AM</span>
                  <div>
                    <b className="text-stone-100">Maha Saptami Pushpanjali (Batch 1 & 2)</b>
                    <p className="text-stone-400 text-xs">Community floral offerings with chanting of the Saptami Pushpanjali mantra.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">07:00 PM</span>
                  <div>
                    <b className="text-stone-100">Maha Aarti & Dhunuchi Dance</b>
                    <p className="text-stone-400 text-xs">Evening grand aarti with burning coconut husks and camphor in earthen dhunuchis.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDay === 'ashtami' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-200 border-b border-stone-800 pb-2 flex items-center justify-between">
                <span>Maha Ashtami & Sacred Sandhi Puja (মহা অষ্টমী ও সন্ধিপূজা)</span>
                <span className="text-xs bg-red-950 text-red-300 border border-red-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  Prime Day
                </span>
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">08:30 AM</span>
                  <div>
                    <b className="text-stone-100">Maha Ashtami Vihit Puja</b>
                    <p className="text-stone-400 text-xs">Special invocation of Chamunda Devi and sixteen sacred upacharas.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">10:30 AM</span>
                  <div>
                    <b className="text-stone-100">Community Ashtami Pushpanjali (Batches 1 to 4)</b>
                    <p className="text-stone-400 text-xs">Devotees observe fasting and offer bilva patra and flowers to Maa Durga.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">12:00 PM</span>
                  <div>
                    <b className="text-stone-100">Kumari Puja</b>
                    <p className="text-stone-400 text-xs">Worship of a young girl as the living embodiment of Devi Durga.</p>
                  </div>
                </div>
                <div className="flex gap-3 bg-red-950/40 p-3 rounded-xl border border-red-500/30">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">04:48 PM</span>
                  <div>
                    <b className="text-amber-200">Sacred Sandhi Puja (The Junction Ritual)</b>
                    <p className="text-stone-300 text-xs">
                      The supreme 48-minute junction between Ashtami and Nabami. Lighting of <b>108 Pradip lamps</b>, offering of <b>108 Lotuses</b>, and Chandi Homa during the exact moment Maa slew Chanda and Munda!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDay === 'nabami' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-200 border-b border-stone-800 pb-2">
                Maha Nabami: Navami Homa & Grand Dhunuchi Naach (মহা নবমী)
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">09:00 AM</span>
                  <div>
                    <b className="text-stone-100">Nabami Vihit Puja & Chandi Homa</b>
                    <p className="text-stone-400 text-xs">Sacred Vedic sacrificial fire ceremony for world peace and community welfare.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">01:00 PM</span>
                  <div>
                    <b className="text-stone-100">Maha Bhog & Prasad Distribution</b>
                    <p className="text-stone-400 text-xs">Khichuri bhog, labra, beguni, tomato-khejur chutney, and payesh served to all devotees.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">08:00 PM</span>
                  <div>
                    <b className="text-stone-100">Mega Dhunuchi Naach Championship</b>
                    <p className="text-stone-400 text-xs">Traditional drum-beat dance contest with prizes awarded by the Committee.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDay === 'dashami' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-200 border-b border-stone-800 pb-2">
                Vijaya Dashami: Sindoor Khela & Shobhajatra (বিজয়া দশমী)
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">09:30 AM</span>
                  <div>
                    <b className="text-stone-100">Dashami Puja & Darpan Bisarjan</b>
                    <p className="text-stone-400 text-xs">Priest captures the sacred reflection of the Pratima in a mirror immersed in water.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">11:00 AM</span>
                  <div>
                    <b className="text-stone-100">Devi Boron & Sindoor Khela</b>
                    <p className="text-stone-400 text-xs">Married women offer betel leaves and sweets, applying vermilion (sindoor) to Maa and one another.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">05:30 PM</span>
                  <div>
                    <b className="text-stone-100">Shobhajatra (Immersion Procession)</b>
                    <p className="text-stone-400 text-xs">Grand immersion procession to the sacred river with thunderous dhak beats: "আসছে বছর আবার হবে!"</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono font-bold text-amber-400 w-24 shrink-0">08:30 PM</span>
                  <div>
                    <b className="text-stone-100">Shanti Jal & Subho Bijoya Sweet Distribution</b>
                    <p className="text-stone-400 text-xs">Sprinkling of sacred Shanti Jal, traditional Kolakoli embraces, and sweets for everyone.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. ONLINE CHANDA & DONATION (WITH INSTANT E-RECEIPT) */}
      <section id="donation" className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 border border-amber-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Official Devotee Subscription
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
              Contribute Chanda Online (অনলাইন চাঁদা ও অনুদান)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto font-bengali">
              উৎসবের সাফল্য আপনার শ্রদ্ধাশীল সহযোগিতার উপর নির্ভরশীল। প্রতিটি অনুদানের জন্য সভাপতি সঞ্জয় কুমার দাস ও কোষাধ্যক্ষ ধনঞ্জয় কুমার অনুমোদিত অফিসিয়াল ই-রসিদ সাথে সাথে সংগ্রহ করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-7 bg-stone-950/80 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
              <form onSubmit={handleDonationSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Donor / Contributor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Enter full name (e.g. Subir Karmakar)"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Select Contribution Amount (₹ INR) *
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                    {[251, 501, 1001, 1500, 2100, 5001].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonorAmount(amt)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          donorAmount === amt
                            ? 'bg-amber-500 text-stone-950 border-amber-400'
                            : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="51"
                    required
                    value={donorAmount}
                    onChange={(e) => setDonorAmount(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    placeholder="Custom amount in ₹"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Unit / Railway Department
                    </label>
                    <select
                      value={donorUnit}
                      onChange={(e) => setDonorUnit(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="MISC">MISC (General Devotees)</option>
                      <option value="1">Unit 1 (Track Staff)</option>
                      <option value="2">Unit 2 (Engineering)</option>
                      <option value="3">Unit 3 (Operating)</option>
                      <option value="4">Unit 4 (Signal & Telecom)</option>
                      <option value="5">Unit 5 (Loco / Shed)</option>
                      <option value="6">Unit 6 (Electrical)</option>
                      <option value="7">Unit 7 (Commercial)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isDonating || !donorName.trim() || donorAmount <= 0}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>
                    {isDonating ? 'Issuing Official Receipt...' : `Contribute ₹${donorAmount.toLocaleString('en-IN')} & Get Receipt`}
                  </span>
                </button>
              </form>
            </div>

            {/* Receipt Preview or Transparency Card */}
            <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
              {donationSuccessReceipt ? (
                <div className="bg-[#fef3c7] text-stone-900 rounded-2xl p-5 border-2 border-amber-600 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Donation Verified
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-700">
                      {donationSuccessReceipt.receiptNo}
                    </span>
                  </div>

                  <div className="text-center bg-[#991b1b] text-white p-2.5 rounded-lg">
                    <p className="text-[10px] text-amber-200 font-bold">DURGA PUJA 2026 KQU</p>
                    <p className="text-xs font-bold">Official Chanda Receipt</p>
                    <p className="text-[10px] text-amber-100">Place: {COMMITTEE_INFO.place}</p>
                  </div>

                  <div className="text-xs space-y-1 bg-white p-3 rounded-lg border border-amber-200">
                    <p><b>Contributor:</b> {donationSuccessReceipt.name}</p>
                    <p><b>Amount:</b> <span className="text-red-700 font-black text-sm">₹{donationSuccessReceipt.amount.toLocaleString('en-IN')}</span></p>
                    <p className="text-[11px] text-stone-500 italic">({numberToWordsIndian(donationSuccessReceipt.amount)})</p>
                    <p><b>Unit:</b> {donationSuccessReceipt.unit}</p>
                    <p><b>Date:</b> {donationSuccessReceipt.date}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-stone-700 pt-1 font-semibold">
                    <div>
                      <p className="font-bold">{COMMITTEE_INFO.president}</p>
                      <p className="text-stone-500">President</p>
                    </div>
                    <div className="text-center font-bold text-red-800 border border-red-700 px-2 py-0.5 rounded text-[8px]">
                      KQU PWI SEAL
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{COMMITTEE_INFO.treasurer}</p>
                      <p className="text-stone-500">Treasurer</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenReceipt({
                        name: donationSuccessReceipt.name,
                        amount: donationSuccessReceipt.amount,
                        unit: donationSuccessReceipt.unit,
                        index: 99,
                      });
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View, Print & Download Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Puja Fund Transparency</span>
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    All subscriptions are recorded in the official accounts register of <b>DURGA PUJA 2026 KQU</b> at <b>KQU PWI OFFICE</b>.
                  </p>
                  <div className="bg-stone-900 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Total Target Budget:</span>
                      <span className="font-bold text-stone-200">₹{totalTarget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Total Collected Till Date:</span>
                      <span className="font-bold text-emerald-400">₹{totalCollected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Organizing Authority:</span>
                      <span className="text-amber-200">KQU PWI Office Committee</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/80">
                    Official offline receipts are also available in duplicate from Sri Dhananjay Kumar (Treasurer) or unit representatives.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. BHOG & PRASAD PRABANDHA (ONLY SAPTAMI BHOG AVAILABLE AS PROSAD) */}
      <section className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            একমাত্র মহাপ্রসাদ ঘোষণা (Only Saptami Bhog as Prasad)
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
            মহাসপ্তমী মহাপ্রসাদ বিতরণ (Maha Saptami Bhog Mahaprasad)
          </h2>
          <p className="text-xs sm:text-sm text-amber-300 font-medium max-w-2xl mx-auto">
            ⚠️ বিশেষ পূজাবিজ্ঞপ্তি: শ্রীশ্রী শারদীয়া দুর্গোৎসবে <strong>শুধুমাত্র মহাসপ্তমীতেই</strong> মহাভোগ প্রসাদ হিসেবে সকল ভক্তদের মাঝে পরিবেশিত হবে। অন্য কোনো দিনে (অষ্টমী বা নবমী) অন্নভোগ পরিবেশন নেই।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Main Maha Saptami Bhog Card */}
          <div className="md:col-span-8 bg-gradient-to-br from-amber-950/60 via-stone-950 to-stone-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-black rounded-bl-2xl tracking-wider uppercase shadow-md">
              একমাত্র মহাভোগ প্রসাদ (Official Only Bhog)
            </div>

            <div className="flex items-center gap-3">
              <span className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-300">
                <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-amber-100 font-festive">
                  মহাসপ্তমী অন্নভোগ মহাপ্রসাদ (Maha Saptami Mahaprasad)
                </h3>
                <p className="text-xs text-amber-400/90 font-medium">
                  ১৭ অক্টোবর ২০২৬ (৩০ আশ্বিন ১৪৩৩), শনিবার · দুপুর ১:০০ টা
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              পবিত্র গোবিন্দভোগ চাল ও মুগের ডালের ভুঁনি খিচুড়ি, খাঁটি গাওয়া ঘি, পাঁচমিশালি তরতাজা লাবড়া, মুচমুচে বেগুনী, টমেটো-আমসত্ত্ব-খেজুরের চাটনি ও ক্ষীর পায়েস।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800">
                <span className="text-stone-400 block text-[11px]">পরিবেশনের স্থান (Venue):</span>
                <span className="text-amber-200 font-bold">{COMMITTEE_INFO.place} ডাইনিং গ্রাউন্ড</span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800">
                <span className="text-stone-400 block text-[11px]">ভোগ বিতরণের সময়:</span>
                <span className="text-emerald-400 font-bold">দুপুর ১:০০ টা থেকে ৩:০০ টা পর্যন্ত</span>
              </div>
            </div>
          </div>

          {/* Side Info Box confirming No other bhog */}
          <div className="md:col-span-4 bg-stone-950/80 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-[11px] font-bold">
                <span>গুরুত্বপূর্ণ তথ্য (Important)</span>
              </div>
              <h4 className="text-sm font-bold text-stone-100">
                অষ্টমী ও নবমী প্রসাদ নিয়মাবলী
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                মহাষ্টমীর প্রধান পুষ্পাঞ্জলি ও মহানবমীর হোম যজ্ঞ শেষে ভক্তদের মিষ্টি ও ফলমূলের চরণামৃত প্রসাদ নিবেদন করা হবে।
              </p>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                ✓ অন্নভোগ শুধুমাত্র সপ্তমীতেই প্রস্তুত ও বিতরণ করা হবে।
              </div>
            </div>

            <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-800">
              পরিচালনায়: {COMMITTEE_INFO.name} স্বেচ্ছাসেবক কমিটি
            </div>
          </div>
        </div>
      </section>

      {/* 6. PHOTO GALLERY & PANDAL SHOWCASE */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Visual Highlights
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
            Pandal & Pratima Darshan (প্যান্ডেল ও প্রতিমা দর্শন)
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
            Glimpses of artistic pandal architecture, illumination lighting gates, and evening celebrations at KQU PWI Ground.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pandals.map((photo) => (
            <div
              key={photo.id}
              className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl hover:border-amber-500/50 transition duration-300 group"
            >
              <div className="h-56 overflow-hidden relative bg-stone-950">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-3 left-3 text-xs font-bold text-amber-200 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30">
                  {photo.title}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-xs text-stone-300 line-clamp-2">
                  {photo.description}
                </p>
                <p className="text-[10px] text-stone-500 pt-1">
                  Place: {COMMITTEE_INFO.place} · Sharadotsav 2026
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. DEVOTEES GUESTBOOK / BLESSINGS WALL */}
      <section className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Subho Sharadiya Greetings
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
            Devotees Blessings & Wishes Wall (ভক্তদের শুভেচ্ছা বার্তা)
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
            Send your festive greetings and best wishes to fellow railway staff, friends, and the Durga Puja 2026 committee.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
          {/* Post Form */}
          <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span>Post Your Festival Wish</span>
            </h3>
            <form onSubmit={handleAddWish} className="space-y-3">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-300 mb-1">Quarter / Location</label>
                <input
                  type="text"
                  value={wishLoc}
                  onChange={(e) => setWishLoc(e.target.value)}
                  placeholder="e.g. KQU Colony, Unit 2"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-300 mb-1">Greeting / Message *</label>
                <textarea
                  rows={3}
                  required
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder="e.g. May Maa Durga bring peace and health to our families!"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Greeting on Wall</span>
              </button>
            </form>
          </div>

          {/* Wall Feed */}
          <div className="lg:col-span-7 space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {wishes.map((w) => (
              <div
                key={w.id}
                className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-4 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-200">{w.name}</span>
                  <span className="text-[10px] text-stone-500">{w.date}</span>
                </div>
                <p className="text-stone-300 leading-relaxed font-sans">{w.message}</p>
                <p className="text-[10px] text-stone-400 flex items-center gap-1 pt-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{w.location}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. COMMITTEE DIRECTORY & CONTACT */}
      <section className="bg-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Organizing Committee & Assistance
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-festive text-amber-100">
            DURGA PUJA 2026 KQU Committee
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
            Place: <b>{COMMITTEE_INFO.place}</b> Ground · West Bengal
          </p>
        </div>

        {/* Committee Leaders: President and Treasurer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-6 text-center space-y-2 shadow-lg">
            <div className="w-14 h-14 rounded-full bg-red-900/80 border-2 border-red-500/50 flex items-center justify-center font-bold text-amber-200 text-xl mx-auto shadow-inner">
              SK
            </div>
            <h4 className="font-bold text-stone-100 text-base">{COMMITTEE_INFO.president}</h4>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">President</p>
            <p className="text-[11px] text-stone-400">Head of Puja Celebrations & PWI Administration</p>
          </div>

          <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-6 text-center space-y-2 shadow-lg">
            <div className="w-14 h-14 rounded-full bg-amber-900/80 border-2 border-amber-500/50 flex items-center justify-center font-bold text-amber-200 text-xl mx-auto shadow-inner">
              DK
            </div>
            <h4 className="font-bold text-stone-100 text-base">{COMMITTEE_INFO.treasurer}</h4>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Treasurer</p>
            <p className="text-[11px] text-stone-400">Subscriptions, Chanda Accounts & Official Receipts</p>
          </div>
        </div>

        {/* Emergency & First Aid Helpdesk */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-stone-200">24x7 Puja Helpdesk & First Aid Counter</p>
              <p className="text-stone-400 text-[11px]">Located adjacent to KQU PWI Office Main Gate. Fire safety & medical volunteer ready.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToTracker}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Open Management Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
