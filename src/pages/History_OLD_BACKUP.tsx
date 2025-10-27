import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Flame,
  TrendingUp,
  Filter,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, getHabitsWithStreaks } from '@/lib/database';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { NavigationBar } from '@/components/NavigationBar';

interface HabitWithStats {
  id: number;
  name: string;
  emoji: string;
  color: string;
  currentStreak: number;
  completionRate: number;
}

interface DayEntry {
  date: Date;
  habits: Array<{
    habitId: number;
    habitName: string;
    emoji: string;
    color: string;
    completed: boolean;
    mood?: string;
    notes?: string;
    completedAt?: Date;
  }>;
  totalCompleted: number;
  totalHabits: number;
  avgMood?: number;
  dominantMood?: string;
  streakCount?: number;
}

interface MonthlyStats {
  totalHabitsCompleted: number;
  bestStreak: number;
  weeklyMoodAverage: number[];
  moodTrends: Array<{ date: string; mood: number; count: number }>;
  previousMonthComparison: {
    moodChange: number;
    completionChange: number;
  };
}

const History = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [dayEntries, setDayEntries] = useState<Map<string, DayEntry>>(new Map());
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    totalWorkouts: 0,
    totalTime: 0,
    totalCalories: 0,
    avgMood: 0
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalHabitsCompleted: 0,
    bestStreak: 0,
    weeklyMoodAverage: [],
    moodTrends: [],
    previousMonthComparison: { moodChange: 0, completionChange: 0 }
  });
  const [selectedDayMoodSummary, setSelectedDayMoodSummary] = useState<{
    date: Date;
    moods: Array<{ habit: string; emoji: string; mood: string; value: number }>;
    avgMood: number;
  } | null>(null);

  useEffect(() => {
    loadHistoryData();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      calculateWeeklyStats(selectedDate);
    }
  }, [selectedDate, dayEntries]);

  const loadHistoryData = async () => {
    try {
      setIsLoading(true);
      const habitsWithStreaks = await getHabitsWithStreaks();
      setHabits(habitsWithStreaks);

      // Load all entries for the current month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const entriesMap = new Map<string, DayEntry>();

      for (const day of daysInMonth) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayHabits = [];
        
        for (const habit of habitsWithStreaks) {
          const entry = await db.entries.where({ habitId: habit.id, date: dateStr }).first();
          if (entry) {
            dayHabits.push({
              habitId: habit.id!,
              habitName: habit.name,
              emoji: habit.emoji,
              color: habit.color,
              completed: entry.completed,
              mood: entry.mood,
              notes: entry.notes,
              completedAt: entry.completedAt
            });
          }
        }

        const completedCount = dayHabits.filter(h => h.completed).length;
        
        // Calculate mood stats for the day
        const completedWithMood = dayHabits.filter(h => h.completed && h.mood);
        const avgMood = completedWithMood.length > 0
          ? completedWithMood.reduce((sum, h) => sum + getMoodValue(h.mood!), 0) / completedWithMood.length
          : undefined;
        
        // Find dominant mood
        const moodCounts: { [key: string]: number } = {};
        completedWithMood.forEach(h => {
          if (h.mood) moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
        });
        const dominantMood = Object.keys(moodCounts).length > 0
          ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
          : undefined;
        
        // Calculate streak count for the day
        const streakCount = dayHabits.filter(h => h.completed).length;
        
        entriesMap.set(dateStr, {
          date: day,
          habits: dayHabits,
          totalCompleted: completedCount,
          totalHabits: habitsWithStreaks.length,
          avgMood,
          dominantMood,
          streakCount
        });
      }

      setDayEntries(entriesMap);
      
      // Calculate monthly analytics
      await calculateMonthlyAnalytics(entriesMap, habitsWithStreaks);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWeeklyStats = (date: Date) => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let totalWorkouts = 0;
    let totalTime = 0;
    let totalCalories = 0;
    let moodSum = 0;
    let moodCount = 0;

    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = dayEntries.get(dateStr);
      
      if (dayData) {
        totalWorkouts += dayData.totalCompleted;
        
        // Mock time and calories (in real app, these would come from entries)
        dayData.habits.forEach(habit => {
          if (habit.completed) {
            totalTime += Math.floor(Math.random() * 30) + 10; // 10-40 min
            totalCalories += Math.floor(Math.random() * 300) + 100; // 100-400 cal
            
            if (habit.mood) {
              const moodValue = getMoodValue(habit.mood);
              moodSum += moodValue;
              moodCount++;
            }
          }
        });
      }
    });

    setWeeklyStats({
      totalWorkouts,
      totalTime,
      totalCalories,
      avgMood: moodCount > 0 ? moodSum / moodCount : 0
    });
  };

  const getMoodValue = (mood: string): number => {
    const moodMap: { [key: string]: number } = {
      '😊': 5, '😃': 5, '🤩': 5,
      '😐': 3, '😑': 3,
      '😔': 1, '😢': 1, '😞': 1
    };
    return moodMap[mood] || 3;
  };

  const calculateMonthlyAnalytics = async (entriesMap: Map<string, DayEntry>, habitsWithStreaks: any[]) => {
    // Calculate total habits completed this month
    let totalCompleted = 0;
    const moodTrends: Array<{ date: string; mood: number; count: number }> = [];
    const weeklyMoods: number[][] = [[], [], [], [], []]; // 5 weeks max
    
    entriesMap.forEach((dayData, dateStr) => {
      totalCompleted += dayData.totalCompleted;
      
      // Mood trends
      if (dayData.avgMood) {
        moodTrends.push({
          date: format(dayData.date, 'MMM dd'),
          mood: dayData.avgMood,
          count: dayData.habits.filter(h => h.completed && h.mood).length
        });
        
        // Weekly mood average
        const weekIndex = Math.floor((dayData.date.getDate() - 1) / 7);
        if (weekIndex < 5) {
          weeklyMoods[weekIndex].push(dayData.avgMood);
        }
      }
    });
    
    // Calculate weekly mood averages
    const weeklyMoodAverage = weeklyMoods.map(week => 
      week.length > 0 ? week.reduce((a, b) => a + b, 0) / week.length : 0
    ).filter(avg => avg > 0);
    
    // Find best streak
    const bestStreak = Math.max(...habitsWithStreaks.map(h => h.currentStreak), 0);
    
    // Calculate previous month comparison
    const prevMonth = subMonths(currentMonth, 1);
    const prevMonthStart = startOfMonth(prevMonth);
    const prevMonthEnd = endOfMonth(prevMonth);
    const prevMonthDays = eachDayOfInterval({ start: prevMonthStart, end: prevMonthEnd });
    
    let prevMonthCompleted = 0;
    let prevMonthMoodSum = 0;
    let prevMonthMoodCount = 0;
    
    for (const day of prevMonthDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      for (const habit of habitsWithStreaks) {
        const entry = await db.entries.where({ habitId: habit.id, date: dateStr }).first();
        if (entry?.completed) {
          prevMonthCompleted++;
          if (entry.mood) {
            prevMonthMoodSum += getMoodValue(entry.mood);
            prevMonthMoodCount++;
          }
        }
      }
    }
    
    const currentMonthMoodSum = moodTrends.reduce((sum, t) => sum + (t.mood * t.count), 0);
    const currentMonthMoodCount = moodTrends.reduce((sum, t) => sum + t.count, 0);
    const currentAvgMood = currentMonthMoodCount > 0 ? currentMonthMoodSum / currentMonthMoodCount : 0;
    const prevAvgMood = prevMonthMoodCount > 0 ? prevMonthMoodSum / prevMonthMoodCount : 0;
    
    setMonthlyStats({
      totalHabitsCompleted: totalCompleted,
      bestStreak,
      weeklyMoodAverage,
      moodTrends: moodTrends.slice(0, 30), // Limit to 30 days for chart
      previousMonthComparison: {
        moodChange: currentAvgMood - prevAvgMood,
        completionChange: totalCompleted - prevMonthCompleted
      }
    });
  };

  const getDayCompletionColor = (dateStr: string) => {
    const dayData = dayEntries.get(dateStr);
    if (!dayData || dayData.totalHabits === 0) return 'bg-background';
    
    const percentage = (dayData.totalCompleted / dayData.totalHabits) * 100;
    
    if (percentage === 100) return 'bg-success/20 border-success';
    if (percentage >= 75) return 'bg-primary/20 border-primary';
    if (percentage >= 50) return 'bg-warning/20 border-warning';
    if (percentage > 0) return 'bg-accent/20 border-accent';
    return 'bg-background';
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Show daily mood summary
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = dayEntries.get(dateStr);
    
    if (dayData && dayData.habits.length > 0) {
      const moodsData = dayData.habits
        .filter(h => h.completed && h.mood)
        .map(h => ({
          habit: h.habitName,
          emoji: h.emoji,
          mood: h.mood!,
          value: getMoodValue(h.mood!)
        }));
      
      const avgMood = moodsData.length > 0
        ? moodsData.reduce((sum, m) => sum + m.value, 0) / moodsData.length
        : 0;
      
      setSelectedDayMoodSummary({
        date,
        moods: moodsData,
        avgMood
      });
    } else {
      setSelectedDayMoodSummary(null);
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const getFilteredHistory = () => {
    const allEntries: Array<{ dateStr: string; entry: DayEntry }> = [];
    
    dayEntries.forEach((entry, dateStr) => {
      if (entry.habits.length > 0) {
        allEntries.push({ dateStr, entry });
      }
    });

    // Sort by date descending
    allEntries.sort((a, b) => b.entry.date.getTime() - a.entry.date.getTime());

    // Filter by habit
    let filtered = allEntries;
    if (selectedHabitFilter !== 'all') {
      filtered = allEntries.filter(({ entry }) =>
        entry.habits.some(h => h.habitId.toString() === selectedHabitFilter && h.completed)
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(({ entry }) =>
        entry.habits.some(h => 
          h.habitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}`;
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">📅</div>
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      </div>
    );
  }

  const filteredHistory = getFilteredHistory();
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedDayData = selectedDateStr ? dayEntries.get(selectedDateStr) : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-warm shadow-soft sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">History 📅</h1>
                <p className="text-muted-foreground">Track your progress over time</p>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs for Week/Month View */}
        <Tabs defaultValue="month" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          {/* Week Tab Content */}
          <TabsContent value="week" className="space-y-6">
            {/* Weekly Summary */}
            {selectedDate && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Weekly Summary
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {format(startOfWeek(selectedDate), 'MMM dd')} - {format(endOfWeek(selectedDate), 'MMM dd')}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Workouts</span>
                    </div>
                    <p className="text-2xl font-bold">{weeklyStats.totalWorkouts}</p>
                  </div>

                  <div className="bg-gradient-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-success" />
                      <span className="text-xs text-muted-foreground">Time</span>
                    </div>
                    <p className="text-2xl font-bold">{formatTime(weeklyStats.totalTime)}</p>
                  </div>

                  <div className="bg-gradient-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-warning" />
                      <span className="text-xs text-muted-foreground">Calories</span>
                    </div>
                    <p className="text-2xl font-bold">{weeklyStats.totalCalories.toLocaleString()}</p>
                    <span className="text-xs text-muted-foreground">Kcal</span>
                  </div>

                  <div className="bg-gradient-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">😊</span>
                      <span className="text-xs text-muted-foreground">Avg Mood</span>
                    </div>
                    <p className="text-2xl font-bold">{weeklyStats.avgMood.toFixed(1)}/5</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search habits or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedHabitFilter} onValueChange={setSelectedHabitFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by habit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Habits</SelectItem>
                    {habits.map(habit => (
                      <SelectItem key={habit.id} value={habit.id!.toString()}>
                        {habit.emoji} {habit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* History Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Activity History</h3>
              
              {filteredHistory.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-muted-foreground">No activity found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery || selectedHabitFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'Start tracking your habits to see your history'}
                  </p>
                </Card>
              ) : (
                filteredHistory.map(({ dateStr, entry }) => {
                  const completedHabits = entry.habits.filter(h => h.completed);
                  
                  return completedHabits.map((habit, habitIndex) => {
                    const cardId = `${dateStr}-${habit.habitId}`;
                    const isExpanded = expandedCards.has(cardId);
                    const timeSpent = Math.floor(Math.random() * 30) + 10;
                    const calories = Math.floor(Math.random() * 300) + 100;

                    return (
                      <Card key={cardId} className="overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                          onClick={() => toggleCardExpansion(cardId)}
                        >
                          <div className="flex items-start gap-4">
                            <div 
                              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                              style={{ backgroundColor: habit.color + '20' }}
                            >
                              {habit.emoji}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {format(entry.date, 'MMM dd, h:mm a')}
                                  </p>
                                  <h4 className="font-semibold text-lg">{habit.habitName}</h4>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{timeSpent} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Flame className="w-4 h-4" />
                                  <span>{calories} Kcal</span>
                                </div>
                                {habit.mood && (
                                  <div className="flex items-center gap-1">
                                    <span>{habit.mood}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              {habit.notes && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Notes:</p>
                                  <p className="text-sm text-muted-foreground">{habit.notes}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Completed At</p>
                                  <p className="text-sm font-medium">
                                    {habit.completedAt 
                                      ? format(habit.completedAt, 'h:mm a')
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Mood Score</p>
                                  <p className="text-sm font-medium">
                                    {habit.mood ? `${getMoodValue(habit.mood)}/5` : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {habit.color}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Day {format(entry.date, 'd')}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  });
                })
              )}
            </div>

            {/* Streak Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Streak Insights</h3>
              <div className="space-y-3">
                {habits
                  .filter(h => h.currentStreak > 0)
                  .sort((a, b) => b.currentStreak - a.currentStreak)
                  .slice(0, 5)
                  .map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-gradient-glass rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.emoji}</span>
                        <div>
                          <p className="font-medium">{habit.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {habit.currentStreak} day streak
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-warning" />
                        <span className="font-bold text-lg">{habit.currentStreak}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          {/* Month Tab Content */}
          <TabsContent value="month" className="space-y-6">
            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Mood Trend Card */}
                <Card className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {format(currentMonth, 'yyyy/MM')}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day, index) => (
                <div key={index} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {dateRange.map((date, index) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                const dayData = dayEntries.get(dateStr);
                const completionColor = getDayCompletionColor(dateStr);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`
                      aspect-square p-1 rounded-lg border-2 transition-all flex flex-col items-center justify-center
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${isToday ? 'bg-foreground text-background font-bold' : completionColor}
                      hover:scale-105 hover:shadow-md
                    `}
                  >
                    <div className="text-sm font-medium">{format(date, 'd')}</div>
                    {dayData && dayData.dominantMood && (
                      <div className="text-lg leading-none">{dayData.dominantMood}</div>
                    )}
                    {dayData && dayData.streakCount && dayData.streakCount > 0 && (
                      <div className="flex items-center gap-0.5 text-xs">
                        <Flame className="w-2.5 h-2.5 text-warning" />
                        <span>{dayData.streakCount}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/20 border-2 border-success"></div>
              <span>100%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/20 border-2 border-primary"></div>
              <span>75%+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning/20 border-2 border-warning"></div>
              <span>50%+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent/20 border-2 border-accent"></div>
              <span>&lt;50%</span>
            </div>
          </div>
        </Card>

        {/* Daily Mood Summary */}
        {selectedDayMoodSummary && (
          <Card className="p-6 bg-gradient-glass">
            <h3 className="text-lg font-semibold mb-4">
              Daily Mood Summary - {format(selectedDayMoodSummary.date, 'MMM dd, yyyy')}
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Mood</span>
                <Badge variant="secondary" className="text-lg">
                  {selectedDayMoodSummary.avgMood.toFixed(1)}/5
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Habits Completed:</p>
              {selectedDayMoodSummary.moods.map((mood, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="font-medium">{mood.habit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{mood.mood}</span>
                    <Badge variant="outline">{mood.value}/5</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Monthly Analytics Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Monthly Analytics - {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-glass p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Completed</span>
              </div>
              <p className="text-2xl font-bold">{monthlyStats.totalHabitsCompleted}</p>
              {monthlyStats.previousMonthComparison.completionChange !== 0 && (
                <p className={`text-xs mt-1 ${monthlyStats.previousMonthComparison.completionChange > 0 ? 'text-success' : 'text-destructive'}`}>
                  {monthlyStats.previousMonthComparison.completionChange > 0 ? '+' : ''}
                  {monthlyStats.previousMonthComparison.completionChange} vs last month
                </p>
              )}
            </div>

            <div className="bg-gradient-glass p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground">Best Streak</span>
              </div>
              <p className="text-2xl font-bold">{monthlyStats.bestStreak} days</p>
            </div>

            <div className="bg-gradient-glass p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">😊</span>
                <span className="text-xs text-muted-foreground">Avg Mood</span>
              </div>
              <p className="text-2xl font-bold">
                {monthlyStats.weeklyMoodAverage.length > 0 
                  ? (monthlyStats.weeklyMoodAverage.reduce((a, b) => a + b, 0) / monthlyStats.weeklyMoodAverage.length).toFixed(1)
                  : '0.0'
                }/5
              </p>
              {monthlyStats.previousMonthComparison.moodChange !== 0 && (
                <p className={`text-xs mt-1 ${monthlyStats.previousMonthComparison.moodChange > 0 ? 'text-success' : 'text-destructive'}`}>
                  {monthlyStats.previousMonthComparison.moodChange > 0 ? '+' : ''}
                  {monthlyStats.previousMonthComparison.moodChange.toFixed(1)} vs last month
                </p>
              )}
            </div>
          </div>

          {/* Mood Trends Chart */}
          {monthlyStats.moodTrends.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-4">Mood Trends</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyStats.moodTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#FF6B5A" 
                    strokeWidth={2}
                    dot={{ fill: '#FF6B5A', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly Mood Average Bar Chart */}
          {monthlyStats.weeklyMoodAverage.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-4">Weekly Mood Average</h4>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={monthlyStats.weeklyMoodAverage.map((avg, idx) => ({ 
                  week: `Week ${idx + 1}`, 
                  mood: avg 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="mood" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Weekly Summary */}
        {selectedDate && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Weekly Summary
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {format(startOfWeek(selectedDate), 'MMM dd')} - {format(endOfWeek(selectedDate), 'MMM dd')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-glass p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Workouts</span>
                </div>
                <p className="text-2xl font-bold">{weeklyStats.totalWorkouts}</p>
              </div>

              <div className="bg-gradient-glass p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">Time</span>
                </div>
                <p className="text-2xl font-bold">{formatTime(weeklyStats.totalTime)}</p>
              </div>

              <div className="bg-gradient-glass p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Calories</span>
                </div>
                <p className="text-2xl font-bold">{weeklyStats.totalCalories.toLocaleString()}</p>
                <span className="text-xs text-muted-foreground">Kcal</span>
              </div>

              <div className="bg-gradient-glass p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">😊</span>
                  <span className="text-xs text-muted-foreground">Avg Mood</span>
                </div>
                <p className="text-2xl font-bold">{weeklyStats.avgMood.toFixed(1)}/5</p>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search habits or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedHabitFilter} onValueChange={setSelectedHabitFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by habit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Habits</SelectItem>
                {habits.map(habit => (
                  <SelectItem key={habit.id} value={habit.id!.toString()}>
                    {habit.emoji} {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* History Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Activity History</h3>
          
          {filteredHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-muted-foreground">No activity found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || selectedHabitFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Start tracking your habits to see your history'}
              </p>
            </Card>
          ) : (
            filteredHistory.map(({ dateStr, entry }) => {
              const completedHabits = entry.habits.filter(h => h.completed);
              
              return completedHabits.map((habit, habitIndex) => {
                const cardId = `${dateStr}-${habit.habitId}`;
                const isExpanded = expandedCards.has(cardId);
                const timeSpent = Math.floor(Math.random() * 30) + 10;
                const calories = Math.floor(Math.random() * 300) + 100;

                return (
                  <Card key={cardId} className="overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                      onClick={() => toggleCardExpansion(cardId)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Habit Image/Icon */}
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          {habit.emoji}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {format(entry.date, 'MMM dd, h:mm a')}
                              </p>
                              <h4 className="font-semibold text-lg">{habit.habitName}</h4>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{timeSpent} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Flame className="w-4 h-4" />
                              <span>{calories} Kcal</span>
                            </div>
                            {habit.mood && (
                              <div className="flex items-center gap-1">
                                <span>{habit.mood}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {habit.notes && (
                            <div>
                              <p className="text-sm font-medium mb-1">Notes:</p>
                              <p className="text-sm text-muted-foreground">{habit.notes}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Completed At</p>
                              <p className="text-sm font-medium">
                                {habit.completedAt 
                                  ? format(habit.completedAt, 'h:mm a')
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Mood Score</p>
                              <p className="text-sm font-medium">
                                {habit.mood ? `${getMoodValue(habit.mood)}/5` : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {habit.color}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Day {format(entry.date, 'd')}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              });
            })
          )}
        </div>

        {/* Streak Insights */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Streak Insights</h3>
          <div className="space-y-3">
            {habits
              .filter(h => h.currentStreak > 0)
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .slice(0, 5)
              .map(habit => (
                <div key={habit.id} className="flex items-center justify-between p-3 bg-gradient-glass rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.emoji}</span>
                    <div>
                      <p className="font-medium">{habit.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {habit.currentStreak} day streak
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-warning" />
                    <span className="font-bold text-lg">{habit.currentStreak}</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
};

export default History;
