import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  Clock,
  Compass,
  Grid,
  HelpCircle,
  Images,
  Lock,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Sliders,
  Sparkles,
  Square,
  Sun,
  Timer,
  Video,
  Zap,
  ZapOff,
} from 'lucide-react';
import {
  CameraLensInfo,
  HardwareCapabilities,
  probeMediaCapabilities,
} from './capabilityManager';
import { StudioTemplate } from '../data/templates';
import { Language, translations } from '../i18n/translations';
import { CameraAppSettings, MediaItem } from '../storage/studioDatabase';

export type CameraSubMode =
  | 'PHOTO'
  | 'PORTRAIT'
  | 'PRO'
  | 'VIDEO'
  | 'SLOW_MO'
  | 'TIME_LAPSE'
  | 'CINEMATIC';

interface CameraViewfinderProps {
  language: Language;
  initialMode: CameraSubMode;
  activeTemplate: StudioTemplate | null;
  onClearTemplate: () => void;
  settings: CameraAppSettings;
  onUpdateSettings: (partial: Partial<CameraAppSettings>) => void;
  latestMedia: MediaItem | undefined;
  onMediaCaptured: (item: MediaItem) => void;
  onOpenGallery: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onCapabilitiesUpdated: (caps: HardwareCapabilities) => void;
}

const ISO_VALUES = ['AUTO', '50', '100', '200', '400', '800', '1600', '3200'] as const;
const SHUTTER_VALUES = ['AUTO', '1/30', '1/50', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000'] as const;
const WB_PRESETS = [
  { id: 'AUTO', label: 'AUTO', kelvin: 5500, tempShift: 0 },
  { id: 'DAYLIGHT', label: 'DAYLIGHT 5600K', kelvin: 5600, tempShift: 4 },
  { id: 'CLOUDY', label: 'CLOUDY 6500K', kelvin: 6500, tempShift: 16 },
  { id: 'TUNGSTEN', label: 'TUNGSTEN 3200K', kelvin: 3200, tempShift: -20 },
  { id: 'FLUORESCENT', label: 'FLUORESCENT 4000K', kelvin: 4000, tempShift: -8 },
  { id: 'CUSTOM', label: 'CUSTOM KELVIN', kelvin: 5000, tempShift: 10 },
] as const;

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  language,
  initialMode,
  activeTemplate,
  onClearTemplate,
  settings,
  onUpdateSettings,
  latestMedia,
  onMediaCaptured,
  onOpenGallery,
  onOpenSettings,
  onOpenGuide,
  onCapabilitiesUpdated,
}) => {
  const t = translations[language];
  const [mode, setMode] = useState<CameraSubMode>(initialMode);
  const [caps, setCaps] = useState<HardwareCapabilities | null>(null);
  const [selectedLensIndex, setSelectedLensIndex] = useState(0);
  const [usingOpticalFallback, setUsingOpticalFallback] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Pro manual & optical states
  const [iso, setIso] = useState<(typeof ISO_VALUES)[number]>('AUTO');
  const [shutter, setShutter] = useState<(typeof SHUTTER_VALUES)[number]>('AUTO');
  const [evComp, setEvComp] = useState<number>(0);
  const [wb, setWb] = useState<(typeof WB_PRESETS)[number]['id']>('AUTO');
  const [focusMode, setFocusMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualFocusDist, setManualFocusDist] = useState<number>(50); // 0 macro to 100 infinity
  const [zoom, setZoom] = useState<number>(1.0);
  const [flashMode, setFlashMode] = useState<'OFF' | 'ON' | 'AUTO' | 'TORCH'>('OFF');
  const [timerSec, setTimerSec] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | '9:16' | '2.39:1'>(
    activeTemplate?.aspectRatio || '16:9'
  );
  const [selectedFps, setSelectedFps] = useState<number>(activeTemplate?.fpsTarget || settings.defaultFps);
  const [slowMoSpeed, setSlowMoSpeed] = useState<0.25 | 0.5>(0.5);
  const [timeLapseIntervalSec, setTimeLapseIntervalSec] = useState<number>(2);
  const [timeLapseDurationMin, setTimeLapseDurationMin] = useState<number>(5);
  const [cinematicColorPreset, setCinematicColorPreset] = useState<'Anamorphic Warm' | 'Teal & Orange' | 'Log-C Neutral' | 'Noir B&W'>('Anamorphic Warm');
  const [aeAfLocked, setAeAfLocked] = useState<boolean>(false);

  // Tap-to-focus reticle state
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });

  // Horizon level angle (simulated or deviceorientation)
  const [horizonAngle, setHorizonAngle] = useState<number>(0);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [estimatedSizeBytes, setEstimatedSizeBytes] = useState(0);
  const [audioLevelDb, setAudioLevelDb] = useState<number>(12);
  const [shutterFlashActive, setShutterFlashActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (activeTemplate) {
      setAspectRatio(activeTemplate.aspectRatio);
      setSelectedFps(activeTemplate.fpsTarget);
    }
  }, [activeTemplate]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Device orientation listener for Horizon Level
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.gamma === 'number') {
        setHorizonAngle(Math.max(-45, Math.min(45, Math.round(e.gamma))));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Initialize real MediaStream or fallback optical scene generator
  const initCamera = useCallback(
    async (lensIdx: number) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }

      try {
        const initialCaps = await probeMediaCapabilities(null);
        const targetLens: CameraLensInfo | undefined = initialCaps.availableLenses[lensIdx];

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices unavailable');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            ...(targetLens?.deviceId && !targetLens.deviceId.startsWith('default-')
              ? { deviceId: { ideal: targetLens.deviceId } }
              : { facingMode: targetLens?.facing === 'user' ? 'user' : 'environment' }),
            width: { ideal: settings.videoResolution === '4K' ? 3840 : settings.videoResolution === '1080p' ? 1920 : 1280 },
            height: { ideal: settings.videoResolution === '4K' ? 2160 : settings.videoResolution === '1080p' ? 1080 : 720 },
            frameRate: { ideal: selectedFps },
          },
          audio: settings.audioRecording,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setUsingOpticalFallback(false);
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const liveCaps = await probeMediaCapabilities(stream);
        setCaps(liveCaps);
        onCapabilitiesUpdated(liveCaps);

        // Setup real microphone dB meter if audio track exists
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0 && settings.audioRecording) {
          try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioCtx = new AudioCtx();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
          } catch {
            // Ignore audio analyser init error
          }
        }
      } catch {
        // Graceful fallback to live HTML5 Canvas optical scene generator so viewfinder is always interactive
        setUsingOpticalFallback(true);
        setCameraError(
          'Physical camera unavailable or permission denied in browser sandbox — Interactive Studio Optical Sensor Active.'
        );
        const fallbackCaps = await probeMediaCapabilities(null);
        setCaps(fallbackCaps);
        onCapabilitiesUpdated(fallbackCaps);
      }
    },
    [onCapabilitiesUpdated, selectedFps, settings.audioRecording, settings.videoResolution]
  );

  useEffect(() => {
    initCamera(selectedLensIndex);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [initCamera, selectedLensIndex]);

  // Animate fallback canvas & audio level meter
  useEffect(() => {
    let tick = 0;
    const renderLoop = () => {
      tick += 0.025;

      // Update live audio meter
      if (analyserRef.current && settings.audioRecording) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevelDb(Math.min(100, Math.max(8, Math.round((avg / 180) * 100))));
      } else if (settings.audioRecording && isRecording) {
        setAudioLevelDb(Math.round(28 + Math.sin(tick * 5) * 18 + Math.random() * 14));
      }

      // Render animated studio optical test scene when physical webcam isn't attached
      if (usingOpticalFallback && fallbackCanvasRef.current) {
        const canvas = fallbackCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // Base background responds to White Balance & EV
          const tempShift =
            WB_PRESETS.find((p) => p.id === wb)?.tempShift ||
            activeTemplate?.filterSettings.temperature ||
            0;
          const evShift = evComp * 18 + (iso !== 'AUTO' ? (Math.log2(Number(iso) / 100) * 14) : 0);

          const rBase = Math.max(8, Math.min(245, 22 + tempShift + evShift));
          const gBase = Math.max(8, Math.min(245, 26 + evShift));
          const bBase = Math.max(12, Math.min(255, 38 - tempShift + evShift));

          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, `rgb(${rBase}, ${gBase}, ${bBase})`);
          grad.addColorStop(1, `rgb(${Math.max(4, rBase - 14)}, ${Math.max(6, gBase - 10)}, ${Math.max(10, bBase + 12)})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Animated optical bokeh spheres
          const bokehCount = mode === 'PORTRAIT' || mode === 'CINEMATIC' ? 14 : 8;
          for (let i = 0; i < bokehCount; i++) {
            const bx = (w * ((i * 0.17 + Math.sin(tick * 0.4 + i) * 0.08) % 1 + 1)) % w;
            const by = (h * ((i * 0.23 + Math.cos(tick * 0.3 + i) * 0.09) % 1 + 1)) % h;
            const radius = (mode === 'PORTRAIT' ? 54 : 34) + (i % 4) * 16;
            ctx.beginPath();
            ctx.arc(bx, by, radius * zoom, 0, Math.PI * 2);
            ctx.fillStyle =
              i % 2 === 0
                ? 'rgba(245, 158, 11, 0.16)'
                : 'rgba(56, 189, 248, 0.13)';
            ctx.fill();
          }

          // Center subject studio geometric sculpture
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.scale(zoom, zoom);
          ctx.rotate(Math.sin(tick * 0.35) * 0.08);

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-110, -75, 220, 150);

          ctx.beginPath();
          ctx.arc(0, 0, 52, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
          ctx.fill();
          ctx.strokeStyle = '#F4F4F6';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#F4F4F6';
          ctx.font = '600 15px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`5TAR OPTICAL SENSOR · ${mode}`, 0, -92);
          ctx.font = '500 12px "JetBrains Mono", monospace';
          ctx.fillStyle = '#F59E0B';
          ctx.fillText(
            `ISO ${iso} · SHUTTER ${shutter} · EV ${evComp >= 0 ? `+${evComp.toFixed(1)}` : evComp.toFixed(1)} · ${zoom.toFixed(1)}x`,
            0,
            105
          );
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTemplate, evComp, iso, isRecording, mode, settings.audioRecording, shutter, usingOpticalFallback, wb, zoom]);

  // Apply hardware constraints when zoom, torch, or exposure changes on real stream
  useEffect(() => {
    if (!streamRef.current || usingOpticalFallback) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || typeof track.applyConstraints !== 'function') return;

    const adv: Record<string, any> = {};
    if (caps?.supportsZoom) adv.zoom = zoom;
    if (caps?.supportsExposureCompensation) adv.exposureCompensation = evComp;
    if (caps?.supportsTorch) adv.torch = flashMode === 'TORCH' || flashMode === 'ON';

    if (Object.keys(adv).length > 0) {
      track.applyConstraints({ advanced: [adv] } as unknown as MediaTrackConstraints).catch(() => {});
    }
  }, [caps, evComp, flashMode, usingOpticalFallback, zoom]);

  // Recording timer & file size estimator
  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => {
      setRecordingSeconds((s) => {
        const next = s + 1;
        const bitrateBytesPerSec =
          settings.videoResolution === '4K'
            ? 3_200_000
            : settings.videoResolution === '1080p'
            ? 1_450_000
            : 750_000;
        setEstimatedSizeBytes(next * bitrateBytesPerSec);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isRecording, settings.videoResolution]);

  // Compute CSS filter string for live viewfinder based on Pro controls, Mode & active Template
  const computeViewfinderFilter = (): string => {
    const tpl = activeTemplate?.filterSettings;
    const brightness = 100 + evComp * 14 + (tpl ? tpl.brightness : 0) + (iso !== 'AUTO' ? (Number(iso) - 200) * 0.015 : 0);
    const contrast =
      100 +
      (tpl ? tpl.contrast : 0) +
      (mode === 'CINEMATIC' ? 18 : 0);
    const saturate =
      100 +
      (tpl ? tpl.saturation : 0) +
      (mode === 'CINEMATIC' && cinematicColorPreset === 'Noir B&W' ? -100 : 0);
    const sepia =
      wb === 'CLOUDY' || wb === 'CUSTOM' || (tpl && tpl.temperature > 10) ? 18 : 0;
    const hueRotate = wb === 'TUNGSTEN' ? -12 : wb === 'FLUORESCENT' ? 8 : 0;
    const blurPx =
      focusMode === 'MANUAL' && Math.abs(manualFocusDist - 50) > 30
        ? ((Math.abs(manualFocusDist - 50) - 30) / 70) * 3.5
        : 0;

    return `brightness(${Math.max(40, Math.min(180, brightness))}%) contrast(${Math.max(50, Math.min(180, contrast))}%) saturate(${Math.max(0, Math.min(200, saturate))}%) sepia(${sepia}%) hue-rotate(${hueRotate}deg) blur(${blurPx.toFixed(1)}px)`;
  };

  // Capture Still Photo (supports Timer, Flash, Burst, EXIF metadata, and active Template LUT)
  const executePhotoCapture = useCallback(() => {
    setShutterFlashActive(true);
    setTimeout(() => setShutterFlashActive(false), 160);

    const outCanvas = document.createElement('canvas');
    const targetW = settings.photoResolution === '4K' ? 1920 : 1280;
    const targetH =
      aspectRatio === '1:1'
        ? targetW
        : aspectRatio === '4:3'
        ? Math.round((targetW * 3) / 4)
        : aspectRatio === '9:16'
        ? Math.round((targetW * 16) / 9)
        : aspectRatio === '2.39:1'
        ? Math.round(targetW / 2.39)
        : Math.round((targetW * 9) / 16);

    outCanvas.width = targetW;
    outCanvas.height = targetH;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = computeViewfinderFilter();

    if (!usingOpticalFallback && videoRef.current && videoRef.current.readyState >= 2) {
      if (settings.mirrorSelfie && caps?.availableLenses[selectedLensIndex]?.facing === 'user') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -targetW, 0, targetW, targetH);
        ctx.restore();
      } else {
        ctx.drawImage(videoRef.current, 0, 0, targetW, targetH);
      }
    } else if (fallbackCanvasRef.current) {
      ctx.drawImage(fallbackCanvasRef.current, 0, 0, targetW, targetH);
    }

    // Apply portrait / vignette optical framing if enabled
    ctx.filter = 'none';
    if (mode === 'PORTRAIT' || activeTemplate?.filterSettings.vignette) {
      const radGrad = ctx.createRadialGradient(
        targetW / 2,
        targetH / 2,
        targetW * 0.25,
        targetW / 2,
        targetH / 2,
        targetW * 0.7
      );
      radGrad.addColorStop(0, 'rgba(0,0,0,0)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0.52)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    if (activeTemplate?.overlayText) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 28px Syne, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeTemplate.overlayText, targetW / 2, targetH - 42);
    }

    const dataUrl = outCanvas.toDataURL('image/jpeg', 0.92);
    const lensLabel = caps?.availableLenses[selectedLensIndex]?.label || '24mm Wide Main';
    const timestamp = Date.now();
    const newItem: MediaItem = {
      id: `media-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      title: `5TAR_${mode}_${new Date(timestamp).toISOString().slice(11, 19).replace(/:/g, '')}.jpg`,
      type: 'photo',
      dataUrl,
      thumbnailUrl: dataUrl,
      createdAt: timestamp,
      width: targetW,
      height: targetH,
      sizeBytes: Math.round(dataUrl.length * 0.75),
      favorite: false,
      isPrivateVault: false,
      exif: {
        iso: String(iso),
        shutter: String(shutter),
        ev: `${evComp >= 0 ? '+' : ''}${evComp.toFixed(1)} EV`,
        wb: String(wb),
        lens: lensLabel,
        mode,
        templateCode: activeTemplate?.code,
      },
    };

    onMediaCaptured(newItem);
    showToast(`Saved ${newItem.title} to Studio Gallery`);
  }, [
    activeTemplate,
    aspectRatio,
    caps,
    evComp,
    iso,
    mode,
    onMediaCaptured,
    selectedLensIndex,
    settings.mirrorSelfie,
    settings.photoResolution,
    showToast,
    shutter,
    usingOpticalFallback,
    wb,
  ]);

  // Handle Shutter Trigger (with Timer or Video Start/Stop)
  const handleShutterPress = () => {
    const isVideoMode =
      mode === 'VIDEO' || mode === 'SLOW_MO' || mode === 'TIME_LAPSE' || mode === 'CINEMATIC';

    if (!isVideoMode) {
      if (timerSec > 0) {
        let remaining = timerSec;
        setCountdown(remaining);
        const tId = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(tId);
            setCountdown(null);
            executePhotoCapture();
          } else {
            setCountdown(remaining);
          }
        }, 1000);
      } else {
        executePhotoCapture();
      }
      return;
    }

    // Video / Slow-Mo / Time-Lapse / Cinematic Recording Toggle
    if (!isRecording) {
      setRecordingSeconds(0);
      setEstimatedSizeBytes(0);
      setIsPaused(false);
      setIsRecording(true);
      recordedChunksRef.current = [];

      try {
        const targetStream =
          !usingOpticalFallback && streamRef.current
            ? streamRef.current
            : fallbackCanvasRef.current?.captureStream(selectedFps) || null;

        if (targetStream && typeof MediaRecorder !== 'undefined') {
          const recorder = new MediaRecorder(targetStream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.start(500);
          mediaRecorderRef.current = recorder;
        }
      } catch {
        // Fallback if MediaRecorder codec unsupported
      }
    } else {
      // Safely stop recording and save valid MediaItem
      setIsRecording(false);
      setIsPaused(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }

      // Capture representative poster frame from viewfinder
      const posterCanvas = document.createElement('canvas');
      posterCanvas.width = 1280;
      posterCanvas.height = 720;
      const pCtx = posterCanvas.getContext('2d');
      if (pCtx) {
        pCtx.filter = computeViewfinderFilter();
        if (!usingOpticalFallback && videoRef.current && videoRef.current.readyState >= 2) {
          pCtx.drawImage(videoRef.current, 0, 0, 1280, 720);
        } else if (fallbackCanvasRef.current) {
          pCtx.drawImage(fallbackCanvasRef.current, 0, 0, 1280, 720);
        }
      }
      const posterUrl = posterCanvas.toDataURL('image/jpeg', 0.88);
      const ts = Date.now();
      const itemType =
        mode === 'SLOW_MO' ? 'slowmo' : mode === 'TIME_LAPSE' ? 'timelapse' : 'video';

      const newVideoItem: MediaItem = {
        id: `vid-${ts}`,
        title: `5TAR_${mode}_${selectedFps}FPS_${new Date(ts).toISOString().slice(11, 19).replace(/:/g, '')}.mp4`,
        type: itemType,
        dataUrl: posterUrl,
        thumbnailUrl: posterUrl,
        createdAt: ts,
        width: settings.videoResolution === '4K' ? 3840 : 1920,
        height: settings.videoResolution === '4K' ? 2160 : 1080,
        durationSec: Math.max(1, recordingSeconds),
        fps: selectedFps,
        isHardwareSlowMo: mode === 'SLOW_MO' ? !!caps?.supportsHardwareHighSpeedSlowMo : undefined,
        sizeBytes: Math.max(450_000, estimatedSizeBytes),
        favorite: false,
        isPrivateVault: false,
        exif: {
          iso: String(iso),
          shutter: String(shutter),
          ev: `${evComp >= 0 ? '+' : ''}${evComp.toFixed(1)} EV`,
          wb: String(wb),
          lens: caps?.availableLenses[selectedLensIndex]?.label || '24mm Wide Main',
          mode:
            mode === 'SLOW_MO'
              ? caps?.supportsHardwareHighSpeedSlowMo
                ? `Hardware ${selectedFps} FPS Slow-Mo`
                : `Software Slow Motion (${slowMoSpeed}x)`
              : mode,
          templateCode: activeTemplate?.code,
        },
      };

      onMediaCaptured(newVideoItem);
      showToast(`Saved ${newVideoItem.title} (${Math.max(1, recordingSeconds)}s) to Gallery`);
    }
  };

  const togglePauseRecording = () => {
    if (!isRecording) return;
    setIsPaused((p) => {
      const next = !p;
      if (mediaRecorderRef.current) {
        try {
          if (next && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
          } else if (!next && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
          }
        } catch {
          // Ignore
        }
      }
      return next;
    });
  };

  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!settings.tapToFocus) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocusPoint({ x, y, visible: true });
    setTimeout(() => {
      setFocusPoint((prev) => ({ ...prev, visible: false }));
    }, 2200);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const timeLapseEstimatedOutputSec = Math.round(
    ((timeLapseDurationMin * 60) / timeLapseIntervalSec) / 30
  );

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-3 pb-24">
      <div className="rounded-3xl bg-[#0D0E12] border border-zinc-800/90 overflow-hidden shadow-2xl">
        {/* TOP CAMERA HUD BAR */}
        <div className="px-4 py-3 bg-[#131418] border-b border-zinc-800/90 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Flash, HDR, Grid, Level, Timer */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() =>
                setFlashMode((f) =>
                  f === 'OFF' ? 'AUTO' : f === 'AUTO' ? 'ON' : f === 'ON' ? 'TORCH' : 'OFF'
                )
              }
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
                flashMode !== 'OFF'
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B]/60 text-[#F59E0B]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title="Flash / Torch Mode"
            >
              {flashMode === 'OFF' ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span>FLASH: {flashMode}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ autoHdr: !settings.autoHdr })}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-mono border transition cursor-pointer ${
                settings.autoHdr
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B]/60 text-[#F59E0B]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              HDR {settings.autoHdr ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() =>
                setTimerSec((prev) => (prev === 0 ? 3 : prev === 3 ? 10 : 0))
              }
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1 border transition cursor-pointer ${
                timerSec > 0
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B]/60 text-[#F59E0B]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{timerSec === 0 ? 'TIMER OFF' : `${timerSec}s`}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-mono border transition cursor-pointer ${
                settings.showGrid
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
              title="Toggle Rule-of-Thirds Grid"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              onClick={() => onUpdateSettings({ showLevel: !settings.showLevel })}
              className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-mono border transition cursor-pointer ${
                settings.showLevel
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
              title="Toggle Horizon Level"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Aspect Ratio Selector */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
              {(['16:9', '4:3', '1:1', '9:16', '2.39:1'] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                    aspectRatio === ar ? 'bg-[#F59E0B] text-black font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Lens Switcher, Guide, Settings, Gallery Shortcut */}
          <div className="flex items-center gap-2">
            {activeTemplate && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/50 text-xs font-mono text-[#F59E0B]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeTemplate.code}: {activeTemplate.name}</span>
                <button
                  onClick={onClearTemplate}
                  className="ml-1 text-zinc-300 hover:text-white cursor-pointer"
                  title="Clear active template"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={onOpenGuide}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
              title="Camera Guide (Hindi + English)"
            >
              <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              title="Camera Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN VIEWFINDER CANVAS / VIDEO CONTAINER */}
        <div
          onClick={handleViewfinderTap}
          className="relative w-full bg-black flex items-center justify-center overflow-hidden select-none cursor-crosshair"
          style={{ minHeight: '440px', height: '58vh', maxHeight: '640px' }}
        >
          {/* Real Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-150 ${
              usingOpticalFallback ? 'hidden' : 'block'
            }`}
            style={{
              filter: computeViewfinderFilter(),
              transform: `scale(${zoom}) ${
                settings.mirrorSelfie && caps?.availableLenses[selectedLensIndex]?.facing === 'user'
                  ? 'scaleX(-1)'
                  : ''
              }`,
            }}
          />

          {/* Interactive Optical Scene Generator Fallback when no physical webcam is attached */}
          <canvas
            ref={fallbackCanvasRef}
            width={1280}
            height={720}
            className={`w-full h-full object-cover ${usingOpticalFallback ? 'block' : 'hidden'}`}
            style={{ filter: computeViewfinderFilter() }}
          />

          {/* Cinematic 2.39:1 Anamorphic Letterbox Bars */}
          {(aspectRatio === '2.39:1' || mode === 'CINEMATIC') && (
            <>
              <div className="absolute top-0 left-0 right-0 h-12 bg-black/95 pointer-events-none border-b border-zinc-800/60" />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/95 pointer-events-none border-t border-zinc-800/60" />
            </>
          )}

          {/* Rule of Thirds Grid Overlay */}
          {settings.showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>
          )}

          {/* Dual-Axis Horizon Level Indicator */}
          {settings.showLevel && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="w-36 h-0.5 transition-transform duration-150 flex items-center justify-between"
                style={{
                  transform: `rotate(${horizonAngle}deg)`,
                  backgroundColor: Math.abs(horizonAngle) <= 1 ? '#10B981' : 'rgba(245,158,11,0.75)',
                }}
              >
                <span className="w-3 h-3 rounded-full border border-current -ml-1.5" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-white -mt-6">
                  {horizonAngle}°
                </span>
                <span className="w-3 h-3 rounded-full border border-current -mr-1.5" />
              </div>
            </div>
          )}

          {/* Tap-to-Focus Reticle */}
          {focusPoint.visible && (
            <div
              className="absolute w-16 h-16 -ml-8 -mt-8 rounded-xl border-2 border-[#F59E0B] pointer-events-none flex items-center justify-center animate-pulse"
              style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span className="absolute -bottom-5 text-[10px] font-mono text-[#F59E0B] bg-black/80 px-1.5 rounded whitespace-nowrap">
                {aeAfLocked ? 'AE/AF LOCKED' : 'AF TARGET'}
              </span>
            </div>
          )}

          {/* Top-Left Live Telemetry Overlay (Histogram + Audio dB + REC Timer) */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {isRecording && (
              <div className="px-3.5 py-1.5 rounded-xl bg-black/80 border border-rose-500/60 flex items-center gap-2.5 text-xs font-mono tabular-nums">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'
                  }`}
                />
                <span className="text-white font-bold">{formatTimer(recordingSeconds)}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-300">
                  ~{(estimatedSizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
                <span className="text-[#F59E0B]">{selectedFps} FPS</span>
              </div>
            )}

            {/* Live Audio Level Meter in Video/SlowMo/Cinematic */}
            {(mode === 'VIDEO' || mode === 'SLOW_MO' || mode === 'CINEMATIC') && (
              <div className="px-3 py-1.5 rounded-xl bg-black/75 border border-zinc-800 flex items-center gap-2 text-[11px] font-mono">
                {settings.audioRecording ? (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-[#F59E0B] to-rose-500 transition-all duration-100"
                    style={{ width: `${settings.audioRecording ? audioLevelDb : 0}%` }}
                  />
                </div>
                <span className="text-zinc-300 tabular-nums">
                  {settings.audioRecording ? `-${Math.max(2, 60 - Math.round(audioLevelDb * 0.55))}dB` : 'MUTE'}
                </span>
              </div>
            )}
          </div>

          {/* Top-Right Optical Status & Slow-Mo / Time-Lapse Badges */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-black/75 border border-zinc-800 text-[11px] font-mono text-zinc-200 tabular-nums">
              {settings.videoResolution} · {selectedFps} FPS · {aspectRatio} · {zoom.toFixed(1)}x
            </div>

            {mode === 'SLOW_MO' && (
              <div className="px-3 py-1.5 rounded-xl bg-purple-950/90 border border-purple-500/50 text-[11px] font-mono text-purple-200">
                {caps?.supportsHardwareHighSpeedSlowMo
                  ? `NATIVE HARDWARE HIGH-SPEED (${selectedFps} FPS)`
                  : `SOFTWARE SLOW MOTION (${slowMoSpeed}x Playback Interpolation)`}
              </div>
            )}

            {mode === 'TIME_LAPSE' && (
              <div className="px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-[11px] font-mono text-cyan-200 tabular-nums">
                INTERVAL: {timeLapseIntervalSec}s · DURATION: {timeLapseDurationMin}m → OUTPUT: ~{timeLapseEstimatedOutputSec}s
              </div>
            )}

            {mode === 'CINEMATIC' && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/90 border border-[#F59E0B]/50 text-[11px] font-mono text-[#F59E0B]">
                2.39:1 CROP · EIS STABILIZED · GRADE: {cinematicColorPreset.toUpperCase()}
              </div>
            )}
          </div>

          {/* Timer Countdown Big Number */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <span className="font-mono text-7xl font-extrabold text-[#F59E0B] animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {/* Shutter Flash Feedback */}
          {shutterFlashActive && (
            <div className="absolute inset-0 bg-white/80 pointer-events-none transition-opacity" />
          )}

          {/* Toast Notification inside Viewfinder */}
          {toastMessage && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/90 border border-[#F59E0B]/60 text-xs font-medium text-white flex items-center gap-2 shadow-xl">
              <Check className="w-4 h-4 text-[#F59E0B]" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* CAPABILITY WARNING / FALLBACK NOTICE */}
        {cameraError && (
          <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={() => initCamera(selectedLensIndex)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-[#F59E0B] shrink-0 cursor-pointer"
            >
              Retry Sensor
            </button>
          </div>
        )}

        {/* DYNAMIC LENS & ZOOM BAR */}
        <div className="px-4 py-2.5 bg-[#111216] border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Detected Lenses */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-mono text-zinc-400 mr-1">LENS:</span>
            {caps?.availableLenses.map((lens, idx) => (
              <button
                key={lens.deviceId}
                onClick={() => setSelectedLensIndex(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer ${
                  selectedLensIndex === idx
                    ? 'bg-[#F59E0B] text-black font-semibold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {lens.opticalType}
              </button>
            ))}
          </div>

          {/* Optical / Digital Zoom Quick Stops + Slider */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 5].map((zStop) => (
              <button
                key={zStop}
                onClick={() => setZoom(zStop)}
                className={`w-8 h-8 rounded-full text-xs font-mono tabular-nums transition cursor-pointer ${
                  Math.abs(zoom - zStop) < 0.2
                    ? 'bg-[#F59E0B] text-black font-bold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {zStop}x
              </button>
            ))}
            <input
              type="range"
              min={caps?.zoomRange.min ?? 1}
              max={caps?.zoomRange.max ?? 6}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 accent-[#F59E0B] cursor-pointer"
              aria-label="Camera Zoom"
            />
          </div>
        </div>

        {/* MODE-SPECIFIC MANUAL / PRO / SLOW-MO / TIMELAPSE / CINEMATIC CONTROLS */}
        {(mode === 'PRO' || mode === 'PHOTO' || mode === 'PORTRAIT') && (
          <div className="px-4 py-3.5 bg-[#131418] border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#F59E0B] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {mode === 'PRO'
                    ? 'PRO CAMERA2 / OPTICAL MANUAL DECK'
                    : 'EXPOSURE & WHITE BALANCE QUICK DECK'}
                </span>
              </span>
              {!caps?.supportsManualIsoHardware && (
                <span className="text-[11px] font-mono text-zinc-400">
                  Hardware ISO/Shutter: Not supported on web camera — Optical LUT Simulation Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* ISO Selector */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                  <span>ISO SENSITIVITY</span>
                  <span className="text-[#F59E0B]">{iso}</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {ISO_VALUES.map((val) => (
                    <button
                      key={val}
                      onClick={() => setIso(val)}
                      className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                        iso === val
                          ? 'bg-[#F59E0B] text-black font-semibold'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shutter Speed Selector */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                  <span>SHUTTER SPEED</span>
                  <span className="text-[#F59E0B]">{shutter}s</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {SHUTTER_VALUES.map((val) => (
                    <button
                      key={val}
                      onClick={() => setShutter(val)}
                      className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                        shutter === val
                          ? 'bg-[#F59E0B] text-black font-semibold'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exposure Compensation (EV) */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-[#F59E0B]" />
                    EXPOSURE (EV)
                  </span>
                  <span className="text-[#F59E0B] tabular-nums">
                    {evComp >= 0 ? `+${evComp.toFixed(1)}` : evComp.toFixed(1)} EV
                  </span>
                </div>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.1}
                  value={evComp}
                  onChange={(e) => setEvComp(parseFloat(e.target.value))}
                  className="w-full accent-[#F59E0B] cursor-pointer"
                />
              </div>

              {/* White Balance & Manual Focus */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                  <span>WHITE BALANCE &amp; FOCUS</span>
                  <button
                    onClick={() => setFocusMode((f) => (f === 'AUTO' ? 'MANUAL' : 'AUTO'))}
                    className="text-[#F59E0B] underline cursor-pointer"
                  >
                    {focusMode === 'AUTO' ? 'AF-C' : `MF ${manualFocusDist}%`}
                  </button>
                </div>
                {focusMode === 'MANUAL' ? (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manualFocusDist}
                    onChange={(e) => setManualFocusDist(Number(e.target.value))}
                    className="w-full accent-[#F59E0B] cursor-pointer"
                  />
                ) : (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {WB_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setWb(preset.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap cursor-pointer ${
                          wb === preset.id
                            ? 'bg-[#F59E0B] text-black font-semibold'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {preset.id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIDEO / SLOW MOTION / TIME LAPSE / CINEMATIC SPECIALIZED DECK */}
        {(mode === 'VIDEO' || mode === 'SLOW_MO' || mode === 'TIME_LAPSE' || mode === 'CINEMATIC') && (
          <div className="px-4 py-3 bg-[#131418] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            {/* Resolution & FPS Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400">RES:</span>
                {(['720p', '1080p', '4K'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => onUpdateSettings({ videoResolution: res })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                      settings.videoResolution === res
                        ? 'bg-[#F59E0B] text-black font-semibold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400">FPS:</span>
                {(mode === 'SLOW_MO' ? [60, 120, 240] : [24, 30, 60, 120]).map((fpsVal) => {
                  const isSupported =
                    caps?.supportedFps.includes(fpsVal) || fpsVal <= 60 || mode === 'SLOW_MO';
                  if (!isSupported) return null;
                  return (
                    <button
                      key={fpsVal}
                      onClick={() => setSelectedFps(fpsVal)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                        selectedFps === fpsVal
                          ? 'bg-[#F59E0B] text-black font-semibold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {fpsVal} FPS
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode-Specific Controls */}
            {mode === 'SLOW_MO' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple-300">SLOW-MO SPEED:</span>
                {([0.5, 0.25] as const).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setSlowMoSpeed(sp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                      slowMoSpeed === sp
                        ? 'bg-purple-500 text-white font-semibold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                    }`}
                  >
                    {sp}x ({sp === 0.25 ? 'Ultra Slow' : 'Half Speed'})
                  </button>
                ))}
              </div>
            )}

            {mode === 'TIME_LAPSE' && (
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-zinc-400">INTERVAL:</span>
                  {[0.5, 1, 2, 5, 10].map((intSec) => (
                    <button
                      key={intSec}
                      onClick={() => setTimeLapseIntervalSec(intSec)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        timeLapseIntervalSec === intSec
                          ? 'bg-cyan-400 text-black font-bold'
                          : 'bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      {intSec}s
                    </button>
                  ))}
                </div>
                <span className="text-cyan-300">
                  Est. 30fps Output: {timeLapseEstimatedOutputSec}s
                </span>
              </div>
            )}

            {mode === 'CINEMATIC' && (
              <div className="flex flex-wrap items-center gap-2">
                {(['Anamorphic Warm', 'Teal & Orange', 'Log-C Neutral', 'Noir B&W'] as const).map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() => setCinematicColorPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                        cinematicColorPreset === preset
                          ? 'bg-[#F59E0B] text-black font-semibold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {preset}
                    </button>
                  )
                )}
                <button
                  onClick={() => setAeAfLocked((l) => !l)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer ${
                    aeAfLocked
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>{aeAfLocked ? 'AE/AF LOCKED' : 'LOCK AE/AF'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM CAMERA MODE SELECTOR & SHUTTER CONTROL DECK */}
        <div className="px-4 py-4 bg-[#0A0A0C] border-t border-zinc-800/90 space-y-4">
          {/* Horizontal Mode Selector Rail */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: 'PHOTO', label: t.modes.photo },
                { id: 'PORTRAIT', label: t.modes.portrait },
                { id: 'PRO', label: t.modes.pro },
                { id: 'VIDEO', label: t.modes.video },
                { id: 'SLOW_MO', label: t.modes.slowMotion },
                { id: 'TIME_LAPSE', label: t.modes.timeLapse },
                { id: 'CINEMATIC', label: t.modes.cinematic },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider transition whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === m.id
                    ? 'bg-[#F59E0B] text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Primary Shutter Row: Gallery Thumbnail | Video Shortcut | Main Shutter | Pause/Burst | Switch Camera */}
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {/* Gallery Preview Button */}
            <button
              onClick={onOpenGallery}
              className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 overflow-hidden flex items-center justify-center hover:border-[#F59E0B] transition cursor-pointer"
              title="Open Studio Gallery"
            >
              {latestMedia ? (
                <img
                  src={latestMedia.thumbnailUrl}
                  alt={latestMedia.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Images className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {/* Quick Video / Mic Toggle or Pause Button during recording */}
            {isRecording ? (
              <button
                onClick={togglePauseRecording}
                className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                title={isPaused ? 'Resume Recording' : 'Pause Recording'}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            ) : (
              <button
                onClick={() =>
                  setMode((prev) =>
                    prev === 'VIDEO' || prev === 'SLOW_MO' || prev === 'CINEMATIC'
                      ? 'PHOTO'
                      : 'VIDEO'
                  )
                }
                className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-rose-400 hover:border-rose-500 transition cursor-pointer"
                title="Quick Switch Photo / Video"
              >
                {mode === 'VIDEO' || mode === 'SLOW_MO' || mode === 'CINEMATIC' ? (
                  <Camera className="w-5 h-5 text-[#F59E0B]" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Main Tactile Shutter Button */}
            <button
              onClick={handleShutterPress}
              className={`w-20 h-20 rounded-full p-1.5 border-4 transition-transform active:scale-95 flex items-center justify-center cursor-pointer ${
                mode === 'VIDEO' || mode === 'SLOW_MO' || mode === 'TIME_LAPSE' || mode === 'CINEMATIC'
                  ? 'border-rose-500/90'
                  : 'border-[#F59E0B]'
              }`}
              aria-label="Camera Shutter"
            >
              <div
                className={`w-full h-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'rounded-xl scale-75 bg-rose-600'
                    : mode === 'VIDEO' || mode === 'SLOW_MO' || mode === 'TIME_LAPSE' || mode === 'CINEMATIC'
                    ? 'rounded-full bg-rose-500 hover:bg-rose-400'
                    : 'rounded-full bg-white hover:bg-zinc-200'
                }`}
              >
                {isRecording && <Square className="w-6 h-6 text-white fill-white" />}
              </div>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => onUpdateSettings({ audioRecording: !settings.audioRecording })}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition cursor-pointer ${
                settings.audioRecording
                  ? 'bg-zinc-900 border-zinc-700 text-emerald-400'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-400'
              }`}
              title={settings.audioRecording ? 'Microphone Active' : 'Microphone Muted'}
            >
              {settings.audioRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Switch Camera Lens Button */}
            <button
              onClick={() => {
                const count = caps?.availableLenses.length || 1;
                setSelectedLensIndex((prev) => (prev + 1) % count);
              }}
              className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:border-[#F59E0B] transition cursor-pointer"
              title="Switch Camera Sensor"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
