import React from 'react';
import { Download, RefreshCw, Share2, Youtube, Instagram } from 'lucide-react';
import { translations, Language } from '@/i18n/translations';

interface ResultPreviewProps {
  videoUrl: string;
  originalUrl: string;
  onReset: () => void;
  lang: Language;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({ videoUrl, originalUrl, onReset, lang }) => {
  const t = translations[lang];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t.before}
            </span>
          </div>
          <div className="aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-xl">
            <video src={originalUrl} controls className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t.after}
            </span>
          </div>
          <div className="aspect-video rounded-3xl overflow-hidden bg-black border-2 border-primary/30 shadow-2xl shadow-primary/10">
            <video src={videoUrl} controls className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 py-8">
        <a 
          href={videoUrl} 
          download="rebranded-video.mp4"
          className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Download size={22} />
          {t.download}
        </a>

        <button 
          onClick={onReset}
          className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
        >
          <RefreshCw size={22} />
          {t.reset}
        </button>
      </div>

      <div className="pt-12 border-t border-white/5">
        <div className="flex flex-col items-center gap-6">
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Optimize for Social Media
          </h4>
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Youtube size={24} />
              </div>
              <span className="text-[10px] font-bold">Shorts</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <Instagram size={24} />
              </div>
              <span className="text-[10px] font-bold">Reels</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Share2 size={24} />
              </div>
              <span className="text-[10px] font-bold">Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
