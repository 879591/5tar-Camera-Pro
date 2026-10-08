import React, { useMemo, useState } from 'react';
import { Camera, Check, Search, Sliders, Sparkles, Wand2 } from 'lucide-react';
import {
  STUDIO_TEMPLATES,
  StudioTemplate,
  TEMPLATE_CATEGORIES,
  TemplateCategory,
} from '../data/templates';

interface TemplatesStudioProps {
  activeTemplate: StudioTemplate | null;
  onApplyToCamera: (template: StudioTemplate) => void;
  onApplyToEditor: (template: StudioTemplate) => void;
}

export const TemplatesStudio: React.FC<TemplatesStudioProps> = ({
  activeTemplate,
  onApplyToCamera,
  onApplyToEditor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [aspectFilter, setAspectFilter] = useState<'ALL' | '16:9' | '9:16' | '4:3' | '2.39:1'>('ALL');

  const filteredTemplates = useMemo(() => {
    return STUDIO_TEMPLATES.filter((tpl) => {
      const matchesCat = selectedCategory === 'All' || tpl.category === selectedCategory;
      const matchesAspect = aspectFilter === 'ALL' || tpl.aspectRatio === aspectFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.code.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q);
      return matchesCat && matchesAspect && matchesQuery;
    });
  }, [aspectFilter, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#131418] border border-zinc-800/90 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <Sparkles className="w-4 h-4" />
            <span>{STUDIO_TEMPLATES.length} CURATED STUDIO PRESETS · 8 CATEGORIES</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            100+ Pro Camera &amp; NLE Studio Templates
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Every template configures real optical color grading (Temperature, Tint, Contrast, Saturation, Highlights, Shadows, Vignette), target FPS, aspect ratio, transition style, and overlay typography. Apply any preset directly to the live Camera Viewfinder or the Photo/Video Editor.
          </p>
        </div>

        <div className="w-full lg:w-80 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${STUDIO_TEMPLATES.length} templates (e.g. Haldi, 120FPS, Portra)...`}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
            <span>Showing {filteredTemplates.length} of {STUDIO_TEMPLATES.length}</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#F59E0B] hover:underline cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category & Aspect Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const count =
              cat === 'All'
                ? STUDIO_TEMPLATES.length
                : STUDIO_TEMPLATES.filter((t) => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#F59E0B] text-black font-semibold'
                    : 'bg-[#131418] border border-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 bg-[#131418] border border-zinc-800 p-1 rounded-xl shrink-0 self-start">
          {(['ALL', '16:9', '9:16', '4:3', '2.39:1'] as const).map((ar) => (
            <button
              key={ar}
              onClick={() => setAspectFilter(ar)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                aspectFilter === ar
                  ? 'bg-zinc-800 text-[#F59E0B] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => {
          const isSelected = activeTemplate?.id === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`rounded-2xl bg-[#131418] border p-5 flex flex-col justify-between gap-4 transition ${
                isSelected ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/40' : 'border-zinc-800/90 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                {/* Visual Color Swatch Bar representing the template's optical LUT */}
                <div
                  className="h-20 rounded-xl border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, #09090B 0%, ${tpl.accentColor}44 55%, #18181B 100%)`,
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-white">{tpl.code}</span>
                    <span className="text-zinc-200">
                      {tpl.aspectRatio} · {tpl.fpsTarget} FPS · {tpl.speedMultiplier}x
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                    <span>MODE: {tpl.recommendedMode}</span>
                    <span>TRANSITION: {tpl.transitionType}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-400">
                    <span>{tpl.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{tpl.audioMood.split('(')[0]}</span>
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-white flex items-center justify-between">
                    <span>{tpl.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#F59E0B] shrink-0" />}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{tpl.description}</p>
                </div>

                {/* Unboxed telemetry parameters */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-zinc-400 tabular-nums">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#F59E0B]" />
                    Temp {tpl.filterSettings.temperature >= 0 ? `+${tpl.filterSettings.temperature}` : tpl.filterSettings.temperature}
                  </span>
                  <span>·</span>
                  <span>Con {tpl.filterSettings.contrast >= 0 ? `+${tpl.filterSettings.contrast}` : tpl.filterSettings.contrast}</span>
                  <span>·</span>
                  <span>Sat {tpl.filterSettings.saturation >= 0 ? `+${tpl.filterSettings.saturation}` : tpl.filterSettings.saturation}</span>
                  <span>·</span>
                  <span>Vig {tpl.filterSettings.vignette}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => onApplyToCamera(tpl)}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#F59E0B]/90 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Shoot Live</span>
                </button>
                <button
                  onClick={() => onApplyToEditor(tpl)}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 hover:border-[#F59E0B] hover:text-white transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Open in Editor</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
