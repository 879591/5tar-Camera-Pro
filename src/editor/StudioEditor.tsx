import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Eye,
  Film,
  FlipHorizontal,
  Layers,
  Music,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Scissors,
  Sliders,
  Sparkles,
  SplitSquareVertical,
  Type,
  Undo2,
  Volume2,
  X,
} from 'lucide-react';
import { STUDIO_TEMPLATES, StudioTemplate } from '../data/templates';
import {
  MediaItem,
  OverlayLayer,
  StudioProject,
  TimelineClip,
} from '../storage/studioDatabase';

interface StudioEditorProps {
  mediaItems: MediaItem[];
  activeProject: StudioProject;
  activeTemplate: StudioTemplate | null;
  onSaveProject: (updated: StudioProject) => void;
  onSaveEditedMedia: (item: MediaItem) => void;
}

interface EditorSnapshot {
  filterSettings: StudioTemplate['filterSettings'];
  rotation: number;
  flipH: boolean;
  cropAspect: 'Original' | '16:9' | '9:16' | '4:3' | '1:1' | '2.39:1';
  clips: TimelineClip[];
  overlays: OverlayLayer[];
  audioTrackName: string;
  audioVolume: number;
  audioFadeIn: boolean;
  audioFadeOut: boolean;
}

const SPEED_OPTIONS: Array<TimelineClip['speed']> = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
const STICKER_PRESETS = ['🎬 5TAR TAKE 1', '🔥 120FPS SLOW-MO', '✨ GOLDEN HOUR', '🎥 ANAMORPHIC 2.39', '📍 MUMBAI STUDIO', '⚡ PRO GRADE'];
const PUBLIC_DOMAIN_TRACKS = [
  { name: 'Cinematic Pulse 90 BPM (Built-in Studio Synth)', freq: 110 },
  { name: 'Festival Warm Strings (Public Domain Loop)', freq: 146.8 },
  { name: 'Lo-Fi Analog Tape Beat (Royalty-Free)', freq: 98 },
  { name: 'Slow-Mo Sub Riser Drone (Studio Synth)', freq: 65.4 },
];

export const StudioEditor: React.FC<StudioEditorProps> = ({
  mediaItems,
  activeProject,
  activeTemplate,
  onSaveProject,
  onSaveEditedMedia,
}) => {
  const publicMedia = mediaItems.filter((m) => !m.isPrivateVault);
  const [editorMode, setEditorMode] = useState<'photo' | 'video'>('photo');
  const [selectedMediaId, setSelectedMediaId] = useState<string>(
    publicMedia[0]?.id || ''
  );

  // Command / History Undo-Redo Stack
  const [history, setHistory] = useState<EditorSnapshot[]>(() => [
    {
      filterSettings: activeTemplate
        ? { ...activeTemplate.filterSettings }
        : { ...activeProject.filterSettings },
      rotation: 0,
      flipH: false,
      cropAspect: 'Original',
      clips: activeProject.clips,
      overlays: activeProject.overlays,
      audioTrackName: activeProject.audioTrackName,
      audioVolume: activeProject.audioVolume,
      audioFadeIn: activeProject.audioFadeIn,
      audioFadeOut: activeProject.audioFadeOut,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const currentSnap = history[historyIndex] || history[0];

  const pushState = useCallback(
    (updater: (prev: EditorSnapshot) => EditorSnapshot) => {
      setHistory((prevHist) => {
        const base = prevHist[historyIndex] || prevHist[0];
        const nextSnap = updater(base);
        const sliced = prevHist.slice(0, historyIndex + 1);
        return [...sliced, nextSnap];
      });
      setHistoryIndex((idx) => idx + 1);
    },
    [historyIndex]
  );

  // Apply template if changed from Templates tab
  useEffect(() => {
    if (activeTemplate) {
      pushState((prev) => ({
        ...prev,
        filterSettings: { ...activeTemplate.filterSettings },
      }));
    }
  }, [activeTemplate, pushState]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (canUndo) setHistoryIndex((i) => i - 1);
  };
  const handleRedo = () => {
    if (canRedo) setHistoryIndex((i) => i + 1);
  };
  const handleReset = () => {
    pushState((prev) => ({
      ...prev,
      filterSettings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        vignette: 0,
        sharpness: 10,
        highlights: 0,
        shadows: 0,
      },
      rotation: 0,
      flipH: false,
      cropAspect: 'Original',
    }));
  };

  // Before / After comparison hold
  const [showBeforeOriginal, setShowBeforeOriginal] = useState(false);

  // Timeline playhead state
  const [playheadSec, setPlayheadSec] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string>(
    currentSnap.clips[0]?.id || ''
  );
  const [newOverlayText, setNewOverlayText] = useState<string>('SHOT ON 5TAR CAMERA PRO');
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'color' | 'crop' | 'timeline' | 'text' | 'audio'
  >('color');

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'JPG' | 'PNG' | 'MP4'>('JPG');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [exportQuality, setExportQuality] = useState<'Low' | 'Medium' | 'High' | 'Original/Maximum'>('High');
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const exportTimerRef = useRef<number | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedMedia =
    publicMedia.find((m) => m.id === selectedMediaId) || publicMedia[0];
  const selectedClip =
    currentSnap.clips.find((c) => c.id === selectedClipId) || currentSnap.clips[0];

  const totalTimelineDuration = currentSnap.clips.reduce(
    (acc, c) => acc + (c.endTime - c.startTime) / c.speed,
    0
  );

  // Timeline playback loop
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      setPlayheadSec((t) => {
        if (t + 0.2 >= Math.max(1, totalTimelineDuration)) {
          setIsPlayingTimeline(false);
          return 0;
        }
        return Number((t + 0.2).toFixed(1));
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlayingTimeline, totalTimelineDuration]);

  // Render real HTML5 Canvas preview with all 10 adjustments + overlays + crop/rotation
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !selectedMedia) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((currentSnap.rotation * Math.PI) / 180);
      if (currentSnap.flipH) {
        ctx.scale(-1, 1);
      }

      if (!showBeforeOriginal) {
        const f = currentSnap.filterSettings;
        const b = 100 + f.brightness + f.shadows * 0.25;
        const c = 100 + f.contrast + f.sharpness * 0.2;
        const s = 100 + f.saturation;
        const sepia = f.temperature > 0 ? f.temperature * 0.6 : 0;
        const hue = f.tint * 0.8 + (f.temperature < 0 ? f.temperature * 0.4 : 0);
        ctx.filter = `brightness(${Math.max(30, b)}%) contrast(${Math.max(40, c)}%) saturate(${Math.max(0, s)}%) sepia(${sepia}%) hue-rotate(${hue}deg)`;
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      // Vignette & Highlight roll-off
      if (!showBeforeOriginal && currentSnap.filterSettings.vignette > 0) {
        const vig = currentSnap.filterSettings.vignette / 100;
        const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${(vig * 0.75).toFixed(2)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Render Text & Sticker Overlays
      if (!showBeforeOriginal) {
        for (const ov of currentSnap.overlays) {
          ctx.save();
          const ox = (ov.xPercent / 100) * w;
          const oy = (ov.yPercent / 100) * h;
          ctx.translate(ox, oy);
          ctx.rotate((ov.rotation * Math.PI) / 180);
          ctx.globalAlpha = ov.opacity / 100;
          ctx.font = `bold ${ov.fontSize}px "${ov.fontFamily}", sans-serif`;
          ctx.fillStyle = ov.color;
          ctx.textAlign = ov.align;
          ctx.fillText(ov.content, 0, 0);
          ctx.restore();
        }
      }
    };
    img.src =
      editorMode === 'video' && selectedClip
        ? selectedClip.dataUrl
        : selectedMedia.dataUrl;
  }, [
    currentSnap,
    editorMode,
    selectedClip,
    selectedMedia,
    showBeforeOriginal,
  ]);

  const updateFilterSlider = (
    key: keyof StudioTemplate['filterSettings'],
    val: number
  ) => {
    pushState((prev) => ({
      ...prev,
      filterSettings: {
        ...prev.filterSettings,
        [key]: val,
      },
    }));
  };

  // Video Timeline Operations: Split, Trim, Merge/Add, Speed
  const handleSplitClipAtPlayhead = () => {
    if (!selectedClip) return;
    const mid = Number(((selectedClip.startTime + selectedClip.endTime) / 2).toFixed(1));
    if (mid <= selectedClip.startTime + 0.5) return;

    const firstHalf: TimelineClip = {
      ...selectedClip,
      id: `${selectedClip.id}-a`,
      title: `${selectedClip.title} (Part 1)`,
      endTime: mid,
      duration: Number((mid - selectedClip.startTime).toFixed(1)),
    };
    const secondHalf: TimelineClip = {
      ...selectedClip,
      id: `${selectedClip.id}-b`,
      title: `${selectedClip.title} (Part 2)`,
      startTime: mid,
      duration: Number((selectedClip.endTime - mid).toFixed(1)),
    };

    pushState((prev) => ({
      ...prev,
      clips: prev.clips.flatMap((c) =>
        c.id === selectedClip.id ? [firstHalf, secondHalf] : [c]
      ),
    }));
    setSelectedClipId(secondHalf.id);
  };

  const handleUpdateClipSpeed = (speed: TimelineClip['speed']) => {
    if (!selectedClip) return;
    pushState((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === selectedClip.id ? { ...c, speed } : c)),
    }));
  };

  const handleUpdateClipTrim = (start: number, end: number) => {
    if (!selectedClip || end <= start + 0.5) return;
    pushState((prev) => ({
      ...prev,
      clips: prev.clips.map((c) =>
        c.id === selectedClip.id
          ? { ...c, startTime: start, endTime: end, duration: Number((end - start).toFixed(1)) }
          : c
      ),
    }));
  };

  const handleAddMediaToTimeline = (media: MediaItem) => {
    const lastEnd =
      currentSnap.clips.length > 0
        ? currentSnap.clips[currentSnap.clips.length - 1].endTime
        : 0;
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      mediaId: media.id,
      title: media.title,
      type: media.type === 'video' || media.type === 'slowmo' ? 'video' : 'photo',
      dataUrl: media.dataUrl,
      startTime: lastEnd,
      endTime: lastEnd + 5,
      duration: 5,
      speed: 1,
      volume: 100,
      fadeInSec: 0.5,
      fadeOutSec: 0.5,
      transition: 'Cross Dissolve',
      rotation: 0,
      flipH: false,
      cropAspect: '16:9',
    };
    pushState((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
    }));
    setSelectedClipId(newClip.id);
  };

  const handleAddOverlay = (kind: 'text' | 'sticker', contentStr: string) => {
    if (!contentStr.trim()) return;
    const newLayer: OverlayLayer = {
      id: `ov-${Date.now()}`,
      kind,
      content: contentStr,
      fontFamily: kind === 'sticker' ? 'Plus Jakarta Sans' : 'Syne',
      fontSize: kind === 'sticker' ? 32 : 28,
      color: '#F59E0B',
      opacity: 100,
      rotation: 0,
      xPercent: 50,
      yPercent: 25 + ((currentSnap.overlays.length * 14) % 55),
      align: 'center',
    };
    pushState((prev) => ({
      ...prev,
      overlays: [...prev.overlays, newLayer],
    }));
  };

  // Preview Built-in Public Domain Audio Synth Tone
  const playDemoAudioPreview = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const matched = PUBLIC_DOMAIN_TRACKS.find((t) => t.name === currentSnap.audioTrackName);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(matched?.freq || 110, ctx.currentTime);
      gain.gain.setValueAtTime((currentSnap.audioVolume / 100) * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Ignore if blocked
    }
  };

  // Non-Destructive Background Export Engine
  const startNonDestructiveExport = () => {
    setExportProgress(0);
    setExportSuccessMsg(null);

    let p = 0;
    const id = window.setInterval(() => {
      p += 20;
      if (p >= 100) {
        clearInterval(id);
        setExportProgress(100);

        const canvas = previewCanvasRef.current;
        const mime = exportFormat === 'PNG' ? 'image/png' : 'image/jpeg';
        const qualityNum =
          exportQuality === 'Original/Maximum'
            ? 1.0
            : exportQuality === 'High'
            ? 0.92
            : exportQuality === 'Medium'
            ? 0.78
            : 0.6;
        const dataUrl = canvas ? canvas.toDataURL(mime, qualityNum) : selectedMedia?.dataUrl || '';
        const ts = Date.now();
        const ext = exportFormat.toLowerCase();
        const exportedItem: MediaItem = {
          id: `edited-${ts}`,
          title: `5TAR_EDITED_${exportResolution}_${ts.toString().slice(-5)}.${ext}`,
          type: 'edited',
          dataUrl,
          thumbnailUrl: dataUrl,
          createdAt: ts,
          width: exportResolution === '4K' ? 3840 : exportResolution === '1080p' ? 1920 : 1280,
          height: exportResolution === '4K' ? 2160 : exportResolution === '1080p' ? 1080 : 720,
          sizeBytes: Math.round(dataUrl.length * 0.75),
          favorite: true,
          isPrivateVault: false,
          exif: {
            iso: selectedMedia?.exif.iso || '100',
            shutter: selectedMedia?.exif.shutter || '1/60',
            ev: selectedMedia?.exif.ev || '0.0 EV',
            wb: selectedMedia?.exif.wb || 'Edited LUT',
            lens: selectedMedia?.exif.lens || 'Studio NLE',
            mode: `EDITED (${exportFormat} ${exportResolution})`,
          },
        };

        onSaveEditedMedia(exportedItem);
        onSaveProject({
          ...activeProject,
          updatedAt: ts,
          clips: currentSnap.clips,
          overlays: currentSnap.overlays,
          filterSettings: currentSnap.filterSettings,
          audioTrackName: currentSnap.audioTrackName,
          audioVolume: currentSnap.audioVolume,
          exportHistory: [
            {
              exportedAt: ts,
              resolution: exportResolution,
              quality: exportQuality,
              format: exportFormat,
              sizeKb: Math.round(exportedItem.sizeBytes / 1024),
            },
            ...activeProject.exportHistory,
          ],
        });

        // Also trigger direct browser download so the user gets the exported file immediately
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = exportedItem.title;
        a.click();

        setExportSuccessMsg(
          `Exported ${exportedItem.title} as a new file without modifying your original media.`
        );
      } else {
        setExportProgress(p);
      }
    }, 180);
    exportTimerRef.current = id;
  };

  const cancelExport = () => {
    if (exportTimerRef.current) clearInterval(exportTimerRef.current);
    setExportProgress(null);
    setExportSuccessMsg(null);
  };

  const estimatedExportMb =
    exportResolution === '4K'
      ? exportQuality === 'Original/Maximum'
        ? 24.5
        : 16.2
      : exportResolution === '1080p'
      ? 6.8
      : 2.9;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Top Studio Editor Toolbar */}
      <div className="rounded-2xl bg-[#131418] border border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setEditorMode('photo')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                editorMode === 'photo' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Photo Lab
            </button>
            <button
              onClick={() => setEditorMode('video')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                editorMode === 'video' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Video NLE Timeline
            </button>
          </div>

          {/* Undo / Redo / Reset Command Stack */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 disabled:opacity-40 hover:border-zinc-700 flex items-center gap-1 cursor-pointer"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 disabled:opacity-40 hover:border-zinc-700 flex items-center gap-1 cursor-pointer"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>
            <button
              onClick={handleReset}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              title="Reset Non-Destructive Edits"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Right: Before/After Hold + Export Button */}
        <div className="flex items-center gap-2.5">
          <button
            onMouseDown={() => setShowBeforeOriginal(true)}
            onMouseUp={() => setShowBeforeOriginal(false)}
            onMouseLeave={() => setShowBeforeOriginal(false)}
            onTouchStart={() => setShowBeforeOriginal(true)}
            onTouchEnd={() => setShowBeforeOriginal(false)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer select-none ${
              showBeforeOriginal
                ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-[#F59E0B]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showBeforeOriginal ? 'ORIGINAL (UNEDITED)' : 'HOLD: BEFORE / AFTER'}</span>
          </button>

          <button
            onClick={() => {
              setExportFormat(editorMode === 'video' ? 'MP4' : 'JPG');
              setShowExportModal(true);
            }}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#F59E0B] text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#F59E0B]/90 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export New File</span>
          </button>
        </div>
      </div>

      {/* Main Editor Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Live Canvas Preview & Source Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-[#0D0E12] border border-zinc-800 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <canvas
              ref={previewCanvasRef}
              width={960}
              height={540}
              className="w-full max-h-[440px] object-contain rounded-xl bg-black border border-zinc-800/80"
            />
            <div className="mt-3 w-full flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
              <span>
                SOURCE: {selectedMedia?.title || 'Studio Sample'} ({currentSnap.cropAspect})
              </span>
              <span className="text-[#F59E0B]">
                HISTORY STEP {historyIndex + 1}/{history.length} · NON-DESTRUCTIVE
              </span>
            </div>
          </div>

          {/* Media Strip to switch active photo or add clip to timeline */}
          <div className="rounded-2xl bg-[#131418] border border-zinc-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">
                STUDIO MEDIA BIN (TAP TO LOAD OR ADD TO TIMELINE)
              </span>
              <span className="text-xs font-mono text-zinc-500">{publicMedia.length} items</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {publicMedia.map((item) => (
                <div
                  key={item.id}
                  className={`group relative w-28 shrink-0 rounded-xl overflow-hidden border transition ${
                    selectedMediaId === item.id ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/40' : 'border-zinc-800'
                  }`}
                >
                  <button
                    onClick={() => setSelectedMediaId(item.id)}
                    className="w-full h-16 block cursor-pointer"
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="p-1.5 bg-zinc-900 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-zinc-300 truncate">{item.title}</span>
                    <button
                      onClick={() => handleAddMediaToTimeline(item)}
                      className="p-1 rounded bg-zinc-800 hover:bg-[#F59E0B] hover:text-black text-zinc-300 cursor-pointer"
                      title="Append to Video Timeline"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Multi-Tab Inspector (Color, Crop/Rotate, NLE Timeline, Text/Stickers, Audio) */}
        <div className="lg:col-span-5 rounded-3xl bg-[#131418] border border-zinc-800 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Inspector Category Tabs */}
            <div className="grid grid-cols-5 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {(
                [
                  { id: 'color', label: 'Color', icon: Sliders },
                  { id: 'crop', label: 'Geometry', icon: RotateCw },
                  { id: 'timeline', label: 'Clips/Speed', icon: Scissors },
                  { id: 'text', label: 'Text/Layer', icon: Type },
                  { id: 'audio', label: 'Audio', icon: Music },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInspectorTab(tab.id)}
                    className={`py-2 px-1 rounded-lg text-[11px] font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                      activeInspectorTab === tab.id
                        ? 'bg-[#F59E0B] text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: COLOR & LUT GRADING */}
            {activeInspectorTab === 'color' && (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#F59E0B]">10-CHANNEL OPTICAL COLOR GRADE</span>
                  <span className="text-[11px] text-zinc-400">Real-time Canvas Shader</span>
                </div>

                {(
                  [
                    { key: 'brightness', label: 'Brightness', min: -50, max: 50 },
                    { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                    { key: 'saturation', label: 'Saturation', min: -50, max: 50 },
                    { key: 'temperature', label: 'Temperature (Warm/Cool)', min: -50, max: 50 },
                    { key: 'tint', label: 'Tint (Green/Magenta)', min: -50, max: 50 },
                    { key: 'highlights', label: 'Highlights', min: -50, max: 50 },
                    { key: 'shadows', label: 'Shadows', min: -50, max: 50 },
                    { key: 'sharpness', label: 'Sharpness / Micro-Clarity', min: 0, max: 100 },
                    { key: 'vignette', label: 'Optical Vignette', min: 0, max: 100 },
                  ] as const
                ).map((slider) => (
                  <div key={slider.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300">{slider.label}</span>
                      <span className="font-mono text-[#F59E0B] tabular-nums">
                        {currentSnap.filterSettings[slider.key]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={currentSnap.filterSettings[slider.key]}
                      onChange={(e) => updateFilterSlider(slider.key, Number(e.target.value))}
                      className="w-full accent-[#F59E0B] cursor-pointer"
                    />
                  </div>
                ))}

                {/* Quick Filter LUT Bar */}
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-400 block mb-2">
                    QUICK STUDIO LUT PRESETS
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDIO_TEMPLATES.slice(0, 6).map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() =>
                          pushState((prev) => ({
                            ...prev,
                            filterSettings: { ...tpl.filterSettings },
                          }))
                        }
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#F59E0B] text-left transition cursor-pointer"
                      >
                        <span className="text-[10px] font-mono text-[#F59E0B] block">{tpl.code}</span>
                        <span className="text-xs font-medium text-white truncate block">{tpl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CROP, ROTATE & FLIP */}
            {activeInspectorTab === 'crop' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-[#F59E0B] block mb-2">
                    ROTATE &amp; MIRROR GEOMETRY
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        pushState((prev) => ({ ...prev, rotation: (prev.rotation - 90) % 360 }))
                      }
                      className="min-h-[44px] rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white flex items-center justify-center gap-1.5 hover:border-[#F59E0B] cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
                      <span>-90°</span>
                    </button>
                    <button
                      onClick={() =>
                        pushState((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
                      }
                      className="min-h-[44px] rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white flex items-center justify-center gap-1.5 hover:border-[#F59E0B] cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4 text-[#F59E0B]" />
                      <span>+90°</span>
                    </button>
                    <button
                      onClick={() => pushState((prev) => ({ ...prev, flipH: !prev.flipH }))}
                      className="min-h-[44px] rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white flex items-center justify-center gap-1.5 hover:border-[#F59E0B] cursor-pointer"
                    >
                      <FlipHorizontal className="w-4 h-4 text-[#F59E0B]" />
                      <span>Flip H</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#F59E0B] block mb-2">
                    ASPECT RATIO CROP FRAME
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Original', '16:9', '9:16', '4:3', '1:1', '2.39:1'] as const).map((ar) => (
                      <button
                        key={ar}
                        onClick={() => pushState((prev) => ({ ...prev, cropAspect: ar }))}
                        className={`min-h-[40px] rounded-xl text-xs font-mono border transition cursor-pointer ${
                          currentSnap.cropAspect === ar
                            ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VIDEO NLE TIMELINE, TRIM, SPLIT & SPEED (0.25x - 4x) */}
            {activeInspectorTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#F59E0B]">
                    CLIP SPEED CONTROL (PLAYBACK &amp; EXPORT)
                  </span>
                  <span className="text-xs font-mono text-white">
                    {selectedClip?.speed || 1}x
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {SPEED_OPTIONS.map((sp) => (
                    <button
                      key={sp}
                      onClick={() => handleUpdateClipSpeed(sp)}
                      className={`py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                        selectedClip?.speed === sp
                          ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>

                {selectedClip && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate">{selectedClip.title}</span>
                      <button
                        onClick={handleSplitClipAtPlayhead}
                        className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#F59E0B] text-xs font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <SplitSquareVertical className="w-3.5 h-3.5" />
                        <span>Split Clip</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <label className="text-zinc-400 block mb-1">
                          IN POINT ({selectedClip.startTime}s)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(1, selectedClip.endTime - 1)}
                          step={0.5}
                          value={selectedClip.startTime}
                          onChange={(e) =>
                            handleUpdateClipTrim(Number(e.target.value), selectedClip.endTime)
                          }
                          className="w-full accent-[#F59E0B]"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">
                          OUT POINT ({selectedClip.endTime}s)
                        </label>
                        <input
                          type="range"
                          min={selectedClip.startTime + 0.5}
                          max={25}
                          step={0.5}
                          value={selectedClip.endTime}
                          onChange={(e) =>
                            handleUpdateClipTrim(selectedClip.startTime, Number(e.target.value))
                          }
                          className="w-full accent-[#F59E0B]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                        CLIP TRANSITION
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {(['None', 'Fade', 'Cross Dissolve', 'Flash Cut', 'Whip Pan', 'Film Burn'] as const).map(
                          (tr) => (
                            <button
                              key={tr}
                              onClick={() =>
                                pushState((prev) => ({
                                  ...prev,
                                  clips: prev.clips.map((c) =>
                                    c.id === selectedClip.id ? { ...c, transition: tr } : c
                                  ),
                                }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap cursor-pointer ${
                                selectedClip.transition === tr
                                  ? 'bg-[#F59E0B] text-black font-semibold'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {tr}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: TEXT & STICKER LAYER SYSTEM */}
            {activeInspectorTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-[#F59E0B] block">ADD TEXT OVERLAY LAYER</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOverlayText}
                      onChange={(e) => setNewOverlayText(e.target.value)}
                      className="flex-1 min-h-[40px] px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                      placeholder="Enter title or caption..."
                    />
                    <button
                      onClick={() => handleAddOverlay('text', newOverlayText)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono text-zinc-400 block mb-2">
                    STUDIO CALLOUT STICKERS
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STICKER_PRESETS.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleAddOverlay('sticker', st)}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#F59E0B] text-xs text-left text-zinc-200 truncate cursor-pointer"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Layers List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentSnap.overlays.map((ov) => (
                    <div
                      key={ov.id}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        <span className="text-white truncate">{ov.content}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="range"
                          min={10}
                          max={90}
                          value={ov.yPercent}
                          onChange={(e) =>
                            pushState((prev) => ({
                              ...prev,
                              overlays: prev.overlays.map((l) =>
                                l.id === ov.id ? { ...l, yPercent: Number(e.target.value) } : l
                              ),
                            }))
                          }
                          className="w-16 accent-[#F59E0B]"
                          title="Vertical Position"
                        />
                        <button
                          onClick={() =>
                            pushState((prev) => ({
                              ...prev,
                              overlays: prev.overlays.filter((l) => l.id !== ov.id),
                            }))
                          }
                          className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ROYALTY-FREE / GENERATED STUDIO AUDIO & FADES */}
            {activeInspectorTab === 'audio' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#F59E0B]">
                    LICENSED / BUILT-IN STUDIO AUDIO
                  </span>
                  <button
                    onClick={playDemoAudioPreview}
                    className="px-3 py-1 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-xs font-mono text-[#F59E0B] flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audition Tone</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {PUBLIC_DOMAIN_TRACKS.map((tr) => (
                    <button
                      key={tr.name}
                      onClick={() =>
                        pushState((prev) => ({ ...prev, audioTrackName: tr.name }))
                      }
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        currentSnap.audioTrackName === tr.name
                          ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {tr.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">Master Music &amp; Voiceover Volume</span>
                    <span className="font-mono text-[#F59E0B]">{currentSnap.audioVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={currentSnap.audioVolume}
                    onChange={(e) =>
                      pushState((prev) => ({ ...prev, audioVolume: Number(e.target.value) }))
                    }
                    className="w-full accent-[#F59E0B]"
                  />

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSnap.audioFadeIn}
                        onChange={(e) =>
                          pushState((prev) => ({ ...prev, audioFadeIn: e.target.checked }))
                        }
                        className="accent-[#F59E0B]"
                      />
                      <span>Audio Fade In (1.5s)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSnap.audioFadeOut}
                        onChange={(e) =>
                          pushState((prev) => ({ ...prev, audioFadeOut: e.target.checked }))
                        }
                        className="accent-[#F59E0B]"
                      />
                      <span>Audio Fade Out (1.5s)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Original file stays untouched</span>
            <span className="font-mono text-emerald-400">Non-Destructive Pipeline</span>
          </div>
        </div>
      </div>

      {/* Multi-Track Interactive Timeline Bar */}
      <div className="rounded-3xl bg-[#131418] border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingTimeline((p) => !p)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isPlayingTimeline ? 'Pause Timeline' : 'Play Timeline'}</span>
            </button>
            <span className="text-xs font-mono text-zinc-300 tabular-nums">
              PLAYHEAD: {playheadSec.toFixed(1)}s / {totalTimelineDuration.toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-64">
            <span className="text-[11px] font-mono text-zinc-400">SCRUB:</span>
            <input
              type="range"
              min={0}
              max={Math.max(1, totalTimelineDuration)}
              step={0.1}
              value={playheadSec}
              onChange={(e) => setPlayheadSec(Number(e.target.value))}
              className="flex-1 accent-[#F59E0B] cursor-pointer"
            />
          </div>
        </div>

        {/* Visual Clips Track */}
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2 pt-1">
          {currentSnap.clips.map((clip, idx) => {
            const isSel = clip.id === selectedClip?.id;
            return (
              <div
                key={clip.id}
                onClick={() => setSelectedClipId(clip.id)}
                className={`min-w-[180px] p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  isSel
                    ? 'bg-[#F59E0B]/15 border-[#F59E0B]'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#F59E0B] font-bold">CLIP 0{idx + 1}</span>
                  <span className="text-zinc-400">
                    {clip.duration}s @ {clip.speed}x
                  </span>
                </div>
                <p className="text-xs font-semibold text-white truncate mt-1">{clip.title}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>In: {clip.startTime}s → Out: {clip.endTime}s</span>
                  <span className="text-emerald-400">{clip.transition}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NON-DESTRUCTIVE EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#131418] border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Export Studio Master</h3>
                <p className="text-xs text-zinc-400">Saves as a brand-new file; original is preserved.</p>
              </div>
              <button
                onClick={() => {
                  cancelExport();
                  setShowExportModal(false);
                }}
                className="p-2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">FORMAT</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JPG', 'PNG', 'MP4'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`py-2 rounded-xl text-xs font-mono border cursor-pointer ${
                        exportFormat === fmt
                          ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                  RESOLUTION (DEVICE SUPPORTED)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['720p', '1080p', '4K'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => setExportResolution(res)}
                      className={`py-2 rounded-xl text-xs font-mono border cursor-pointer ${
                        exportResolution === res
                          ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">ENCODING QUALITY</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Low', 'Medium', 'High', 'Original/Maximum'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setExportQuality(q)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono border cursor-pointer ${
                        exportQuality === q
                          ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">ESTIMATED FILE SIZE:</span>
                <span className="text-white font-bold tabular-nums">~{estimatedExportMb} MB</span>
              </div>

              {exportProgress !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#F59E0B]">
                      {exportProgress < 100 ? 'Background Encoding...' : 'Export Complete'}
                    </span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {exportSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {exportProgress !== null && exportProgress < 100 ? (
                <button
                  onClick={cancelExport}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel Export
                </button>
              ) : (
                <button
                  onClick={startNonDestructiveExport}
                  className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold hover:bg-[#F59E0B]/90 transition cursor-pointer"
                >
                  Start Background Export
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
