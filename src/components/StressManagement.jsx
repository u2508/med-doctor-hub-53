import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Square, Music } from 'lucide-react';
import { motion } from 'framer-motion';

const StressManagement = () => {
  const navigate = useNavigate();
  const [breathingExercise, setBreathingExercise] = useState({
    isActive: false,
    phase: 'inhale', // 'inhale', 'hold', 'exhale'
    time: 0,
    duration: 4, // seconds
    holdDuration: 4, // seconds
    cycles: 0
  });
  const [meditationAudio, setMeditationAudio] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // Breathing exercise timer
  useEffect(() => {
    let timer;
    if (breathingExercise.isActive) {
      timer = setInterval(() => {
        setBreathingExercise(prev => {
          let newTime = prev.time + 1;
          let newPhase = prev.phase;
          let newCycles = prev.cycles;

          if (prev.phase === 'inhale' && newTime > prev.duration) {
            newPhase = 'hold';
            newTime = 0;
          } else if (prev.phase === 'hold' && newTime > prev.holdDuration) {
            newPhase = 'exhale';
            newTime = 0;
          } else if (prev.phase === 'exhale' && newTime > prev.duration) {
            newPhase = 'inhale';
            newTime = 0;
            newCycles = prev.cycles + 1;
          }

          return {
            ...prev,
            time: newTime,
            phase: newPhase,
            cycles: newCycles
          };
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [breathingExercise.isActive]);

  const startBreathingExercise = () => {
    setBreathingExercise({
      isActive: true,
      phase: 'inhale',
      time: 0,
      duration: 4,
      holdDuration: 4,
      cycles: 0
    });
  };

  const stopBreathingExercise = () => {
    setBreathingExercise({
      isActive: false,
      phase: 'inhale',
      time: 0,
      duration: 4,
      holdDuration: 4,
      cycles: breathingExercise.cycles
    });
  };

  const meditationTracks = [
    {
      id: 1,
      title: "Aroma of the Sea - Track 1",
      file: "/media/Aroma of the Sea-1.mp3",
      duration: "5:30",
      description: "Calming ocean sounds to help you relax and focus"
    },
    {
      id: 2,
      title: "Aroma of the Sea - Track 2",
      file: "/media/Aroma of the Sea-2.mp3",
      duration: "8:15",
      description: "Extended ocean waves for deeper relaxation"
    },
    {
      id: 3,
      title: "Chirps of the Nightingale - Track 1",
      file: "/media/Chirps of the Nightingale-1.mp3",
      duration: "7:45",
      description: "Gentle bird songs for peaceful meditation"
    },
    {
      id: 4,
      title: "Chirps of the Nightingale - Track 2",
      file: "/media/Chirps of the Nightingale-2.mp3",
      duration: "12:30",
      description: "Extended bird chorus for nature immersion"
    },
    {
      id: 5,
      title: "Fireplace Woods - Track 1",
      file: "/media/Fireplace Woods-1.mp3",
      duration: "10:00",
      description: "Crackling fire sounds in a forest setting"
    },
    {
      id: 6,
      title: "Fireplace Woods - Track 2",
      file: "/media/Fireplace Woods-2.mp3",
      duration: "15:20",
      description: "Extended fireside ambiance for deep relaxation"
    },
    {
      id: 7,
      title: "Nightly Shimmer - Track 1",
      file: "/media/Nightly Shimmer-1.mp3",
      duration: "6:15",
      description: "Soft ambient sounds for deep relaxation"
    },
    {
      id: 8,
      title: "Nightly Shimmer - Track 2",
      file: "/media/Nightly Shimmer-2.mp3",
      duration: "11:45",
      description: "Extended ambient soundscape for meditation"
    }
  ];

  const selectAudio = (track) => {
    setSelectedAudio(track.title);
    // In a real app, you would load the actual audio file
    setMeditationAudio(track);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // In a real app, you would actually play/pause the audio
  };

  const breathingPhases = {
    inhale: { text: "Breathe In", color: "bg-blue-500", instruction: "Slowly breathe in through your nose" },
    hold: { text: "Hold", color: "bg-yellow-500", instruction: "Hold your breath gently" },
    exhale: { text: "Breathe Out", color: "bg-green-500", instruction: "Slowly exhale through your mouth" }
  };

  return (
    <div className="min-h-screen bg-background" style={{ background: 'var(--gradient-subtle)' }}>
      <header className="bg-card border-b border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Stress Management</h1>
            <p className="text-muted-foreground mt-1">Find your inner peace and relaxation</p>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breathing Exercise */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Breathing Exercise</h2>
          
          <div className="flex flex-col items-center">
            {breathingExercise.isActive ? (
              <div className="w-full max-w-md">
                {/* Breathing Circle */}
                <div className="relative w-64 h-64 mx-auto mb-8">
                  <div className={`absolute inset-0 rounded-full ${breathingPhases[breathingExercise.phase].color} opacity-20 animate-pulse`}></div>
                  <div className={`absolute inset-4 rounded-full ${breathingPhases[breathingExercise.phase].color} opacity-40 animate-pulse`}></div>
                  <div className={`absolute inset-8 rounded-full ${breathingPhases[breathingExercise.phase].color} flex items-center justify-center`}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{breathingPhases[breathingExercise.phase].text}</div>
                      <div className="text-white mt-2">{breathingPhases[breathingExercise.phase].instruction}</div>
                      <div className="text-6xl font-bold text-white mt-4">
                        {breathingExercise.phase === 'inhale' || breathingExercise.phase === 'exhale' 
                          ? breathingExercise.duration - breathingExercise.time 
                          : breathingExercise.holdDuration - breathingExercise.time}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">Cycle: {breathingExercise.cycles + 1}</p>
                </div>
                
                {/* Stop Button */}
                <div className="text-center">
                  <button
                    onClick={stopBreathingExercise}
                    className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-destructive/80 transition"
                  >
                    Stop Exercise
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-xl font-medium text-card-foreground mb-2">4-4-4 Breathing Technique</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  This technique helps calm your nervous system. Breathe in for 4 seconds, hold for 4 seconds, 
                  and breathe out for 4 seconds. Repeat for several cycles.
                </p>
                <button
                  onClick={startBreathingExercise}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary-dark transition"
                >
                  Start Breathing Exercise
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meditation Audio */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Meditation & Relaxation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meditationTracks.map((track) => (
              <div 
                key={track.id} 
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  selectedAudio === track.title 
                    ? 'border-primary bg-accent' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => selectAudio(track)}
              >
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-lg p-3 mr-4">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground">{track.title}</h3>
                    <p className="text-sm text-muted-foreground">{track.duration}</p>
                    <p className="text-sm text-muted-foreground mt-1">{track.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedAudio && (
            <div className="mt-8 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">{selectedAudio}</h3>
                  <p className="text-muted-foreground">Click play to begin meditation</p>
                </div>
                <button
                  onClick={togglePlayback}
                  className="bg-primary text-primary-foreground p-4 rounded-lg hover:bg-primary-dark transition"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: isPlaying ? '30%' : '0%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0:00</span>
                  <span>{meditationAudio?.duration || '0:00'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stress Management Tips */}
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Stress Management Tips</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-5 bg-accent">
              <div className="text-primary text-2xl mb-3">📝</div>
              <h3 className="font-medium text-card-foreground mb-2">Journaling</h3>
              <p className="text-muted-foreground text-sm">
                Write down your thoughts and feelings to process emotions and identify stress triggers.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-5 bg-accent">
              <div className="text-primary text-2xl mb-3">🏃</div>
              <h3 className="font-medium text-card-foreground mb-2">Physical Activity</h3>
              <p className="text-muted-foreground text-sm">
                Regular exercise helps reduce stress hormones and triggers the release of endorphins.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-5 bg-accent">
              <div className="text-primary text-2xl mb-3">😴</div>
              <h3 className="font-medium text-card-foreground mb-2">Sleep Hygiene</h3>
              <p className="text-muted-foreground text-sm">
                Maintain a consistent sleep schedule and create a restful environment for better sleep.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-5 bg-accent">
              <div className="text-primary text-2xl mb-3">🥦</div>
              <h3 className="font-medium text-card-foreground mb-2">Healthy Eating</h3>
              <p className="text-muted-foreground text-sm">
                A balanced diet can improve your energy levels and mood, helping you cope with stress.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-5 bg-accent">
              <div className="text-primary text-2xl mb-3">👥</div>
              <h3 className="font-medium text-card-foreground mb-2">Social Support</h3>
              <p className="text-muted-foreground text-sm">
                Connect with friends and family to share your feelings and receive emotional support.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-5 bg-accent">
              <div className="text-primary text-2xl mb-3">🧘</div>
              <h3 className="font-medium text-card-foreground mb-2">Mindfulness</h3>
              <p className="text-muted-foreground text-sm">
                Practice mindfulness to stay present and reduce anxiety about future events.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StressManagement;
