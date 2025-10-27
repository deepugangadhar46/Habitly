import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/database';
import { starterHabits } from '@/lib/starterHabits';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [selectedHabits, setSelectedHabits] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'welcome' | 'habits'>('welcome');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const toggleHabit = (index: number) => {
    const newSelected = new Set(selectedHabits);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else if (newSelected.size < 3) {
      newSelected.add(index);
    }
    setSelectedHabits(newSelected);
  };

  const createSelectedHabits = async () => {
    setIsCreating(true);
    try {
      const habitsToCreate = Array.from(selectedHabits).map(index => ({
        ...starterHabits[index],
        createdAt: new Date(),
        isActive: true
      }));

      await db.habits.bulkAdd(habitsToCreate);
      
      toast({
        title: "Welcome aboard! 🎉",
        description: `${habitsToCreate.length} habits ready to go! Let's build something amazing! ✨`,
      });
      
      onComplete();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating starter habits:', error);
      }
      toast({
        title: "Oops!",
        description: "Couldn't create habits. Please try again! 💪",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const skipToApp = () => {
    onComplete();
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-glass shadow-warm">
          <div className="p-8 text-center">
            <div className="text-6xl mb-6">✨</div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Welcome, superstar!
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Ready to build amazing habits together? I'm here to cheer you on every step of the way! 💪
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setStep('habits')}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Let's pick some habits!
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={skipToApp}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                I'll create my own habits
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Choose your starter habits ✨
          </h1>
          <p className="text-muted-foreground">
            Pick up to 3 habits to get started (you can add more later!)
          </p>
          <Badge variant="secondary" className="mt-2">
            {selectedHabits.size}/3 selected
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {starterHabits.map((habit, index) => (
            <Card
              key={index}
              className={`
                cursor-pointer transition-all duration-300 hover:shadow-soft
                ${selectedHabits.has(index) 
                  ? 'ring-2 ring-primary bg-primary/5 shadow-warm' 
                  : 'bg-gradient-glass hover:bg-secondary/50'
                }
                ${selectedHabits.size >= 3 && !selectedHabits.has(index) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
                }
              `}
              onClick={() => toggleHabit(index)}
            >
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{habit.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {habit.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {habit.description}
                    </p>
                  </div>
                  {selectedHabits.has(index) && (
                    <div className="text-primary">✓</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            variant="ghost"
            onClick={skipToApp}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
          
          <Button
            onClick={createSelectedHabits}
            disabled={selectedHabits.size === 0 || isCreating}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 min-w-[140px]"
          >
            {isCreating ? (
              'Creating...'
            ) : (
              <div className="flex items-center space-x-2">
                <span>Start my journey</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};