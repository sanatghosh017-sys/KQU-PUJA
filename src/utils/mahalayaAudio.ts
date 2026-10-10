/**
 * Mahalaya & Festival Audio Engine
 * All hardcoded default songs removed per user request:
 * "All songs deleted only songs added from gallary"
 * Songs are added strictly from user device/gallery/audio storage by Admin.
 */

import { SongTrack } from '../types';

export const DEFAULT_TRACKS: SongTrack[] = [];

class MahalayaDevotionalPlayer {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private currentTrack: SongTrack | null = null;
  private synthInterval: any = null;
  private listeners: Set<(state: { isPlaying: boolean; currentTrack: SongTrack | null }) => void> = new Set();
  private volume: number = 0.8;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.volume = this.volume;
      this.audioElement.addEventListener('ended', () => {
        this.nextTrack();
      });
      this.audioElement.addEventListener('error', (e) => {
        console.warn('Audio element notice:', e);
      });
    }
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public subscribe(cb: (state: { isPlaying: boolean; currentTrack: SongTrack | null }) => void) {
    this.listeners.add(cb);
    const tracks = this.getTracks();
    if (!this.currentTrack && tracks.length > 0) {
      this.currentTrack = tracks[0];
    }
    cb({ isPlaying: this.isPlaying, currentTrack: this.currentTrack });
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      cb({ isPlaying: this.isPlaying, currentTrack: this.currentTrack });
    });
  }

  public getTracks(): SongTrack[] {
    try {
      const saved = JSON.parse(localStorage.getItem('dp_gallery_songs') || '[]');
      if (Array.isArray(saved)) return saved;
      return [];
    } catch {
      return [];
    }
  }

  public addCustomSong(song: { title: string; artist: string; url: string; addedBy?: string }): SongTrack {
    const newTrack: SongTrack = {
      id: `gallery-song-${Date.now()}`,
      title: song.title.trim(),
      artist: song.artist.trim() || 'Festive Devotional',
      category: 'custom',
      url: song.url,
      isCustom: true,
      addedAt: new Date().toISOString(),
    };

    try {
      const current = this.getTracks();
      const updated = [newTrack, ...current];
      localStorage.setItem('dp_gallery_songs', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save gallery song:', e);
    }

    this.currentTrack = newTrack;
    this.notify();
    return newTrack;
  }

  public deleteCustomSong(id: string) {
    try {
      const current = this.getTracks();
      const filtered = current.filter((s: SongTrack) => s.id !== id);
      localStorage.setItem('dp_gallery_songs', JSON.stringify(filtered));
      if (this.currentTrack?.id === id) {
        this.currentTrack = filtered.length > 0 ? filtered[0] : null;
        if (!this.currentTrack) {
          this.pause();
        }
      }
    } catch {}
    this.notify();
  }

  public play() {
    this.initAudioContext();
    const tracks = this.getTracks();
    if (tracks.length === 0) {
      this.isPlaying = false;
      this.notify();
      return;
    }

    if (!this.currentTrack) {
      this.currentTrack = tracks[0];
    }

    this.isPlaying = true;

    if (this.currentTrack?.url && this.audioElement) {
      if (this.audioElement.src !== this.currentTrack.url) {
        this.audioElement.src = this.currentTrack.url;
      }
      this.audioElement
        .play()
        .then(() => {
          this.stopSynth();
        })
        .catch(() => {
          this.playFestiveBells();
        });
    } else {
      this.playFestiveBells();
    }

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSynth();
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setTrack(track: SongTrack) {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentTrack = track;
    if (this.audioElement && track.url) {
      this.audioElement.src = track.url;
    }
    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public nextTrack() {
    const all = this.getTracks();
    if (all.length === 0) return;
    const idx = all.findIndex((t) => t.id === this.currentTrack?.id);
    const nextIdx = (idx + 1) % all.length;
    this.setTrack(all[nextIdx]);
  }

  public prevTrack() {
    const all = this.getTracks();
    if (all.length === 0) return;
    const idx = all.findIndex((t) => t.id === this.currentTrack?.id);
    const prevIdx = (idx - 1 + all.length) % all.length;
    this.setTrack(all[prevIdx]);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  private playFestiveBells() {
    this.stopSynth();
    if (!this.audioCtx) return;

    const playBell = () => {
      if (!this.audioCtx || !this.isPlaying) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 + Math.random() * 40, now);
      gain.gain.setValueAtTime(0.04 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 2.6);
    };

    playBell();
    this.synthInterval = setInterval(playBell, 4500);
  }

  private stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

export const mahalayaPlayer = new MahalayaDevotionalPlayer();
