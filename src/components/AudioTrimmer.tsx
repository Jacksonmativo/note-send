import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Upload, X, Play, Pause, Scissors } from 'lucide-react';

interface AudioTrimmerProps {
  totalDuration: number; // total slideshow duration in seconds
  onAudioChange: (audio: { buffer: AudioBuffer; startTime: number; endTime: number } | null) => void;
}

const AudioTrimmer = ({ totalDuration, onAudioChange }: AudioTrimmerProps) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playPosition, setPlayPosition] = useState(0);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const playStartRef = useRef(0);
  const draggingRef = useRef<'start' | 'end' | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ctx = getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    setAudioBuffer(decoded);
    setFileName(file.name);
    setStartTime(0);
    const trimEnd = Math.min(decoded.duration, totalDuration);
    setEndTime(trimEnd);

    // Generate waveform data
    const rawData = decoded.getChannelData(0);
    const samples = 200;
    const blockSize = Math.floor(rawData.length / samples);
    const peaks: number[] = [];
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      peaks.push(sum / blockSize);
    }
    const maxPeak = Math.max(...peaks);
    setWaveformData(peaks.map(p => p / maxPeak));

    onAudioChange({ buffer: decoded, startTime: 0, endTime: trimEnd });
  };

  // Draw waveform
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || waveformData.length === 0 || !audioBuffer) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barWidth = w / waveformData.length;
    const duration = audioBuffer.duration;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw bars
    waveformData.forEach((peak, i) => {
      const x = i * barWidth;
      const barH = peak * h * 0.8;
      const timeAt = (i / waveformData.length) * duration;
      const inRange = timeAt >= startTime && timeAt <= endTime;

      ctx.fillStyle = inRange
        ? 'hsl(var(--primary))'
        : 'hsl(var(--muted-foreground) / 0.25)';
      ctx.fillRect(x, (h - barH) / 2, Math.max(barWidth - 1, 1), barH);
    });

    // Draw selection overlay borders
    const startX = (startTime / duration) * w;
    const endX = (endTime / duration) * w;

    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw play position
    if (isPlaying) {
      const posX = (playPosition / duration) * w;
      ctx.strokeStyle = 'hsl(var(--destructive))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(posX, 0);
      ctx.lineTo(posX, h);
      ctx.stroke();
    }
  }, [waveformData, startTime, endTime, audioBuffer, isPlaying, playPosition]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!audioBuffer || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * audioBuffer.duration;

    const startX = (startTime / audioBuffer.duration) * rect.width;
    const endX = (endTime / audioBuffer.duration) * rect.width;

    if (Math.abs(x - startX) < 12) {
      draggingRef.current = 'start';
    } else if (Math.abs(x - endX) < 12) {
      draggingRef.current = 'end';
    } else {
      // Click to set nearest handle
      if (Math.abs(time - startTime) < Math.abs(time - endTime)) {
        draggingRef.current = 'start';
      } else {
        draggingRef.current = 'end';
      }
      updateHandle(time);
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !audioBuffer || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min((x / rect.width) * audioBuffer.duration, audioBuffer.duration));
    updateHandle(time);
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  const updateHandle = (time: number) => {
    if (!audioBuffer) return;
    if (draggingRef.current === 'start') {
      const newStart = Math.min(time, endTime - 0.5);
      const clampedStart = Math.max(0, newStart);
      // Auto-clamp end so selection <= totalDuration
      let newEnd = endTime;
      if (newEnd - clampedStart > totalDuration) {
        newEnd = clampedStart + totalDuration;
      }
      setStartTime(clampedStart);
      setEndTime(newEnd);
      onAudioChange({ buffer: audioBuffer, startTime: clampedStart, endTime: newEnd });
    } else if (draggingRef.current === 'end') {
      const newEnd = Math.max(time, startTime + 0.5);
      const clampedEnd = Math.min(audioBuffer.duration, newEnd);
      let newStart = startTime;
      if (clampedEnd - newStart > totalDuration) {
        newStart = clampedEnd - totalDuration;
      }
      setStartTime(newStart);
      setEndTime(clampedEnd);
      onAudioChange({ buffer: audioBuffer, startTime: newStart, endTime: clampedEnd });
    }
  };

  const togglePlay = () => {
    if (!audioBuffer) return;
    const ctx = getAudioContext();

    if (isPlaying) {
      sourceRef.current?.stop();
      cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    const duration = endTime - startTime;
    source.start(0, startTime, duration);
    sourceRef.current = source;
    playStartRef.current = ctx.currentTime;
    setIsPlaying(true);

    const animate = () => {
      const elapsed = ctx.currentTime - playStartRef.current;
      setPlayPosition(startTime + elapsed);
      if (elapsed < duration) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    source.onended = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    };
  };

  const autoFit = () => {
    if (!audioBuffer) return;
    setStartTime(0);
    const newEnd = Math.min(audioBuffer.duration, totalDuration);
    setEndTime(newEnd);
    onAudioChange({ buffer: audioBuffer, startTime: 0, endTime: newEnd });
  };

  const removeAudio = () => {
    sourceRef.current?.stop();
    cancelAnimationFrame(animFrameRef.current);
    setAudioBuffer(null);
    setFileName('');
    setWaveformData([]);
    setIsPlaying(false);
    onAudioChange(null);
  };

  const selectedDuration = endTime - startTime;

  if (!audioBuffer) {
    return (
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity cursor-pointer">
        <Music className="w-4 h-4" />
        Add Audio
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <div className="bg-card rounded-xl p-3 paper-shadow space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          <span className="text-xs font-handwriting-patrick text-foreground truncate max-w-[140px]">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title={isPlaying ? 'Pause' : 'Play selection'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={autoFit}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="Auto-fit to slides duration"
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button
            onClick={removeAudio}
            className="p-1.5 rounded-md hover:bg-destructive/20 text-destructive transition-colors"
            title="Remove audio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Waveform */}
      <div
        ref={containerRef}
        className="relative h-16 rounded-md bg-muted/50 cursor-col-resize touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <canvas
          ref={waveformRef}
          className="w-full h-full"
        />
        {/* Handle indicators */}
        {audioBuffer && (
          <>
            <div
              className="absolute top-0 bottom-0 w-1 bg-primary rounded-full"
              style={{ left: `${(startTime / audioBuffer.duration) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-4 h-3 bg-primary rounded-t-sm" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-1 bg-primary rounded-full"
              style={{ left: `${(endTime / audioBuffer.duration) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-4 h-3 bg-primary rounded-t-sm" />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-handwriting-patrick">
        <span>
          {startTime.toFixed(1)}s – {endTime.toFixed(1)}s ({selectedDuration.toFixed(1)}s selected)
        </span>
        <span>
          Slides: {totalDuration}s
          {Math.abs(selectedDuration - totalDuration) > 0.5 && (
            <span className="text-destructive ml-1">
              {selectedDuration > totalDuration ? '(too long)' : '(shorter)'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default AudioTrimmer;
