import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export function useFFmpeg() {
  const [ready, setReady] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setReady(true);
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
    }
  };

  return { ffmpeg: ffmpegRef.current, ready, progress };
}
