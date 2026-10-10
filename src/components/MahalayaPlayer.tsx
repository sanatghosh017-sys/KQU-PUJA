import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Plus, 
  Music, 
  ListMusic, 
  X, 
  Upload, 
  Flame, 
  Sparkles, 
  Trash2,
  Lock,
  ShieldCheck,
  FolderPlus,
  Volume2
} from 'lucide-react';
import { mahalayaPlayer } from '../utils/mahalayaAudio';
import { SongTrack, Language, AuthSession } from '../types';
import { getTranslation } from '../utils/i18n';

interface MahalayaPlayerProps {
  lang: Language;
  authSession?: AuthSession | null;
  onOpenAuth?: () => void;
}

export const MahalayaPlayer: React.FC<MahalayaPlayerProps> = ({ 
  lang, 
  authSession,
  onOpenAuth 
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<SongTrack | null>(null);
  const [tracks, setTracks] = useState<SongTrack[]>([]);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [permissionAlert, setPermissionAlert] = useState<string | null>(null);

  // Add song form state (Only for Admin)
  const [songTitle, setSongTitle] = useState<string>('');
  const [songArtist, setSongArtist] = useState<string>('');
  const [songUrl, setSongUrl] = useState<string>('');
  const [fileSuccessNotice, setFileSuccessNotice] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = authSession?.role === 'admin';

  useEffect(() => {
    setTracks(mahalayaPlayer.getTracks());
    const unsub = mahalayaPlayer.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTrack(state.currentTrack);
      setTracks(mahalayaPlayer.getTracks());
    });
    return () => unsub();
  }, []);

  const handleTogglePlay = () => {
    if (tracks.length === 0) {
      if (isAdmin) {
        setShowAddModal(true);
      } else {
        setPermissionAlert('গ্যালারি থেকে কোনো গান এখনো যুক্ত করা হয়নি। শুধুমাত্র অ্যাডমিন গান যোগ করতে পারেন।');
      }
      return;
    }
    mahalayaPlayer.togglePlay();
  };

  const handleNext = () => {
    if (tracks.length > 0) mahalayaPlayer.nextTrack();
  };

  const handlePrev = () => {
    if (tracks.length > 0) mahalayaPlayer.prevTrack();
  };

  const handleSelectTrack = (track: SongTrack) => {
    mahalayaPlayer.setTrack(track);
    setShowPlaylist(false);
  };

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      setPermissionAlert('⚠️ গান শুধুমাত্র অ্যাডমিন (KQU2026) যুক্ত করতে পারেন। দয়া করে অ্যাডমিন অ্যাকাউন্টে লগইন করুন।');
      return;
    }
    setShowAddModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!songTitle) {
      setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSongUrl(event.target.result as string);
        setFileSuccessNotice(`গ্যালারি/অডিও ফাইল প্রস্তুত: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setPermissionAlert('শুধুমাত্র অ্যাডমিন নতুন গান সেভ করতে পারবেন।');
      return;
    }
    if (!songTitle.trim()) return;
    if (!songUrl.trim()) {
      setPermissionAlert('দয়া করে আপনার গ্যালারি/ডিভাইস থেকে অডিও ফাইল বেছে নিন।');
      return;
    }

    const newTrack = mahalayaPlayer.addCustomSong({
      title: songTitle.trim(),
      artist: songArtist.trim() || 'Devotional Music',
      url: songUrl.trim(),
      addedBy: authSession?.name || 'Admin',
    });

    setTracks(mahalayaPlayer.getTracks());
    mahalayaPlayer.setTrack(newTrack);
    mahalayaPlayer.play();

    // Reset and close
    setSongTitle('');
    setSongArtist('');
    setSongUrl('');
    setFileSuccessNotice('');
    setShowAddModal(false);
  };

  const handleDeleteSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      setPermissionAlert('গান ডিলিট করার অনুমতি শুধুমাত্র অ্যাডমিনের রয়েছে।');
      return;
    }
    mahalayaPlayer.deleteCustomSong(id);
    setTracks(mahalayaPlayer.getTracks());
  };

  return (
    <>
      {/* Floating Audio Bar at bottom right */}
      <aside 
        aria-label="Mahalaya Devotional Music Player"
        className="fixed bottom-20 md:bottom-16 right-3 sm:right-6 z-40 max-w-sm w-[92vw] sm:w-auto"
      >
        <div className="bg-gradient-to-r from-red-950/95 via-stone-900/95 to-amber-950/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-white flex items-center gap-2.5 sm:gap-3 transition-all hover:border-amber-400">
          
          {/* Animated Golden Disc / Diya Icon */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-stone-950 shrink-0 shadow-md cursor-pointer group"
            title="গ্যালারি গানের প্লেলিস্ট দেখুন"
          >
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-stone-950 rounded-full animate-[bounce_0.8s_infinite] h-3"></span>
                <span className="w-1 bg-stone-950 rounded-full animate-[bounce_0.6s_infinite] h-4"></span>
                <span className="w-1 bg-stone-950 rounded-full animate-[bounce_1s_infinite] h-2"></span>
              </div>
            ) : (
              <Flame className="w-5 h-5 text-stone-950" />
            )}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {lang === 'bn' ? 'গ্যালারি অডিও প্লেয়ার' : 'Gallery Music Player'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-xs font-bold text-amber-100 truncate mt-0.5">
              {currentTrack ? currentTrack.title : (tracks.length === 0 ? 'গ্যালারি থেকে কোনো গান যুক্ত নেই' : 'গান নির্বাচন করুন')}
            </p>
            <p className="text-[10px] text-stone-400 truncate">
              {currentTrack ? currentTrack.artist : (tracks.length === 0 ? 'অ্যাডমিন গ্যালারি থেকে গান যোগ করবেন' : `${tracks.length} টি গান সংগৃহীত`)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrev}
              disabled={tracks.length === 0}
              className="p-1 rounded-lg text-stone-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-500 text-stone-950 hover:bg-amber-400' 
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={handleNext}
              disabled={tracks.length === 0}
              className="p-1 rounded-lg text-stone-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Add Song Button (Admin Only or prompts admin login) */}
            <button
              onClick={handleOpenAddModal}
              className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition cursor-pointer border border-amber-400/40 ml-0.5"
              title="গ্যালারি থেকে গান যোগ করুন (অ্যাডমিন)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Permission Alert Toast */}
      {permissionAlert && (
        <div className="fixed bottom-36 right-3 sm:right-6 z-50 bg-stone-950/95 border border-amber-500/60 rounded-2xl p-3.5 text-xs text-amber-200 shadow-2xl max-w-sm animate-in fade-in flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-white">অনুমতি তথ্য</p>
            <p className="mt-0.5 text-amber-300/90 leading-relaxed">{permissionAlert}</p>
            {!isAdmin && onOpenAuth && (
              <button
                onClick={() => {
                  setPermissionAlert(null);
                  onOpenAuth();
                }}
                className="mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer"
              >
                অ্যাডমিন লগইন করুন
              </button>
            )}
          </div>
          <button 
            onClick={() => setPermissionAlert(null)}
            className="text-stone-400 hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Playlist Drawer Modal */}
      {showPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-4 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <ListMusic className="w-4 h-4 text-amber-400" />
                <span>{lang === 'bn' ? 'গ্যালারি থেকে যোগ করা গানের তালিকা' : 'Gallery Playlist'}</span>
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-1.5 max-h-64 overflow-y-auto">
              {tracks.length === 0 ? (
                <div className="text-center py-8 text-stone-400 space-y-2">
                  <Music className="w-8 h-8 mx-auto text-stone-600" />
                  <p className="text-xs">গ্যালারি থেকে কোনো গান এখনো যোগ করা হয়নি।</p>
                  <p className="text-[11px] text-amber-400/80">
                    পূর্ববর্তী সমস্ত গান বাদ দেওয়া হয়েছে। শুধুমাত্র অ্যাডমিন ডিভাইস গ্যালারি থেকে গান যুক্ত করতে পারবেন।
                  </p>
                </div>
              ) : (
                tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      currentTrack?.id === track.id
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                        : 'hover:bg-stone-800 text-stone-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold truncate">{track.title}</p>
                      <p className="text-[10px] text-stone-400 truncate">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {currentTrack?.id === track.id && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                          Playing
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteSong(track.id, e)}
                          className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                          title="গান মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              {isAdmin ? (
                <button
                  onClick={() => {
                    setShowPlaylist(false);
                    setShowAddModal(true);
                  }}
                  className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>গ্যালারি থেকে নতুন গান যোগ করুন</span>
                </button>
              ) : (
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>গান যোগ: কেবল অ্যাডমিনের জন্য</span>
                </span>
              )}
              <button
                onClick={() => setShowPlaylist(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Song from Gallery Modal (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-amber-300 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/40">
                <Music className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-100 flex items-center gap-1.5">
                  <span>গ্যালারি থেকে গান যোগ করুন</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Admin
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  ডিভাইস / ফাইল গ্যালারি থেকে অডিও যোগ করুন
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-bold uppercase tracking-wider text-[11px] mb-1">
                  গানের নাম / Title *
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="যেমন: আগমনী গান, মহালয়া বিশেষ গান..."
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase tracking-wider text-[11px] mb-1">
                  শিল্পী / Artist
                </label>
                <input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="শিল্পী বা ব্যান্ডের নাম..."
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              {/* Upload directly from device gallery */}
              <div className="p-4 bg-stone-800/80 rounded-2xl border-2 border-dashed border-amber-500/40 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 font-bold flex items-center justify-center gap-2 mx-auto cursor-pointer transition text-xs shadow-md"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>গ্যালারি / ডিভাইস থেকে অডিও বাছুন</span>
                </button>
                {fileSuccessNotice ? (
                  <p className="text-[11px] text-emerald-400 mt-2 font-semibold">
                    ✓ {fileSuccessNotice}
                  </p>
                ) : (
                  <p className="text-[10px] text-stone-400 mt-2">
                    MP3, WAV, AAC, M4A ফাইল সাপোর্ট করে (সরাসরি গ্যালারি থেকে)
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold transition shadow-md shadow-red-600/30 cursor-pointer"
                >
                  গ্যালারি গান প্লেলিস্টে যুক্ত করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
