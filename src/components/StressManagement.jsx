import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Music, Volume2, VolumeX, Wind, Brain, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const Visualizer = ({ audioEl, uiMode, type = 'bars' }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  // color palette per UI mode
  const palette = {
    breathe: 'rgba(119, 93, 221, 1)', // soft purple
    relax: 'rgba(94, 234, 212, 0.95)',    // teal
    focus: 'rgba(50, 53, 252, 0.95)'     // electric indigo
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioEl) return;

    // create or reuse AudioContext
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
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

  if (!audioEl || !audioEl.src || audioEl.paused) {
    return (
      <div className="w-full h-48 rounded-lg border border-slate-600/50 bg-slate-900/50 flex items-center justify-center">
        <p className="text-slate-400">No audio playing</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      className="w-full h-48 rounded-lg border border-slate-600/50 bg-slate-900/50"
    />
  );
};

const StressManagement = () => {
  const navigate = useNavigate();
  const [breathingExercise, setBreathingExercise] = useState({
    isActive: false,
    phase: 'inhale',
    time: 0,
    duration: 4,
    holdDuration: 4,
    cycles: 0
  });

  const [uiMode, setUiMode] = useState('relax');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [audioState, setAudioState] = useState({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false
  });

  const audioRef = useRef(null);

  useEffect(() => {
    let timer;
    if (breathingExercise.isActive) {
      timer = setInterval(() => {
        setBreathingExercise(prev => {
          let { time, phase, cycles } = prev;
          time += 1;

          if (phase === 'inhale' && time > prev.duration) {
            phase = 'hold'; time = 0;
          } else if (phase === 'hold' && time > prev.holdDuration) {
            phase = 'exhale'; time = 0;
          } else if (phase === 'exhale' && time > prev.duration) {
            phase = 'inhale'; time = 0; cycles += 1;
          }

          return { ...prev, time, phase, cycles };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [breathingExercise.isActive]);

  const startBreathingExercise = () =>
    setBreathingExercise({ isActive: true, phase: 'inhale', time: 0, duration: 4, holdDuration: 4, cycles: 0 });

  const stopBreathingExercise = () =>
    setBreathingExercise(prev => ({ ...prev, isActive: false, time: 0 }));


  // Load tracks from Supabase storage bucket 'audio_tracks'
  const [allTracks, setAllTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  useEffect(() => {
    const loadTracksFromSupabase = async () => {
      try {
        const { data, error } = await supabase.storage
        .from('audio_tracks')
        .list('', {
          limit: 100,
          offset: 0,
        });

        if (error) {
          console.error('Error fetching list from Supabase storage:', error);
          throw error;
        }

        console.log('Files from Supabase:', data);

        // Sort the data by name after fetching
        const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));

        const tracks = sortedData
          .filter(file => file.name.endsWith('.mp3'))
          .map(file => {
            const name = file.name.replace('.mp3', '');
            let category = 'nature';
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
        const fallbackTracks = [
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

  // Log meditation interaction to Supabase
  const logMeditationInteraction = async (track, duration) => {
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

  const playTrack = async (track) => {
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

  const handleVolumeChange = (e) => {
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

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setAudioState(prev => ({ ...prev, currentTime: seekTime }));
    }
  };

  const breathingPhases = {
    inhale: { text: "Breathe In", color: "bg-blue-500", instruction: "Inhale gently through your nose" },
    hold: { text: "Hold", color: "bg-yellow-500", instruction: "Hold your breath softly" },
    exhale: { text: "Breathe Out", color: "bg-green-500", instruction: "Exhale slowly through your mouth" }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        backgroundSize: '400% 400%',
        animation: 'bgShift 15s ease infinite'
      }}
    >
      <style>{`
        @keyframes bgShift {
          0% {background-position: 0% 50%;}
          50% {background-position: 100% 50%;}
          100% {background-position: 0% 50%;}
        }
      `}</style>

      {/* HEADER */}
      <header className="backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Heart className="h-6 w-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-300">Stress Management</h1>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 transition-all duration-200 font-medium shadow-lg hover:shadow-cyan-500/25"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">

        {/* Welcome Message and CTA */}
        <motion.section
          className="text-center py-12 px-8 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-md">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-cyan-300 mb-4">Welcome to Stress Management</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Take a moment to breathe, relax, and find your inner peace. Choose from guided breathing exercises, soothing audio tracks, or practical stress tips to help you unwind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startBreathingExercise}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
            >
              Start Breathing Exercise
            </button>
            <button
              onClick={() => document.getElementById('audio-section').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-200"
            >
              Explore Audio Library
            </button>
          </div>
        </motion.section>

        {/* Breathing Section */}
        <motion.section
          className="p-8 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Wind className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-semibold text-cyan-300">Guided Breathing</h2>
          </div>
          <div className="flex flex-col items-center space-y-8">
            {breathingExercise.isActive ? (
              <>
                <motion.div
                  className={`rounded-full flex items-center justify-center text-center shadow-2xl ${
                    breathingExercise.phase === 'inhale' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    breathingExercise.phase === 'hold' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-br from-green-500 to-green-600'
                  }`}
                  animate={{
                    scale:
                      breathingExercise.phase === 'inhale' ? 1.2 :
                      breathingExercise.phase === 'hold' ? 1.0 : 0.9,
                    boxShadow: [
                      '0 0 20px rgba(59, 130, 246, 0.5)',
                      '0 0 40px rgba(59, 130, 246, 0.8)',
                      '0 0 20px rgba(59, 130, 246, 0.5)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '16rem', height: '16rem' }}
                >
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">{breathingPhases[breathingExercise.phase].text}</div>
                    <div className="text-sm opacity-90">{breathingPhases[breathingExercise.phase].instruction}</div>
                    <div className="text-5xl font-semibold mt-4">
                      {breathingExercise.phase === 'hold'
                        ? breathingExercise.holdDuration - breathingExercise.time
                        : breathingExercise.duration - breathingExercise.time}
                    </div>
                  </div>
                </motion.div>

                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-4">Cycle: {breathingExercise.cycles + 1}</p>
                  <button
                    onClick={stopBreathingExercise}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                  >
                    Stop Exercise
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-500/20 rounded-full w-32 h-32 flex items-center justify-center shadow-xl">
                  <Heart className="h-16 w-16 text-cyan-400" />
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-medium text-white">4-4-4 Breathing</h3>
                  <p className="text-slate-400 max-w-md text-center">
                    Inhale for 4 seconds, hold for 4, and exhale for 4. A simple rhythm to calm your nervous system.
                  </p>
                  <button
                    onClick={startBreathingExercise}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
                  >
                    Start Breathing
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.section>

        {/* Audio Player */}
        <motion.section
          id="audio-section"
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Headphones className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Audio Player</h2>
            </div>
            <div className="flex gap-3">
              {['breathe', 'relax', 'focus'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setUiMode(mode)}
                  className={`px-5 py-2.5 rounded-xl capitalize transition-all duration-200 font-medium ${
                    uiMode === mode
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visualizer */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-cyan-300 flex items-center gap-2">
                <Music className="h-4 w-4" />
                Audio Visualizer
              </h3>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/50">
                <Visualizer audioEl={audioRef.current} uiMode={uiMode} />
              </div>

              {audioState.currentTrack ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-lg">{audioState.currentTrack.title}</p>
                      <p className="text-sm text-slate-400 capitalize">{audioState.currentTrack.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleMute}
                        className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-200"
                      >
                        {audioState.isMuted ? <VolumeX size={20} className="text-slate-300" /> : <Volume2 size={20} className="text-slate-300" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={audioState.isMuted ? 0 : audioState.volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={audioState.duration || 0}
                      value={audioState.currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-800"
                    />
                    <div className="text-sm text-slate-300 font-mono flex justify-between">
                      <span>{formatTime(audioState.currentTime)}</span>
                      <span>{formatTime(audioState.duration)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No track selected — pick a sound to start the visualizer.</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-cyan-300 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Controls
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => audioState.currentTrack && playTrack(audioState.currentTrack)}
                  disabled={!audioState.currentTrack}
                  className={`flex items-center gap-3 px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                    audioState.currentTrack
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-cyan-500/25 hover:shadow-cyan-400/25'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {audioState.isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  {audioState.isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Library */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sound Library</h2>
            <div className="flex gap-2">
              {['all', 'nature', 'ambient', 'meditation', 'focus'].map(c => (
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

        {/* Tips Section */}
        <motion.section
          className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">Practical Stress Tips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '📝', title: 'Journaling', text: 'Write your thoughts to declutter your mind.' },
              { emoji: '🏃', title: 'Movement', text: 'A short walk boosts mood and focus.' },
              { emoji: '😴', title: 'Rest Well', text: 'Consistent sleep improves emotional balance.' },
              { emoji: '🥦', title: 'Eat Mindfully', text: 'Healthy food fuels calmness.' },
              { emoji: '👥', title: 'Stay Connected', text: 'Social support lowers stress perception.' },
              { emoji: '🧘', title: 'Be Present', text: 'Mindfulness anchors you in the now.' }
            ].map((tip, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-6 border border-white/10 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="text-3xl mb-3">{tip.emoji}</div>
                <h3 className="font-medium text-white mb-2">{tip.title}</h3>
                <p className="text-gray-400 text-sm">{tip.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default StressManagement;
