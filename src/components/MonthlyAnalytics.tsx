import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award,
  ArrowRight,
  Minus,
  ChevronLeft,
  ChevronRight,
  Flame,
  ChevronDown,
  ChevronUp,
  Download,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  getMonthlyComparison, 
  getMonthlyHistory, 
  MonthlyComparison,
  MonthlyHistoryData 
} from '@/lib/mood-analysis';
import { db, getHabitsWithStreaks } from '@/lib/database';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { SadStreakNudge } from '@/components/SadStreakNudge';

export const MonthlyAnalytics = () => {
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [history, setHistory] = useState<MonthlyHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // History calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dayEntries, setDayEntries] = useState<Map<string, any>>(new Map());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [sadStreakDetected, setSadStreakDetected] = useState(false);
  const [sadStreakHabit, setSadStreakHabit] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadHistoryData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      const [comparisonData, historyData] = await Promise.all([
        getMonthlyComparison(),
        getMonthlyHistory(6)
      ]);
      setComparison(comparisonData);
      setHistory(historyData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading monthly analytics:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      const habitsWithStreaks = await getHabitsWithStreaks();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const entriesMap = new Map<string, any>();

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
        
        const completedWithMood = dayHabits.filter(h => h.completed && h.mood);
        const avgMood = completedWithMood.length > 0
          ? completedWithMood.reduce((sum, h) => sum + getMoodValue(h.mood!), 0) / completedWithMood.length
          : undefined;
        
        const moodCounts: { [key: string]: number } = {};
        completedWithMood.forEach(h => {
          if (h.mood) moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
        });
        const dominantMood = Object.keys(moodCounts).length > 0
          ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
          : undefined;
        
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
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading history data:', error);
      }
    }
  };

  const getMoodValue = (mood: string): number => {
    const moodMap: { [key: string]: number } = {
      '😊': 5, '😃': 5, '🤩': 5,
      '😐': 3, '😑': 3,
      '😔': 1, '😢': 1, '😞': 1
    };
    return moodMap[mood] || 3;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading monthly analytics...
        </div>
      </Card>
    );
  }

  if (!comparison) return null;

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return '😊';
    if (mood >= 4) return '😌';
    if (mood >= 3) return '😑';
    if (mood >= 2) return '😔';
    return '😮‍💨';
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleDateClick = (date: Date) => setSelectedDate(date);
  
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const handleRetireHabit = async (habitId: number) => {
    if (confirm('Retire this habit? You can restore it later in Settings.')) {
      await db.habits.update(habitId, { isActive: false });
      loadData();
      loadHistoryData();
      setSadStreakDetected(false);
    }
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

  const exportToCSV = () => {
    const csvData = [];
    csvData.push(['Date', 'Habit', 'Completed', 'Mood', 'Notes']);
    
    dayEntries.forEach((entry, dateStr) => {
      entry.habits.forEach((habit: any) => {
        if (habit.completed) {
          csvData.push([
            dateStr,
            habit.habitName,
            'Yes',
            habit.mood || 'N/A',
            (habit.notes || '').replace(/,/g, ';')
          ]);
        }
      });
    });

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitly-export-${format(currentMonth, 'yyyy-MM')}.csv`;
    a.click();
  };

  const getFilteredHistory = () => {
    const allEntries: Array<{ dateStr: string; entry: any }> = [];
    
    dayEntries.forEach((entry, dateStr) => {
      if (entry.habits.length > 0) {
        allEntries.push({ dateStr, entry });
      }
    });

    allEntries.sort((a, b) => b.entry.date.getTime() - a.entry.date.getTime());
    return allEntries;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      {/* History Calendar & Activity - ABOVE Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) - History List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {getFilteredHistory().length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-muted-foreground">No activity found for this month</p>
                </div>
              ) : (
                getFilteredHistory().slice(0, 10).map(({ dateStr, entry }) => {
                  const completedHabits = entry.habits.filter((h: any) => h.completed);
                  
                  return completedHabits.map((habit: any) => {
                    const cardId = `${dateStr}-${habit.habitId}`;
                    const isExpanded = expandedCards.has(cardId);

                    return (
                      <div
                        key={cardId}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                        onClick={() => toggleCardExpansion(cardId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{habit.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{habit.habitName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(entry.date, 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {habit.mood && <span className="text-lg">{habit.mood}</span>}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            {habit.notes && (
                              <p className="text-sm text-muted-foreground">{habit.notes}</p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetireHabit(habit.habitId);
                              }}
                              className="text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Retire Habit
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1/3) - Calendar */}
        <div className="lg:col-span-1">
          <Card className="p-4 md:p-6 analytics-calendar">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg md:text-xl font-bold">
                {format(currentMonth, 'MMM yyyy')}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center text-xs md:text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 md:gap-2">
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
                        aspect-square p-1 rounded-lg border-2 transition-all flex flex-col items-center justify-center analytics-calendar__tile
                        ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                        ${isToday ? 'ring-2 ring-primary border-primary bg-primary/10 font-bold' : completionColor}
                        hover:scale-105 hover:shadow-md
                      `}
                    >
                      <div className="text-xs md:text-sm font-medium">{format(date, 'd')}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-success/20 border-2 border-success"></div>
                <span>100%</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-primary/20 border-2 border-primary"></div>
                <span>75%+</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Monthly Comparison - MOVED DOWN */}
      <Card className="p-6 bg-gradient-glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">Monthly Comparison</h3>
            <p className="text-sm text-muted-foreground">
              How you're doing this month vs last month
            </p>
          </div>
          <Calendar className="w-8 h-8 text-primary" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Previous Month */}
          <div className="p-4 bg-secondary/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-muted-foreground">
                {comparison.previousMonth.name}
              </h4>
              <Badge variant="outline">Previous</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Completions</p>
                <p className="text-2xl font-bold">{comparison.previousMonth.totalCompletions}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Top Habit</p>
                <div className="flex items-center space-x-2">
                  {comparison.previousMonth.topHabit ? (
                    <>
                      <span className="text-xl">{comparison.previousMonth.topHabit.emoji}</span>
                      <span className="font-medium">{comparison.previousMonth.topHabit.name}</span>
                      <Badge variant="secondary">{comparison.previousMonth.topHabit.count}x</Badge>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No data</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Average Mood</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getMoodEmoji(comparison.previousMonth.averageMood)}</span>
                  <span className="font-medium">{comparison.previousMonth.averageMood.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Month */}
          <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">
                {comparison.currentMonth.name}
              </h4>
              <Badge>Current</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Completions</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{comparison.currentMonth.totalCompletions}</p>
                  {getTrendIcon(comparison.change.completions)}
                  <span className={`text-sm font-medium ${getTrendColor(comparison.change.completions)}`}>
                    {comparison.change.completions > 0 ? '+' : ''}{comparison.change.completions}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Top Habit</p>
                <div className="flex items-center space-x-2">
                  {comparison.currentMonth.topHabit ? (
                    <>
                      <span className="text-xl">{comparison.currentMonth.topHabit.emoji}</span>
                      <span className="font-medium">{comparison.currentMonth.topHabit.name}</span>
                      <Badge variant="secondary">{comparison.currentMonth.topHabit.count}x</Badge>
                      {comparison.change.habitShift && (
                        <Badge variant="outline" className="text-xs">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Shifted
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No data</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Average Mood</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getMoodEmoji(comparison.currentMonth.averageMood)}</span>
                  <span className="font-medium">{comparison.currentMonth.averageMood.toFixed(1)}/5.0</span>
                  {getTrendIcon(comparison.change.mood)}
                  <span className={`text-sm font-medium ${getTrendColor(comparison.change.mood)}`}>
                    {comparison.change.mood > 0 ? '+' : ''}{comparison.change.mood.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        {comparison.change.habitShift && (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/30">
            <div className="flex items-start space-x-2">
              <Award className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium text-sm">Focus Shift Detected!</p>
                <p className="text-sm text-muted-foreground">
                  You've changed your primary focus from "{comparison.previousMonth.topHabit?.name}" 
                  to "{comparison.currentMonth.topHabit?.name}" this month.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Historical Charts */}
      <Card className="p-6">
        <Tabs defaultValue="completions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="completions">Completion Trends</TabsTrigger>
            <TabsTrigger value="mood">Mood Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="completions" className="mt-6">
            <h4 className="font-semibold mb-4">6-Month Completion History</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.month}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.completions} completions
                          </p>
                          <p className="text-sm">
                            Top: {data.topHabit}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="completions" fill="#FF6B5A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="mood" className="mt-6">
            <h4 className="font-semibold mb-4">6-Month Mood Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.month}</p>
                          <p className="text-sm">
                            Mood: {getMoodEmoji(data.averageMood)} {data.averageMood.toFixed(1)}/5.0
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Top: {data.topHabit}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageMood" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
