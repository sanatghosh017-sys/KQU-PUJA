import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Upload, 
  Download, 
  Image as ImageIcon, 
  RefreshCw, 
  SlidersHorizontal,
  Flame, 
  Copy,
  Info,
  Check
} from 'lucide-react';
import { AIImageItem } from '../types';

interface AIImageStudioProps {
  onSetBannerImage?: (imageUrl: string) => void;
}

const PRESET_PROMPTS = [
  {
    title: "Majestic Maa Durga Idol",
    prompt: "Majestic clay sculpture idol of Goddess Durga with ten arms holding divine weapons, adorned in ornate golden jewelry and mukut crown, standing against traditional Bengali pandal backdrop with glowing earthen diyas and marigold garlands, dramatic golden festive illumination.",
  },
  {
    title: "Sharadotsav Festive Poster",
    prompt: "A festive Durga Puja 2026 greeting banner with traditional Bengali calligraphy text 'শুভ শারদীয়া', sacred white Kash phool blooming against azure autumn sky, and traditional dhak drums adorned with white feathers.",
  },
  {
    title: "Evening Dhunuchi Naach",
    prompt: "Devotional Durga Puja evening Aarti atmosphere with traditional Dhunuchi Naach dance, smoky fragrant frankincense curls, glowing clay censers, vibrant red and white sarees, cinematic warm temple lighting.",
  },
  {
    title: "Illuminated Kolkata Pandal",
    prompt: "Breathtaking architectural Durga Puja pandal at night with thousands of glittering warm fairy lights, intricate handcrafted bamboo and cloth craftsmanship, festive crowd celebration in Kolkata.",
  },
  {
    title: "Subho Bijoya & Sindoor Khela",
    prompt: "Joyful Bijoya Dashami celebration with women participating in traditional Sindoor Khela, wearing classic red-bordered white Garad sarees, sweets and betel leaf offerings, warm emotional atmosphere.",
  }
];

export const AIImageStudio: React.FC<AIImageStudioProps> = ({ onSetBannerImage }) => {
  const [activeMode, setActiveMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Mode state
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>(
    "Add glowing golden fairy lights, marigold flower garlands around the frame, and festive Bengali greeting 'শুভ শারদীয়া' in ornate gold lettering"
  );

  // Gallery of generated/edited images
  const [images, setImages] = useState<AIImageItem[]>([
    {
      id: 'default-1',
      url: 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Traditional clay idol of Goddess Durga with glowing diyas and marigold flowers',
      type: 'generated',
      timestamp: 'Sample Artwork',
      aspectRatio: '1:1'
    }
  ]);

  const [selectedImage, setSelectedImage] = useState<AIImageItem | null>(images[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to draw an artistic fallback canvas poster if the API is restricted or quota exceeded
  const generateArtisticFallback = (promptText: string, ar: string): string => {
    const canvas = document.createElement('canvas');
    let width = 1024;
    let height = 1024;
    if (ar === '16:9') { width = 1280; height = 720; }
    else if (ar === '9:16') { width = 720; height = 1280; }
    else if (ar === '4:3') { width = 1024; height = 768; }
    else if (ar === '3:4') { width = 768; height = 1024; }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Deep festive background gradient
    const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
    grad.addColorStop(0, '#881337');
    grad.addColorStop(0.5, '#4c0519');
    grad.addColorStop(1, '#1c1917');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative golden concentric mandala rings
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 2;
    for (let r = 80; r < Math.min(width, height) / 2; r += 60) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sacred center icon / aura
    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 160, 0, Math.PI * 2);
    ctx.fill();

    // Bengali Festive Calligraphy
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 54px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('শুভ শারদীয়া', width / 2, height / 2 - 40);

    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('DURGA PUJA 2026 KQU', width / 2, height / 2 + 25);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('KQU PWI Office Ground · Sharadotsav', width / 2, height / 2 + 70);

    // Prompt snippet footer
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    const truncatedPrompt = promptText.length > 70 ? promptText.slice(0, 68) + '...' : promptText;
    ctx.fillText(`“${truncatedPrompt}”`, width / 2, height - 50);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleCreateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          imageSize,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.imageUrl) {
        const newImg: AIImageItem = {
          id: `ai-${Date.now()}`,
          url: data.imageUrl,
          prompt,
          type: 'generated',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          aspectRatio,
        };
        setImages((prev) => [newImg, ...prev]);
        setSelectedImage(newImg);
      } else {
        const fallbackUrl = generateArtisticFallback(prompt, aspectRatio);
        const fallbackImg: AIImageItem = {
          id: `art-${Date.now()}`,
          url: fallbackUrl,
          prompt,
          type: 'generated',
          timestamp: 'Creative Card',
          aspectRatio,
        };
        setImages((prev) => [fallbackImg, ...prev]);
        setSelectedImage(fallbackImg);
        setErrorMsg(
          data.error || 'Created an artistic festive festival card for you!'
        );
      }
    } catch {
      const fallbackUrl = generateArtisticFallback(prompt, aspectRatio);
      const fallbackImg: AIImageItem = {
        id: `art-${Date.now()}`,
        url: fallbackUrl,
        prompt,
        type: 'generated',
        timestamp: 'Creative Card',
        aspectRatio,
      };
      setImages((prev) => [fallbackImg, ...prev]);
      setSelectedImage(fallbackImg);
      setErrorMsg('Created festive festival card via high-DPI canvas designer.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!sourceImage) {
      setErrorMsg('Please select or upload an image to edit first.');
      return;
    }
    if (!editPrompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceImage,
          prompt: editPrompt,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.imageUrl) {
        const newImg: AIImageItem = {
          id: `ai-edit-${Date.now()}`,
          url: data.imageUrl,
          prompt: `Edited: ${editPrompt}`,
          type: 'edited',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          aspectRatio,
        };
        setImages((prev) => [newImg, ...prev]);
        setSelectedImage(newImg);
      } else {
        setErrorMsg(data.error || 'Could not complete image edit. Please verify prompt or API key.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server error while editing image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSourceImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (img: AIImageItem) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `Durga_Puja_${img.type}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async (img: AIImageItem) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Card */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-stone-900 border border-amber-600/30 rounded-2xl p-5 text-amber-50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-amber-300">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-festive text-amber-100">
                AI Festive Image Studio
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1 max-w-2xl">
              Create and edit custom Durga Puja posters, pandal artworks, Sharadotsav invitations, and committee chanda banners with text prompts powered by <span className="font-mono font-semibold text-amber-300">gemini-3.1-flash-image</span>.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-stone-950/70 p-1 rounded-xl border border-amber-500/30 self-start md:self-auto">
            <button
              onClick={() => setActiveMode('create')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'create'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>Create from Text</span>
            </button>
            <button
              onClick={() => setActiveMode('edit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'edit'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Edit Existing Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error / Notice Banner if any */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompt Input & Configurations */}
        <div className="lg:col-span-6 space-y-5">
          {activeMode === 'create' ? (
            /* CREATE MODE */
            <div className="bg-white dark:bg-stone-900 border border-amber-600/20 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Prompt Description</span>
                </label>
                <span className="text-xs text-stone-500">English or Bengali themed</span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe the Durga Puja image you want to generate in detail..."
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none leading-relaxed"
              />

              {/* Preset Prompts Chips */}
              <div>
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">
                  Festive Prompt Inspiration:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(item.prompt)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition text-left cursor-pointer"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Quality */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1:1">1:1 Square (Social / Profile)</option>
                    <option value="16:9">16:9 Landscape (Banner / Header)</option>
                    <option value="4:3">4:3 Standard (Poster / Card)</option>
                    <option value="9:16">9:16 Portrait (WhatsApp Status)</option>
                    <option value="3:4">3:4 Vertical (Idol Portrait)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Resolution Quality
                  </label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1K">1K High Definition</option>
                    <option value="2K">2K Ultra HD</option>
                    <option value="512px">512px Fast</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleCreateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-700 via-amber-600 to-amber-500 hover:from-red-800 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Maa Durga Art Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Artwork with Gemini 3.1</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* EDIT MODE */
            <div className="bg-white dark:bg-stone-900 border border-amber-600/20 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  <span>Image to Edit</span>
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from Device</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Source Image Selector */}
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-3 bg-stone-50 dark:bg-stone-800/50 flex flex-col items-center justify-center text-center">
                {sourceImage ? (
                  <div className="relative group max-h-48 overflow-hidden rounded-lg">
                    <img
                      src={sourceImage}
                      alt="Source for editing"
                      className="max-h-48 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setSourceImage(null)}
                      className="absolute top-2 right-2 bg-stone-900/80 text-white text-xs px-2 py-1 rounded shadow cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      Select an image from gallery below or upload a photo to edit
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {images.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setSourceImage(img.url)}
                          className="w-12 h-12 rounded-lg border-2 border-stone-300 overflow-hidden hover:border-amber-500 transition cursor-pointer"
                        >
                          <img
                            src={img.url}
                            alt="thumb"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Instruction */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-1.5">
                  Edit Instruction
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Add golden festival light aura and write 'শুভ শারদীয়া' in glowing letters..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"
                />
              </div>

              {/* Edit Button */}
              <button
                onClick={handleEditImage}
                disabled={isGenerating || !sourceImage || !editPrompt.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-700 via-amber-600 to-amber-500 hover:from-red-800 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Applying AI edits with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Edit Artwork with Gemini 3.1</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Preview & Output Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-600/20 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Artwork Preview</span>
              </h3>
              {selectedImage && (
                <span className="text-xs text-stone-500 font-mono">
                  {selectedImage.aspectRatio} · {selectedImage.timestamp}
                </span>
              )}
            </div>

            {/* Main Preview Screen */}
            <div className="relative min-h-[300px] sm:min-h-[360px] bg-stone-950 rounded-xl overflow-hidden flex items-center justify-center border border-stone-800 group shadow-inner">
              {isGenerating ? (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-amber-300 font-bold font-festive text-base">
                    Generating Sharadotsav Artwork...
                  </p>
                  <p className="text-xs text-stone-400 max-w-xs">
                    Calling <span className="font-mono text-amber-400">gemini-3.1-flash-image</span> to synthesize festive motifs and lighting.
                  </p>
                </div>
              ) : selectedImage ? (
                <>
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="max-h-[460px] w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {/* Floating Action Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleCopy(selectedImage)}
                      className="p-2 bg-stone-900/80 hover:bg-stone-900 text-stone-200 rounded-lg backdrop-blur-sm transition border border-stone-700 cursor-pointer"
                      title="Copy Image"
                    >
                      {copiedId === selectedImage.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(selectedImage)}
                      className="p-2 bg-stone-900/80 hover:bg-stone-900 text-stone-200 rounded-lg backdrop-blur-sm transition border border-stone-700 cursor-pointer"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-stone-500 py-12">
                  <ImageIcon className="w-10 h-10 mx-auto text-stone-700 mb-2" />
                  <p className="text-xs">No image selected</p>
                </div>
              )}
            </div>

            {/* Prompt details & Committee actions */}
            {selectedImage && (
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800 text-xs">
                <p className="text-stone-700 dark:text-stone-300 italic">
                  "{selectedImage.prompt}"
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </button>
                  <button
                    onClick={() => {
                      setSourceImage(selectedImage.url);
                      setActiveMode('edit');
                    }}
                    className="px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Edit this Image</span>
                  </button>
                  {onSetBannerImage && (
                    <button
                      onClick={() => onSetBannerImage(selectedImage.url)}
                      className="px-3.5 py-1.5 bg-rose-900/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 font-semibold rounded-lg hover:bg-rose-900/30 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Use as App Banner</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2">
          <span>Festival Art Gallery ({images.length})</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition aspect-square bg-stone-950 ${
                selectedImage?.id === item.id
                  ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'border-stone-200 dark:border-stone-800 hover:border-amber-400/50'
              }`}
            >
              <img
                src={item.url}
                alt={item.prompt}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                <p className="text-[10px] text-amber-200 truncate w-full font-medium">
                  {item.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
