import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Music } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const [selectedAudio, setSelectedAudio] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

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

  const meditationTracks = [
    { id: 1, title: "Aroma of the Sea", file: "/media/Aroma1.mp3", duration: "5:30", description: "Calming ocean sounds to help you relax and focus" },
    { id: 2, title: "Chirps of the Nightingale", file: "/media/Nightingale.mp3", duration: "7:45", description: "Gentle bird songs for peaceful meditation" },
    { id: 3, title: "Fireplace Woods", file: "/media/Fireplace.mp3", duration: "10:00", description: "Crackling fire sounds in a forest setting" },
    { id: 4, title: "Nightly Shimmer", file: "/media/Nightly.mp3", duration: "6:15", description: "Soft ambient sounds for deep relaxation" }
  ];

  const selectAudio = track => setSelectedAudio(track.title);
  const togglePlayback = () => setIsPlaying(!isPlaying);

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
      <header className="backdrop-blur-lg bg-white/5 border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight text-cyan-300">Stress Management</h1>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 transition font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* Breathing Section */}
        <motion.section
          className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">Guided Breathing</h2>
          <div className="flex flex-col items-center space-y-8">
            {breathingExercise.isActive ? (
              <>
                <motion.div
                  className={`rounded-full flex items-center justify-center text-center ${breathingPhases[breathingExercise.phase].color}`}
                  animate={{
                    scale:
                      breathingExercise.phase === 'inhale' ? 1.2 :
                      breathingExercise.phase === 'hold' ? 1.0 : 0.9
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

                <p className="text-sm text-gray-300">Cycle: {breathingExercise.cycles + 1}</p>
                <button
                  onClick={stopBreathingExercise}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition"
                >
                  Stop Exercise
                </button>
              </>
            ) : (
              <>
                <div className="bg-cyan-600/20 rounded-full w-32 h-32 flex items-center justify-center">
                  <Heart className="h-16 w-16 text-cyan-400" />
                </div>
                <h3 className="text-xl font-medium">4-4-4 Breathing</h3>
                <p className="text-gray-400 max-w-md text-center">
                  Inhale for 4 seconds, hold for 4, and exhale for 4. A simple rhythm to calm your nervous system.
                </p>
                <button
                  onClick={startBreathingExercise}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
                >
                  Start Breathing
                </button>
              </>
            )}
          </div>
        </motion.section>

        {/* Meditation Audio */}
        <motion.section
          className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">Meditation & Relaxation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meditationTracks.map(track => (
              <motion.div
                key={track.id}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl border p-5 transition cursor-pointer ${
                  selectedAudio === track.title ? 'border-cyan-400 bg-cyan-900/20' : 'border-white/10 hover:border-cyan-300/50'
                }`}
                onClick={() => selectAudio(track)}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-600/20 rounded-lg p-3">
                    <Music className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{track.title}</h3>
                    <p className="text-sm text-gray-400">{track.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{track.duration}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {selectedAudio && (
            <div className="mt-8 border-t border-white/10 pt-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-white">{selectedAudio}</h3>
                <p className="text-sm text-gray-400">Click play to begin your session</p>
              </div>
              <button
                onClick={togglePlayback}
                className="bg-cyan-600 p-4 rounded-full hover:bg-cyan-500 transition"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
            </div>
          )}
        </motion.section>

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
