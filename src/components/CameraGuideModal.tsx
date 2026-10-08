import React from 'react';
import { BookOpen, Sliders, X } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface CameraGuideModalProps {
  language: Language;
  onClose: () => void;
}

export const CameraGuideModal: React.FC<CameraGuideModalProps> = ({ language, onClose }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 shadow-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg md:text-xl font-bold text-white">{t.guide.title}</h2>
              <p className="text-xs text-zinc-400">{t.guide.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            aria-label="Close Camera Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 overflow-y-auto space-y-4 pr-1">
          {t.guide.items.map((item) => (
            <div
              key={item.term}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#F59E0B]" />
                  <span>{item.term}</span>
                </h3>
                <span className="text-xs font-mono text-[#F59E0B]">{item.badge}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/60">
                  <p className="text-[11px] font-mono text-zinc-400">ENGLISH EXPLANATION</p>
                  <p className="mt-1 text-xs text-zinc-200 leading-relaxed">{item.en}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                  <p className="text-[11px] font-mono text-[#F59E0B]">HINDI / HINGLISH GUIDE</p>
                  <p className="mt-1 text-xs text-zinc-100 leading-relaxed font-medium">{item.hi}</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 pt-1">
                <strong className="text-zinc-200">Studio Tip:</strong> {item.proTip}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-400">5tar Camera Pro · Developed by 5tar Suraj</span>
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold hover:bg-[#F59E0B]/90 transition cursor-pointer"
          >
            Back to Viewfinder
          </button>
        </div>
      </div>
    </div>
  );
};
