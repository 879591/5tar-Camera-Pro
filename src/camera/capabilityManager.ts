export interface CameraLensInfo {
  deviceId: string;
  label: string;
  facing: 'user' | 'environment' | 'external';
  opticalType: 'Wide (Main)' | 'Ultra-Wide' | 'Telephoto' | 'Front Selfie' | 'External Pro';
}

export interface HardwareCapabilities {
  platform: 'Web Browser (MediaDevices)' | 'Android Native (CameraX/Camera2)';
  cameraPermission: 'granted' | 'denied' | 'prompt';
  micPermission: 'granted' | 'denied' | 'prompt';
  availableLenses: CameraLensInfo[];
  supportedResolutions: Array<{ label: string; width: number; height: number }>;
  supportedFps: number[];
  maxHardwareFps: number;
  supportsHardwareHighSpeedSlowMo: boolean;
  supportsTorch: boolean;
  supportsZoom: boolean;
  zoomRange: { min: number; max: number; step: number };
  supportsExposureCompensation: boolean;
  exposureRange: { min: number; max: number; step: number };
  supportsManualFocus: boolean;
  supportsManualWhiteBalance: boolean;
  supportsManualIsoHardware: boolean;
  supportsManualShutterHardware: boolean;
  supportsRawCapture: boolean;
  supportsHdrHardware: boolean;
  supportsOpticalStabilization: boolean;
}

export const DEFAULT_CAPABILITIES: HardwareCapabilities = {
  platform: 'Web Browser (MediaDevices)',
  cameraPermission: 'prompt',
  micPermission: 'prompt',
  availableLenses: [
    {
      deviceId: 'default-rear',
      label: '24mm Wide Main Sensor',
      facing: 'environment',
      opticalType: 'Wide (Main)',
    },
  ],
  supportedResolutions: [
    { label: '720p HD (1280×720)', width: 1280, height: 720 },
    { label: '1080p FHD (1920×1080)', width: 1920, height: 1080 },
  ],
  supportedFps: [24, 30, 60],
  maxHardwareFps: 60,
  supportsHardwareHighSpeedSlowMo: false,
  supportsTorch: false,
  supportsZoom: true,
  zoomRange: { min: 1, max: 6, step: 0.1 },
  supportsExposureCompensation: true,
  exposureRange: { min: -3, max: 3, step: 0.1 },
  supportsManualFocus: false,
  supportsManualWhiteBalance: false,
  supportsManualIsoHardware: false,
  supportsManualShutterHardware: false,
  supportsRawCapture: false,
  supportsHdrHardware: false,
  supportsOpticalStabilization: false,
};

export async function probeMediaCapabilities(
  activeStream?: MediaStream | null
): Promise<HardwareCapabilities> {
  const caps: HardwareCapabilities = {
    ...DEFAULT_CAPABILITIES,
    availableLenses: [],
    supportedResolutions: [
      { label: '720p HD (1280×720)', width: 1280, height: 720 },
      { label: '1080p FHD (1920×1080)', width: 1920, height: 1080 },
    ],
    supportedFps: [24, 30],
  };

  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return DEFAULT_CAPABILITIES;
  }

  try {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const camPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
        caps.cameraPermission = camPerm.state;
      } catch {
        // Ignore if browser doesn't support 'camera' query
      }
      try {
        const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        caps.micPermission = micPerm.state;
      } catch {
        // Ignore
      }
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');

    if (videoInputs.length > 0) {
      caps.availableLenses = videoInputs.map((d, idx) => {
        const lower = (d.label || '').toLowerCase();
        const isFront = lower.includes('front') || lower.includes('user') || lower.includes('facetime');
        const isUltra = lower.includes('ultra') || lower.includes('0.5') || lower.includes('wide-angle');
        const isTele = lower.includes('tele') || lower.includes('zoom');

        let opticalType: CameraLensInfo['opticalType'] = 'Wide (Main)';
        if (isFront) opticalType = 'Front Selfie';
        else if (isUltra) opticalType = 'Ultra-Wide';
        else if (isTele) opticalType = 'Telephoto';
        else if (idx > 1) opticalType = 'External Pro';

        return {
          deviceId: d.deviceId || `cam-${idx}`,
          label: d.label || `Camera Lens ${idx + 1}`,
          facing: isFront ? 'user' : 'environment',
          opticalType,
        };
      });
    } else {
      caps.availableLenses = DEFAULT_CAPABILITIES.availableLenses;
    }

    if (activeStream) {
      caps.cameraPermission = 'granted';
      const videoTrack = activeStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const rawCaps = videoTrack.getCapabilities() as Record<string, any>;

        if (rawCaps.width?.max >= 3840 || rawCaps.height?.max >= 2160) {
          caps.supportedResolutions.push({ label: '4K UHD (3840×2160)', width: 3840, height: 2160 });
        }

        const maxFps = rawCaps.frameRate?.max || 30;
        caps.maxHardwareFps = Math.round(maxFps);
        caps.supportedFps = [24, 30];
        if (maxFps >= 60) caps.supportedFps.push(60);
        if (maxFps >= 120) {
          caps.supportedFps.push(120);
          caps.supportsHardwareHighSpeedSlowMo = true;
        }
        if (maxFps >= 240) {
          caps.supportedFps.push(240);
        }

        if (typeof rawCaps.torch === 'boolean') {
          caps.supportsTorch = rawCaps.torch;
        }

        if (rawCaps.zoom) {
          caps.supportsZoom = true;
          caps.zoomRange = {
            min: rawCaps.zoom.min ?? 1,
            max: rawCaps.zoom.max ?? 6,
            step: rawCaps.zoom.step ?? 0.1,
          };
        }

        if (rawCaps.exposureCompensation) {
          caps.supportsExposureCompensation = true;
          caps.exposureRange = {
            min: rawCaps.exposureCompensation.min ?? -3,
            max: rawCaps.exposureCompensation.max ?? 3,
            step: rawCaps.exposureCompensation.step ?? 0.1,
          };
        }

        if (Array.isArray(rawCaps.focusMode) && rawCaps.focusMode.includes('manual')) {
          caps.supportsManualFocus = true;
        }

        if (Array.isArray(rawCaps.whiteBalanceMode) && rawCaps.whiteBalanceMode.includes('manual')) {
          caps.supportsManualWhiteBalance = true;
        }

        if (rawCaps.iso) {
          caps.supportsManualIsoHardware = true;
        }
        if (rawCaps.exposureTime) {
          caps.supportsManualShutterHardware = true;
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  return caps;
}
