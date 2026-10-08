export type Language = 'en' | 'hi';

export interface Translations {
  appName: string;
  tagline: string;
  developer: string;
  getStarted: string;
  nav: {
    home: string;
    camera: string;
    templates: string;
    editor: string;
    gallery: string;
    projects: string;
    vault: string;
    settings: string;
  };
  modes: {
    photo: string;
    portrait: string;
    pro: string;
    video: string;
    slowMotion: string;
    timeLapse: string;
    cinematic: string;
  };
  permissions: {
    title: string;
    subtitle: string;
    cameraTitle: string;
    cameraDesc: string;
    micTitle: string;
    micDesc: string;
    mediaTitle: string;
    mediaDesc: string;
    grant: string;
    granted: string;
    denied: string;
    continueToApp: string;
  };
  proControls: {
    iso: string;
    shutter: string;
    ev: string;
    wb: string;
    focus: string;
    zoom: string;
    lens: string;
    notSupported: string;
    browserFallbackNote: string;
  };
  guide: {
    title: string;
    subtitle: string;
    items: Array<{
      term: string;
      badge: string;
      en: string;
      hi: string;
      proTip: string;
    }>;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: '5tar Camera Pro',
    tagline: 'Professional Camera. Creative Studio.',
    developer: '5tar Suraj',
    getStarted: 'Get Started',
    nav: {
      home: 'Studio Home',
      camera: 'Camera',
      templates: '100+ Templates',
      editor: 'NLE Editor',
      gallery: 'Gallery',
      projects: 'Projects',
      vault: 'Private Vault',
      settings: 'Settings',
    },
    modes: {
      photo: 'PHOTO',
      portrait: 'PORTRAIT',
      pro: 'PRO',
      video: 'VIDEO',
      slowMotion: 'SLOW MO',
      timeLapse: 'TIME LAPSE',
      cinematic: 'CINEMATIC',
    },
    permissions: {
      title: 'Hardware Permissions & Privacy Setup',
      subtitle: '5tar Camera Pro requests only strictly required hardware permissions. All capture and editing stays 100% local on your device.',
      cameraTitle: 'Camera Sensor Access',
      cameraDesc: 'Required for real-time optical viewfinder, photo capture, Pro manual controls, and high-FPS recording.',
      micTitle: 'Microphone & Audio Input',
      micDesc: 'Required only when recording Video, Slow Motion, or Voiceover tracks with live dB level metering.',
      mediaTitle: 'Local Media & Storage',
      mediaDesc: 'Saves photos, videos, and project timelines locally via IndexedDB / Android MediaStore without overwriting files.',
      grant: 'Request Access',
      granted: 'Hardware Ready',
      denied: 'Denied — Fallback Active',
      continueToApp: 'Launch 5tar Camera Pro',
    },
    proControls: {
      iso: 'ISO',
      shutter: 'SHUTTER',
      ev: 'EV COMP',
      wb: 'WB',
      focus: 'FOCUS',
      zoom: 'ZOOM',
      lens: 'OPTICS',
      notSupported: 'Not supported on this camera — Automatic fallback active',
      browserFallbackNote: 'Browser MediaStream API detected. Hardware Camera2 sensors (RAW/Shutter) require the Native Android app; real-time optical & WebGL shaders active.',
    },
    guide: {
      title: 'Camera Guide (English + Hinglish)',
      subtitle: 'Master DSLR & Android Camera2 manual controls in simple bilingual terminology.',
      items: [
        {
          term: 'ISO (Light Sensitivity)',
          badge: 'SENSOR GAIN',
          en: 'Controls the camera sensor light sensitivity. Lower ISO (50–100) gives clean noise-free images; higher ISO (800–3200) brightens dark night scenes.',
          hi: 'Sensor ki light sensitivity. Kam ISO (50-100) mein photo bilkul saaf aati hai; zyada ISO (800+) andhere mein roshni badhata hai par grain aa sakta hai.',
          proTip: 'Keep ISO at 100 in daylight and use 800+ only indoors or at night.',
        },
        {
          term: 'Shutter Speed (Exposure Time)',
          badge: 'EXPOSURE TIME',
          en: 'How long the shutter stays open. Fast shutter (1/1000s) freezes action and sports; slow shutter (1/15s) captures motion blur and more light.',
          hi: 'Exposure time. Slow shutter zyada light capture karta hai aur motion blur deta hai; fast shutter (1/1000s) daudte hue subject ko freeze kar deta hai.',
          proTip: 'For cinematic 24fps video, follow the 180-degree rule: use 1/50s shutter speed.',
        },
        {
          term: 'Exposure Compensation (EV)',
          badge: '-3.0 TO +3.0 EV',
          en: 'Quickly brighten (+EV) or darken (-EV) the automatic meter reading without switching to full manual mode.',
          hi: 'Photo ya video ki brightness ko turant +EV (bright) ya -EV (dark/moody) karne ka control.',
          proTip: 'Dial -0.7 EV in harsh sunlight to protect sky highlights from blowing out.',
        },
        {
          term: 'Focus (Auto / Manual Peaking)',
          badge: 'AF-C / MF',
          en: 'Switch between continuous autofocus and precise manual focus distance for macro shots or cinematic rack focus.',
          hi: 'Auto focus apne aap subject pakadta hai; Manual Focus (MF) se aap macro close-up ya background blur khud control kar sakte hain.',
          proTip: 'Tap anywhere on the viewfinder to lock AF/AE on your main subject.',
        },
        {
          term: 'White Balance (Color Temperature)',
          badge: '2800K – 7500K',
          en: 'Adjusts color warmth so whites look accurate under tungsten bulbs, fluorescent tubes, daylight, or cloudy skies.',
          hi: 'Photo ka rang thanda (blue) ya garam (golden/warm) set karne ke liye. Daylight, Cloudy, aur Tungsten presets.',
          proTip: 'Use Cloudy (6000K) during sunset for rich golden-hour skin tones.',
        },
        {
          term: 'FPS (Frames Per Second)',
          badge: '24 / 30 / 60 / 120',
          en: 'Number of video frames recorded every second. 24 FPS looks like cinema film; 60 FPS is ultra-smooth.',
          hi: 'Ek second mein kitne frames record hote hain. 24 FPS movie jaisa feel deta hai, 60 FPS smooth action ke liye best hai.',
          proTip: 'Always match your FPS to your final delivery platform.',
        },
        {
          term: 'Slow Motion (High-FPS vs Software)',
          badge: '120 / 240 FPS',
          en: 'Native Slow Motion records at 120/240 FPS via Android Camera2 ConstrainedHighSpeedCaptureSession. When unsupported, Software Slow Motion interpolates playback speed.',
          hi: 'Asli Slow Motion 120 ya 240 FPS par record hota hai. Agar phone hardware support na kare, toh Software Slow Motion speed kam karke smooth effect deta hai.',
          proTip: 'High-FPS recording needs extra light because each frame has a shorter exposure.',
        },
      ],
    },
  },
  hi: {
    appName: '5tar Camera Pro',
    tagline: 'Professional Camera. Creative Studio.',
    developer: '5tar Suraj',
    getStarted: 'Shuru Karein (Get Started)',
    nav: {
      home: 'Studio Home',
      camera: 'Camera',
      templates: '100+ Templates',
      editor: 'Photo/Video Editor',
      gallery: 'Gallery',
      projects: 'Projects',
      vault: 'Private Vault',
      settings: 'Settings',
    },
    modes: {
      photo: 'PHOTO',
      portrait: 'PORTRAIT',
      pro: 'PRO MANUAL',
      video: 'VIDEO',
      slowMotion: 'SLOW MO',
      timeLapse: 'TIME LAPSE',
      cinematic: 'CINEMATIC',
    },
    permissions: {
      title: 'Camera Permissions Aur Privacy',
      subtitle: '5tar Camera Pro sirf zaroori permissions mangta hai. Aapke photos aur videos 100% aapke phone mein safe rehte hain.',
      cameraTitle: 'Camera Sensor Access',
      cameraDesc: 'Asli live camera preview, photo capture, aur Pro manual controls ke liye zaroori.',
      micTitle: 'Microphone Audio Access',
      micDesc: 'Video recording aur voiceover mein aawaz record karne ke liye zaroori.',
      mediaTitle: 'Photos & Media Storage',
      mediaDesc: 'Edited photos, videos aur projects ko bina purani file mitaye save karne ke liye.',
      grant: 'Allow Karein',
      granted: 'Ready Hai',
      denied: 'Denied — Fallback On',
      continueToApp: '5tar Camera Pro Kholein',
    },
    proControls: {
      iso: 'ISO',
      shutter: 'SHUTTER',
      ev: 'EV COMP',
      wb: 'WB COLOR',
      focus: 'FOCUS',
      zoom: 'ZOOM',
      lens: 'LENS',
      notSupported: 'Is camera par manual support nahi hai — Auto mode chalu hai',
      browserFallbackNote: 'Web Browser camera active hai. Asli hardware Camera2 manual sensor ke liye Native Android APK download karein.',
    },
    guide: {
      title: 'Camera Guide (Hindi + English)',
      subtitle: 'Asaan bhasha mein Pro Camera settings samjhein.',
      items: [
        {
          term: 'ISO (Light Sensitivity)',
          badge: 'SENSOR GAIN',
          en: 'Controls the camera sensor light sensitivity.',
          hi: 'Sensor ki light sensitivity. Kam ISO (50-100) mein photo bilkul saaf aati hai; zyada ISO (800+) andhere mein roshni badhata hai.',
          proTip: 'Din ki dhoop mein ISO 100 rakhein.',
        },
        {
          term: 'Shutter Speed (Exposure Time)',
          badge: 'EXPOSURE TIME',
          en: 'How long the camera shutter stays open.',
          hi: 'Exposure time. Slow shutter zyada light capture karta hai; fast shutter (1/1000s) action ko freeze karta hai.',
          proTip: 'Cinematic video ke liye 1/50 shutter best hai.',
        },
        {
          term: 'Exposure Compensation (EV)',
          badge: '-3.0 TO +3.0 EV',
          en: 'Brighten or darken the scene quickly.',
          hi: 'Photo ki roshni ko turant +EV (zyada) ya -EV (kam/cinematic) karne ka slider.',
          proTip: 'Tez dhoop mein -0.5 EV rakhein.',
        },
        {
          term: 'Focus (Auto / Manual)',
          badge: 'AF / MF',
          en: 'Lock focus on subject or adjust manually.',
          hi: 'Screen par tap karke focus lock karein ya slider se manual blur set karein.',
          proTip: 'Macro close-up ke liye Manual Focus (MF) chunein.',
        },
        {
          term: 'White Balance (WB)',
          badge: 'KELVIN TEMP',
          en: 'Adjust warm golden or cool blue color cast.',
          hi: 'Photo ka color tone Daylight, Cloudy ya Warm set karein.',
          proTip: 'Sunset photo ke liye Cloudy/Golden preset use karein.',
        },
        {
          term: 'FPS (Frames Per Second)',
          badge: '24 / 30 / 60 / 120',
          en: 'Frames recorded per second.',
          hi: 'Ek second mein kitne frames record hote hain. Zyada FPS = zyada smooth video.',
          proTip: 'Reels aur Action ke liye 60 FPS chunein.',
        },
        {
          term: 'Slow Motion',
          badge: 'HIGH SPEED',
          en: 'Hardware 120/240 FPS vs Software Slow Motion.',
          hi: 'Hardware support hone par asli 120/240 FPS record hota hai, warna Software Slow Motion kaam aata hai.',
          proTip: 'Slow motion hamesha acchi roshni mein shoot karein.',
        },
      ],
    },
  },
};
