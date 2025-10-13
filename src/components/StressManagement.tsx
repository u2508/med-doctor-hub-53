/* StressManagement.tsx
   Enhanced StressManagement with real-time Web Audio API Visualizer
   - TypeScript + React + Framer Motion (as before)
   - Visualizer supports 'bars' and 'wave' modes and adapts color by app mode
*/

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Music, Play, Pause, Volume2, VolumeX, Wind, Brain, Headphones
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AudioTrack {
  id: string;
  title: string;
  duration: string;
  file: string;
  description: string;
  category: 'nature' | 'ambient' | 'meditation' | 'focus';
}

/* -------------------------
   Visualizer component
   - Props: audioEl (HTMLAudioElement | null), mode, type
   - type: 'bars' | 'wave'
   ------------------------- */
const Visualizer: React.FC<{
  audioEl: HTMLAudioElement | null;
  uiMode: 'breathe' | 'relax' | 'focus';
  type?: 'bars' | 'wave';
}> = ({ audioEl, uiMode, type = 'bars' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // color palette per UI mode
  const palette: Record<string, string> = {
    breathe: 'rgba(163, 140, 255, 0.95)', // soft purple
    relax: 'rgba(94, 234, 212, 0.95)',    // teal
    focus: 'rgba(99, 102, 241, 0.95)'     // electric indigo
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioEl) return;

    // create or reuse AudioContext
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContextCtor();
    const audioCtx = audioCtxRef.current;

    // create source and analyser
    if (!sourceRef.current) {
      sourceRef.current = audioCtx.createMediaElementSource(audioEl);
    }
    if (!analyserRef.current) {
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 2048; // good resolution
      analyserRef.current.smoothingTimeConstant = 0.8;
    }

    const analyser = analyserRef.current;
    // connect chain: source -> analyser -> destination (destination optionally omitted to avoid duplicates)
    try {
      sourceRef.current.disconnect(); // guard double-connect
    } catch (e) { /* ignore */ }
    sourceRef.current.connect(analyser);
    analyser.connect(audioCtx.destination);

    const ctx = canvas.getContext('2d')!;
    let width = canvas.width = canvas.clientWidth * devicePixelRatio;
    let height = canvas.height = canvas.clientHeight * devicePixelRatio;

    const resize = () => {
      width = canvas.width = canvas.clientWidth * devicePixelRatio;
      height = canvas.height = canvas.clientHeight * devicePixelRatio;
    };

    const render = () => {
      if (!analyser) return;
      rafRef.current = requestAnimationFrame(render);
      // adaptive smoothing for prettier visuals
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      ctx.clearRect(0, 0, width, height);
      // background subtle fade:
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.fillRect(0, 0, width, height);

      const color = palette[uiMode] || palette['relax'];
      if (type === 'bars') {
        const barCount = 64; // number of bars on canvas
        const step = Math.floor(freqData.length / barCount);
        const barWidth = Math.max((width / barCount) * 0.8, 2 * devicePixelRatio);
        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] / 255; // 0..1
          const barHeight = val * height * 0.9;
          const x = (i * (width / barCount)) + (width / barCount - barWidth) / 2;
          const y = height - barHeight;
          // gradient per bar
          const grad = ctx.createLinearGradient(x, y, x, height);
          grad.addColorStop(0, color);
          grad.addColorStop(1, 'rgba(255,255,255,0.04)');
          ctx.fillStyle = grad;
          // subtle rounded bar (drawRect via path)
          const radius = Math.min(barWidth * 0.2, 8 * devicePixelRatio);
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + barWidth - radius, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
          ctx.lineTo(x + barWidth, height - radius);
          ctx.quadraticCurveTo(x + barWidth, height, x + barWidth - radius, height);
          ctx.lineTo(x + radius, height);
          ctx.quadraticCurveTo(x, height, x, height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // waveform mode
        const timeDomain = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(timeDomain);
        ctx.lineWidth = 2 * devicePixelRatio;
        ctx.strokeStyle = color;
        ctx.beginPath();
        const sliceWidth = width / timeDomain.length;
        let x = 0;
        for (let i = 0; i < timeDomain.length; i++) {
          const v = timeDomain[i] / 128.0; // 0..2
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // subtle filled glow under waveform
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = color;
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        ctx.globalAlpha = 1;
      }
    };

    // start rendering when audio context is resumed (user gesture may be required)
    const ensureResume = async () => {
      if (audioCtx.state === 'suspended') {
        try { await audioCtx.resume(); } catch (e) { /* ignore */ }
      }
      if (!rafRef.current) render();
    };
    ensureResume();

    // attach resize observer
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ro.disconnect();
      try {
        analyser.disconnect();
      } catch (e) { /* ignore */ }
      try {
        sourceRef.current?.disconnect();
      } catch (e) { /* ignore */ }
    };
  }, [audioEl, uiMode, type]);

  // small UI wrapper for canvas
  return (
    <div className="w-full h-40 md:h-52 rounded-xl overflow-hidden border border-white/6 bg-black/20">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

/* -------------------------
   Main StressManagement component (integrates Visualizer)
   ------------------------- */
const StressManagement: React.FC = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // app mode
  const [mode, setMode] = useState<'breathe' | 'relax' | 'focus'>('breathe');

  // dynamic tracks from Supabase
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'nature' | 'ambient' | 'meditation' | 'focus'>('all');

  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTrack: null as AudioTrack | null,
    volume: 0.7,
    isMuted: false,
    currentTime: 0,
    duration: 0,
  });

  // visualizer settings
  const [vizType, setVizType] = useState<'bars' | 'wave'>('bars');

  // fetch tracks once (Supabase example)
  useEffect(() => {
    const fetchTracks = async () => {
      setLoadingTracks(true);
      try {
        const { data, error } = await supabase.from('audio_tracks').select('*');
        if (!error && Array.isArray(data)) {
          // minimal validation / mapping
          const mapped: AudioTrack[] = data.map((r: any) => ({
            id: String(r.id),
            title: r.title || r.name || 'Untitled',
            duration: r.duration || '0:00',
            file: r.file || r.url || '',
            description: r.description || '',
            category: r.category || 'ambient'
          }));
          setTracks(mapped);
        } else {
          console.warn('Supabase fetch error', error);
        }
      } catch (err) {
        console.error('fetchTracks error', err);
      } finally {
        setLoadingTracks(false);
      }
    };
    fetchTracks();
  }, []);

  // audio element effects - time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setAudioState(prev => ({ ...prev, currentTime: audio.currentTime, duration: audio.duration || 0 }));
    };
    const ended = () => setAudioState(prev => ({ ...prev, isPlaying: false }));

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', ended);
    audio.addEventListener('loadedmetadata', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('loadedmetadata', updateTime);
    };
  }, [audioState.currentTrack]);

  const playTrack = (track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState.currentTrack?.id === track.id) {
      if (audioState.isPlaying) {
        audio.pause();
        setAudioState(p => ({ ...p, isPlaying: false }));
      } else {
        audio.play();
        setAudioState(p => ({ ...p, isPlaying: true }));
      }
    } else {
      audio.src = track.file;
      audio.play().catch(() => {
        // if browser blocks autoplay, UI will show paused state; user must interact
      });
      setAudioState(p => ({ ...p, currentTrack: track, isPlaying: true }));
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMute = !audioState.isMuted;
    audio.muted = newMute;
    if (!newMute) audio.volume = audioState.volume;
    setAudioState(p => ({ ...p, isMuted: newMute }));
  };

  const handleVolume = (v: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = v;
    setAudioState(p => ({ ...p, volume: v }));
  };

  const filteredTracks = selectedCategory === 'all'
    ? tracks
    : tracks.filter(t => t.category === selectedCategory);

  const formatTime = (s: number) => {
    if (!s || Number.isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-800 text-white p-6">
      <audio ref={audioRef} crossOrigin="anonymous" />
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-pink-400" />
          <div>
            <h1 className="text-2xl font-bold">AetherMind — Stress Management</h1>
            <p className="text-sm text-gray-300">Breathing + curated soundscapes + realtime visualizer</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => navigate('/user-dashboard')}
            className="px-4 py-2 rounded-lg bg-white/8 hover:bg-white/12"
          >
            Back
          </button>
        </div>
      </header>

      {/* Mode & Visualizer controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            {[
              { key: 'breathe', label: 'Breathe', icon: Wind },
              { key: 'relax', label: 'Relax', icon: Music },
              { key: 'focus', label: 'Focus', icon: Brain }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                  mode === key ? 'bg-white/10 text-white' : 'bg-white/4 text-gray-200 hover:bg-white/6'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/4 p-2 rounded-xl">
              <button
                onClick={() => setVizType('bars')}
                className={`px-3 py-1 rounded ${vizType === 'bars' ? 'bg-white/10' : 'hover:bg-white/6'}`}
              >
                Bars
              </button>
              <button
                onClick={() => setVizType('wave')}
                className={`px-3 py-1 rounded ${vizType === 'wave' ? 'bg-white/10' : 'hover:bg-white/6'}`}
              >
                Wave
              </button>
            </div>
          </div>

          {/* Visualizer */}
          <Visualizer audioEl={audioRef.current} uiMode={mode} type={vizType} />
        </div>

        {/* Player Controls / Quick Info */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Now Playing</h3>
          {audioState.currentTrack ? (
            <>
              <div className="mb-3">
                <div className="font-medium">{audioState.currentTrack.title}</div>
                <div className="text-xs text-gray-300 line-clamp-2">{audioState.currentTrack.description}</div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => {
                    if (audioState.currentTrack) playTrack(audioState.currentTrack);
                  }}
                  className="p-2 rounded bg-white/6 hover:bg-white/10"
                >
                  {audioState.isPlaying ? <Pause /> : <Play />}
                </button>

                <button onClick={toggleMute} className="p-2 rounded hover:bg-white/6">
                  {audioState.isMuted ? <VolumeX /> : <Volume2 />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={audioState.volume}
                  onChange={(e) => handleVolume(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              <div className="text-xs text-gray-300">
                {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-300">No track selected — pick a sound to start the visualizer.</div>
          )}
        </div>
      </div>

      {/* Library */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sound Library</h2>
          <div className="flex gap-2">
            {(['all', 'nature', 'ambient', 'meditation', 'focus'] as const).map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded ${selectedCategory === c ? 'bg-white/10' : 'bg-white/4 hover:bg-white/6'}`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loadingTracks ? (
          <div className="text-gray-300">Loading tracks...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map(track => (
              <motion.div
                key={track.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => playTrack(track)}
                className="p-4 rounded-xl bg-white/4 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{track.title}</div>
                    <div className="text-xs text-gray-300 line-clamp-2">{track.description}</div>
                  </div>
                  <div className="ml-3">
                    {audioState.currentTrack?.id === track.id && audioState.isPlaying ? <Pause /> : <Play />}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-300 flex justify-between">
                  <span>{track.category}</span>
                  <span>{track.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StressManagement;
