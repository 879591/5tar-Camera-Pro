import React, { useState } from 'react';
import { Camera, CheckCircle2, FolderOpen, Mic, ShieldAlert, Sparkles } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface OnboardingModalProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  language,
  onChangeLanguage,
  onComplete,
}) => {
  const t = translations[language];
  const [step, setStep] = useState<'welcome' | 'permissions'>('welcome');
  const [camStatus, setCamStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [micStatus, setMicStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'granted'>('granted');
  const [errorNote, setErrorNote] = useState<string | null>(null);

  const requestCameraPermission = async () => {
    setErrorNote(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamStatus('denied');
      setErrorNote(
        'Browser MediaDevices API unavailable in this environment. Optical studio generator fallback is ready so you can still test all Pro controls.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((tr) => tr.stop());
      setCamStatus('granted');
    } catch {
      setCamStatus('denied');
      setErrorNote(
        'Camera permission was denied or no physical camera was found. You can enable it anytime in Browser/Device Settings. Studio Optical Fallback is enabled so the app never crashes.'
      );
    }
  };

  const requestMicPermission = async () => {
    setErrorNote(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('denied');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop());
      setMicStatus('granted');
    } catch {
      setMicStatus('denied');
      setErrorNote(
        'Microphone access denied. Video recording will continue safely in silent video-only mode unless enabled in Settings.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-[#131418] border border-zinc-800/90 p-6 md:p-8 shadow-2xl">
        {/* Top language selector */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="5tar Camera Pro logo" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg" />
            <span className="font-display text-sm font-bold tracking-tight text-white">5tar Camera Pro</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => onChangeLanguage('en')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                language === 'en' ? 'bg-[#F59E0B] text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                language === 'hi' ? 'bg-[#F59E0B] text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              हिंदी / Hinglish
            </button>
          </div>
        </div>

        {step === 'welcome' ? (
          <div className="pt-6 text-center md:text-left">
            <p className="text-xs font-mono text-[#F59E0B] tracking-wider">DEVELOPED BY 5TAR SURAJ</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {t.appName}
            </h1>
            <p className="mt-2 text-lg font-medium text-zinc-300">{t.tagline}</p>

            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Experience real optical viewfinder controls, Pro ISO/Shutter/WB calibration, 120/240 FPS Slow Motion capability detection, a full multi-track Photo &amp; Video NLE Editor, 106+ one-tap Creative Templates, and an AES-GCM Encrypted Private Vault.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                <p className="text-xs font-mono text-[#F59E0B]">CAMERA2 + WEB</p>
                <p className="mt-1 text-sm font-semibold text-white">Pro Manual Controls</p>
                <p className="mt-0.5 text-xs text-zinc-400">Dynamic capability detection with zero fake crashes.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                <p className="text-xs font-mono text-[#F59E0B]">106+ TEMPLATES</p>
                <p className="mt-1 text-sm font-semibold text-white">Instant Color &amp; Reels</p>
                <p className="mt-0.5 text-xs text-zinc-400">Cinematic LUTs, Wedding, Slow-Mo, Retro 35mm &amp; Night.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                <p className="text-xs font-mono text-[#F59E0B]">100% LOCAL</p>
                <p className="mt-1 text-sm font-semibold text-white">No Forced Login</p>
                <p className="mt-0.5 text-xs text-zinc-400">Works offline without cloud uploads or telemetry.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => setStep('permissions')}
                className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#F59E0B] text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#F59E0B]/90 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.getStarted}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-6">
            <h2 className="font-display text-xl md:text-2xl font-bold text-white">{t.permissions.title}</h2>
            <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{t.permissions.subtitle}</p>

            <div className="mt-5 space-y-3">
              {/* Camera Permission Row */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center shrink-0 text-[#F59E0B]">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.permissions.cameraTitle}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{t.permissions.cameraDesc}</p>
                  </div>
                </div>
                <button
                  onClick={requestCameraPermission}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    camStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : camStatus === 'denied'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90'
                  }`}
                >
                  {camStatus === 'granted'
                    ? t.permissions.granted
                    : camStatus === 'denied'
                    ? t.permissions.denied
                    : t.permissions.grant}
                </button>
              </div>

              {/* Microphone Permission Row */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.permissions.micTitle}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{t.permissions.micDesc}</p>
                  </div>
                </div>
                <button
                  onClick={requestMicPermission}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    micStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : micStatus === 'denied'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  {micStatus === 'granted'
                    ? t.permissions.granted
                    : micStatus === 'denied'
                    ? t.permissions.denied
                    : t.permissions.grant}
                </button>
              </div>

              {/* Local Media Storage Row */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.permissions.mediaTitle}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{t.permissions.mediaDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMediaStatus('granted')}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{mediaStatus === 'granted' ? t.permissions.granted : t.permissions.grant}</span>
                </button>
              </div>
            </div>

            {errorNote && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{errorNote}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setStep('welcome')}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={onComplete}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#F59E0B] text-black text-sm font-semibold hover:bg-[#F59E0B]/90 transition cursor-pointer"
              >
                {t.permissions.continueToApp}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
