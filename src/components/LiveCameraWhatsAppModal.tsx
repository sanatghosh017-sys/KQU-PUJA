import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  X,
  RefreshCw,
  Send,
  MessageCircle,
  Phone,
  Sparkles,
  Check,
  AlertCircle,
  Download,
  Flame,
  Radio
} from 'lucide-react';
import { COMMITTEE_INFO } from '../data/pujaData';
import { AuthSession } from '../types';

interface LiveCameraWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: { name: string; phone: string } | null;
  authSession?: AuthSession | null;
}

export const LiveCameraWhatsAppModal: React.FC<LiveCameraWhatsAppModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient,
  authSession,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Form states
  const [senderName, setSenderName] = useState(authSession?.name || '');
  const [selectedRecipientPhone, setSelectedRecipientPhone] = useState(
    defaultRecipient?.phone || '9932401892' // Sanjoy Kumar Das (Secretary)
  );
  const [selectedRecipientName, setSelectedRecipientName] = useState(
    defaultRecipient?.name || 'Sanjoy Kumar Das (Secretary)'
  );
  const [customPhone, setCustomPhone] = useState('');
  const [liveNote, setLiveNote] = useState('প্যান্ডেল ও প্রতিমা দর্শন লাইভ স্ট্রিমিং আপডেট');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Committee preset contacts
  const PRESET_CONTACTS = [
    { name: 'Sanjoy Kumar Das (Secretary)', phone: '9932401892', role: 'সাধারণ সম্পাদক' },
    { name: 'Biswajit Mondal (President)', phone: '9093134605', role: 'পূজা সভাপতি' },
    { name: 'Sanat Kumar Ghosh (Coordinator)', phone: '8100484475', role: 'কমিটি কো-অর্ডিনেটর' },
    { name: 'Dhananjay Kumar (Treasurer)', phone: '9024222693', role: 'কোষাধ্যক্ষ' },
    { name: 'custom', phone: '', role: 'অন্য কোনো মোবাইল নম্বর' },
  ];

  useEffect(() => {
    if (defaultRecipient) {
      setSelectedRecipientName(defaultRecipient.name);
      setSelectedRecipientPhone(defaultRecipient.phone);
    }
  }, [defaultRecipient]);

  // Start Camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        setStream(mediaStream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError('আপনার ব্রাউজার বা ডিভাইসে ক্যামেরা পারমিশন সমর্থিত নয়।');
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('ক্যামেরা চালু করা যায়নি। অনুগ্রহ করে ব্রাউজারে ক্যামেরার অনুমতি (Permission) দিন।');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setCapturedSnapshot(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from stream
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, canvas.height - 45, canvas.width, 45);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`🔴 ${COMMITTEE_INFO.name} - LIVE CAMERA`, 16, canvas.height - 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      const timeStr = new Date().toLocaleTimeString('en-IN');
      ctx.fillText(`${timeStr} · Staff: ${senderName || 'KQU Staff'}`, 16, canvas.height - 8);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedSnapshot(dataUrl);
    }
  };

  const handleDownloadSnapshot = () => {
    if (!capturedSnapshot) return;
    const a = document.createElement('a');
    a.href = capturedSnapshot;
    a.download = `Durga_Puja_KQU_Live_Cam_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // WhatsApp Video Call / Live Broadcast
  const handleLaunchWhatsAppVideo = () => {
    const target = (selectedRecipientPhone === 'custom' ? customPhone : selectedRecipientPhone)
      .replace(/\D/g, '')
      .slice(-10);

    const now = new Date().toLocaleTimeString('bn-IN');
    const msg = `🔴 *DURGA PUJA 2026 KQU - লাইভ ক্যামেরা আপডেট*\n` +
      `📅 সময়: *${now}*\n` +
      `📍 স্থান: *${COMMITTEE_INFO.place}*\n` +
      `👤 প্রেরক কর্মী: *${senderName.trim() || 'KQU Staff Member'}*\n` +
      `📝 আপডেট: *${liveNote}*\n\n` +
      `🎥 মা দুর্গার মণ্ডপ ও প্রতিমার লাইভ ক্যামেরা শেয়ার করছি। লাইভ ভিডিও দেখতে অনুগ্রহ করে কল সংযুক্ত করুন।\n` +
      `👉 উৎসব পোর্টাল: ${COMMITTEE_INFO.websiteUrl}`;

    const url = target.length === 10
      ? `https://api.whatsapp.com/send?phone=91${target}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-lg w-full text-stone-100 shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 p-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-600/30 border border-red-500/50 rounded-xl text-red-400 relative">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-amber-100 font-festive flex items-center gap-1.5">
                <span>লাইভ ক্যামেরা (Live Camera via WhatsApp)</span>
              </h3>
              <p className="text-[11px] text-amber-300/80">
                যেকোনো কর্মী (Any Staff) মণ্ডপ ও প্রতিমার লাইভ শেয়ার করতে পারেন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-4 space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-stone-800 shadow-inner flex items-center justify-center">
            {/* Live stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${capturedSnapshot ? 'hidden' : 'block'}`}
            />

            {/* Frozen captured snapshot */}
            {capturedSnapshot && (
              <img
                src={capturedSnapshot}
                alt="Live Snapshot"
                className="w-full h-full object-cover"
              />
            )}

            {/* Error or Fallback message */}
            {!isCameraActive && !capturedSnapshot && (
              <div className="p-6 text-center space-y-2">
                <Camera className="w-10 h-10 text-stone-600 mx-auto" />
                <p className="text-xs text-stone-400">
                  {cameraError || 'ক্যামেরা চালু হচ্ছে...'}
                </p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            )}

            {/* Live Indicator overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-red-500/40 text-[10px] font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE CAM</span>
            </div>

            {/* Camera Switch button */}
            {isCameraActive && !capturedSnapshot && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/70 text-white border border-stone-700 hover:bg-stone-800 transition cursor-pointer"
                title="ক্যামেরা পরিবর্তন করুন"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Capture controls inside viewfinder bottom */}
            {isCameraActive && (
              <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2">
                {!capturedSnapshot ? (
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-stone-900" />
                    <span>ছবি তুলুন (Snapshot)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCapturedSnapshot(null)}
                      className="px-3 py-1 rounded-full bg-stone-900/90 text-stone-200 border border-stone-700 text-xs font-bold cursor-pointer"
                    >
                      আবার লাইভ করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSnapshot}
                      className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>সেভ করুন</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Form details for sending via WhatsApp */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  আপনার নাম (কর্মী) *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="যেমন: Sanat Ghosh, Alok Pal..."
                  className="w-full p-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  প্রাপক (কাকে পাঠাবেন)
                </label>
                <select
                  value={selectedRecipientPhone}
                  onChange={(e) => setSelectedRecipientPhone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {PRESET_CONTACTS.map((c, i) => (
                    <option key={i} value={c.phone || 'custom'}>
                      {c.name} {c.phone ? `(${c.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRecipientPhone === 'custom' && (
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  কাস্টম হোয়াটসঅ্যাপ নম্বর (১০ সংখ্যা)
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="যেমন: 9831068891"
                  className="w-full p-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                লাইভ স্ট্যাটাস নোট / বিবরণী
              </label>
              <input
                type="text"
                value={liveNote}
                onChange={(e) => setLiveNote(e.target.value)}
                placeholder="যেমন: মহাসপ্তমী সন্ধ্যার আরতি শুরু হলো..."
                className="w-full p-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Big Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleLaunchWhatsAppVideo}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 cursor-pointer active:scale-95 transition"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>হোয়াটসঅ্যাপে লাইভ ক্যামেরা শেয়ার করুন (Send Live)</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchWhatsAppVideo}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Video className="w-4 h-4 text-red-400" />
                <span>ভিডিও কল সরাসরি শুরু করুন (WhatsApp Video Call)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
