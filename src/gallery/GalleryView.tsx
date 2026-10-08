import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Edit3,
  Heart,
  Lock,
  Maximize2,
  Share2,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { MediaItem, StudioProject } from '../storage/studioDatabase';

interface GalleryViewProps {
  mediaItems: MediaItem[];
  projects: StudioProject[];
  onToggleFavorite: (id: string) => void;
  onMoveToVault: (id: string) => void;
  onDeleteMedia: (id: string) => void;
  onRenameMedia: (id: string, newTitle: string) => void;
  onOpenInEditor: (item: MediaItem) => void;
  onOpenProjectsTab: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  mediaItems,
  projects,
  onToggleFavorite,
  onMoveToVault,
  onDeleteMedia,
  onRenameMedia,
  onOpenInEditor,
  onOpenProjectsTab,
}) => {
  const [category, setCategory] = useState<'ALL' | 'photo' | 'video' | 'slowmo' | 'edited' | 'projects'>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');

  const publicItems = useMemo(() => {
    const list = mediaItems.filter((m) => !m.isPrivateVault);
    const filtered =
      category === 'ALL' || category === 'projects'
        ? list
        : list.filter((m) => m.type === category);

    return [...filtered].sort((a, b) =>
      sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
  }, [category, mediaItems, sortOrder]);

  const handleDownload = (item: MediaItem) => {
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.title;
    a.click();
  };

  const handleShare = async (item: MediaItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Captured with 5tar Camera Pro (${item.exif.mode} · ISO ${item.exif.iso})`,
        });
        return;
      } catch {
        // Fallback to download
      }
    }
    handleDownload(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header & Filter Bar */}
      <div className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#F59E0B]">IN-APP STUDIO GALLERY · EXIF INSPECTOR</p>
          <h1 className="font-display text-2xl font-bold text-white mt-1">
            Captured Media &amp; Master Exports
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Protected with destructive-action confirmation and one-tap Private Vault transfer.
          </p>
        </div>

        <button
          onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>SORT: {sortOrder === 'newest' ? 'NEWEST FIRST' : 'OLDEST FIRST'}</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'ALL', label: 'All Media' },
            { id: 'photo', label: 'Photos' },
            { id: 'video', label: 'Videos' },
            { id: 'slowmo', label: 'Slow Motion' },
            { id: 'edited', label: 'Edited Masters' },
            { id: 'projects', label: `Projects (${projects.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'projects') {
                onOpenProjectsTab();
              } else {
                setCategory(tab.id);
              }
            }}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              category === tab.id
                ? 'bg-[#F59E0B] text-black'
                : 'bg-[#131418] border border-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {publicItems.length === 0 ? (
        <div className="rounded-3xl bg-[#131418] border border-zinc-800 p-12 text-center space-y-2">
          <p className="text-base font-semibold text-white">No media in this category yet</p>
          <p className="text-xs text-zinc-400">
            Capture photos, 120FPS slow-motion clips, or export graded masters to view them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {publicItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#131418] border border-zinc-800/90 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail with Lightbox Trigger */}
                <div className="relative h-52 bg-black overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-3 left-3 text-[11px] font-mono text-white bg-black/70 px-2.5 py-1 rounded-lg">
                    {item.exif.mode}
                    {item.fps ? ` · ${item.fps} FPS` : ''}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md transition cursor-pointer ${
                        item.favorite
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/60 text-zinc-300 hover:text-white'
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-4 h-4 ${item.favorite ? 'fill-white' : ''}`} />
                    </button>
                    <button
                      onClick={() => setLightboxItem(item)}
                      className="w-8 h-8 rounded-lg bg-black/60 text-zinc-200 hover:text-white flex items-center justify-center backdrop-blur-md cursor-pointer"
                      title="Fullscreen Lightbox"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-300 tabular-nums">
                    <span>
                      {item.width}×{item.height} · {(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <span>ISO {item.exif.iso} · {item.exif.shutter}</span>
                  </div>
                </div>

                {/* Title & Rename Inline */}
                <div className="p-4 space-y-2">
                  {renamingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-[#F59E0B] text-xs text-white"
                      />
                      <button
                        onClick={() => {
                          if (renameDraft.trim()) onRenameMedia(item.id, renameDraft.trim());
                          setRenamingId(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                      <button
                        onClick={() => {
                          setRenamingId(item.id);
                          setRenameDraft(item.title);
                        }}
                        className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                        title="Rename file"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Clean unboxed EXIF metadata with middot separators */}
                  <div className="text-xs text-zinc-400 font-mono">
                    <span>{item.exif.lens}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{item.exif.wb}</span>
                    {item.exif.templateCode && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="text-[#F59E0B]">{item.exif.templateCode}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-3 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenInEditor(item)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold flex items-center gap-1 hover:bg-[#F59E0B]/90 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onMoveToVault(item.id)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:text-[#F59E0B] text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="Move to Encrypted Private Vault"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Vault</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShare(item)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 cursor-pointer"
                    title="Delete with Confirmation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal (Never delete device media without confirmation) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131418] border border-zinc-800 p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white">Confirm Media Deletion</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently remove this file from your Studio Gallery? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteMedia(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white cursor-pointer"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Viewer */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <div className="max-w-5xl w-full space-y-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="font-display text-lg font-bold">{lightboxItem.title}</h3>
                <p className="text-xs font-mono text-zinc-400">
                  {lightboxItem.width}×{lightboxItem.height} · ISO {lightboxItem.exif.iso} · Shutter {lightboxItem.exif.shutter} · {lightboxItem.exif.lens}
                </p>
              </div>
              <button
                onClick={() => setLightboxItem(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center max-h-[75vh]">
              <img
                src={lightboxItem.dataUrl}
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
