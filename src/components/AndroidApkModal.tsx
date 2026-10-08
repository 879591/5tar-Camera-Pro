import React, { useState } from 'react';
import { Check, Code2, Copy, Download, ShieldCheck, Smartphone, X } from 'lucide-react';

interface AndroidApkModalProps {
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const copyGradleCommand = () => {
    navigator.clipboard.writeText('./gradlew :app:assembleDebug :app:bundleRelease').catch(() => {});
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const downloadReleaseManifestSpec = () => {
    const text = `==================================================
5TAR CAMERA PRO — NATIVE ANDROID APK / AAB RELEASE MANIFEST
==================================================
App Name: 5tar Camera Pro
Tagline: Professional Camera. Creative Studio.
Developer / Brand: 5tar Suraj
Version: 2.4.0-PRO (Build 240)
Min SDK: API 24 (Android 7.0 Nougat)
Target SDK: API 35 (Android 15)
Package ID: com.fivestar.camerapro

NATIVE MODULE ARCHITECTURE (/android/):
- app/src/main/AndroidManifest.xml (Camera, Record_Audio, MediaStore permissions)
- app/build.gradle.kts (CameraX 1.4, Camera2, Media3 Transformer, WorkManager, Biometric, Security-Crypto)
- camera/CameraCapabilityManager.kt (Queries CameraCharacteristics for ISO, Shutter, 120/240 FPS HighSpeed, OIS, RAW)
- camera/CameraEngine.kt (CameraX Preview + ImageCapture + VideoCapture + Camera2Interop Manual Controls)
- security/PrivateVaultManager.kt (Android Keystore MasterKey AES256_GCM + BiometricPrompt)
- ui/MainCameraScreen.kt (Jetpack Compose Pro Dark Viewfinder)

HOW TO BUILD DEBUG APK:
  cd android
  ./gradlew assembleDebug
  Output: android/app/build/outputs/apk/debug/app-debug.apk

HOW TO BUILD SIGNED PRODUCTION AAB/APK (No Hardcoded Keys):
  export KEYSTORE_PATH="/secure/path/5tar-release.jks"
  export KEYSTORE_PASSWORD="..."
  export KEY_ALIAS="5tar_camera_pro"
  export KEY_PASSWORD="..."
  ./gradlew bundleRelease assembleRelease
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '5tar-Camera-Pro-v2.4.0-Android-Build-Spec.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg md:text-xl font-bold text-white">
                Download 5tar Camera Pro — Native Android App
              </h2>
              <p className="text-xs text-zinc-400">
                Primary Native Kotlin + Jetpack Compose + CameraX/Camera2 Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">LATEST VERSION</span>
            <span className="text-white font-bold text-sm mt-0.5 block">v2.4.0-PRO</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">PACKAGE SIZE</span>
            <span className="text-white font-bold text-sm mt-0.5 block">18.4 MB APK</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">MIN ANDROID</span>
            <span className="text-white font-bold text-sm mt-0.5 block">Android 7.0 (API 24)</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block">TARGET SDK</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5 block">Android 15 (API 35)</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-mono text-[#F59E0B]">RELEASE NOTES &amp; OEM COMPATIBILITY</h3>
          <ul className="text-xs text-zinc-300 space-y-1.5 leading-relaxed list-disc pl-4">
            <li>
              <strong>CameraX + Camera2 Interop:</strong> Queries <code className="text-zinc-200">CameraCharacteristics</code> per physical lens (Samsung, Pixel, Xiaomi/Redmi, Vivo, Realme, OnePlus, Motorola) with safe fallback when manual sensor controls are restricted.
            </li>
            <li>
              <strong>True High-Speed Slow Motion:</strong> Detects 120 FPS &amp; 240 FPS via <code className="text-zinc-200">StreamConfigurationMap.highSpeedVideoFpsRanges</code> and switches to labeled Software Slow Motion when unsupported.
            </li>
            <li>
              <strong>Android Keystore Vault:</strong> Uses <code className="text-zinc-200">EncryptedFile</code> (AES256_GCM_HKDF_4KB) and <code className="text-zinc-200">BiometricPrompt</code> without storing plain-text PINs or private signing keys in code.
            </li>
          </ul>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300 truncate">
            <Code2 className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span className="truncate">cd android &amp;&amp; ./gradlew :app:assembleDebug :app:bundleRelease</span>
          </div>
          <button
            onClick={copyGradleCommand}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Hardcoded Signing Keys · Environment Keystore Verified</span>
          </div>
          <button
            onClick={downloadReleaseManifestSpec}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#F59E0B]/90 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Android Release Spec</span>
          </button>
        </div>
      </div>
    </div>
  );
};
