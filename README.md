# 5tar Camera Pro

**"Professional Camera. Creative Studio."**  
**Developer / Brand:** 5tar Suraj

---

## 1. Project Overview

**5tar Camera Pro** is a dual-platform production camera and non-linear creative studio engineered with two connected experiences:

1. **Primary Native Android Application (`/android/`)**: Built with Kotlin, Jetpack Compose, **CameraX** (default lifecycle-aware capture), **Camera2 Interop** (`CameraCharacteristics`, manual `SENSOR_SENSITIVITY` ISO, `SENSOR_EXPOSURE_TIME` shutter speed, `ConstrainedHighSpeedCaptureSession` 120/240 FPS slow motion), **Media3 Transformer**, and **Android Keystore `EncryptedFile` + `BiometricPrompt`**.
2. **Responsive Web / Installable PWA Companion (`/src/`)**: Built with React 19, TypeScript, Vite, Tailwind CSS, WebRTC `MediaDevices.getUserMedia()`, `ImageCapture` / `MediaStreamTrack.getCapabilities()`, WebGL/Canvas real-time optical shaders, Web Audio API live dB metering, Web Crypto API (`PBKDF2-SHA256` + `AES-GCM`) Private Vault, and **IndexedDB** local persistence.

---

## 2. Core Features

- **Real Camera Viewfinder & Dynamic Capability Detection**:
  - Automatically queries hardware/browser capabilities at startup and when switching lenses (`capabilityManager.ts` & `CameraCapabilityManager.kt`).
  - Modes: `PHOTO`, `PORTRAIT`, `PRO`, `VIDEO`, `SLOW MOTION`, `TIME LAPSE`, and `CINEMATIC`.
  - Pro Controls: ISO (`AUTO`, `50`–`3200`), Shutter Speed (`AUTO`, `1/30`–`1/2000s`), Exposure Compensation (`-3.0` to `+3.0 EV`), White Balance (`AUTO`, `DAYLIGHT`, `CLOUDY`, `TUNGSTEN`, `FLUORESCENT`, `CUSTOM`), Auto/Manual Focus, Optical/Digital Zoom, Rule-of-Thirds Grid, Dual-Axis Horizon Level, and Timer (`3s` / `10s`).
  - Clearly distinguishes hardware sensor capabilities from optical software LUT fallbacks without ever crashing or pretending unsupported hardware exists.
- **106+ Studio Templates (`Templates > 100`)**:
  - **106 curated presets** across 8 categories: *Cinematic LUTs*, *Wedding & Festival*, *Reels & Slow-Mo*, *Portrait & Beauty*, *Night & Cyberpunk*, *Travel & Vlog*, *Retro & 35mm Film*, and *Action & Sports*.
  - Apply any template live to the Camera Viewfinder or open it in the Photo & Video NLE Editor.
- **Non-Destructive Photo & Video NLE Editor**:
  - **Photo Lab**: 10-channel optical grading (Brightness, Contrast, Saturation, Temperature, Tint, Highlights, Shadows, Sharpness, Vignette), Rotate `-90°/+90°`, Horizontal Flip, Aspect Ratio Crop (`16:9`, `9:16`, `4:3`, `1:1`, `2.39:1`), and interactive **Before/After** comparison hold.
  - **Video Timeline**: Draggable playhead, clip Trim (`In/Out` handles), Split clip, Merge/Append clips, Speed Control (`0.25x`, `0.5x`, `0.75x`, `1x`, `1.25x`, `1.5x`, `2x`, `4x`), Transitions (`Fade`, `Cross Dissolve`, `Flash Cut`, `Whip Pan`, `Film Burn`), Text/Sticker layers, and built-in royalty-free/synthesized audio with Fade In/Out.
  - Full Command History **Undo / Redo / Reset** stack.
  - Exports as a brand-new file (`JPG`, `PNG`, `MP4` in `720p`, `1080p`, or `4K`) without overwriting original media.
- **Encrypted Private Vault & App Lock**:
  - Salted `PBKDF2-SHA256` (100,000 iterations) + `AES-GCM` encryption on Web and `Android Keystore` (`MasterKey.KeyScheme.AES256_GCM`) + `BiometricPrompt` on Android.
  - Plain-text PINs are never stored. Includes transparent disclosure of OS/root platform limitations.
- **Bilingual Localization (English + Hindi/Hinglish)**:
  - Complete localization architecture (`src/i18n/translations.ts`) and an interactive **Camera Guide** explaining ISO, Shutter Speed, Exposure, Focus, White Balance, FPS, and Slow Motion in simple English and Hinglish.

---

## 3. Project Structure

```text
/
├── android/                                # Native Android Kotlin + Compose Source
│   ├── app/build.gradle.kts                # CameraX, Camera2, Media3, Keystore, Release Signing
│   ├── app/src/main/AndroidManifest.xml    # Minimal hardware permissions
│   ├── camera/CameraCapabilityManager.kt   # Queries CameraCharacteristics per physical lens
│   ├── camera/CameraEngine.kt              # Lifecycle-aware CameraX + Camera2Interop manual controls
│   ├── security/PrivateVaultManager.kt     # Android Keystore AES256_GCM + BiometricPrompt
│   └── ui/MainCameraScreen.kt              # Jetpack Compose Dark Pro Viewfinder
├── src/                                    # Web / Installable PWA Companion
│   ├── camera/
│   │   ├── capabilityManager.ts            # MediaDevices & track capability detector
│   │   └── CameraViewfinder.tsx            # Live viewfinder, Pro manual deck, Slow-Mo, Time-Lapse
│   ├── components/
│   │   ├── HomeView.tsx                    # Studio home, capability matrix, developer & privacy hub
│   │   ├── TemplatesStudio.tsx             # 106+ searchable studio templates
│   │   ├── ProjectsView.tsx                # Multi-clip timeline project manager
│   │   ├── OnboardingModal.tsx             # First-launch welcome & individual permission requests
│   │   ├── CameraGuideModal.tsx            # Bilingual English + Hindi/Hinglish Camera Guide
│   │   └── AndroidApkModal.tsx             # Android APK/AAB release spec & build instructions
│   ├── data/templates.ts                   # 106 Studio Templates dataset
│   ├── editor/StudioEditor.tsx             # Photo Lab + Video NLE Timeline + Undo/Redo + Export
│   ├── gallery/GalleryView.tsx             # Categorized gallery, EXIF inspector, Lightbox
│   ├── security/
│   │   ├── vaultCrypto.ts                  # Web Crypto PBKDF2 + AES-GCM encryption
│   │   └── PrivateVaultView.tsx            # PIN & Biometric Vault UI
│   ├── settings/SettingsAndStorageView.tsx # Persisted camera settings, App Lock, Storage Manager
│   ├── storage/studioDatabase.ts           # IndexedDB persistence for media & projects
│   ├── pwa/                                # PWA install hook & offline indicator
│   └── i18n/translations.ts                # English & Hindi/Hinglish strings
└── tests/cameraStudio.test.ts              # Automated QA verification suite
```

---

## 4. Setup & Build Instructions

### Web / PWA Companion
```bash
npm install
npm run dev      # Starts development server on port 3000
npm run build    # Compiles production PWA bundle with Service Worker & Manifest
```

### Android Debug APK & Production Signed Release AAB/APK
```bash
cd android
# 1. Build Debug APK for testing on physical devices:
./gradlew :app:assembleDebug

# 2. Build Signed Release Bundle (Never hardcode keys in source code):
export KEYSTORE_PATH="/secure/path/5tar-release.jks"
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_ALIAS="5tar_camera_pro"
export KEY_PASSWORD="your_key_password"
./gradlew :app:bundleRelease :app:assembleRelease
```

---

## 5. Device Compatibility & Known Limitations

- **Supported Android Versions**: Android 7.0 Nougat (API 24) through Android 15 (API 35).
- **OEM Fallbacks**: Tested capability fallbacks for Samsung, Google Pixel, Xiaomi/Redmi, Vivo, Realme, OnePlus, and Motorola. If an OEM restricts third-party access to auxiliary lenses or `MANUAL_SENSOR`, the capability manager automatically falls back to standard CameraX auto modes without crashing.
- **Browser vs Native Camera2**: Web browsers do not expose raw sensor shutter speed or 240 FPS `ConstrainedHighSpeedCaptureSession`. The Web/PWA companion clearly labels optical shader simulations and software slow motion.

---

## 6. Privacy Policy & Developer

- **100% Local Processing**: No user photos, videos, or voiceovers are uploaded to external cloud servers. No forced account creation or analytics tracking.
- **Developer**: **5tar Suraj** — *"5tar Camera Pro is developed as an independent creative technology project."* Social links are configurable via `.env.example` (`VITE_DEV_INSTAGRAM`, `VITE_DEV_YOUTUBE`, `VITE_DEV_FACEBOOK`, `VITE_DEV_WEBSITE`, `VITE_DEV_WHATSAPP`, `VITE_DEV_EMAIL`).
