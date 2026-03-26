import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translations, Language } from '@/i18n/translations';

interface VideoUploadProps {
  onUpload: (file: File) => void;
  lang: Language;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload, lang }) => {
  const t = translations[lang];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 10) {
          alert("Video duration exceeds 10 seconds limit.");
          return;
        }
        onUpload(file);
      };
      video.src = URL.createObjectURL(file);
    }
  }, [onUpload]);

  // @ts-ignore
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
          "glass-surface"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
            isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {isDragActive ? <Video size={40} /> : <Upload size={40} />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">
              {t.uploadTitle}
            </h3>
            <p className="text-muted-foreground">
              {t.uploadDesc}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
            <AlertCircle size={14} />
            {t.maxSize}
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>
            {fileRejections[0].errors[0].code === 'file-too-large' 
              ? t.maxSize 
              : "Invalid file type. Please upload MP4, MOV, or WEBM."}
          </span>
        </div>
      )}
    </div>
  );
};
