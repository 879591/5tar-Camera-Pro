import React, { useState } from 'react';
import {
  Edit3,
  Film,
  FolderPlus,
  Music,
  Play,
  Trash2,
  Wand2,
} from 'lucide-react';
import { MediaItem, StudioProject } from '../storage/studioDatabase';

interface ProjectsViewProps {
  projects: StudioProject[];
  mediaItems: MediaItem[];
  onSelectProjectForEdit: (project: StudioProject) => void;
  onCreateProject: (name: string, aspectRatio: StudioProject['aspectRatio']) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProjectForEdit,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}) => {
  const [newProjName, setNewProjName] = useState('');
  const [newProjAspect, setNewProjAspect] = useState<StudioProject['aspectRatio']>('16:9');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newProjName.trim() || `Studio Reel #${projects.length + 1}`;
    onCreateProject(title, newProjAspect);
    setNewProjName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header & Create New Project Bar */}
      <div className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <p className="text-xs font-mono text-[#F59E0B]">LOCAL INDEXEDDB / ROOM PROJECT MANAGER</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Multi-Clip Studio Projects
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Organize multi-clip timelines, transitions, text overlays, music tracks, and full export logs.
          </p>
        </div>

        <form onSubmit={handleCreate} className="w-full lg:w-auto flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            placeholder="New project name (e.g. Birthday Video)..."
            className="min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 w-full sm:w-64"
          />
          <select
            value={newProjAspect}
            onChange={(e) => setNewProjAspect(e.target.value as StudioProject['aspectRatio'])}
            className="min-h-[44px] px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white"
          >
            <option value="16:9">16:9 Cinema</option>
            <option value="9:16">9:16 Reels</option>
            <option value="2.39:1">2.39:1 Anamorphic</option>
            <option value="4:3">4:3 Classic</option>
            <option value="1:1">1:1 Square</option>
          </select>
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F59E0B]/90 transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </form>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {projects.map((proj) => {
          const totalDuration = proj.clips.reduce((acc, c) => acc + c.duration, 0);
          return (
            <div
              key={proj.id}
              className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono text-[#F59E0B]">
                      <span>{proj.aspectRatio} TIMELINE</span>
                      <span aria-hidden="true"> · </span>
                      <span>{proj.clips.length} CLIPS</span>
                      <span aria-hidden="true"> · </span>
                      <span>{totalDuration}s TOTAL</span>
                    </div>

                    {renamingId === proj.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-[#F59E0B] text-sm text-white"
                        />
                        <button
                          onClick={() => {
                            if (renameText.trim()) onRenameProject(proj.id, renameText.trim());
                            setRenamingId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h2 className="mt-1 font-display text-xl font-bold text-white flex items-center gap-2">
                        <span>{proj.name}</span>
                        <button
                          onClick={() => {
                            setRenamingId(proj.id);
                            setRenameText(proj.name);
                          }}
                          className="text-zinc-400 hover:text-white cursor-pointer"
                          title="Rename Project"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </h2>
                    )}
                  </div>

                  <button
                    onClick={() => setConfirmDeleteId(proj.id)}
                    className="p-2 text-zinc-400 hover:text-rose-400 cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Timeline Chain Visualization: clip -> transition -> text -> music */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    TIMELINE GRAPH (CLIP → TRANSITION → TEXT → MUSIC)
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {proj.clips.map((c, idx) => (
                      <React.Fragment key={c.id}>
                        <div className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white shrink-0 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>{c.title}</span>
                          <span className="font-mono text-[10px] text-zinc-400">({c.speed}x)</span>
                        </div>
                        {idx < proj.clips.length - 1 && (
                          <span className="text-[11px] font-mono text-[#F59E0B] shrink-0">
                            → [{c.transition}] →
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                      {proj.audioTrackName}
                    </span>
                    <span className="font-mono text-[11px]">
                      {proj.overlays.length} Text/Sticker Layer(s)
                    </span>
                  </div>
                </div>

                {/* Export History Log */}
                {proj.exportHistory.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-zinc-400">RECENT EXPORT HISTORY:</span>
                    {proj.exportHistory.slice(0, 2).map((eh, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono text-zinc-300 flex items-center justify-between py-1 border-b border-zinc-800/60 tabular-nums"
                      >
                        <span>
                          {eh.format} · {eh.resolution} · {eh.quality}
                        </span>
                        <span className="text-emerald-400">
                          {(eh.sizeKb / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <span className="text-xs text-zinc-500 font-mono">
                  Updated {new Date(proj.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onSelectProjectForEdit(proj)}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F59E0B]/90 transition cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Open in NLE Editor</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131418] border border-zinc-800 p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white">Delete Studio Project?</h3>
            <p className="text-xs text-zinc-300">
              Deleting this project timeline will not delete your underlying photos or videos in the Studio Gallery.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="min-h-[40px] px-4 rounded-xl bg-zinc-800 text-xs text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-rose-600 text-xs font-semibold text-white cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
