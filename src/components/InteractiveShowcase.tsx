import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Info, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const InteractiveShowcase = () => {
  // Dynamic Progress Bar State
  const [progressValue, setProgressValue] = useState(45);

  // Jumping 3D Image State
  const [isJumping, setIsJumping] = useState(false);

  // Pumping Heart State
  const [isLiked, setIsLiked] = useState(false);

  const handleJump = () => {
    if (!isJumping) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 600);
    }
  };

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
  };

  return (
    <section className="container py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Interactive Experience
        </h2>
        <p className="text-lg text-muted-foreground">
          Try our engaging interactive elements
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 1. Dynamic Progress Bar */}
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-8">
            <h3 className="mb-6 text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Dynamic Progress Tracker
            </h3>
            
            <div className="space-y-6">
              <div className="relative">
                <Progress value={progressValue} className="h-6" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {progressValue}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Adjust Progress
                </label>
                <Slider
                  value={[progressValue]}
                  onValueChange={(value) => setProgressValue(value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Jumping 3D Image */}
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-8">
            <h3 className="mb-6 text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              3D Jump Animation
            </h3>
            
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={isJumping ? {
                  y: [-20, -60, -20, 0],
                  rotateX: [0, 20, -20, 0],
                  scale: [1, 1.1, 1.05, 1],
                } : {}}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut"
                }}
                className="cursor-pointer"
                onClick={handleJump}
              >
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center shadow-card hover:shadow-elegant transition-shadow">
                  <span className="text-5xl">🚀</span>
                </div>
              </motion.div>
              
              <p className="text-center text-sm text-muted-foreground">
                Click to make it jump!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Pumping Heart Icon */}
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-8">
            <h3 className="mb-6 text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">💝</span>
              Interactive Heart
            </h3>
            
            <div className="flex flex-col items-center gap-4">
              <motion.button
                onClick={handleHeartClick}
                whileTap={{ scale: 0.9 }}
                className="focus:outline-none"
              >
                <motion.div
                  animate={isLiked ? {
                    scale: [1, 1.3, 1.1, 1],
                  } : {
                    scale: 1
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                >
                  <Heart
                    className={`w-24 h-24 transition-colors duration-300 ${
                      isLiked 
                        ? 'fill-destructive stroke-destructive' 
                        : 'fill-none stroke-muted-foreground hover:stroke-destructive'
                    }`}
                    strokeWidth={2}
                  />
                </motion.div>
              </motion.button>
              
              <p className="text-center text-sm text-muted-foreground">
                {isLiked ? 'Thanks for the love! ❤️' : 'Click to show some love'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Info Popup Button */}
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-8">
            <h3 className="mb-6 text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Information Portal
            </h3>
            
            <div className="flex flex-col items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 shadow-card hover:shadow-elegant transition-shadow">
                    <Info className="w-5 h-5" />
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="text-2xl">🌟</span>
                      About Our Platform
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-4">
                      <p className="text-base leading-relaxed">
                        MedDoctor Hub is your comprehensive healthcare companion, 
                        seamlessly integrating mental health support with medical care services.
                      </p>
                      <p className="text-base leading-relaxed">
                        Our platform combines cutting-edge AI technology with human expertise 
                        to provide personalized care and support whenever you need it.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              
              <p className="text-center text-sm text-muted-foreground">
                Click to discover more about our services
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
