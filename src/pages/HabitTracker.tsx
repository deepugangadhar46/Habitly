import { useEffect, useState, useMemo } from 'react';
import { HabitCard } from '@/components/HabitCard';
import { EnhancedAddHabitDialog } from '@/components/EnhancedAddHabitDialog';
import { MotivationalMessage } from '@/components/MotivationalMessage';
import MotivationQuote from '@/components/MotivationQuote';
import { ExportImportDialog } from '@/components/ExportImportDialog';
import { NavigationBar } from '@/components/NavigationBar';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { GoalTracker } from '@/components/GoalTracker';
import { Habit, HabitEntry, getHabitsWithStreaks, getTodayEntry } from '@/lib/database';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HabitCardSkeletonGrid } from '@/components/HabitCardSkeleton';

export const HabitTracker = () => {
  const [habits, setHabits] = useState<(Habit & { currentStreak: number; completionRate: number })[]>([]);
  const [todayEntries, setTodayEntries] = useState<{ [key: number]: HabitEntry }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      if (import.meta.env.DEV) {
        console.error('Error loading habits:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // Filter habits based on search query
  const filteredHabits = useMemo(() => {
    if (!searchQuery.trim()) {
      return habits;
    }
    const query = searchQuery.toLowerCase();
    return habits.filter(habit => 
      habit.name.toLowerCase().includes(query) ||
      habit.description?.toLowerCase().includes(query) ||
      habit.category?.toLowerCase().includes(query)
    );
  }, [habits, searchQuery]);

  const completedToday = Object.values(todayEntries).filter(entry => entry.completed).length;
  const totalHabits = habits.length;
  const maxStreak = Math.max(...habits.map(h => h.currentStreak), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-warm shadow-soft">
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                  Your Daily Habits ✨
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Building better habits, one day at a time
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <HabitCardSkeletonGrid count={6} />
        </div>
        <NavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-warm shadow-soft">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                Your Daily Habits ✨
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Building better habits, one day at a time
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 self-end sm:self-auto">
              <EnhancedAddHabitDialog onHabitAdded={loadHabits} />
              <ExportImportDialog onImported={loadHabits} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Motivational Quote */}
        <MotivationQuote />
        
        {/* Motivational Message */}
        <div className="mb-6 md:mb-8">
          <MotivationalMessage
            totalHabits={totalHabits}
            completedToday={completedToday}
            currentStreak={maxStreak}
          />
        </div>

        {/* Search Bar */}
        {habits.length > 0 && (
          <div className="mb-6 md:mb-8">
            <div className="relative max-w-md mx-auto md:mx-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search habits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground text-center md:text-left mt-2">
                {filteredHabits.length} {filteredHabits.length === 1 ? 'habit' : 'habits'} found
              </p>
            )}
          </div>
        )}

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="text-center py-12 md:py-16 px-4">
            <div className="text-5xl md:text-6xl mb-4">🌱</div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">
              Ready to start your journey?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              Create your first habit and let's build something amazing together!
            </p>
            <EnhancedAddHabitDialog onHabitAdded={loadHabits} />
          </div>
        ) : filteredHabits.length === 0 && searchQuery ? (
          <div className="text-center py-12 md:py-16 px-4">
            <div className="text-5xl md:text-6xl mb-4">🔍</div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">
              No habits found
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              Try a different search term
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHabits.map((habit) => (
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
        <div className="mt-8 md:mt-12">
          <GoalTracker />
        </div>
      </div>
      
      <PWAInstallPrompt />
      <NavigationBar />
    </div>
  );
};