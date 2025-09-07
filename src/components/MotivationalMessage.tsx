import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Heart, Sparkles } from 'lucide-react';

interface MotivationalMessageProps {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  userName?: string;
}

const getMotivationalMessage = (
  completedToday: number, 
  totalHabits: number, 
  currentStreak: number,
  timeOfDay: 'morning' | 'afternoon' | 'evening'
): string => {
  const completionRate = totalHabits > 0 ? completedToday / totalHabits : 0;
  const userName = "superstar"; // Playful default

  // Time-based greetings
  const timeGreetings = {
    morning: ["Rise and shine", "Good morning", "Wake up"],
    afternoon: ["Keep going", "You're doing great", "Stay strong"],
    evening: ["Nice work today", "Almost there", "Finish strong"]
  };

  const greeting = timeGreetings[timeOfDay][Math.floor(Math.random() * timeGreetings[timeOfDay].length)];

  // Flirty motivational messages based on progress
  if (completionRate === 1) {
    return `${greeting}, ${userName}! You're absolutely crushing it today! 🔥✨`;
  } else if (completionRate >= 0.7) {
    return `${greeting}, ${userName}! You're on fire - don't stop now! 💪😘`;
  } else if (completionRate >= 0.5) {
    return `${greeting}, cutie! Halfway there - you've got this! 💖⚡`;
  } else if (completionRate > 0) {
    return `${greeting}, ${userName}! Every step counts - keep that momentum! 🌟💫`;
  } else if (currentStreak > 5) {
    return `${greeting}, habit hero! Your ${currentStreak}-day streak is impressive - let's keep it alive! 🔥❤️`;
  } else if (currentStreak > 0) {
    return `${greeting}, ${userName}! Day ${currentStreak} of your journey - tap that button like it's your destiny! 😏✨`;
  } else {
    return `${greeting}, beautiful! Today's a fresh start - I believe in you! 💝🌅`;
  }
};

export const MotivationalMessage = ({ 
  totalHabits, 
  completedToday, 
  currentStreak,
  userName 
}: MotivationalMessageProps) => {
  const [message, setMessage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    const currentTimeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    setTimeOfDay(currentTimeOfDay);
    
    const motivationalMessage = getMotivationalMessage(
      completedToday, 
      totalHabits, 
      currentStreak, 
      currentTimeOfDay
    );
    setMessage(motivationalMessage);
  }, [completedToday, totalHabits, currentStreak]);

  const getGradientClass = () => {
    const completionRate = totalHabits > 0 ? completedToday / totalHabits : 0;
    if (completionRate === 1) return 'bg-gradient-success';
    if (completionRate >= 0.5) return 'bg-gradient-accent';
    return 'bg-gradient-warm';
  };

  return (
    <Card className={`${getGradientClass()} shadow-soft transition-all duration-500`}>
      <div className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {completedToday === totalHabits && totalHabits > 0 ? (
              <Sparkles className="w-6 h-6 text-warning animate-pulse" />
            ) : (
              <Heart className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium leading-relaxed">
              {message}
            </p>
            {totalHabits > 0 && (
              <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{completedToday}/{totalHabits} habits today</span>
                {currentStreak > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>🔥</span>
                    <span>{currentStreak} day streak</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};