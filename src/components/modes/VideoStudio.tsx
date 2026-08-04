import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Music,
  Type,
  Film,
  Download,
  Plus,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { VideoClip, VideoTrack } from '../../types';

export const VideoStudio: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(4.5); // seconds
  const totalDuration = 30; // 30 seconds project

  const [tracks, setTracks] = useState<VideoTrack[]>([
    {
      id: 'track_video_1',
      name: 'Vídeo Principal 4K',
      type: 'video',
      clips: [
        {
          id: 'clip_v1',
          name: 'Cena_01_Intro_Render3D.mp4',
          start: 0,
          duration: 10,
          type: 'video',
          color: '#3b82f6',
        },
        {
          id: 'clip_v2',
          name: 'Cena_02_Ilustracao_Speedpaint.mp4',
          start: 10,
          duration: 12,
          type: 'video',
          color: '#8b5cf6',
        },
      ],
    },
    {
      id: 'track_audio_1',
      name: 'Trilha Sonora & Efeitos',
      type: 'audio',
      clips: [
        {
          id: 'clip_a1',
          name: 'Trilha_Ambient_Cinematic.wav',
          start: 0,
          duration: 25,
          type: 'audio',
          color: '#10b981',
        },
      ],
    },
    {
      id: 'track_text_1',
      name: 'Legendas & Títulos Overlays',
      type: 'text',
      clips: [
        {
          id: 'clip_t1',
          name: 'Título: AetherStudio Pro 2026',
          start: 2,
          duration: 6,
          type: 'text',
          color: '#f59e0b',
        },
      ],
    },
  ]);

  // Video playback timer loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const exportVideoFile = () => {
    alert('Iniciando renderização da timeline de vídeo em WebM/MP4...');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* Top Preview Player Area */}
      <div className="flex-1 flex bg-[#111111] p-6 gap-6 items-center justify-center">
        {/* Video Player Display Container */}
        <div className="w-[720px] h-[400px] bg-[#161616] border border-white/10 rounded-lg shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
          {/* Animated Video Frame Simulation */}
          <div className="w-full h-full bg-gradient-to-tr from-black via-[#161616] to-indigo-950/40 flex flex-col items-center justify-center relative">
            <Film className="w-16 h-16 text-indigo-500/40 mb-3 animate-pulse" />
            <span className="text-sm font-bold text-gray-200">
              Pré-visualização da Timeline em Tempo Real
            </span>
            <span className="text-xs font-mono text-indigo-400 mt-1">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </span>

            {/* Simulated Animated Title Overlay if clip active */}
            {currentTime >= 2 && currentTime <= 8 && (
              <div className="absolute top-12 px-6 py-2 bg-black/80 backdrop-blur-md rounded border border-amber-500/50 text-amber-300 font-bold text-lg shadow-2xl animate-in fade-in duration-300">
                AetherStudio Pro 2026
              </div>
            )}
          </div>

          {/* Player Transport Controls */}
          <div className="w-full bg-black border-t border-white/10 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTime(0)}
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow transition-transform active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-300">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{formatTimecode(currentTime)}</span>
            </div>

            <button
              onClick={exportVideoFile}
              className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Vídeo MP4/WebM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Area */}
      <div className="h-64 bg-[#161616] border-t border-white/10 p-4 flex flex-col space-y-3">
        {/* Timeline Header Ruler */}
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 border-b border-white/10 pb-2">
          <span className="font-bold text-gray-200">Trilhas ({tracks.length})</span>
          <div className="flex items-center gap-8 text-[11px]">
            <span>00:00</span>
            <span>00:05</span>
            <span>00:10</span>
            <span>00:15</span>
            <span>00:20</span>
            <span>00:25</span>
            <span>00:30</span>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 bg-black p-2 rounded border border-white/10"
            >
              {/* Track Info Header */}
              <div className="w-44 flex items-center gap-2 border-r border-white/10 pr-3">
                {track.type === 'video' && <Video className="w-4 h-4 text-indigo-400" />}
                {track.type === 'audio' && <Music className="w-4 h-4 text-emerald-400" />}
                {track.type === 'text' && <Type className="w-4 h-4 text-amber-400" />}
                <span className="text-xs font-semibold text-gray-200 truncate">
                  {track.name}
                </span>
              </div>

              {/* Clips Runway */}
              <div className="flex-1 h-9 bg-[#111111] rounded relative overflow-hidden border border-white/5">
                {/* Playhead Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-10 shadow-[0_0_8px_#818cf8]"
                  style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                />

                {track.clips.map((clip) => {
                  const leftPercent = (clip.start / totalDuration) * 100;
                  const widthPercent = (clip.duration / totalDuration) * 100;

                  return (
                    <div
                      key={clip.id}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: clip.color,
                      }}
                      className="absolute top-1 bottom-1 rounded px-2 flex items-center justify-between text-[10px] font-bold text-white shadow cursor-pointer hover:brightness-110 transition-all truncate"
                    >
                      <span className="truncate">{clip.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
