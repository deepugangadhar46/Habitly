import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Heart, Music, X } from 'lucide-react';

interface SadStreakNudgeProps {
  habit: {
    id: number;
    name: string;
    emoji: string;
  };
  onRetire: (habitId: number) => void;
  onDismiss: () => void;
}

export const SadStreakNudge = ({ habit, onRetire, onDismiss }: SadStreakNudgeProps) => {
  const handleMicroHabit = (action: string) => {
    // These are just suggestions, no actual action needed
    alert(`Great choice! Try: ${action}`);
  };

  return (
    <Alert className="bg-orange-500/10 border-orange-500/30 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={onDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
      
      <AlertDescription>
        <div className="space-y-3 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">😔</span>
            <div>
              <p className="font-medium">
                We noticed 5 low moods with "{habit.name}" this week
              </p>
              <p className="text-sm text-muted-foreground">
                Try these quick mood boosters:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMicroHabit('5-minute stretch')}
              className="text-xs"
            >
              <Heart className="w-3 h-3 mr-1" />
              5-min stretch
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMicroHabit('3-song playlist')}
              className="text-xs"
            >
              <Music className="w-3 h-3 mr-1" />
              3-song playlist
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetire(habit.id)}
              className="text-xs text-orange-600 hover:text-orange-700"
            >
              <X className="w-3 h-3 mr-1" />
              Retire habit
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
