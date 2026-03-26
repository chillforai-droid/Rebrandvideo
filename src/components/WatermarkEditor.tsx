import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Move, Maximize, Eye, Type, Image as ImageIcon, Settings2, Play, Pause, Upload, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translations, Language } from '@/i18n/translations';

interface WatermarkEditorProps {
  videoUrl: string;
  onProcess: (config: WatermarkConfig) => void;
  lang: Language;
  detectedInfo?: {
    fps: number;
    frameCount: number;
    suggestedArea?: { x: number; y: number; width: number; height: number };
  };
}

export interface WatermarkConfig {
  area: { x: number; y: number; width: number; height: number };
  newWatermark: {
    type: 'text' | 'image';
    content: string;
    opacity: number;
    size: number;
  };
  options: {
    temporalSmoothing: boolean;
    processEverySecondFrame: boolean;
  };
}

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({ videoUrl, onProcess, lang, detectedInfo }) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [area, setArea] = useState({ x: 10, y: 10, width: 20, height: 10 });
  const [config, setConfig] = useState<WatermarkConfig['newWatermark']>({
    type: 'text',
    content: 'MY BRAND',
    opacity: 0.8,
    size: 24
  });
  const [options, setOptions] = useState<WatermarkConfig['options']>({
    temporalSmoothing: true,
    processEverySecondFrame: false
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (detectedInfo?.suggestedArea) {
      setArea(detectedInfo.suggestedArea);
    }
  }, [detectedInfo]);

  const handleAreaChange = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, x - prev.width / 2)),
      y: Math.max(0, Math.min(100 - prev.height, y - prev.height / 2))
    }));
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
      {/* Video Preview & Area Selection */}
      <div className="lg:col-span-2 space-y-4">
        <div 
          ref={containerRef}
          className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10"
        >
          <video 
            ref={videoRef}
            src={videoUrl} 
            className="w-full h-full object-contain"
            onEnded={() => setIsPlaying(false)}
          />
          
          {/* Watermark Selection Overlay */}
          <motion.div
            drag
            dragConstraints={containerRef}
            onDragEnd={(_, info) => {
              // Update area based on drag
            }}
            style={{
              left: `${area.x}%`,
              top: `${area.y}%`,
              width: `${area.width}%`,
              height: `${area.height}%`,
            }}
            className="absolute border-2 border-primary bg-primary/20 cursor-move flex items-center justify-center group"
          >
            <div className="absolute -top-3 -left-3 bg-primary text-white p-1 rounded-full shadow-lg">
              <Move size={12} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              {t.position}
            </span>
          </motion.div>

          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            className="absolute bottom-6 left-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 glass-surface rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <Settings2 size={18} className="text-primary" />
            <span className="text-sm font-medium">{t.manualAdjust}</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={area.width} 
              onChange={e => setArea(prev => ({ ...prev, width: Number(e.target.value) }))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs"
              placeholder="W%"
            />
            <input 
              type="number" 
              value={area.height} 
              onChange={e => setArea(prev => ({ ...prev, height: Number(e.target.value) }))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs"
              placeholder="H%"
            />
          </div>
        </div>

        {/* Debug Panel */}
        {detectedInfo && (
          <div className="p-4 glass-surface rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <Zap size={14} />
              {t.debugPanel}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">{t.detectedFps}</span>
                <p className="text-sm font-mono font-bold">{detectedInfo.fps}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">{t.frameCount}</span>
                <p className="text-sm font-mono font-bold">{detectedInfo.frameCount}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              {t.smartDetectionNote}
            </p>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="space-y-6">
        <div className="glass-surface rounded-3xl p-6 border border-white/10 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Type size={20} className="text-primary" />
            {t.rebranding}
          </h3>

          <div className="space-y-4">
            {/* Options Toggle */}
            <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.temporalSmoothing}</span>
                <input 
                  type="checkbox" 
                  checked={options.temporalSmoothing}
                  onChange={e => setOptions(prev => ({ ...prev, temporalSmoothing: e.target.checked }))}
                  className="accent-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.fastMode}</span>
                <input 
                  type="checkbox" 
                  checked={options.processEverySecondFrame}
                  onChange={e => setOptions(prev => ({ ...prev, processEverySecondFrame: e.target.checked }))}
                  className="accent-primary"
                />
              </div>
            </div>
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              <button 
                onClick={() => setConfig(prev => ({ ...prev, type: 'text' }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                  config.type === 'text' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                <Type size={16} />
                {t.addText}
              </button>
              <button 
                onClick={() => setConfig(prev => ({ ...prev, type: 'image' }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                  config.type === 'image' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                <ImageIcon size={16} />
                {t.addLogo}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {config.type === 'text' ? t.addText : t.addLogo}
              </label>
              {config.type === 'text' ? (
                <input 
                  type="text" 
                  value={config.content}
                  onChange={e => setConfig(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              ) : (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/png"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setConfig(prev => ({ ...prev, content: ev.target?.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:bg-white/10 transition-all">
                    {config.content.startsWith('data:image') ? (
                      <img src={config.content} className="h-16 object-contain" alt="Logo" />
                    ) : (
                      <>
                        <Upload size={20} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">PNG only</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>{t.opacity}</span>
              <span>{Math.round(config.opacity * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.1"
              value={config.opacity}
              onChange={e => setConfig(prev => ({ ...prev, opacity: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>{t.size}</span>
                <span>{config.size}px</span>
              </div>
              <input 
                type="range" 
                min="10" max="100" step="1"
                value={config.size}
                onChange={e => setConfig(prev => ({ ...prev, size: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <button 
            onClick={() => onProcess({ area, newWatermark: config, options })}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {t.start}
          </button>
        </div>
      </div>
    </div>
  );
};
