import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smile, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { getHabitsWithStreaks } from '@/lib/database';
import { db } from '@/lib/database';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface MoodData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  avgMood: number;
}

interface HabitMoodTrend {
  habitId: number;
  habitName: string;
  emoji: string;
  moodData: MoodData[];
  dominantMood: string;
  avgMood: number;
  trend: 'improving' | 'declining' | 'stable';
}

export const MoodTrendReports = () => {
  const [weeklyData, setWeeklyData] = useState<MoodData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MoodData[]>([]);
  const [habitTrends, setHabitTrends] = useState<HabitMoodTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const habits = await getHabitsWithStreaks();
      const allEntries = await db.entries.toArray();
      
      const positiveEmojis = ['😊', '😌', '💪', '🔥', '✨'];
      const negativeEmojis = ['😔', '😮‍💨'];
      const neutralEmojis = ['😴', '😑'];
      
      // Weekly data (last 30 days)
      const weeklyMoods: MoodData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const dayEntries = allEntries.filter(e => e.date === dateStr && e.completed && e.mood);
        let positive = 0, neutral = 0, negative = 0;
        
        dayEntries.forEach(e => {
          if (e.mood) {
            if (positiveEmojis.includes(e.mood)) positive++;
            else if (negativeEmojis.includes(e.mood)) negative++;
            else if (neutralEmojis.includes(e.mood)) neutral++;
          }
        });
        
        const total = dayEntries.length;
        const avgMood = total > 0 ? ((positive * 5 + neutral * 3 + negative * 1) / total) : 0;
        
        weeklyMoods.push({
          date: format(date, 'MMM dd'),
          positive,
          neutral,
          negative,
          total,
          avgMood
        });
      }
      
      // Monthly data (last 6 months)
      const monthlyMoods: MoodData[] = [];
      for (let i = 5; i >= 0; i--) {
        const startDate = startOfMonth(subDays(new Date(), i * 30));
        const endDate = endOfMonth(startDate);
        
        const monthEntries = allEntries.filter(e => {
          const entryDate = new Date(e.date);
          return e.completed && e.mood && entryDate >= startDate && entryDate <= endDate;
        });
        
        let positive = 0, neutral = 0, negative = 0;
        
        monthEntries.forEach(e => {
          if (e.mood) {
            if (positiveEmojis.includes(e.mood)) positive++;
            else if (negativeEmojis.includes(e.mood)) negative++;
            else if (neutralEmojis.includes(e.mood)) neutral++;
          }
        });
        
        const total = monthEntries.length;
        const avgMood = total > 0 ? ((positive * 5 + neutral * 3 + negative * 1) / total) : 0;
        
        monthlyMoods.push({
          date: format(startDate, 'MMM yyyy'),
          positive,
          neutral,
          negative,
          total,
          avgMood
        });
      }
      
      // Habit-specific trends
      const trends: HabitMoodTrend[] = await Promise.all(
        habits.slice(0, 5).map(async (habit) => {
          const habitEntries = allEntries
            .filter(e => e.habitId === habit.id && e.completed && e.mood)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Get last 14 days of data
          const recentData: MoodData[] = [];
          for (let i = 13; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            
            const entries = habitEntries.filter(e => e.date === dateStr);
            let positive = 0, neutral = 0, negative = 0;
            
            entries.forEach(e => {
              if (e.mood) {
                if (positiveEmojis.includes(e.mood)) positive++;
                else if (negativeEmojis.includes(e.mood)) negative++;
                else if (neutralEmojis.includes(e.mood)) neutral++;
              }
            });
            
            recentData.push({
              date: format(date, 'MMM dd'),
              positive,
              neutral,
              negative,
              total: entries.length,
              avgMood: entries.length > 0 ? ((positive * 5 + neutral * 3 + negative * 1) / entries.length) : 0
            });
          }
          
          const recentMoods = habitEntries.slice(-14).map(e => e.mood).filter(Boolean);
          const moodCounts: Record<string, number> = {};
          recentMoods.forEach(m => {
            moodCounts[m!] = (moodCounts[m!] || 0) + 1;
          });
          const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '😊';
          
          const overallAvg = habitEntries.length > 0
            ? recentData.reduce((sum, d) => sum + d.avgMood, 0) / recentData.filter(d => d.total > 0).length
            : 0;
          
          const lastWeekAvg = recentData.slice(-7).reduce((sum, d) => sum + d.avgMood, 0) / 7;
          const prevWeekAvg = recentData.slice(-14, -7).reduce((sum, d) => sum + d.avgMood, 0) / 7;
          const trend = lastWeekAvg > prevWeekAvg + 0.5 ? 'improving' :
                       lastWeekAvg < prevWeekAvg - 0.5 ? 'declining' : 'stable';
          
          return {
            habitId: habit.id!,
            habitName: habit.name,
            emoji: habit.emoji,
            moodData: recentData,
            dominantMood,
            avgMood: overallAvg,
            trend
          };
        })
      );
      
      setWeeklyData(weeklyMoods);
      setMonthlyData(monthlyMoods);
      setHabitTrends(trends);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading mood data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodEmoji = (avg: number) => {
    if (avg >= 4.5) return '😊';
    if (avg >= 4) return '😌';
    if (avg >= 3) return '😑';
    if (avg >= 2) return '😔';
    return '😮‍💨';
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-muted-foreground">Loading mood trends...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <Smile className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Overall Mood</p>
              <p className="text-2xl font-bold flex items-center space-x-1">
                <span>{getMoodEmoji(weeklyData.slice(-7).reduce((s, d) => s + d.avgMood, 0) / 7)}</span>
                <span className="text-base">{(weeklyData.slice(-7).reduce((s, d) => s + d.avgMood, 0) / 7).toFixed(1)}/5</span>
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Positive Days</p>
              <p className="text-2xl font-bold">
                {weeklyData.slice(-7).filter(d => d.avgMood >= 4).length}/7
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-glass">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className="text-2xl font-bold">
                {weeklyData.slice(-7).reduce((s, d) => s + d.avgMood, 0) > 
                 weeklyData.slice(-14, -7).reduce((s, d) => s + d.avgMood, 0) ? 
                 '⬆️' : '⬇️'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Monthly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">30-Day Mood Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.date}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg: {getMoodEmoji(data.avgMood)} {data.avgMood.toFixed(1)}/5
                          </p>
                          <div className="text-xs space-y-1 mt-1">
                            <p>😊: {data.positive}</p>
                            <p>😐: {data.neutral}</p>
                            <p>😔: {data.negative}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="avgMood" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">6-Month Mood Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.date}</p>
                          <p className="text-sm">
                            {getMoodEmoji(data.avgMood)} {data.avgMood.toFixed(1)}/5
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgMood" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Habit-specific trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Habit Mood Trends</h3>
        <div className="space-y-4">
          {habitTrends.map((trend) => (
            <Card key={trend.habitId} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{trend.emoji}</span>
                  <div>
                    <h4 className="font-medium">{trend.habitName}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={trend.trend === 'improving' ? 'default' : 
                                     trend.trend === 'declining' ? 'destructive' : 'secondary'}>
                        {trend.trend === 'improving' ? '📈 Improving' : 
                         trend.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Dominant: {trend.dominantMood}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{trend.avgMood.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">avg / 5</p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={trend.moodData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgMood" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
