import { useEffect, useState } from 'react';
import { HabitCard } from '@/components/HabitCard';
import { EnhancedAddHabitDialog } from '@/components/EnhancedAddHabitDialog';
import { MotivationalMessage } from '@/components/MotivationalMessage';
import { ExportImportDialog } from '@/components/ExportImportDialog';
import { NavigationBar } from '@/components/NavigationBar';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { GoalTracker } from '@/components/GoalTracker';
import { Habit, HabitEntry, getHabitsWithStreaks, getTodayEntry } from '@/lib/database';
import { Loader2 } from 'lucide-react';

export const HabitTracker = () => {
  const [habits, setHabits] = useState<(Habit & { currentStreak: number; completionRate: number })[]>([]);
  const [todayEntries, setTodayEntries] = useState<{ [key: number]: HabitEntry }>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadHabits = async () => {
    try {
      const habitsWithStreaks = await getHabitsWithStreaks();
      setHabits(habitsWithStreaks);
      
      // Load today's entries for all habits
      const entries: { [key: number]: HabitEntry } = {};
      for (const habit of habitsWithStreaks) {
        if (habit.id) {
          const entry = await getTodayEntry(habit.id);
          if (entry) {
            entries[habit.id] = entry;
          }
        }
      }
      setTodayEntries(entries);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const completedToday = Object.values(todayEntries).filter(entry => entry.completed).length;
  const totalHabits = habits.length;
  const maxStreak = Math.max(...habits.map(h => h.currentStreak), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-warm shadow-soft">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Your Daily Habits ✨
              </h1>
              <p className="text-muted-foreground">
                Building better habits, one day at a time
              </p>
            </div>
            <div className="flex items-center gap-4">
              <EnhancedAddHabitDialog onHabitAdded={loadHabits} />
              <ExportImportDialog onImported={loadHabits} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Motivational Message */}
        <div className="mb-8">
          <MotivationalMessage
            totalHabits={totalHabits}
            completedToday={completedToday}
            currentStreak={maxStreak}
          />
        </div>

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌱</div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              Ready to start your journey?
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first habit and let's build something amazing together!
            </p>
            <EnhancedAddHabitDialog onHabitAdded={loadHabits} />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayEntry={habit.id ? todayEntries[habit.id] : undefined}
                onUpdate={loadHabits}
              />
            ))}
          </div>
        )}

        {/* Goals Section */}
        <div className="mt-12">
          <GoalTracker />
        </div>
      </div>
      
      <PWAInstallPrompt />
      <NavigationBar />
    </div>
  );
};