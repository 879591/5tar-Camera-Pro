import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ onOpenApkModal?: () => void }> = ({ onOpenApkModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F59E0B]/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install PWA</span>
          </button>
        )}

        {!isInstalled && isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Install iOS</span>
          </button>
        )}

        {onOpenApkModal && (
          <button
            onClick={onOpenApkModal}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs font-medium flex items-center gap-1.5 hover:border-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Android APK</span>
          </button>
        )}
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131418] border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Install 5tar Camera Pro on iOS</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-2 text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              1. Tap the <strong>Share</strong> icon in Safari&apos;s bottom bar.
              <br />
              2. Scroll down and select <strong>Add to Home Screen</strong>.
              <br />
              3. Launch <strong>5tarCamPro</strong> in full-screen standalone mode.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#F59E0B] text-black text-sm font-semibold hover:bg-[#F59E0B]/90 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#131418] border border-[#F59E0B]/50 px-3.5 py-2 text-xs font-medium text-[#F59E0B] shadow-xl">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Studio Mode — Local IndexedDB & Cached Assets Active</span>
    </div>
  );
};
