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
// Log meditation interaction to Supabase
const logMeditationInteraction = async (track: AudioTrack, duration: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        interaction_type: 'meditation',
        description: `Listened to "${track.title}" for ${Math.round(duration)} seconds`,
        metadata: {
          track_id: track.id,
          track_title: track.title,
          duration_seconds: duration,
          category: track.category
        }
      });
  } catch (error) {
    console.error('Error logging meditation interaction:', error);
  }
};
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
    // connect chain: source -> analyser -> destination
    sourceRef.current.connect(analyser);
    analyser.connect(audioCtx.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = palette[uiMode] || palette.relax;
      ctx.fillStyle = color;

      if (type === 'bars') {
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      } else if (type === 'wave') {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [audioEl, uiMode, type]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      className="w-full h-48 rounded-lg border border-border/20 bg-card/50"
    />
  );
};

const StressManagement: React.FC = () => {
  const navigate = useNavigate();
  const [uiMode, setUiMode] = useState<'breathe' | 'relax' | 'focus'>('relax');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'nature' | 'ambient' | 'meditation' | 'focus'>('all');
  const [audioState, setAudioState] = useState({
    currentTrack: null as AudioTrack | null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load tracks from Supabase storage bucket 'media'
  const [allTracks, setAllTracks] = useState<AudioTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  useEffect(() => {
    const loadTracksFromSupabase = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('audio_tracks')
          .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) throw error;

        const tracks: AudioTrack[] = data
          .filter(file => file.name.endsWith('.mp3'))
          .map(file => {
            const name = file.name.replace('.mp3', '');
            let category: 'nature' | 'ambient' | 'meditation' | 'focus' = 'nature';
            let description = '';

            // Categorize based on filename
            if (name.includes('Sea') || name.includes('Rain') || name.includes('Nightingale')) {
              category = 'nature';
              if (name.includes('Sea')) description = 'Gentle ocean waves with calming sea sounds';
              else if (name.includes('Rain')) description = 'Rhythmic rain patterns and soothing droplets';
              else if (name.includes('Nightingale')) description = 'Peaceful night sounds with bird calls';
            } else if (name.includes('Fireplace')) {
              category = 'ambient';
              description = 'Crackling fire in a cozy cabin atmosphere';
            } else if (name.includes('Shimmer')) {
              category = 'meditation';
              description = 'Soft ambient music for deep relaxation and meditation';
            }

            return {
              id: file.id || name.toLowerCase().replace(/\s+/g, '-'),
              title: name,
              duration: '3:00', // Default duration, will be updated when loaded
              file: supabase.storage.from('audio_tracks').getPublicUrl(file.name).data.publicUrl,
              description,
              category
            };
          });

        setAllTracks(tracks);
      } catch (error) {
        console.error('Error loading tracks from Supabase:', error);
        // Fallback to local files if Supabase fails
        const fallbackTracks: AudioTrack[] = [
          { id: 'aroma-sea-1', title: 'Aroma of the Sea-1', duration: '3:24', file: '/media/Aroma of the Sea-1.mp3', description: 'Gentle ocean waves with distant seagulls', category: 'nature' },
          { id: 'aroma-sea-2', title: 'Aroma of the Sea-2', duration: '3:45', file: '/media/Aroma of the Sea-2.mp3', description: 'Ocean waves with calming sea sounds', category: 'nature' },
          { id: 'nightingale-1', title: 'Chirps of the Nightingale-1', duration: '4:12', file: '/media/Chirps of the Nightingale-1.mp3', description: 'Peaceful night sounds with bird calls', category: 'nature' },
          { id: 'nightingale-2', title: 'Chirps of the Nightingale-2', duration: '4:30', file: '/media/Chirps of the Nightingale-2.mp3', description: 'Evening bird songs and night ambiance', category: 'nature' },
          { id: 'fireplace-1', title: 'Fireplace Woods-1', duration: '5:01', file: '/media/Fireplace Woods-1.mp3', description: 'Crackling fire in a cozy cabin', category: 'ambient' },
          { id: 'fireplace-2', title: 'Fireplace Woods-2', duration: '5:15', file: '/media/Fireplace Woods-2.mp3', description: 'Warm fireplace sounds with wood crackling', category: 'ambient' },
          { id: 'nightly-shimmer-1', title: 'Nightly Shimmer-1', duration: '3:45', file: '/media/Nightly Shimmer-1.mp3', description: 'Soft ambient music for deep relaxation', category: 'meditation' },
          { id: 'nightly-shimmer-2', title: 'Nightly Shimmer-2', duration: '4:02', file: '/media/Nightly Shimmer-2.mp3', description: 'Gentle ambient tones for meditation', category: 'meditation' },
          { id: 'rain-1', title: 'Patters of Rain-1', duration: '4:33', file: '/media/Patters of Rain-1.mp3', description: 'Rhythmic rain on a window pane', category: 'nature' },
          { id: 'rain-2', title: 'Patters of Rain-2', duration: '4:50', file: '/media/Patters of Rain-2.mp3', description: 'Soothing rain patterns and droplets', category: 'nature' },
        ];
        setAllTracks(fallbackTracks);
      } finally {
        setLoadingTracks(false);
      }
    };

    loadTracksFromSupabase();
  }, []);

  const filteredTracks = selectedCategory === 'all'
    ? allTracks
    : allTracks.filter(track => track.category === selectedCategory);

  // Log meditation interaction (could be added to mood_entries or separate analytics table if needed)
  const logMeditationInteraction = async (track: AudioTrack, duration: number) => {
    try {
      // Analytics logging could be added here if needed
      console.log(`Meditation session: ${track.title} for ${Math.round(duration)} seconds`);
    } catch (error) {
      console.error('Error logging meditation interaction:', error);
    }
  };

  const playTrack = async (track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audioState.currentTrack?.id === track.id && audioState.isPlaying) {
        audio.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false }));

        // Log the meditation session when paused
        if (audioState.currentTime > 0) {
          logMeditationInteraction(track, audioState.currentTime);
        }
      } else {
        if (audioState.currentTrack?.id !== track.id) {
          audio.src = track.file;
          setAudioState(prev => ({ ...prev, currentTrack: track }));
        }

        await audio.play();
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setAudioState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0
      }));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setAudioState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audioState.isMuted;
      setAudioState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-display">Stress Management</h1>
          <p className="text-muted-foreground text-lg">Find peace through guided meditation and calming sounds</p>
        </div>

        {/* Audio Player */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-lg border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Audio Player</h2>
            <div className="flex gap-2">
              {(['breathe', 'relax', 'focus'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setUiMode(mode)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    uiMode === mode
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visualizer */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-card-foreground">Audio Visualizer</h3>
              <Visualizer audioEl={audioRef.current} uiMode={uiMode} />

              {audioState.currentTrack ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">{audioState.currentTrack.title}</p>
                      <p className="text-sm text-muted-foreground">{audioState.currentTrack.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {audioState.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={audioState.isMuted ? 0 : audioState.volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-white"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-300">
                    {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-300">No track selected — pick a sound to start the visualizer.</div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-card-foreground">Controls</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => audioState.currentTrack && playTrack(audioState.currentTrack)}
                  disabled={!audioState.currentTrack}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {audioState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  {audioState.isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
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

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setAudioState(prev => {
              const newState = { ...prev, isPlaying: false };
              // Log completed meditation session
              if (prev.currentTrack) {
                logMeditationInteraction(prev.currentTrack, prev.duration);
              }
              return newState;
            });
          }}
        />
      </div>
    </div>
  );
};

export default StressManagement;
