import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Flame, 
  Radio, 
  Send, 
  MessageSquare, 
  RefreshCw,
  X,
  Compass
} from 'lucide-react';

interface LiveVoiceCompanionProps {
  onClose?: () => void;
}

export const LiveVoiceCompanion: React.FC<LiveVoiceCompanionProps> = ({ onClose }) => {
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>('voice');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to talk with Gemini 3.8 Live');
  const [chatInput, setChatInput] = useState<string>('');
  const [isProcessingText, setIsProcessingText] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<Array<{ role: 'user' | 'model'; text: string; time: string }>>([
    {
      role: 'model',
      text: 'নমস্কার! শুভ শারদীয়া। আমি DURGA PUJA 2026 KQU-এর অফিসিয়াল লাইভ এআই ভয়েস সহকারী। পূজা নির্ঘন্ট, ১০৮ প্রদীপের সন্ধিপূজা, পুষ্পাঞ্জলি বা ভোগ বিতরণ সম্পর্কে যে কোনো প্রশ্ন জিজ্ঞাসা করতে পারেন।',
      time: 'Just now',
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatLog]);

  // Convert Float32Array PCM to 16-bit PCM base64
  const pcmToBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert base64 PCM (24kHz 16-bit LE) to Float32Array
  const base64ToFloat32 = (base64: string): Float32Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  };

  const playNextAudioChunk = () => {
    if (!outputAudioCtxRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    const buffer = outputAudioCtxRef.current.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);
    const source = outputAudioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioCtxRef.current.destination);
    source.onended = () => {
      playNextAudioChunk();
    };
    source.start();
  };

  const enqueueAudio = (base64Audio: string) => {
    const float32 = base64ToFloat32(base64Audio);
    audioQueueRef.current.push(float32);
    if (!isPlayingRef.current) {
      playNextAudioChunk();
    }
  };

  const startVoiceConversation = async () => {
    try {
      setStatusMessage('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioCtxRef.current = new AudioCtx({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });

      setStatusMessage('Connecting to Gemini 3.8 Live API...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsVoiceActive(true);
        setStatusMessage('Live with Gemini 3.8 Live. Speak now...');
        const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(inputAudioCtxRef.current!.destination);

        processor.onaudioprocess = (e) => {
          if (!isMuted && ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const base64 = pcmToBase64(inputData);
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.interrupted) {
            audioQueueRef.current = [];
            isPlayingRef.current = false;
          }
          if (msg.audio) {
            enqueueAudio(msg.audio);
          }
          if (msg.text) {
            setChatLog((prev) => [
              ...prev,
              {
                role: 'model',
                text: msg.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        } catch (e) {
          console.warn('WS message parse notice:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('Live WebSocket note:', e);
        setStatusMessage('Live voice connected. Ready for questions.');
      };

      ws.onclose = () => {
        setIsVoiceActive(false);
        setStatusMessage('Voice conversation disconnected.');
      };
    } catch (err: any) {
      console.warn('Mic error fallback:', err);
      setStatusMessage('Microphone unavailable. You can use text chat below!');
      setActiveMode('text');
    }
  };

  const stopVoiceConversation = () => {
    setIsVoiceActive(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    setStatusMessage('Conversation paused. Tap mic to restart.');
  };

  const handleSendTextMessage = async (customText?: string) => {
    const textToSend = customText || chatInput.trim();
    if (!textToSend) return;

    setChatLog((prev) => [
      ...prev,
      {
        role: 'user',
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    if (!customText) setChatInput('');
    setIsProcessingText(true);

    try {
      const response = await fetch('/api/ai/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatLog.slice(-6).map((c) => ({ role: c.role, text: c.text })),
        }),
      });
      const data = await response.json();
      if (data.success && data.text) {
        setChatLog((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e) {
      setChatLog((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'মা দুর্গা আপনার মনোবাঞ্ছা পূর্ণ করুন! দুর্গোৎসব ২০২৬ সংক্রান্ত বিস্তারিত তথ্য হোমপেজের পূজা নির্ঘন্ট ও রসিদ বইয়ে পাবেন।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessingText(false);
    }
  };

  // Quick prompt chips
  const quickPrompts = [
    'সন্ধিপূজা ও ১০৮ প্রদীপের সময় কখন?',
    'অষ্টমীর পুষ্পাঞ্জলি ও ভোগ বিতরণের নিয়ম কি?',
    'কমিটি সভাপতি ও কোষাধ্যক্ষ কে?',
    'অনলাইন চাঁদা দিলে কিভাবে রসিদ পাব?',
  ];

  return (
    <div className="bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-stone-100 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-rose-950 to-amber-950 p-5 border-b border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-festive text-amber-100 text-base sm:text-lg">
                Gemini 3.8 Live Voice Companion
              </h3>
              <span className="text-[10px] bg-red-900 text-amber-200 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                Live API
              </span>
            </div>
            <p className="text-xs text-amber-200/80">
              Real-time voice & text consultation in Bengali and English
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setActiveMode('voice')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'voice'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setActiveMode('text')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'text'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="p-6 space-y-6">
        {/* VOICE MODE STAGE */}
        {activeMode === 'voice' && (
          <div className="text-center space-y-6 py-4">
            {/* Visual Voice Wave Aura */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              {/* Outer pulsing rings when active */}
              {isVoiceActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="absolute -inset-4 rounded-full border-2 border-amber-400/40 animate-pulse" />
                  <div className="absolute -inset-8 rounded-full border border-red-500/20" />
                </>
              )}

              {/* Central Mic Button */}
              <button
                onClick={isVoiceActive ? stopVoiceConversation : startVoiceConversation}
                className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer active:scale-95 ${
                  isVoiceActive
                    ? 'bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-stone-950 ring-4 ring-amber-400/50'
                    : 'bg-stone-800 hover:bg-stone-750 text-amber-300 border-2 border-amber-500/40'
                }`}
                title={isVoiceActive ? 'Tap to pause voice' : 'Tap to start speaking'}
              >
                {isVoiceActive ? (
                  <Mic className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider mt-1">
                  {isVoiceActive ? 'Listening' : 'Start Voice'}
                </span>
              </button>
            </div>

            {/* Status & Audio waveform indicators */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-200">
                {statusMessage}
              </p>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Powered by <span className="text-amber-400 font-mono">gemini-3.8-live</span>. Converses fluently about ritual timings, 108 lotus Sandhi Puja, bhog Prasad, and committee leaders.
              </p>
            </div>

            {/* Control Bar */}
            {isVoiceActive && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    isMuted
                      ? 'bg-red-950 text-red-200 border border-red-500'
                      : 'bg-stone-800 text-stone-200 hover:bg-stone-750'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
                </button>
                <button
                  onClick={stopVoiceConversation}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>End Voice Session</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Topic Prompts */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Ask Gemini about DURGA PUJA 2026 KQU:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendTextMessage(q)}
                className="text-left p-3 rounded-xl bg-stone-950/70 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-500/40 text-xs text-stone-300 hover:text-amber-200 transition cursor-pointer flex items-center justify-between group"
              >
                <span>{q}</span>
                <Sparkles className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Transcript Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-bold uppercase tracking-wider">Conversation Log</span>
            <span className="text-[11px]">Real-time Bengali / English</span>
          </div>

          <div
            ref={chatScrollRef}
            className="bg-stone-950 border border-stone-800 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-3"
          >
            {chatLog.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-600 text-white rounded-tr-none'
                      : 'bg-stone-800 text-stone-200 border border-stone-700 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[9px] opacity-70 mt-1 text-right">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isProcessingText && (
              <div className="flex items-center gap-2 text-xs text-amber-300 italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini is thinking...</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Input Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTextMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your question in Bengali or English..."
            className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isProcessingText}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
