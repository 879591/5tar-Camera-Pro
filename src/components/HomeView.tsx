import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Film,
  FolderKanban,
  Gauge,
  Globe,
  HelpCircle,
  Images,
  Lock,
  Settings,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react';
import { HardwareCapabilities } from '../camera/capabilityManager';
import { STUDIO_TEMPLATES, StudioTemplate } from '../data/templates';
import { Language, translations } from '../i18n/translations';
import { MediaItem, StudioProject } from '../storage/studioDatabase';

interface HomeViewProps {
  language: Language;
  capabilities: HardwareCapabilities;
  mediaItems: MediaItem[];
  projects: StudioProject[];
  onNavigate: (
    tab: 'home' | 'camera' | 'templates' | 'editor' | 'gallery' | 'projects' | 'vault' | 'settings',
    cameraSubMode?: 'PHOTO' | 'PORTRAIT' | 'PRO' | 'VIDEO' | 'SLOW_MO' | 'TIME_LAPSE' | 'CINEMATIC'
  ) => void;
  onApplyTemplate: (template: StudioTemplate) => void;
  onOpenGuide: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  language,
  capabilities,
  mediaItems,
  projects,
  onNavigate,
  onApplyTemplate,
  onOpenGuide,
}) => {
  const t = translations[language];
  const [activeDocTab, setActiveDocTab] = useState<'android' | 'privacy' | 'developer'>('android');

  const publicMediaCount = mediaItems.filter((m) => !m.isPrivateVault).length;
  const vaultCount = mediaItems.filter((m) => m.isPrivateVault).length;
  const featuredTemplates = STUDIO_TEMPLATES.slice(0, 6);

  const downloadAndroidSourceBundle = () => {
    const summary = `# 5tar Camera Pro — Native Android + Web Studio Bundle
Developer: 5tar Suraj
Version: 2.4.0-PRO (API 24 - API 35 Target)
Architecture: Kotlin + Jetpack Compose + CameraX + Camera2 HighSpeed + Media3 Transformer + EncryptedFile Vault

Included Native Modules in Repository (/android/):
1. AndroidManifest.xml — Strict minimal hardware permissions (Camera, Record_Audio, MediaStore)
2. app/build.gradle.kts — SigningConfig from environment variables (never hardcoded keys)
3. camera/CameraCapabilityManager.kt — Queries CameraCharacteristics for ISO, Shutter, 120/240fps HighSpeed, RAW, OIS
4. camera/CameraEngine.kt — CameraX Preview/ImageCapture/Recorder + Camera2 Interop for manual ISO/Shutter
5. security/PrivateVaultManager.kt — Android Keystore AES256_GCM + BiometricPrompt
6. ui/MainCameraScreen.kt — Jetpack Compose Pro Dark Viewfinder
`;
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '5tar-Camera-Pro-Android-Release-Notes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-10">
      {/* Hero Split Section */}
      <section className="rounded-3xl bg-[#131418] border border-zinc-800/90 p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
              <span>5TAR SURAJ STUDIO</span>
              <span aria-hidden="true">·</span>
              <span>OPTICAL &amp; NLE SUITE</span>
              <span aria-hidden="true">·</span>
              <span>{STUDIO_TEMPLATES.length} PRO TEMPLATES</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              5tar Camera Pro
              <span className="block text-[#F59E0B] text-xl sm:text-2xl font-semibold mt-1.5">
                {t.tagline}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
              Engineered for creators who demand real optical hardware capability detection, manual ISO &amp; shutter precision, 120/240 FPS slow-motion diagnostics, non-destructive photo/video editing, and 100+ instant studio grading templates—100% local on your device with zero forced sign-ups.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('camera', 'PRO')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#F59E0B] text-black font-semibold text-sm flex items-center gap-2 hover:bg-[#F59E0B]/90 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Launch Pro Camera</span>
              </button>

              <button
                onClick={() => onNavigate('templates')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm flex items-center gap-2 hover:border-[#F59E0B] transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span>Explore {STUDIO_TEMPLATES.length} Templates</span>
              </button>

              <button
                onClick={onOpenGuide}
                className="min-h-[48px] px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1.5 hover:text-white transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Camera Guide (EN/HI)</span>
              </button>
            </div>
          </div>

          {/* Right Live Hardware Capability Diagnostic Card */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0A0A0C] border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-[#F59E0B]">CAPABILITY MANAGER</p>
                <h2 className="text-sm font-bold text-white mt-0.5">Detected Device Optics</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <span className="text-zinc-400 block">LENSES FOUND</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">
                  {capabilities.availableLenses.length} Optical Input(s)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <span className="text-zinc-400 block">MAX FPS STREAM</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">
                  {capabilities.maxHardwareFps} FPS ({capabilities.supportsHardwareHighSpeedSlowMo ? 'Native High-Speed' : 'Software Slow-Mo'})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <span className="text-zinc-400 block">RESOLUTIONS</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">
                  {capabilities.supportedResolutions.map((r) => r.label.split(' ')[0]).join(' · ')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <span className="text-zinc-400 block">LOCAL STUDIO DB</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">
                  {publicMediaCount} Media · {projects.length} Proj
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Browser WebRTC streams expose zoom/exposure constraints where supported; Native Android Camera2 unlocks hardware ISO, shutter speed, and 120/240 FPS ConstrainedHighSpeedCaptureSession.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Studio Modes Grid (All 8 Required Home Modules + Templates & Vault) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">01. Core Camera &amp; Studio Modules</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Direct one-tap access to every specialized capture mode and post-production workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <button
            onClick={() => onNavigate('camera', 'PHOTO')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-[#F59E0B]/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-black transition">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Camera (Photo)</h3>
            <p className="mt-1 text-xs text-zinc-400">Tap-to-focus · Grid · Level · Timer · Burst</p>
          </button>

          <button
            onClick={() => onNavigate('camera', 'PRO')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-[#F59E0B]/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Pro Manual Mode</h3>
            <p className="mt-1 text-xs text-zinc-400">ISO · Shutter · WB · EV · Manual Focus</p>
          </button>

          <button
            onClick={() => onNavigate('camera', 'VIDEO')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-rose-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Video Recording</h3>
            <p className="mt-1 text-xs text-zinc-400">24/30/60 FPS · Pause/Resume · Live dB Mic</p>
          </button>

          <button
            onClick={() => onNavigate('camera', 'SLOW_MO')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-purple-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Slow Motion</h3>
            <p className="mt-1 text-xs text-zinc-400">120/240 FPS Hardware + Software Slow-Mo</p>
          </button>

          <button
            onClick={() => onNavigate('camera', 'TIME_LAPSE')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-cyan-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-black transition">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Time Lapse</h3>
            <p className="mt-1 text-xs text-zinc-400">0.5s–10s Interval · Output Duration Calc</p>
          </button>

          <button
            onClick={() => onNavigate('templates')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-[#F59E0B]/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-black transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">{STUDIO_TEMPLATES.length} Templates</h3>
            <p className="mt-1 text-xs text-zinc-400">Cinematic LUTs · Wedding · Reels · Film</p>
          </button>

          <button
            onClick={() => onNavigate('editor')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-emerald-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Photo &amp; Video Editor</h3>
            <p className="mt-1 text-xs text-zinc-400">Trim · Split · Speed · LUTs · Undo/Redo</p>
          </button>

          <button
            onClick={() => onNavigate('gallery')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-blue-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition">
              <Images className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Studio Gallery ({publicMediaCount})</h3>
            <p className="mt-1 text-xs text-zinc-400">Photos · Videos · Slow-Mo · EXIF Inspector</p>
          </button>

          <button
            onClick={() => onNavigate('projects')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-indigo-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Projects ({projects.length})</h3>
            <p className="mt-1 text-xs text-zinc-400">Multi-clip Timelines · Export History</p>
          </button>

          <button
            onClick={() => onNavigate('vault')}
            className="p-4 rounded-2xl bg-[#131418] border border-zinc-800/90 hover:border-amber-500/70 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-[#F59E0B] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-black transition">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm text-white">Private Vault ({vaultCount})</h3>
            <p className="mt-1 text-xs text-zinc-400">PBKDF2 PIN + Biometric Encrypted Lock</p>
          </button>
        </div>
      </section>

      {/* Featured Templates Preview Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              02. Featured Studio Templates ({STUDIO_TEMPLATES.length} Total Available)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Apply any template directly to the live camera viewfinder or open it in the Photo &amp; Video Editor.
            </p>
          </div>
          <button
            onClick={() => onNavigate('templates')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-[#F59E0B] hover:border-[#F59E0B] transition cursor-pointer whitespace-nowrap"
          >
            View All {STUDIO_TEMPLATES.length} Templates →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-[#131418] border border-zinc-800/90 flex flex-col justify-between gap-4 hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span style={{ color: tpl.accentColor }}>{tpl.code}</span>
                  <span>
                    {tpl.category} · {tpl.aspectRatio} · {tpl.fpsTarget}FPS
                  </span>
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-white">{tpl.name}</h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{tpl.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div className="text-[11px] font-mono text-zinc-400">
                  Temp {tpl.filterSettings.temperature > 0 ? `+${tpl.filterSettings.temperature}` : tpl.filterSettings.temperature} · Contrast +{tpl.filterSettings.contrast}
                </div>
                <button
                  onClick={() => onApplyTemplate(tpl)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold hover:bg-[#F59E0B]/90 transition cursor-pointer"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Download Android App + Privacy + About Developer Compact Hub */}
      <section className="rounded-3xl bg-[#131418] border border-zinc-800/90 p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setActiveDocTab('android')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDocTab === 'android' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Download Android App
            </button>
            <button
              onClick={() => setActiveDocTab('privacy')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDocTab === 'privacy' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Privacy Architecture
            </button>
            <button
              onClick={() => setActiveDocTab('developer')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDocTab === 'developer' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              About Developer
            </button>
          </div>

          <button
            onClick={() => onNavigate('settings')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>All Camera &amp; Storage Settings</span>
          </button>
        </div>

        {activeDocTab === 'android' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
                <Smartphone className="w-4 h-4" />
                <span>PRIMARY NATIVE ANDROID APPLICATION (CAMERA2 + CAMERAX)</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                Download 5tar Camera Pro for Android
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Unlock hardware-level Camera2 sensor controls (`SENSOR_SENSITIVITY`, `SENSOR_EXPOSURE_TIME`), `ConstrainedHighSpeedCaptureSession` 120/240 FPS slow motion, multi-lens physical camera switching (Ultra-Wide, Wide, Telephoto, Macro), and Android Keystore `EncryptedFile` Private Vault.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 pt-1 tabular-nums">
                <span>Latest Version: v2.4.0-PRO</span>
                <span>·</span>
                <span>APK Size: 18.4 MB</span>
                <span>·</span>
                <span>Android 7.0+ (API 24–35)</span>
                <span>·</span>
                <span>Samsung / Pixel / Xiaomi / Vivo / OnePlus</span>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <button
                onClick={downloadAndroidSourceBundle}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#F59E0B] text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#F59E0B]/90 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Download Android Build Spec &amp; Notes</span>
              </button>
              <p className="text-[11px] text-zinc-400 text-center">
                Full Kotlin source code included in <code className="text-zinc-300">/android/</code> directory
              </p>
            </div>
          </div>
        )}

        {activeDocTab === 'privacy' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>ZERO CLOUD UPLOAD · 100% ON-DEVICE PROCESSING</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              Transparent Privacy &amp; Hardware Permissions Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                <strong className="text-white block mb-1">Camera &amp; Microphone</strong>
                Used strictly for live optical preview, photo capture, and video/voiceover recording when explicitly triggered by you. Never accessed in the background.
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                <strong className="text-white block mb-1">Local Media &amp; Non-Destructive Edits</strong>
                All photos, videos, and edited exports are saved as new entries in MediaStore / IndexedDB. Original files are never overwritten or uploaded to external servers.
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                <strong className="text-white block mb-1">Private Vault Platform Honesty</strong>
                Vault items are encrypted using AES-GCM / Android Keystore and hidden from the normal gallery. Platform limitation: rooted devices or OS-level system backups may still index app directories if unencrypted externally.
              </div>
            </div>
          </div>
        )}

        {activeDocTab === 'developer' && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs font-mono text-[#F59E0B]">ABOUT DEVELOPER · 5TAR SURAJ</p>
              <h3 className="font-display text-lg font-bold text-white">5tar Suraj</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                &ldquo;5tar Camera Pro is developed as an independent creative technology project.&rdquo;
              </p>
              <p className="text-xs text-zinc-400">
                Social &amp; contact endpoints are configured via environment placeholders (<code className="text-zinc-300">VITE_DEV_INSTAGRAM</code>, <code className="text-zinc-300">VITE_DEV_YOUTUBE</code>, etc.) with zero fabricated links.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto text-xs font-mono">
              {[
                { label: 'Instagram', envKey: 'VITE_DEV_INSTAGRAM' },
                { label: 'YouTube', envKey: 'VITE_DEV_YOUTUBE' },
                { label: 'Facebook', envKey: 'VITE_DEV_FACEBOOK' },
                { label: 'Website', envKey: 'VITE_DEV_WEBSITE' },
                { label: 'WhatsApp', envKey: 'VITE_DEV_WHATSAPP' },
                { label: 'Email', envKey: 'VITE_DEV_EMAIL' },
              ].map((link) => (
                <div
                  key={link.label}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-2"
                  title={`Configure via ${link.envKey}`}
                >
                  <Globe className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <div className="truncate">
                    <span className="block text-white font-sans font-medium text-xs">{link.label}</span>
                    <span className="block text-[10px] text-zinc-500">{link.envKey}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
