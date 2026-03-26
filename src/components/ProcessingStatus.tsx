import React from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { translations, Language } from '@/i18n/translations';

interface ProcessingStatusProps {
  progress: number;
  status: 'idle' | 'extracting' | 'processing' | 'encoding' | 'done' | 'error';
  lang: Language;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ progress, status, lang }) => {
  const t = translations[lang];

  const getStatusText = () => {
    switch (status) {
      case 'extracting': return t.processing;
      case 'processing': return t.cleaning;
      case 'encoding': return t.rebranding;
      case 'done': return t.download;
      default: return "";
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 py-12">
      <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
        />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {status !== 'done' && status !== 'error' ? (
            <Loader2 size={48} className="text-primary animate-spin" />
          ) : status === 'done' ? (
            <CheckCircle2 size={48} className="text-green-500" />
          ) : (
            <AlertCircle size={48} className="text-destructive" />
          )}
          
          <div className="absolute inset-0 blur-2xl bg-primary/20 -z-10" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">
            {getStatusText()}
          </h3>
          <p className="text-4xl font-black text-primary font-mono">
            {progress}%
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          {['extracting', 'processing', 'encoding'].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                status === s ? "bg-primary animate-pulse" : 
                ['extracting', 'processing', 'encoding'].indexOf(status) > i ? "bg-green-500" : "bg-white/10"
              }`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Step {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
