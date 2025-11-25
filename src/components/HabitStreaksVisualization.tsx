import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, TrendingUp, Calendar, Award, Zap } from 'lucide-react';
import { getHabitsWithStreaks } from '@/lib/database';
import { db } from '@/lib/database';
import { format, subDays, isWithinInterval } from 'date-fns';

interface StreakInfo {
  habitId: number;
  name: string;
  emoji: string;
  color: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompletions: number;
  streakHistory: StreakPeriod[];
  weeklyCompletionData: { day: string; completed: number; total: number }[];
}

interface StreakPeriod {
  start: string;
  end: string;
  length: number;
}

export const HabitStreaksVisualization = () => {
  const [streaks, setStreaks] = useState<StreakInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const habits = await getHabitsWithStreaks();
      const allEntries = await db.entries.toArray();
      
      const streakInfos: StreakInfo[] = await Promise.all(
        habits.map(async (habit) => {
          const habitEntries = allEntries.filter(e => e.habitId === habit.id && e.completed);
          
          // Calculate longest streak
          let longestStreak = 0;
          let tempStreak = 0;
          const sortedEntries = [...habitEntries].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          for (let i = 0; i < sortedEntries.length - 1; i++) {
            const current = new Date(sortedEntries[i].date);
            const next = new Date(sortedEntries[i + 1].date);
            const daysDiff = Math.floor((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
              tempStreak++;
              longestStreak = Math.max(longestStreak, tempStreak);
            } else {
              tempStreak = 0;
            }
          }
          
          // Get streak history
          const streakHistory = calculateStreakHistory(habitEntries);
          
          // Get weekly completion data (last 7 days)
          const weeklyData: { day: string; completed: number; total: number }[] = [];
          for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayEntry = habitEntries.find(e => e.date === dateStr);
            
            weeklyData.push({
              day: format(date, 'EEE'),
              completed: dayEntry ? 1 : 0,
              total: 1
            });
          }
          
          return {
            habitId: habit.id!,
            name: habit.name,
            emoji: habit.emoji,
            color: habit.color,
            currentStreak: habit.currentStreak,
            longestStreak: longestStreak + 1, // +1 because we count completed days
            completionRate: habit.completionRate,
            totalCompletions: habitEntries.length,
            streakHistory,
            weeklyCompletionData: weeklyData
          };
        })
      );
      
      setStreaks(streakInfos);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading streak data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreakHistory = (entries: any[]): StreakPeriod[] => {
    if (entries.length === 0) return [];
    
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const streaks: StreakPeriod[] = [];
    let currentStreak: StreakPeriod | null = null;
    
    for (let i = 0; i < sorted.length; i++) {
      const date = new Date(sorted[i].date);
      
      if (!currentStreak) {
        currentStreak = { start: sorted[i].date, end: sorted[i].date, length: 1 };
      } else {
        const lastDate = new Date(currentStreak.end);
        const daysDiff = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak.end = sorted[i].date;
          currentStreak.length++;
        } else {
          if (currentStreak.length > 1) {
            streaks.push(currentStreak);
          }
          currentStreak = { start: sorted[i].date, end: sorted[i].date, length: 1 };
        }
      }
    }
    
    if (currentStreak && currentStreak.length > 1) {
      streaks.push(currentStreak);
    }
    
    return streaks.slice(-5); // Last 5 streaks
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 100) return { icon: Award, color: 'text-purple-500', label: 'Legend' };
    if (streak >= 50) return { icon: Trophy, color: 'text-yellow-500', label: 'Master' };
    if (streak >= 30) return { icon: Zap, color: 'text-orange-500', label: 'Elite' };
    if (streak >= 14) return { icon: Flame, color: 'text-red-500', label: 'Strong' };
    if (streak >= 7) return { icon: TrendingUp, color: 'text-blue-500', label: 'Good' };
    return { icon: Calendar, color: 'text-green-500', label: 'Growing' };
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="text-4xl mb-4">🔥</div>
        <p className="text-muted-foreground">Loading streak data...</p>
      </Card>
    );
  }

  if (streaks.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-glass">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No Streaks Yet</h3>
        <p className="text-muted-foreground">Complete your habits to start building streaks!</p>
      </Card>
    );
  }

  const sortedStreaks = [...streaks].sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Streaks</p>
              <p className="text-2xl font-bold">{streaks.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Best Streak</p>
              <p className="text-2xl font-bold">
                {Math.max(...streaks.map(s => s.longestStreak))}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Streak</p>
              <p className="text-2xl font-bold">
                {Math.round(streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Days</p>
              <p className="text-2xl font-bold">
                {streaks.reduce((sum, s) => sum + s.totalCompletions, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Individual Streaks */}
      <div className="space-y-4">
        {sortedStreaks.map((streak) => {
          const badge = getStreakBadge(streak.currentStreak);
          const BadgeIcon = badge.icon;
          
          return (
            <Card key={streak.habitId} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{streak.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{streak.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={streak.currentStreak >= 7 ? "default" : "secondary"}>
                        <BadgeIcon className={`w-3 h-3 mr-1 ${badge.color}`} />
                        {badge.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {streak.completionRate}% completion
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Chart */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Last 7 Days</p>
                  <p className="text-sm text-muted-foreground">
                    {streak.weeklyCompletionData.filter(d => d.completed > 0).length}/7
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {streak.weeklyCompletionData.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <div
                        className={`w-full aspect-square rounded ${
                          day.completed > 0 ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">{day.day[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
                  <p className="text-2xl font-bold flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <span>{streak.currentStreak} days</span>
                  </p>
                </div>
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Longest Streak</p>
                  <p className="text-2xl font-bold flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>{streak.longestStreak} days</span>
                  </p>
                </div>
              </div>

              {/* Recent Streak History */}
              {streak.streakHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent Streaks</p>
                  <div className="space-y-1">
                    {streak.streakHistory.map((period, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {format(new Date(period.start), 'MMM d')} - {format(new Date(period.end), 'MMM d')}
                        </span>
                        <Badge variant="outline">{period.length} days</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
