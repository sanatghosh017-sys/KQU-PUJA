import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  Download, 
  Plus, 
  Sparkles, 
  Check, 
  X,
  Calendar,
  Users,
  HardHat,
  Sparkle
} from 'lucide-react';
import { AuthSession } from '../types';

export interface PandalPhoto {
  id: string;
  title: string;
  description: string;
  url: string;
  uploadedAt: string;
  unit?: string;
  uploadedBy?: string;
}

interface PandalsGalleryProps {
  pandals: PandalPhoto[];
  onAddPandal: (pandal: { title: string; description: string; url: string; unit: string; uploadedBy?: string }) => void;
  onDeletePandal: (id: string) => void;
  isUnlocked: boolean;
  onOpenAIStudio: () => void;
  authSession?: AuthSession | null;
  onOpenLiveCamera?: () => void;
}

export const PandalsGallery: React.FC<PandalsGalleryProps> = ({
  pandals,
  onAddPandal,
  onDeletePandal,
  isUnlocked,
  onOpenAIStudio,
  authSession,
  onOpenLiveCamera,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<PandalPhoto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('General');
  const [staffName, setStaffName] = useState(authSession?.name || '');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('ছবি ২৫MB এর কম হওয়া প্রয়োজন');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      setImageUrl(res);
      setUploadError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError('দয়া করে গ্যালারি থেকে প্যান্ডেল বা প্রতিমার ছবি নির্বাচন করুন');
      return;
    }
    if (!title.trim()) {
      setUploadError('দয়া করে ছবির শিরোনাম দিন');
      return;
    }
    onAddPandal({
      title: title.trim(),
      description: description.trim(),
      url: imageUrl,
      unit,
      uploadedBy: staffName.trim() || authSession?.name || 'KQU Staff Member',
    });
    setTitle('');
    setDescription('');
    setImageUrl('');
    setModalOpen(false);
  };

  const handleDownload = (photo: PandalPhoto) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.title.replace(/\s+/g, '_')}_KQU.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Professional Festive Animation */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-amber-50 shadow-2xl relative overflow-hidden animate-festive-glow">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-300">
                <Camera className="w-5 h-5 text-amber-400 animate-diya-flicker" />
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold font-festive text-amber-100">
                প্যান্ডেল, প্রতিমা ও আলোকসজ্জা গ্যালারি
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/90 mt-2 max-w-2xl leading-relaxed">
              <strong>যে কোনো কর্মী (Any Staff)</strong> মণ্ডপ নির্মাণ, ডাকের সাজ প্রতিমা, চন্দননগরের আলোকসজ্জা ও ধুনুচি আরতির ফটো আপলোড করে সকলের সাথে শেয়ার করতে পারেন।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (!staffName && authSession?.name) {
                  setStaffName(authSession.name);
                }
                setModalOpen(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black rounded-2xl shadow-xl shadow-amber-600/40 text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 animate-pulse"
            >
              <Plus className="w-4 h-4" />
              <span>গ্যালারি থেকে ছবি যোগ করুন (Add Pic)</span>
            </button>
            {onOpenLiveCamera && (
              <button
                onClick={onOpenLiveCamera}
                className="px-4 py-3 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg shadow-red-900/40 active:scale-95"
              >
                <Camera className="w-4 h-4 text-white animate-pulse" />
                <span>🎥 লাইভ ক্যামেরা (WhatsApp Live)</span>
              </button>
            )}
            <button
              onClick={onOpenAIStudio}
              className="px-4 py-3 bg-stone-900/80 hover:bg-stone-900 text-white border border-amber-500/40 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI মণ্ডপ জেনারেটর</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pandals Grid */}
      {pandals.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center text-stone-500 space-y-3">
          <Camera className="w-12 h-12 mx-auto text-amber-500/60 animate-bounce" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">এখনো কোনো ছবি যোগ করা হয়নি</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            যেকোনো স্টাফ সদস্য মণ্ডপ, প্রতিমা বা উৎসবের ছবি ক্যামেরা বা ডিভাইস গ্যালারি থেকে আপলোড করতে পারেন।
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            প্রথম ছবি যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pandals.map((pandal) => (
            <div
              key={pandal.id}
              className="group bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-2xl hover:border-amber-500/60 transition-all flex flex-col justify-between"
            >
              {/* Image Box */}
              <div className="relative aspect-video overflow-hidden bg-stone-950">
                <img
                  src={pandal.url}
                  alt={pandal.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <button
                  onClick={() => setPreviewImage(pandal)}
                  className="absolute bottom-3 right-3 p-2 bg-stone-900/90 text-white rounded-xl shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold"
                  title="বড় করে দেখুন"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold bg-amber-500/90 text-stone-950 px-2.5 py-0.5 rounded-full shadow-sm">
                    {pandal.unit || 'General'}
                  </span>
                </div>
              </div>

              {/* Description & Staff Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 font-festive line-clamp-1">
                    {pandal.title}
                  </h3>
                  {pandal.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                      {pandal.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      <Users className="w-3 h-3 text-amber-500" />
                      <span>{pandal.uploadedBy || 'কে.কিউ.ইউ স্টাফ'}</span>
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(pandal.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(pandal)}
                      className="p-2 rounded-xl text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                      title="ডাউনলোড"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {isUnlocked && (
                      <button
                        onClick={() => onDeletePandal(pandal.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (Allowed by Any Staff Member) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-600/30 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 px-5 py-4 border-b border-amber-500/30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-amber-100 text-sm sm:text-base">
                  প্যান্ডেল / প্রতিমার ছবি যুক্ত করুন (Any Staff)
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs sm:text-sm">
              {uploadError && (
                <p className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs">
                  {uploadError}
                </p>
              )}

              {/* Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  গ্যালারি থেকে ছবি নির্বাচন *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="relative group max-h-48 overflow-hidden rounded-2xl border border-stone-300 dark:border-stone-700">
                    <img src={imageUrl} alt="Pandal Preview" className="w-full max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 bg-stone-900/80 text-white text-xs px-3 py-1 rounded-lg shadow cursor-pointer font-bold"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/50 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition bg-amber-50/20 dark:bg-stone-800/50"
                  >
                    <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="font-bold text-stone-800 dark:text-stone-200">
                      গ্যালারি বা ক্যামেরা থেকে ছবি বেছে নিন
                    </p>
                    <p className="text-stone-400 text-xs mt-0.5">JPG, PNG, WebP (যে কোনো স্টাফ আপলোড করতে পারবেন)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  ছবির শিরোনাম / Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: প্রধান প্রবেশদ্বার মণ্ডপ, ডাকের সাজ প্রতিমা..."
                  className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    ক্যাটাগরি / বিভাগ
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="General">প্রধান মণ্ডপ (Main Pandal)</option>
                    <option value="Idol">মা দুর্গা প্রতিমা (Idol)</option>
                    <option value="Lighting">আলোকসজ্জা (Lighting)</option>
                    <option value="Aarti">ধুনুচি আরতি (Aarti)</option>
                    <option value="Bhog">ভোগ বিতরণ (Bhog)</option>
                    <option value="Unit 1">Unit 1 Staff</option>
                    <option value="Unit 2">Unit 2 Staff</option>
                    <option value="Unit 3">Unit 3 Staff</option>
                    <option value="Unit 4">Unit 4 Staff</option>
                    <option value="Unit 5">Unit 5 Staff</option>
                    <option value="Unit 6">Unit 6 Staff</option>
                    <option value="Unit 7">Unit 7 Staff</option>
                    <option value="MISC">MISC Unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    আপলোডকারী কর্মীর নাম
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="আপনার নাম..."
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  বিবরণ / নোট (ঐচ্ছিক)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="মণ্ডপের বিশেষ বৈশিষ্ট্য, কারিগর বা আলোকসজ্জা সম্পর্কে..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>গ্যালারিতে যুক্ত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlarged Image Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="max-w-4xl w-full bg-stone-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-stone-950 flex items-center justify-between border-b border-stone-800">
              <span className="font-bold text-amber-200 text-sm truncate">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[70vh] object-contain rounded-xl" />
            </div>
            <div className="p-4 bg-stone-950 text-xs text-stone-300 flex items-center justify-between">
              <span>{previewImage.description || 'DURGA PUJA 2026 KQU'}</span>
              <button
                onClick={() => handleDownload(previewImage)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
