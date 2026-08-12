import React, { useState, useEffect, useRef } from 'react';
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
  VolumeX,
  Upload,
  Layers,
  Wand2,
  Sliders,
  Trash2,
  Maximize2,
  Copy,
  Zap,
  Edit2,
  Check,
} from 'lucide-react';
import { VideoClip, VideoTrack } from '../../types';

export interface VideoFilter {
  id: string;
  name: string;
  cssFilter: string;
}

export const VideoStudio: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(30);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('normal');

  // Sample or Uploaded Video Source
  const [videoSrc, setVideoSrc] = useState<string | null>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );

  const videoRef = useRef<HTMLVideoElement>(null);

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
          duration: 12,
          type: 'video',
          color: '#3b82f6',
        },
        {
          id: 'clip_v2',
          name: 'Cena_02_Ilustracao_Speedpaint.mp4',
          start: 12,
          duration: 18,
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
          duration: 28,
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
          name: 'Título: MNAnimat Visuals Pro',
          start: 2,
          duration: 7,
          type: 'text',
          color: '#f59e0b',
        },
      ],
    },
  ]);

  const filtersList: VideoFilter[] = [
    { id: 'normal', name: 'Original (Normal)', cssFilter: 'none' },
    { id: 'cinematic', name: 'Cinematográfico 4K', cssFilter: 'contrast(120%) saturate(130%) brightness(95%)' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', cssFilter: 'hue-rotate(180deg) saturate(180%)' },
    { id: 'vintage', name: 'Vintage Sephia', cssFilter: 'sepia(80%) contrast(110%)' },
    { id: 'bw', name: 'P&B Alto Contraste', cssFilter: 'grayscale(100%) contrast(150%)' },
  ];

  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_v1');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(100);
  const [overlayText, setOverlayText] = useState<string>('MNAnimat Visuals Pro 2026');
  const [overlayColor, setOverlayColor] = useState<string>('#f59e0b');

  // Track / Layer Renaming State
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState<string>('');

  const handleSaveTrackName = (trackId: string) => {
    const trimmed = editingTrackName.trim();
    if (trimmed) {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, name: trimmed } : t))
      );
    }
    setEditingTrackId(null);
  };

  // Export rendering progress state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Video playback timer loop and synced with HTML5 video
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            if (videoRef.current) videoRef.current.pause();
            return 0;
          }
          return prev + 0.1 * playbackSpeed;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, playbackSpeed]);

  // Sync volume & playback speed with video tag
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed]);

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setTotalDuration(30);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackSpeed;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  };

  const handleDuplicateSelectedClip = () => {
    if (!selectedClipId) return;
    setTracks((prev) =>
      prev.map((track) => {
        const target = track.clips.find((c) => c.id === selectedClipId);
        if (!target) return track;
        const dup: VideoClip = {
          ...target,
          id: `clip_dup_${Date.now()}`,
          name: `${target.name} (Cópia)`,
          start: Math.min(totalDuration - target.duration, target.start + target.duration + 0.5),
        };
        return {
          ...track,
          clips: [...track.clips, dup].sort((a, b) => a.start - b.start),
        };
      })
    );
  };

  const handleSplitClipAtPlayhead = () => {
    if (!selectedClipId) return;

    setTracks((prev) =>
      prev.map((track) => {
        const targetClip = track.clips.find((c) => c.id === selectedClipId);
        if (!targetClip) return track;

        // Check if playhead intersects clip
        if (currentTime > targetClip.start && currentTime < targetClip.start + targetClip.duration) {
          const firstDuration = currentTime - targetClip.start;
          const secondDuration = targetClip.duration - firstDuration;

          const clip1: VideoClip = {
            ...targetClip,
            duration: Math.max(0.5, Number(firstDuration.toFixed(1))),
          };

          const clip2: VideoClip = {
            ...targetClip,
            id: `clip_split_${Date.now()}`,
            name: `${targetClip.name} (Parte 2)`,
            start: Number(currentTime.toFixed(1)),
            duration: Math.max(0.5, Number(secondDuration.toFixed(1))),
          };

          const remainingClips = track.clips.filter((c) => c.id !== selectedClipId);
          return {
            ...track,
            clips: [...remainingClips, clip1, clip2].sort((a, b) => a.start - b.start),
          };
        }
        return track;
      })
    );
  };

  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return;
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => c.id !== selectedClipId),
      }))
    );
    setSelectedClipId(null);
  };

  const handleUpdateSelectedClip = (field: keyof VideoClip, value: any) => {
    if (!selectedClipId) return;
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        clips: track.clips.map((c) => (c.id === selectedClipId ? { ...c, [field]: value } : c)),
      }))
    );
  };

  // Dragging Clips state (Move & Resize handles on left/right edges)
  const handleClipPointerDown = (
    e: React.PointerEvent,
    clip: VideoClip,
    type: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedClipId(clip.id);

    const runwayEl = (e.currentTarget as HTMLElement).closest('.clips-runway');
    if (!runwayEl) return;
    const runwayWidth = runwayEl.getBoundingClientRect().width;
    if (runwayWidth <= 0) return;

    const startX = e.clientX;
    const initialStart = clip.start;
    const initialDuration = clip.duration;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = (deltaX / runwayWidth) * totalDuration;

      setTracks((prevTracks) =>
        prevTracks.map((track) => ({
          ...track,
          clips: track.clips.map((c) => {
            if (c.id !== clip.id) return c;

            if (type === 'move') {
              const rawStart = initialStart + deltaSeconds;
              const newStart = Math.max(0, Math.min(totalDuration - c.duration, rawStart));
              return { ...c, start: Number(newStart.toFixed(1)) };
            } else if (type === 'resize-left') {
              const maxStart = initialStart + initialDuration - 0.5;
              const rawStart = Math.max(0, Math.min(maxStart, initialStart + deltaSeconds));
              const newStart = Number(rawStart.toFixed(1));
              const newDuration = Number((initialDuration + (initialStart - newStart)).toFixed(1));
              return { ...c, start: newStart, duration: Math.max(0.5, newDuration) };
            } else if (type === 'resize-right') {
              const maxDuration = totalDuration - initialStart;
              const rawDuration = Math.max(0.5, Math.min(maxDuration, initialDuration + deltaSeconds));
              return { ...c, duration: Number(rawDuration.toFixed(1)) };
            }
            return c;
          }),
        }))
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleAddTrack = (type: 'video' | 'audio' | 'text') => {
    const newTrack: VideoTrack = {
      id: `track_${Date.now()}`,
      name: `Nova Trilha ${type.toUpperCase()} #${tracks.length + 1}`,
      type,
      clips: [
        {
          id: `clip_${Date.now()}`,
          name: `Novo_Clip_${type.toUpperCase()}.mp4`,
          start: Math.floor(currentTime),
          duration: 8,
          type,
          color: type === 'video' ? '#06b6d4' : type === 'audio' ? '#10b981' : '#f59e0b',
        },
      ],
    };
    setTracks([...tracks, newTrack]);
  };

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const exportVideoFile = () => {
    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            // Trigger sample download
            const blob = new Blob(['MNAnimat Studio MP4 Export Data'], { type: 'video/mp4' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Video_Editado_4K_${Date.now()}.mp4`;
            a.click();
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const currentCssFilter = filtersList.find((f) => f.id === activeFilter)?.cssFilter || 'none';

  return (
    <div className="flex-1 flex flex-col bg-[#0a0f1d] overflow-hidden text-slate-100 select-none">
      {/* Top Header & Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-rose-500 text-white shadow-lg">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Estúdio de Edição de Vídeo Pro</h2>
            <p className="text-[10px] text-slate-400">Timeline Multi-Trilha, Filtros e Renderização em 4K</p>
          </div>
        </div>

        {/* Custom Video Import */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-xs font-bold cursor-pointer transition-all">
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>Importar Vídeo Local</span>
          <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" />
        </label>

        {/* Filter Selection */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Filtro de Cor:</span>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded-lg px-2.5 py-1 focus:outline-none"
          >
            {filtersList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={exportVideoFile}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 hover:from-indigo-500 hover:to-rose-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Vídeo MP4</span>
        </button>
      </div>

      {/* Main Preview Player Area */}
      <div className="flex-1 flex bg-[#070b14] p-4 gap-4 items-center justify-center relative overflow-hidden">
        {/* Video Player Display Container */}
        <div className="flex-1 max-w-[760px] h-[410px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center group">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              muted={isMuted}
              style={{ filter: currentCssFilter }}
              className="w-full h-full object-cover rounded-xl transition-all"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Film className="w-16 h-16 mb-2 animate-pulse" />
              <p className="text-xs font-semibold">Nenhum vídeo carregado</p>
            </div>
          )}

          {/* Dynamic Active Text Track Clips Overlay */}
          {tracks
            .filter((t) => t.type === 'text')
            .flatMap((t) => t.clips)
            .filter((c) => currentTime >= c.start && currentTime <= c.start + c.duration)
            .map((textClip) => (
              <div
                key={textClip.id}
                className="absolute top-8 px-6 py-2.5 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-amber-500/50 text-amber-300 font-extrabold text-lg shadow-2xl animate-in fade-in duration-300 z-10 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{textClip.name}</span>
              </div>
            ))}

          {/* Player Transport Overlay Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-5 py-2.5 flex items-center justify-between z-20">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setCurrentTime(0);
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl shadow font-bold flex items-center gap-1.5 text-xs transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title={isMuted ? 'Desmutar' : 'Mutar'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-16 accent-cyan-400 cursor-pointer h-1"
                />
              </div>
            </div>

            {/* Timeline Progress Slider */}
            <div className="flex-1 mx-4 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={totalDuration}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>
                {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Clip Property Inspector Sidebar */}
        <div className="w-72 h-[410px] bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-xl overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Propriedades do Clip</span>
              </div>
              {selectedClipId && (
                <button
                  onClick={handleDuplicateSelectedClip}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px] flex items-center gap-1 font-bold"
                  title="Duplicar Clip"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  Duplicar
                </button>
              )}
            </div>

            {selectedClipId ? (
              (() => {
                const selectedClip = tracks
                  .flatMap((t) => t.clips)
                  .find((c) => c.id === selectedClipId);
                if (!selectedClip) return null;

                return (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold mb-1 block">Nome do Clip:</label>
                      <input
                        type="text"
                        value={selectedClip.name}
                        onChange={(e) => handleUpdateSelectedClip('name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 font-semibold mb-1 block">Início (s):</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={totalDuration - 1}
                          value={selectedClip.start}
                          onChange={(e) => handleUpdateSelectedClip('start', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold mb-1 block">Duração (s):</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max={totalDuration}
                          value={selectedClip.duration}
                          onChange={(e) => handleUpdateSelectedClip('duration', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold mb-1 block">Cor de Destaque:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedClip.color}
                          onChange={(e) => handleUpdateSelectedClip('color', e.target.value)}
                          className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-slate-300 text-xs">{selectedClip.color}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
                      <span>Tipo: <strong className="text-slate-300 uppercase">{selectedClip.type}</strong></span>
                      <button
                        onClick={handleDeleteSelectedClip}
                        className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="p-4 text-center text-slate-500 space-y-2">
                <Layers className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs">Clique em qualquer clip na timeline abaixo para editar suas propriedades.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-cyan-400 block">Dicas de Controle de Clips:</span>
            <p>• <strong className="text-slate-200">Mover:</strong> Arraste o centro do clip na timeline.</p>
            <p>• <strong className="text-slate-200">Aumentar/Ajustar:</strong> Arraste as pontas laterais de cada clip.</p>
            <p>• <strong className="text-slate-200">Dividir:</strong> Use a Tesoura na posição da agulha.</p>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Area */}
      <div className="h-64 bg-slate-900 border-t border-slate-800 p-3 flex flex-col space-y-2 shrink-0">
        {/* Timeline Header Toolbar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-white">Timeline ({tracks.length} trilhas)</span>
            </div>

            {/* Split & Delete Clip Editing Tools */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={handleSplitClipAtPlayhead}
                disabled={!selectedClipId}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded font-bold flex items-center gap-1 text-[11px] shadow transition-all"
                title="Cortar/Dividir Clip Selecionado na Posição da Agulha"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Dividir (Tesoura)</span>
              </button>

              <button
                onClick={handleDeleteSelectedClip}
                disabled={!selectedClipId}
                className="px-2 py-1 bg-rose-950 hover:bg-rose-800 text-rose-300 border border-rose-800 disabled:opacity-40 rounded font-bold flex items-center gap-1 text-[11px] transition-all"
                title="Excluir Clip Selecionado"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>

            {/* Playback Speed Control */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Velocidade:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-slate-900 text-amber-300 font-bold rounded focus:outline-none px-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x (Rápido)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddTrack('video')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Trilha Vídeo
            </button>
            <button
              onClick={() => handleAddTrack('audio')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Trilha Áudio
            </button>
            <button
              onClick={() => handleAddTrack('text')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Trilha Título
            </button>
          </div>
        </div>

        {/* Tracks List Container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800"
            >
              {/* Track Info Header */}
              <div className="w-48 flex items-center justify-between border-r border-slate-800 pr-3 shrink-0">
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  {track.type === 'video' && <Video className="w-4 h-4 text-indigo-400 shrink-0" />}
                  {track.type === 'audio' && <Music className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {track.type === 'text' && <Type className="w-4 h-4 text-amber-400 shrink-0" />}

                  {editingTrackId === track.id ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingTrackName}
                        onChange={(e) => setEditingTrackName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTrackName(track.id);
                          if (e.key === 'Escape') setEditingTrackId(null);
                        }}
                        onBlur={() => handleSaveTrackName(track.id)}
                        autoFocus
                        className="bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white font-bold focus:outline-none w-full"
                      />
                      <button
                        onClick={() => handleSaveTrackName(track.id)}
                        className="p-0.5 text-emerald-400 hover:text-emerald-300"
                        title="Salvar Nome da Trilha"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1.5 flex-1 min-w-0 group/trackname cursor-pointer"
                      onDoubleClick={() => {
                        setEditingTrackId(track.id);
                        setEditingTrackName(track.name);
                      }}
                    >
                      <span className="text-xs font-extrabold text-slate-200 truncate" title="Clique duas vezes para renomear esta trilha">
                        {track.name}
                      </span>
                      <button
                        onClick={() => {
                          setEditingTrackId(track.id);
                          setEditingTrackName(track.name);
                        }}
                        className="opacity-0 group-hover/trackname:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-cyan-300"
                        title="Renomear Trilha"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clips Runway */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  const newTime = Number((ratio * totalDuration).toFixed(1));
                  setCurrentTime(newTime);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                }}
                className="clips-runway flex-1 h-10 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 cursor-pointer"
              >
                {/* Playhead Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 shadow-[0_0_10px_#22d3ee]"
                  style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                />

                {track.clips.map((clip) => {
                  const leftPercent = (clip.start / totalDuration) * 100;
                  const widthPercent = (clip.duration / totalDuration) * 100;
                  const isSelected = selectedClipId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(clip.id);
                      }}
                      onPointerDown={(e) => handleClipPointerDown(e, clip, 'move')}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: clip.color,
                      }}
                      className={`group absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between text-[10px] font-bold text-white shadow-lg cursor-grab active:cursor-grabbing select-none border transition-all ${
                        isSelected ? 'ring-2 ring-cyan-300 border-white font-black z-10' : 'border-white/20 hover:brightness-125'
                      }`}
                    >
                      {/* Left Edge Handle (Aumentar/Diminuir Tamanho do Início) */}
                      <div
                        onPointerDown={(e) => handleClipPointerDown(e, clip, 'resize-left')}
                        className="absolute left-0 top-0 bottom-0 w-3 bg-white/40 hover:bg-cyan-400 cursor-ew-resize rounded-l-lg z-20 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                        title="Arraste para ajustar o início do clipe"
                      >
                        <div className="w-0.5 h-3 bg-slate-950 rounded-full" />
                      </div>

                      <span className="truncate px-2 pointer-events-none">{clip.name}</span>
                      <span className="font-mono text-[9px] opacity-90 pointer-events-none">{clip.duration}s</span>

                      {/* Right Edge Handle (Aumentar/Diminuir Tamanho do Fim) */}
                      <div
                        onPointerDown={(e) => handleClipPointerDown(e, clip, 'resize-right')}
                        className="absolute right-0 top-0 bottom-0 w-3 bg-white/40 hover:bg-cyan-400 cursor-ew-resize rounded-r-lg z-20 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                        title="Arraste para ajustar o fim do clipe"
                      >
                        <div className="w-0.5 h-3 bg-slate-950 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Exporting Modal Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-6 h-6 animate-spin text-amber-400" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">Renderizando Vídeo MP4 4K</h3>
              <p className="text-xs text-slate-400 mt-1">
                Processando trilhas de vídeo, efeitos de cor e codificação de áudio AAC...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold text-cyan-400">
                <span>Progresso de Renderização</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-200 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
