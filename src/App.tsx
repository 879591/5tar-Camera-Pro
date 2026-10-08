/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Camera,
  FolderKanban,
  Home,
  Images,
  Lock,
  Settings,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  DEFAULT_CAPABILITIES,
  HardwareCapabilities,
  probeMediaCapabilities,
} from './camera/capabilityManager';
import { CameraSubMode, CameraViewfinder } from './camera/CameraViewfinder';
import { AndroidApkModal } from './components/AndroidApkModal';
import { CameraGuideModal } from './components/CameraGuideModal';
import { HomeView } from './components/HomeView';
import { OnboardingModal } from './components/OnboardingModal';
import { ProjectsView } from './components/ProjectsView';
import { TemplatesStudio } from './components/TemplatesStudio';
import { StudioTemplate } from './data/templates';
import { StudioEditor } from './editor/StudioEditor';
import { GalleryView } from './gallery/GalleryView';
import { Language, translations } from './i18n/translations';
import { OfflineIndicator, PWAInstallButton } from './pwa/PWAInstallBanner';
import { PrivateVaultView } from './security/PrivateVaultView';
import { SettingsAndStorageView } from './settings/SettingsAndStorageView';
import {
  CameraAppSettings,
  createInitialStudioSamples,
  DEFAULT_SETTINGS,
  deleteMediaItem,
  deleteProject,
  getAllMediaItems,
  getAllProjects,
  MediaItem,
  saveMediaItem,
  saveProject,
  StudioProject,
} from './storage/studioDatabase';

type ActiveTab =
  | 'home'
  | 'camera'
  | 'templates'
  | 'editor'
  | 'gallery'
  | 'projects'
  | 'vault'
  | 'settings';

const ONBOARDING_KEY = '5tar_camera_pro_onboarded_v1';
const SETTINGS_KEY = '5tar_camera_pro_settings_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [cameraSubMode, setCameraSubMode] = useState<CameraSubMode>('PHOTO');
  const [activeTemplate, setActiveTemplate] = useState<StudioTemplate | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem(ONBOARDING_KEY);
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  const [settings, setSettings] = useState<CameraAppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [language, setLanguage] = useState<Language>(settings.language || 'en');
  const [capabilities, setCapabilities] = useState<HardwareCapabilities>(DEFAULT_CAPABILITIES);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  const t = translations[language];

  // Load persisted IndexedDB media & projects (or initialize with generated studio samples on first run)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const loadedMedia = await getAllMediaItems();
      const loadedProjects = await getAllProjects();

      if (loadedMedia.length === 0 && loadedProjects.length === 0) {
        const samples = createInitialStudioSamples();
        for (const m of samples.media) {
          await saveMediaItem(m);
        }
        for (const p of samples.projects) {
          await saveProject(p);
        }
        if (mounted) {
          setMediaItems(samples.media);
          setProjects(samples.projects);
          setActiveProjectId(samples.projects[0]?.id || '');
        }
      } else if (mounted) {
        setMediaItems(loadedMedia);
        setProjects(loadedProjects);
        setActiveProjectId(loadedProjects[0]?.id || '');
      }

      const initialCaps = await probeMediaCapabilities(null);
      if (mounted) setCapabilities(initialCaps);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdateSettings = (partial: Partial<CameraAppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleChangeLanguage = (lang: Language) => {
    setLanguage(lang);
    handleUpdateSettings({ language: lang });
  };

  const handleMediaCaptured = async (newItem: MediaItem) => {
    await saveMediaItem(newItem);
    setMediaItems((prev) => [newItem, ...prev]);
  };

  const handleToggleFavorite = async (id: string) => {
    const target = mediaItems.find((m) => m.id === id);
    if (!target) return;
    const updated = { ...target, favorite: !target.favorite };
    await saveMediaItem(updated);
    setMediaItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleMoveToVault = async (id: string) => {
    const target = mediaItems.find((m) => m.id === id);
    if (!target) return;
    const updated = { ...target, isPrivateVault: true };
    await saveMediaItem(updated);
    setMediaItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleRestoreFromVault = async (id: string) => {
    const target = mediaItems.find((m) => m.id === id);
    if (!target) return;
    const updated = { ...target, isPrivateVault: false };
    await saveMediaItem(updated);
    setMediaItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleDeleteMedia = async (id: string) => {
    await deleteMediaItem(id);
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRenameMedia = async (id: string, newTitle: string) => {
    const target = mediaItems.find((m) => m.id === id);
    if (!target) return;
    const updated = { ...target, title: newTitle };
    await saveMediaItem(updated);
    setMediaItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleCreateProject = async (
    name: string,
    aspectRatio: StudioProject['aspectRatio']
  ) => {
    const now = Date.now();
    const firstMedia = mediaItems.find((m) => !m.isPrivateVault);
    const newProj: StudioProject = {
      id: `proj-${now}`,
      name,
      createdAt: now,
      updatedAt: now,
      aspectRatio,
      clips: firstMedia
        ? [
            {
              id: `clip-${now}`,
              mediaId: firstMedia.id,
              title: firstMedia.title,
              type: firstMedia.type === 'video' ? 'video' : 'photo',
              dataUrl: firstMedia.dataUrl,
              startTime: 0,
              endTime: 5,
              duration: 5,
              speed: 1,
              volume: 100,
              fadeInSec: 0.5,
              fadeOutSec: 0.5,
              transition: 'Cross Dissolve',
              rotation: 0,
              flipH: false,
              cropAspect: aspectRatio,
            },
          ]
        : [],
      overlays: [],
      filterSettings: {
        brightness: 0,
        contrast: 10,
        saturation: 8,
        temperature: 4,
        tint: 0,
        vignette: 15,
        sharpness: 20,
        highlights: 0,
        shadows: 0,
      },
      audioTrackName: 'Cinematic Pulse 90 BPM (Built-in Studio Synth)',
      audioVolume: 80,
      audioFadeIn: true,
      audioFadeOut: true,
      exportHistory: [],
    };
    await saveProject(newProj);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
  };

  const handleSaveProject = async (updated: StudioProject) => {
    await saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleRenameProject = async (id: string, newName: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const updated = { ...target, name: newName, updatedAt: Date.now() };
    await saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ||
    projects[0] ||
    createInitialStudioSamples().projects[0];

  const publicMediaItems = mediaItems.filter((m) => !m.isPrivateVault);
  const vaultMediaItems = mediaItems.filter((m) => m.isPrivateVault);

  return (
    <div
      className={`min-h-screen bg-[#0A0A0C] text-[#F4F4F6] flex flex-col ${
        settings.maxScreenBrightness ? 'brightness-110 contrast-105' : ''
      }`}
    >
      {/* Top Bar Contract: Zone 1 (Single Text Element Brand) — Zone 2 (5 Single-Line Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between gap-4">
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          5tar Camera Pro
        </a>

        {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <button
            onClick={() => setActiveTab('home')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'home' ? 'text-[#F59E0B] underline underline-offset-8' : ''
            }`}
          >
            {t.nav.home}
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'camera' ? 'text-[#F59E0B] underline underline-offset-8' : ''
            }`}
          >
            {t.nav.camera}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'templates' ? 'text-[#F59E0B] underline underline-offset-8' : ''
            }`}
          >
            {t.nav.templates}
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'editor' ? 'text-[#F59E0B] underline underline-offset-8' : ''
            }`}
          >
            {t.nav.editor}
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'gallery' ? 'text-[#F59E0B] underline underline-offset-8' : ''
            }`}
          >
            {t.nav.gallery}
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions (PWA Install + Android APK) */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton onOpenApkModal={() => setShowApkModal(true)} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            language={language}
            capabilities={capabilities}
            mediaItems={mediaItems}
            projects={projects}
            onNavigate={(tab, subMode) => {
              if (subMode) setCameraSubMode(subMode);
              setActiveTab(tab);
            }}
            onApplyTemplate={(tpl) => {
              setActiveTemplate(tpl);
              setCameraSubMode(tpl.recommendedMode);
              setActiveTab('camera');
            }}
            onOpenGuide={() => setShowGuideModal(true)}
          />
        )}

        {activeTab === 'camera' && (
          <CameraViewfinder
            language={language}
            initialMode={cameraSubMode}
            activeTemplate={activeTemplate}
            onClearTemplate={() => setActiveTemplate(null)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            latestMedia={publicMediaItems[0]}
            onMediaCaptured={handleMediaCaptured}
            onOpenGallery={() => setActiveTab('gallery')}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenGuide={() => setShowGuideModal(true)}
            onCapabilitiesUpdated={setCapabilities}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesStudio
            activeTemplate={activeTemplate}
            onApplyToCamera={(tpl) => {
              setActiveTemplate(tpl);
              setCameraSubMode(tpl.recommendedMode);
              setActiveTab('camera');
            }}
            onApplyToEditor={(tpl) => {
              setActiveTemplate(tpl);
              setActiveTab('editor');
            }}
          />
        )}

        {activeTab === 'editor' && (
          <StudioEditor
            mediaItems={mediaItems}
            activeProject={activeProject}
            activeTemplate={activeTemplate}
            onSaveProject={handleSaveProject}
            onSaveEditedMedia={handleMediaCaptured}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryView
            mediaItems={mediaItems}
            projects={projects}
            onToggleFavorite={handleToggleFavorite}
            onMoveToVault={handleMoveToVault}
            onDeleteMedia={handleDeleteMedia}
            onRenameMedia={handleRenameMedia}
            onOpenInEditor={() => setActiveTab('editor')}
            onOpenProjectsTab={() => setActiveTab('projects')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            mediaItems={mediaItems}
            onSelectProjectForEdit={(proj) => {
              setActiveProjectId(proj.id);
              setActiveTab('editor');
            }}
            onCreateProject={handleCreateProject}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'vault' && (
          <PrivateVaultView
            vaultItems={vaultMediaItems}
            onRestoreFromVault={handleRestoreFromVault}
            onDeleteFromVault={handleDeleteMedia}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAndStorageView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            capabilities={capabilities}
            mediaItems={mediaItems}
            projects={projects}
            onChangeLanguage={handleChangeLanguage}
          />
        )}
      </main>

      {/* Mobile & Touch-First Ergonomic Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0A0A0C]/95 backdrop-blur-md border-t border-zinc-800/90 grid grid-cols-7 items-center px-1">
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'camera', label: 'Camera', icon: Camera },
            { id: 'templates', label: '100+ LUTs', icon: Sparkles },
            { id: 'editor', label: 'Editor', icon: Wand2 },
            { id: 'gallery', label: 'Gallery', icon: Images },
            { id: 'projects', label: 'Projects', icon: FolderKanban },
            { id: 'vault', label: 'Vault', icon: Lock },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isActive ? 'text-[#F59E0B]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Offline Indicator */}
      <OfflineIndicator />

      {showOnboarding && (
        <OnboardingModal
          language={language}
          onChangeLanguage={handleChangeLanguage}
          onComplete={() => {
            localStorage.setItem(ONBOARDING_KEY, 'true');
            setShowOnboarding(false);
          }}
        />
      )}

      {showGuideModal && (
        <CameraGuideModal
          language={language}
          onClose={() => setShowGuideModal(false)}
        />
      )}

      {showApkModal && (
        <AndroidApkModal onClose={() => setShowApkModal(false)} />
      )}
    </div>
  );
}

