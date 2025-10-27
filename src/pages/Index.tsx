import { OnboardingScreen } from '@/components/OnboardingScreen';
import { HabitTracker } from "./HabitTracker";
import { useState, useEffect } from 'react';
import { db } from '@/lib/database';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const habitCount = await db.habits.count();
        setShowOnboarding(habitCount === 0);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error checking habits:', error);
        }
        setShowOnboarding(true);
      }
    };

    checkFirstTime();
  }, []);

  if (showOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">✨</div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return <HabitTracker />;
};

export default Index;
