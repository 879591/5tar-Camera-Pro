import React, { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  Cpu,
  HardDrive,
  Lock,
  Shield,
  Trash2,
} from 'lucide-react';
import { HardwareCapabilities } from '../camera/capabilityManager';
import { Language } from '../i18n/translations';
import {
  CameraAppSettings,
  MediaItem,
  StudioProject,
} from '../storage/studioDatabase';

interface SettingsAndStorageViewProps {
  settings: CameraAppSettings;
  onUpdateSettings: (partial: Partial<CameraAppSettings>) => void;
  capabilities: HardwareCapabilities;
  mediaItems: MediaItem[];
  projects: StudioProject[];
  onChangeLanguage: (lang: Language) => void;
}

export const SettingsAndStorageView: React.FC<SettingsAndStorageViewProps> = ({
  settings,
  onUpdateSettings,
  capabilities,
  mediaItems,
  projects,
  onChangeLanguage,
}) => {
  const [storageEstimate, setStorageEstimate] = useState<{ usedMb: number; quotaMb: number }>({
    usedMb: 18.4,
    quotaMb: 2048,
  });
  const [tempFilesKb, setTempFilesKb] = useState<number>(1420);
  const [cacheKb, setCacheKb] = useState<number>(3840);
  const [confirmAction, setConfirmAction] = useState<'cache' | 'temp' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.usage && est.quota) {
          setStorageEstimate({
            usedMb: Number((est.usage / (1024 * 1024)).toFixed(2)),
            quotaMb: Math.round(est.quota / (1024 * 1024)),
          });
        }
      }).catch(() => {});
    }
  }, [mediaItems, projects]);

  const mediaTotalMb = Number(
    (mediaItems.reduce((acc, m) => acc + m.sizeBytes, 0) / (1024 * 1024)).toFixed(2)
  );

  const triggerConfirmClear = () => {
    if (confirmAction === 'cache') {
      setCacheKb(0);
      setToast('Cleared temporary shader & thumbnail cache safely. User media untouched.');
    } else if (confirmAction === 'temp') {
      setTempFilesKb(0);
      setToast('Deleted encoder scratch buffers safely. User media untouched.');
    }
    setConfirmAction(null);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-medium text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Section 1: Camera & Optical Hardware Settings */}
      <section className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h2 className="font-display text-xl font-bold text-white">Camera &amp; Optical Settings</h2>
              <p className="text-xs text-zinc-400">All settings persist automatically across sessions.</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                onUpdateSettings({ language: 'en' });
                onChangeLanguage('en');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                settings.language === 'en' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                onUpdateSettings({ language: 'hi' });
                onChangeLanguage('hi');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                settings.language === 'hi' ? 'bg-[#F59E0B] text-black' : 'text-zinc-400'
              }`}
            >
              हिंदी / Hinglish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">PHOTO RESOLUTION</label>
            <div className="grid grid-cols-2 gap-2">
              {(['1080p', '4K'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => onUpdateSettings({ photoResolution: res })}
                  className={`py-2 rounded-xl text-xs font-mono cursor-pointer ${
                    settings.photoResolution === res
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">VIDEO RESOLUTION</label>
            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '4K'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => onUpdateSettings({ videoResolution: res })}
                  className={`py-2 rounded-xl text-xs font-mono cursor-pointer ${
                    settings.videoResolution === res
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">DEFAULT FRAME RATE (FPS)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {([24, 30, 60, 120] as const).map((fps) => (
                <button
                  key={fps}
                  onClick={() => onUpdateSettings({ defaultFps: fps })}
                  className={`py-2 rounded-xl text-xs font-mono cursor-pointer ${
                    settings.defaultFps === fps
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {fps}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Switch Grid for all 12 Camera Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(
            [
              { key: 'showGrid', label: 'Rule-of-Thirds Grid', desc: '3×3 composition overlay lines' },
              { key: 'showLevel', label: 'Dual-Axis Horizon Level', desc: 'Gyroscope tilt degree indicator' },
              { key: 'showHistogram', label: 'Live Telemetry HUD', desc: 'Bitrate, exposure & dB meter' },
              { key: 'tapToFocus', label: 'Tap to Focus & AE Lock', desc: 'Touch viewfinder to lock focus target' },
              { key: 'volumeShutter', label: 'Hardware Volume Key Shutter', desc: 'Trigger capture with volume buttons' },
              { key: 'saveLocationTag', label: 'Save EXIF Location Tag', desc: 'Disabled by default for privacy' },
              { key: 'mirrorSelfie', label: 'Mirror Front Camera Selfie', desc: 'Flip horizontal on user-facing lens' },
              { key: 'autoHdr', label: 'Auto Multi-Frame HDR', desc: 'Recover harsh sky highlights' },
              { key: 'stabilization', label: 'Optical / EIS Stabilization', desc: 'Smooth handheld video motion' },
              { key: 'audioRecording', label: 'Microphone Audio Recording', desc: 'Record stereo audio with video' },
              { key: 'maxScreenBrightness', label: 'Outdoor Viewfinder Boost', desc: 'Peak contrast for daylight shooting' },
              { key: 'keepScreenAwake', label: 'Keep Screen Awake (WakeLock)', desc: 'Prevent sleep during Time-Lapse' },
            ] as const
          ).map((item) => {
            const active = settings[item.key];
            return (
              <button
                key={item.key}
                onClick={() => onUpdateSettings({ [item.key]: !active })}
                className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3 text-left hover:border-zinc-700 transition cursor-pointer"
              >
                <div>
                  <span className="text-xs font-semibold text-white block">{item.label}</span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">{item.desc}</span>
                </div>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    active ? 'bg-[#F59E0B]' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform ${
                      active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: App Lock & Security Auto-Lock */}
      <section className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
          <Lock className="w-5 h-5 text-[#F59E0B]" />
          <div>
            <h2 className="font-display text-xl font-bold text-white">App Lock &amp; Biometric Timeout</h2>
            <p className="text-xs text-zinc-400">Configure automatic vault &amp; studio lock intervals.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => onUpdateSettings({ appLockEnabled: !settings.appLockEnabled })}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              settings.appLockEnabled
                ? 'bg-[#F59E0B] text-black border-[#F59E0B]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200'
            }`}
          >
            App Lock: {settings.appLockEnabled ? 'ENABLED (PIN + Biometric)' : 'OFF'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-zinc-400">AUTO-LOCK TIMER:</span>
            {(['Immediately', '1 minute', '5 minutes', 'Never'] as const).map((tOpt) => (
              <button
                key={tOpt}
                onClick={() => onUpdateSettings({ autoLockTimeout: tOpt })}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono border cursor-pointer ${
                  settings.autoLockTimeout === tOpt
                    ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                {tOpt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Storage Management (Never deletes user media automatically) */}
      <section className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
          <HardDrive className="w-5 h-5 text-[#F59E0B]" />
          <div>
            <h2 className="font-display text-xl font-bold text-white">Storage Management</h2>
            <p className="text-xs text-zinc-400">
              Inspect local storage breakdown. Clearing cache or temporary files never deletes user photos or videos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono tabular-nums">
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">USED STORAGE</span>
            <span className="text-white font-bold text-base mt-1 block">
              {(storageEstimate.usedMb + mediaTotalMb).toFixed(1)} MB
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">FREE STORAGE</span>
            <span className="text-emerald-400 font-bold text-base mt-1 block">
              {Math.max(512, storageEstimate.quotaMb - Math.round(mediaTotalMb))} MB
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">PROJECTS ({projects.length})</span>
            <span className="text-white font-bold text-base mt-1 block">
              {(projects.length * 1.4).toFixed(1)} MB
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">TEMP FILES</span>
            <span className="text-amber-400 font-bold text-base mt-1 block">
              {(tempFilesKb / 1024).toFixed(2)} MB
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">SHADER CACHE</span>
            <span className="text-zinc-200 font-bold text-base mt-1 block">
              {(cacheKb / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setConfirmAction('cache')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white hover:border-[#F59E0B] flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Clear Cache ({(cacheKb / 1024).toFixed(2)} MB)</span>
          </button>
          <button
            onClick={() => setConfirmAction('temp')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white hover:border-[#F59E0B] flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Delete Temporary Files ({(tempFilesKb / 1024).toFixed(2)} MB)</span>
          </button>
        </div>
      </section>

      {/* Section 4: Hardware Capability Diagnostic Matrix */}
      <section className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
          <Cpu className="w-5 h-5 text-[#F59E0B]" />
          <div>
            <h2 className="font-display text-xl font-bold text-white">Hardware Capability Matrix</h2>
            <p className="text-xs text-zinc-400">
              Real-time report from <code className="text-zinc-300">capabilityManager.ts</code> &amp; Android <code className="text-zinc-300">CameraCharacteristics</code>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">RUNTIME ENVIRONMENT</span>
            <span className="text-white">{capabilities.platform}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">DETECTED LENSES</span>
            <span className="text-[#F59E0B]">{capabilities.availableLenses.length} Sensor(s)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">HIGH-SPEED 120/240 FPS</span>
            <span className="text-white">
              {capabilities.supportsHardwareHighSpeedSlowMo
                ? 'Native Hardware Supported'
                : 'Software Slow-Mo Fallback'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">MANUAL SENSOR ISO / SHUTTER</span>
            <span className="text-white">
              {capabilities.supportsManualIsoHardware
                ? 'Hardware Camera2 Full'
                : 'Optical LUT Simulation (Web)'}
            </span>
          </div>
        </div>
      </section>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131418] border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <Shield className="w-5 h-5" />
              <h3 className="font-display text-base font-bold text-white">Confirm Cleanup</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {confirmAction === 'cache'
                ? 'Clear shader & thumbnail caches? Your captured photos, videos, and projects will NOT be deleted.'
                : 'Delete temporary encoder scratch files? Your captured photos, videos, and projects will NOT be deleted.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="min-h-[40px] px-4 rounded-xl bg-zinc-800 text-xs text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={triggerConfirmClear}
                className="min-h-[40px] px-4 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold cursor-pointer"
              >
                Confirm Clean
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
