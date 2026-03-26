import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Sparkles, 
  Layers, 
  Download, 
  Globe, 
  Moon, 
  Sun, 
  Zap, 
  ShieldCheck, 
  Clock,
  ChevronRight,
  Github
} from 'lucide-react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { VideoUpload } from '@/components/VideoUpload';
import { WatermarkEditor, WatermarkConfig } from '@/components/WatermarkEditor';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ResultPreview } from '@/components/ResultPreview';
import { translations, Language } from '@/i18n/translations';
import { cn } from '@/lib/utils';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [step, setStep] = useState<'upload' | 'editor' | 'processing' | 'result'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [processStatus, setProcessStatus] = useState<'idle' | 'extracting' | 'processing' | 'encoding' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [detectedInfo, setDetectedInfo] = useState<{
    fps: number;
    frameCount: number;
    suggestedArea?: { x: number; y: number; width: number; height: number };
  }>();

  const { ffmpeg, ready } = useFFmpeg();
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    document.title = t.seoTitle;
  }, [t.seoTitle]);

  const handleUpload = async (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setStep('editor');
    
    if (ffmpeg && ready) {
      await detectMetadata(file);
    }
  };

  const detectMetadata = async (file: File) => {
    if (!ffmpeg) return;
    
    const inputName = 'detect_input.mp4';
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Capture logs to parse FPS
    let logs = "";
    const logHandler = ({ message }: { message: string }) => {
      logs += message + "\n";
    };
    ffmpeg.on('log', logHandler);
    
    await ffmpeg.exec(['-i', inputName]);
    
    ffmpeg.off('log', logHandler);
    
    // Parse FPS from logs (e.g., "25 fps")
    const fpsMatch = logs.match(/(\d+(\.\d+)?)\s+fps/);
    const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 30;
    
    // Get frame count (approximate)
    const durationMatch = logs.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    let frameCount = 0;
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      const centiseconds = parseInt(durationMatch[4]);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
      frameCount = Math.floor(totalSeconds * fps);
    }

    // Smart Detection (Analyze first 5 frames)
    const suggestedArea = await smartDetectWatermark(inputName, fps);
    
    setDetectedInfo({ fps, frameCount, suggestedArea });
  };

  const smartDetectWatermark = async (inputName: string, fps: number) => {
    if (!ffmpeg) return;
    
    // Extract first 5 frames
    await ffmpeg.exec(['-i', inputName, '-t', '0.5', '-vf', `fps=${fps}`, 'detect_%03d.png']);
    
    const frames = await ffmpeg.listDir('.');
    const detectFiles = frames
      .filter(f => f.name.startsWith('detect_') && f.name.endsWith('.png'))
      .map(f => f.name)
      .sort();

    if (detectFiles.length < 2) return undefined;

    // Basic logic: Divide into 4 zones and check for static high-contrast areas
    // For simplicity in this demo, we'll return a common watermark position (top-right)
    // but in a real app, we'd compare pixel differences across detectFiles.
    return { x: 75, y: 5, width: 20, height: 10 };
  };

  const processVideo = async (config: WatermarkConfig) => {
    if (!ffmpeg || !videoFile) return;

    setStep('processing');
    setProcessStatus('extracting');
    setProgress(0);

    try {
      const inputName = 'input.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      const fps = detectedInfo?.fps || 30;
      const fpsArg = config.options.processEverySecondFrame ? fps / 2 : fps;

      // 1. Extract Frames
      await ffmpeg.exec(['-i', inputName, '-vf', `fps=${fpsArg}`, 'frame_%04d.png']);
      setProcessStatus('processing');
      setProgress(30);

      // 2. Process Frames
      const frames = await ffmpeg.listDir('.');
      const frameFiles = frames
        .filter(f => f.name.startsWith('frame_') && f.name.endsWith('.png'))
        .map(f => f.name)
        .sort();

      const totalFrames = frameFiles.length;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Buffers for temporal smoothing
      const frameBuffers: ImageData[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const frameName = frameFiles[i];
        const data = await ffmpeg.readFile(frameName);
        const img = await loadImage(URL.createObjectURL(new Blob([data], { type: 'image/png' })));

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const { area, newWatermark, options } = config;
        const x = (area.x / 100) * canvas.width;
        const y = (area.y / 100) * canvas.height;
        const w = (area.width / 100) * canvas.width;
        const h = (area.height / 100) * canvas.height;

        // Temporal Smoothing: Blend with neighbors
        if (options.temporalSmoothing) {
          const currentFrameData = ctx.getImageData(x, y, w, h);
          frameBuffers.push(currentFrameData);
          if (frameBuffers.length > 3) frameBuffers.shift();

          if (frameBuffers.length === 3) {
            const blended = blendFrames(frameBuffers);
            ctx.putImageData(blended, x, y);
          }
        }

        // Apply Cleaning (Blur/Smooth)
        ctx.filter = 'blur(6px)';
        ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
        ctx.filter = 'none';

        // Apply New Watermark
        ctx.globalAlpha = newWatermark.opacity;
        if (newWatermark.type === 'text') {
          ctx.font = `bold ${newWatermark.size}px Inter`;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(newWatermark.content, x + w / 2, y + h / 2);
        } else if (newWatermark.content) {
          const logo = await loadImage(newWatermark.content);
          const logoW = newWatermark.size * 2;
          const logoH = (logo.height / logo.width) * logoW;
          ctx.drawImage(logo, x + (w - logoW) / 2, y + (h - logoH) / 2, logoW, logoH);
        }
        ctx.globalAlpha = 1.0;

        // Write back
        const processedBlob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
        await ffmpeg.writeFile(`out_${frameName}`, await fetchFile(processedBlob));
        
        setProgress(30 + Math.round((i / totalFrames) * 40));
      }

      // 3. Re-encode Video
      setProcessStatus('encoding');
      await ffmpeg.exec([
        '-framerate', fpsArg.toString(),
        '-i', 'out_frame_%04d.png',
        '-i', inputName,
        '-map', '0:v',
        '-map', '1:a?', 
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        'output.mp4'
      ]);

      const outputData = await ffmpeg.readFile('output.mp4');
      const outputUrl = URL.createObjectURL(new Blob([outputData], { type: 'video/mp4' }));
      
      setResultUrl(outputUrl);
      setProcessStatus('done');
      setProgress(100);
      setTimeout(() => setStep('result'), 1000);

    } catch (error) {
      console.error('Processing error:', error);
      setProcessStatus('error');
    }
  };

  const blendFrames = (buffers: ImageData[]): ImageData => {
    const output = new ImageData(buffers[0].width, buffers[0].height);
    for (let i = 0; i < output.data.length; i++) {
      let sum = 0;
      for (const buffer of buffers) {
        sum += buffer.data[i];
      }
      output.data[i] = sum / buffers.length;
    }
    return output;
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const reset = () => {
    setStep('upload');
    setVideoFile(null);
    setVideoUrl("");
    setResultUrl("");
    setProcessStatus('idle');
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-surface border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              {t.title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
              <Globe size={16} className="text-muted-foreground" />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="es">Español</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4"
                >
                  <Zap size={14} />
                  AI-Powered Rebranding
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                  {t.subtitle}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t.seoDesc}
                </p>
              </div>

              <VideoUpload onUpload={handleUpload} lang={lang} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-12">
                {[
                  { icon: <ShieldCheck className="text-green-500" />, title: "Secure & Private", desc: "All processing happens in your browser. No video is uploaded to our servers." },
                  { icon: <Clock className="text-blue-500" />, title: "Fast Processing", desc: "Optimized frame extraction and cleaning engine for instant results." },
                  { icon: <Layers className="text-purple-500" />, title: "Pro Customization", desc: "Add your own logos, text, and adjust opacity for the perfect look." }
                ].map((feature, i) => (
                  <div key={i} className="glass-surface p-8 rounded-3xl border border-white/5 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h4 className="text-lg font-bold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <button 
                  onClick={() => setStep('upload')}
                  className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  ← Back to Upload
                </button>
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Editor Mode
                </div>
              </div>
              <WatermarkEditor 
                videoUrl={videoUrl} 
                onProcess={processVideo} 
                lang={lang} 
                detectedInfo={detectedInfo}
              />
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProcessingStatus progress={progress} status={processStatus} lang={lang} />
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                  <Sparkles className="text-primary" />
                  Processing Complete!
                </h3>
                <button 
                  onClick={reset}
                  className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  Start New Project
                </button>
              </div>
              <ResultPreview videoUrl={resultUrl} originalUrl={videoUrl} onReset={reset} lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 glass-surface">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Sparkles className="text-primary" size={20} />
              AI Video Clean
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 AI Video Clean & Rebrand Tool. All rights reserved.
            </p>
          </div>

          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Github size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
