import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Habit, HabitEntry, toggleHabitCompletion, db } from '@/lib/database';
import { Check, Flame, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUndoToast } from '@/hooks/useUndoToast';
import { scheduleEmotionalNudge, showStreakMilestoneNotification } from '@/lib/notificationService';
import type { MoodEmoji } from '@/lib/quotes';
import { getStreakMilestoneQuote } from '@/lib/quoteEngine';
import { toast } from 'sonner';
import { ReminderSettings } from '@/components/ReminderSettings';

interface HabitCardProps {
  habit: Habit & {
    currentStreak: number;
    completionRate: number;
  };
  todayEntry?: HabitEntry;
  onUpdate: () => void;
}

const MOOD_EMOJIS = ['😊', '😌', '💪', '🔥', '✨', '😴', '😑', '😔', '😮‍💨'];

export const HabitCard = ({ habit, todayEntry, onUpdate }: HabitCardProps) => {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState(todayEntry?.mood || '😊');
  const [isAnimating, setIsAnimating] = useState(false);
  const { showUndoToast } = useUndoToast();

  const isCompleted = todayEntry?.completed || false;
  const previousStreak = habit.currentStreak;

  const handleComplete = async (mood?: string) => {
    setIsAnimating(true);
    const wasCompleted = isCompleted;
    
    try {
      await toggleHabitCompletion(habit.id!, mood);
      
      // If marking as complete (not undoing), show undo toast
      if (!wasCompleted) {
        const newStreak = habit.currentStreak + 1;
        
        // Check for milestone
        const milestoneQuote = getStreakMilestoneQuote(newStreak);
        if (milestoneQuote) {
          toast.success(milestoneQuote, { duration: 5000 });
          await showStreakMilestoneNotification(habit.name, newStreak);
        }
        
        // Show emotional nudge for negative moods
        if (mood && (mood === '😔' || mood === '😮‍💨')) {
          await scheduleEmotionalNudge(habit.name, mood as MoodEmoji);
        }
        
        // Show undo toast
        showUndoToast({
          message: `${habit.emoji} ${habit.name} completed!`,
          onUndo: async () => {
            await toggleHabitCompletion(habit.id!);
            onUpdate();
          },
          onComplete: () => {
            onUpdate();
          },
        });
      } else {
        onUpdate();
      }
      
      setTimeout(() => setIsAnimating(false), 400);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error toggling habit:', error);
      }
      setIsAnimating(false);
    }
  };

  const handleQuickComplete = () => {
    if (isCompleted) {
      // Already completed today; do not toggle back to incomplete
      toast.info('Already marked as done today');
      return;
    }
    setShowMoodPicker(true);
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    handleComplete(mood);
    setShowMoodPicker(false);
  };

  const handleDeleteHabit = async () => {
    try {
      await db.habits.delete(habit.id!);
      toast.success('Habit deleted successfully');
      onUpdate();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting habit:', error);
      }
      toast.error('Failed to delete habit');
    }
  };

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300 hover:shadow-warm
      ${isCompleted ? 'bg-gradient-success' : 'bg-gradient-glass'}
      ${isAnimating ? 'scale-105' : 'scale-100'}
    `}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{habit.emoji}</div>
            <div>
              <h3 className="font-semibold text-lg">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground">{habit.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {habit.currentStreak > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Flame className="w-3 h-3 text-accent" />
                <span>{habit.currentStreak}</span>
              </Badge>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{habit.name}"? This will remove all completion history and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteHabit}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>{habit.completionRate}% completion rate</span>
          {todayEntry?.mood && (
            <span className="flex items-center space-x-1">
              <span>Today:</span>
              <span className="text-base">{todayEntry.mood}</span>
            </span>
          )}
        </div>

        {/* Reminder Settings */}
        <div className="mb-4">
          <ReminderSettings habit={habit} onUpdate={onUpdate} />
        </div>

        {/* Action Button */}
        {!showMoodPicker ? (
          <Button
            onClick={handleQuickComplete}
            variant={isCompleted ? "secondary" : "default"}
            className={`
              w-full transition-all duration-300
              ${isCompleted 
                ? 'bg-success hover:bg-success/90 text-success-foreground' 
                : 'bg-gradient-primary hover:shadow-glow'
              }
            `}
            disabled={isAnimating || isCompleted}
          >
            {isCompleted ? (
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Completed!</span>
              </div>
            ) : (
              'Mark as Done'
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              How are you feeling?
            </p>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoodSelect(emoji)}
                  className={`
                    text-lg p-2 h-auto transition-all duration-200
                    hover:scale-110 hover:bg-secondary
                    ${selectedMood === emoji ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  {emoji}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoodPicker(false)}
              className="w-full text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Completion Glow Effect */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-success opacity-10 pointer-events-none" />
      )}
    </Card>
  );
};