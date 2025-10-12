import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Square, Music, Wind, Sun, Clock, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioTrack {
  id: string;
  title: string;
  duration: string;
  file: string;
  description: string;
  category: 'nature' | 'ambient' | 'meditation';
}

const StressManagement = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Breathing exercise state
  const [breathingExercise, setBreathingExercise] = useState({
    isActive: false,
    phase: 'inhale' as 'inhale' | 'hold' | 'exhale',
    time: 0,
    duration: 4,
    holdDuration: 4,
    cycles: 0,
    totalCycles: 10
  });

  // Audio player state
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTrack: null as AudioTrack | null,
    volume: 0.7,
    isMuted: false,
    currentTime: 0,
    duration: 0
  });

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'nature' | 'ambient' | 'meditation'>('all');

  const audioTracks: AudioTrack[] = [
    {
      id: 'ocean-waves',
      title: 'Aroma of the Sea',
      duration: '15:30',
      file: '/media/Aroma of the Sea-1.mp3',
      description: 'Gentle ocean waves for deep relaxation',
      category: 'nature'
    },
    {
      id: 'rain-sounds',
      title: 'Patterns of Rain', 
      duration: '12:45',
      file: '/media/Patters of Rain-1.mp3',
      description: 'Soft rainfall sounds for stress relief',
      category: 'nature'
    },
    {
      id: 'fireplace',
      title: 'Fireplace Woods',
      duration: '20:00',
      file: '/media/Fireplace Woods-1.mp3',
      description: 'Crackling fireplace for cozy ambiance',
      category: 'ambient'
    },
    {
      id: 'nightingale',
      title: 'Chirps of the Nightingale',
      duration: '18:20',
      file: '/media/Chirps of the Nightingale-1.mp3',
      description: 'Peaceful bird songs for meditation',
      category: 'nature'
    },
    {
      id: 'night-shimmer',
      title: 'Nightly Shimmer',
      duration: '25:15',
      file: '/media/Nightly Shimmer-1.mp3',
      description: 'Calming night sounds for sleep',
      category: 'meditation'
    }
  ];

  const filteredTracks = selectedCategory === 'all' 
    ? audioTracks 
    : audioTracks.filter(track => track.category === selectedCategory);

  // Breathing exercise logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (breathingExercise.isActive) {
      interval = setInterval(() => {
        setBreathingExercise(prev => {
          const newTime = prev.time + 0.1;
          let newPhase = prev.phase;
          let newCycles = prev.cycles;
          let nextTime = newTime;
          
          if (prev.phase === 'inhale' && newTime >= prev.duration) {
            newPhase = 'hold';
            nextTime = 0;
          } else if (prev.phase === 'hold' && newTime >= prev.holdDuration) {
            newPhase = 'exhale';
            nextTime = 0;
          } else if (prev.phase === 'exhale' && newTime >= prev.duration) {
            newPhase = 'inhale';
            nextTime = 0;
            newCycles = prev.cycles + 1;
          }

          // Auto-stop after completing all cycles
          if (newCycles >= prev.totalCycles) {
            return {
              ...prev,
              isActive: false,
              phase: 'inhale',
              time: 0,
              cycles: 0
            };
          }
          
          return {
            ...prev,
            phase: newPhase,
            time: nextTime,
            cycles: newCycles
          };
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breathingExercise.isActive]);

  // Audio player effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setAudioState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0
      }));
    };

    const handleEnded = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', updateTime);
    };
  }, [audioState.currentTrack]);

  const startBreathingExercise = () => {
    setBreathingExercise(prev => ({ ...prev, isActive: true, cycles: 0, time: 0 }));
  };

  const stopBreathingExercise = () => {
    setBreathingExercise(prev => ({ 
      ...prev, 
      isActive: false, 
      phase: 'inhale', 
      time: 0, 
      cycles: 0 
    }));
  };

  const playTrack = (track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState.currentTrack?.id === track.id && audioState.isPlaying) {
      audio.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } else {
      if (audioState.currentTrack?.id !== track.id) {
        audio.src = track.file;
        setAudioState(prev => ({ ...prev, currentTrack: track }));
      }
      audio.volume = audioState.isMuted ? 0 : audioState.volume;
      audio.play();
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMutedState = !audioState.isMuted;
    audio.volume = newMutedState ? 0 : audioState.volume;
    setAudioState(prev => ({ ...prev, isMuted: newMutedState }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = audioState.isMuted ? 0 : newVolume;
    setAudioState(prev => ({ ...prev, volume: newVolume }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstruction = () => {
    switch (breathingExercise.phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
    }
  };

  const getBreathingProgress = () => {
    const { phase, time, duration, holdDuration } = breathingExercise;
    const maxDuration = phase === 'hold' ? holdDuration : duration;
    return (time / maxDuration) * 100;
  };

  return (
    <div className="min-h-screen bg-background" style={{ background: 'var(--gradient-subtle)' }}>
      <audio ref={audioRef} />
      
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-10" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Stress Management</h1>
                <p className="text-muted-foreground">Find peace through breathing exercises and calming sounds</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/user-dashboard')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Breathing Exercise Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-8 md:p-12"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Wind className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Breathing Exercise</span>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">4-4-4 Breathing</h2>
            <p className="text-muted-foreground">Follow the circle and breathe deeply to reduce stress and anxiety</p>
          </div>

          <div className="flex flex-col items-center space-y-10">
            {/* Breathing Circle */}
            <div className="relative">
              <motion.div
                className="w-48 h-48 rounded-full border-4 border-primary/30 flex items-center justify-center"
                animate={{
                  scale: breathingExercise.isActive 
                    ? (breathingExercise.phase === 'inhale' ? 1.2 : 
                       breathingExercise.phase === 'hold' ? 1.2 : 1) 
                    : 1
                }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
              >
                <motion.div
                  className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                  animate={{
                    backgroundColor: breathingExercise.phase === 'inhale' ? 'hsl(var(--primary) / 0.3)' :
                                   breathingExercise.phase === 'hold' ? 'hsl(var(--accent) / 0.3)' :
                                   'hsl(var(--secondary) / 0.3)'
                  }}
                >
                  <div className="text-center">
                    <p className="text-lg font-semibold text-card-foreground">
                      {getBreathingInstruction()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil((breathingExercise.phase === 'hold' ? breathingExercise.holdDuration : breathingExercise.duration) - breathingExercise.time)}s
                    </p>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96" 
                  r="88"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-border"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-primary"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - getBreathingProgress() / 100)}`}
                  strokeLinecap="round"
                  transition={{ duration: 0.1 }}
                />
              </svg>
            </div>

            {/* Breathing Controls */}
            <div className="text-center space-y-6 mt-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="bg-accent/50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-accent-foreground">
                    Cycle: {breathingExercise.cycles + 1}/{breathingExercise.totalCycles}
                  </span>
                </div>
                <div className="bg-accent/50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-accent-foreground">
                    Pattern: 4-4-4
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center space-x-3">
                {!breathingExercise.isActive ? (
                  <button
                    onClick={startBreathingExercise}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Exercise</span>
                  </button>
                ) : (
                  <button
                    onClick={stopBreathingExercise}
                    className="flex items-center space-x-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-xl hover:bg-destructive/90 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>Stop Exercise</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Audio Player Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-8 md:p-12"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-secondary/20 px-4 py-2 rounded-full mb-4">
              <Music className="w-5 h-5 text-secondary-foreground" />
              <span className="text-secondary-foreground font-medium">Relaxation Sounds</span>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Calming Audio Collection</h2>
            <p className="text-muted-foreground">Choose from our curated selection of relaxing sounds</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'nature', 'ambient', 'meditation'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Audio Player Controls */}
          <AnimatePresence>
            {audioState.currentTrack && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-accent/30 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{audioState.currentTrack.title}</h3>
                    <p className="text-sm text-muted-foreground">{audioState.currentTrack.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                    >
                      {audioState.isMuted ? (
                        <VolumeX className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={audioState.volume}
                      onChange={handleVolumeChange}
                      className="w-20 accent-primary"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground min-w-[40px]">
                    {formatTime(audioState.currentTime)}
                  </span>
                  <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ 
                        width: `${audioState.duration ? (audioState.currentTime / audioState.duration) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground min-w-[40px]">
                    {formatTime(audioState.duration)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => (
              <motion.div
                key={track.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-background/50 rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => playTrack(track)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">{track.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{track.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        track.category === 'nature' ? 'bg-green-100 text-green-800' :
                        track.category === 'ambient' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {track.category}
                      </span>
                      <span className="text-sm text-muted-foreground">{track.duration}</span>
                    </div>
                  </div>
                  <button className="ml-2 p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                    {audioState.currentTrack?.id === track.id && audioState.isPlaying ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-6"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <h3 className="text-xl font-bold text-card-foreground mb-4">Quick Stress Relief Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: "Take Breaks", tip: "Step away from your desk every hour" },
              { icon: Sun, title: "Get Sunlight", tip: "Spend 10 minutes outside daily" },
              { icon: Heart, title: "Stay Hydrated", tip: "Drink water throughout the day" },
              { icon: Wind, title: "Deep Breathing", tip: "Practice the 4-4-4 breathing technique" }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-accent/30 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default StressManagement;