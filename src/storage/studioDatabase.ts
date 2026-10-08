import { StudioTemplate } from '../data/templates';

export interface MediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video' | 'slowmo' | 'timelapse' | 'edited';
  dataUrl: string;
  thumbnailUrl: string;
  createdAt: number;
  width: number;
  height: number;
  durationSec?: number;
  fps?: number;
  isHardwareSlowMo?: boolean;
  sizeBytes: number;
  favorite: boolean;
  isPrivateVault: boolean;
  encryptedPayload?: string;
  ivHex?: string;
  exif: {
    iso: string;
    shutter: string;
    ev: string;
    wb: string;
    lens: string;
    mode: string;
    templateCode?: string;
  };
}

export interface TimelineClip {
  id: string;
  mediaId: string;
  title: string;
  type: 'photo' | 'video';
  dataUrl: string;
  startTime: number;
  endTime: number;
  duration: number;
  speed: 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 4;
  volume: number;
  fadeInSec: number;
  fadeOutSec: number;
  transition: 'None' | 'Fade' | 'Cross Dissolve' | 'Flash Cut' | 'Whip Pan' | 'Film Burn';
  rotation: number;
  flipH: boolean;
  cropAspect: 'Original' | '16:9' | '9:16' | '4:3' | '1:1' | '2.39:1';
}

export interface OverlayLayer {
  id: string;
  kind: 'text' | 'sticker';
  content: string;
  fontFamily: 'Syne' | 'Plus Jakarta Sans' | 'JetBrains Mono';
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  xPercent: number;
  yPercent: number;
  align: 'left' | 'center' | 'right';
}

export interface StudioProject {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' | '2.39:1';
  clips: TimelineClip[];
  overlays: OverlayLayer[];
  filterSettings: StudioTemplate['filterSettings'];
  audioTrackName: string;
  audioVolume: number;
  audioFadeIn: boolean;
  audioFadeOut: boolean;
  exportHistory: Array<{
    exportedAt: number;
    resolution: string;
    quality: string;
    format: string;
    sizeKb: number;
  }>;
}

export interface CameraAppSettings {
  photoResolution: '1080p' | '4K';
  videoResolution: '720p' | '1080p' | '4K';
  defaultFps: 24 | 30 | 60 | 120;
  showGrid: boolean;
  showLevel: boolean;
  showHistogram: boolean;
  tapToFocus: boolean;
  volumeShutter: boolean;
  saveLocationTag: boolean;
  mirrorSelfie: boolean;
  autoHdr: boolean;
  stabilization: boolean;
  audioRecording: boolean;
  maxScreenBrightness: boolean;
  keepScreenAwake: boolean;
  appLockEnabled: boolean;
  autoLockTimeout: 'Immediately' | '1 minute' | '5 minutes' | 'Never';
  language: 'en' | 'hi';
}

export const DEFAULT_SETTINGS: CameraAppSettings = {
  photoResolution: '4K',
  videoResolution: '1080p',
  defaultFps: 60,
  showGrid: true,
  showLevel: true,
  showHistogram: true,
  tapToFocus: true,
  volumeShutter: true,
  saveLocationTag: false,
  mirrorSelfie: true,
  autoHdr: true,
  stabilization: true,
  audioRecording: true,
  maxScreenBrightness: false,
  keepScreenAwake: true,
  appLockEnabled: false,
  autoLockTimeout: '5 minutes',
  language: 'en',
};

const DB_NAME = '5tarCameraProDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllMediaItems(): Promise<MediaItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('media', 'readonly');
      const store = tx.objectStore('media');
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as MediaItem[]) || [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveMediaItem(item: MediaItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteMediaItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllProjects(): Promise<StudioProject[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readonly');
      const req = tx.objectStore('projects').getAll();
      req.onsuccess = () => {
        const list = (req.result as StudioProject[]) || [];
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveProject(project: StudioProject): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    tx.objectStore('projects').put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    tx.objectStore('projects').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Generate initial studio showcase media using HTML5 Canvas so there are zero external broken URLs
export function createInitialStudioSamples(): { media: MediaItem[]; projects: StudioProject[] } {
  const makeSampleCanvas = (
    title: string,
    subtitle: string,
    c1: string,
    c2: string,
    accent: string,
    iso: string,
    shutter: string
  ): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const grad = ctx.createLinearGradient(0, 0, 960, 540);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Optical bokeh circles
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(120 + i * 95, 180 + Math.sin(i * 1.4) * 110, 45 + (i % 3) * 28, 0, Math.PI * 2);
      ctx.fillStyle = `${accent}22`;
      ctx.fill();
    }

    // Rule of thirds subtle hairline
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 45, 840, 450);

    // Subject focal badge
    ctx.fillStyle = '#F4F4F6';
    ctx.font = 'bold 38px Syne, sans-serif';
    ctx.fillText(title, 96, 260);

    ctx.fillStyle = accent;
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle, 96, 302);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.fillText(`5TAR CAMERA PRO · ${iso} · ${shutter} · 24mm f/1.8`, 96, 455);

    return canvas.toDataURL('image/jpeg', 0.88);
  };

  const sample1Url = makeSampleCanvas(
    'Golden Hour Anamorphic',
    'Shot on 5tar Camera Pro · CINE-001 Grade',
    '#0F172A',
    '#451A03',
    '#F59E0B',
    'ISO 100',
    '1/50s'
  );
  const sample2Url = makeSampleCanvas(
    'Mumbai Monsoon Street 120FPS',
    'High-Speed Slow Motion · REEL-029 Grade',
    '#090D16',
    '#064E3B',
    '#10B981',
    'ISO 400',
    '1/250s'
  );
  const sample3Url = makeSampleCanvas(
    'Shibuya Cyber Night Portrait',
    'Low-Light Pro Manual · NEON-056 Grade',
    '#09090B',
    '#3B0764',
    '#06B6D4',
    'ISO 800',
    '1/30s'
  );

  const now = Date.now();
  const media: MediaItem[] = [
    {
      id: 'sample-media-1',
      title: 'Golden_Hour_Anamorphic_01.jpg',
      type: 'photo',
      dataUrl: sample1Url,
      thumbnailUrl: sample1Url,
      createdAt: now - 3600_000 * 5,
      width: 3840,
      height: 2160,
      sizeBytes: 2_450_000,
      favorite: true,
      isPrivateVault: false,
      exif: {
        iso: '100',
        shutter: '1/50',
        ev: '-0.3 EV',
        wb: '5600K Daylight',
        lens: '24mm Wide (Main)',
        mode: 'PRO',
        templateCode: 'CINE-001',
      },
    },
    {
      id: 'sample-media-2',
      title: 'Monsoon_SlowMo_120fps.mp4',
      type: 'slowmo',
      dataUrl: sample2Url,
      thumbnailUrl: sample2Url,
      createdAt: now - 3600_000 * 2,
      width: 1920,
      height: 1080,
      durationSec: 12.4,
      fps: 120,
      isHardwareSlowMo: false,
      sizeBytes: 14_820_000,
      favorite: true,
      isPrivateVault: false,
      exif: {
        iso: '400',
        shutter: '1/250',
        ev: '0.0 EV',
        wb: 'AUTO',
        lens: '24mm Wide (Main)',
        mode: 'SLOW MOTION',
        templateCode: 'REEL-029',
      },
    },
    {
      id: 'sample-media-3',
      title: 'Cyber_Night_Portrait_RAW.jpg',
      type: 'edited',
      dataUrl: sample3Url,
      thumbnailUrl: sample3Url,
      createdAt: now - 1800_000,
      width: 3840,
      height: 2160,
      sizeBytes: 3_120_000,
      favorite: false,
      isPrivateVault: false,
      exif: {
        iso: '800',
        shutter: '1/30',
        ev: '-0.7 EV',
        wb: '3200K Tungsten',
        lens: '50mm Portrait',
        mode: 'PORTRAIT',
        templateCode: 'NEON-056',
      },
    },
  ];

  const projects: StudioProject[] = [
    {
      id: 'proj-birthday-cinema',
      name: 'Birthday Video — Cinematic Reel',
      createdAt: now - 86400_000,
      updatedAt: now - 1200_000,
      aspectRatio: '16:9',
      clips: [
        {
          id: 'clip-1',
          mediaId: 'sample-media-1',
          title: '1_Opening_Golden_Shot.jpg',
          type: 'photo',
          dataUrl: sample1Url,
          startTime: 0,
          endTime: 4,
          duration: 4,
          speed: 1,
          volume: 100,
          fadeInSec: 1.0,
          fadeOutSec: 0.5,
          transition: 'Cross Dissolve',
          rotation: 0,
          flipH: false,
          cropAspect: '16:9',
        },
        {
          id: 'clip-2',
          mediaId: 'sample-media-2',
          title: '2_SlowMo_Celebration_120fps.mp4',
          type: 'video',
          dataUrl: sample2Url,
          startTime: 4,
          endTime: 10,
          duration: 6,
          speed: 0.5,
          volume: 85,
          fadeInSec: 0,
          fadeOutSec: 0.5,
          transition: 'Film Burn',
          rotation: 0,
          flipH: false,
          cropAspect: '16:9',
        },
        {
          id: 'clip-3',
          mediaId: 'sample-media-3',
          title: '3_Night_Finale_Portrait.jpg',
          type: 'photo',
          dataUrl: sample3Url,
          startTime: 10,
          endTime: 15,
          duration: 5,
          speed: 1,
          volume: 100,
          fadeInSec: 0.5,
          fadeOutSec: 1.5,
          transition: 'Fade',
          rotation: 0,
          flipH: false,
          cropAspect: '16:9',
        },
      ],
      overlays: [
        {
          id: 'ov-1',
          kind: 'text',
          content: 'DIRECTED BY 5TAR SURAJ',
          fontFamily: 'Syne',
          fontSize: 28,
          color: '#F59E0B',
          opacity: 95,
          rotation: 0,
          xPercent: 50,
          yPercent: 82,
          align: 'center',
        },
      ],
      filterSettings: {
        brightness: 4,
        contrast: 18,
        saturation: 12,
        temperature: 14,
        tint: 0,
        vignette: 28,
        sharpness: 25,
        highlights: -10,
        shadows: 8,
      },
      audioTrackName: 'Cinematic Pulse 90 BPM (Built-in Studio Synth)',
      audioVolume: 85,
      audioFadeIn: true,
      audioFadeOut: true,
      exportHistory: [
        {
          exportedAt: now - 3600_000,
          resolution: '1080p FHD',
          quality: 'High (24 Mbps)',
          format: 'MP4 / WebM',
          sizeKb: 18420,
        },
      ],
    },
  ];

  return { media, projects };
}
