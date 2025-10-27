import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Calendar, Target, Award, Lightbulb, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { db, getHabitsWithStreaks } from '@/lib/database';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { MonthlyAnalytics } from '@/components/MonthlyAnalytics';

const Analytics = () => {
  const [habits, setHabits] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const habitsWithStreaks = await getHabitsWithStreaks();
      setHabits(habitsWithStreaks);

      // Generate weekly completion data
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        let completedCount = 0;
        for (const habit of habitsWithStreaks) {
          const entry = await db.entries.where({ habitId: habit.id, date: dateStr }).first();
          if (entry?.completed) completedCount++;
        }
        
        weekData.push({
          date: format(date, 'MMM dd'),
          completed: completedCount,
          total: habitsWithStreaks.length
        });
      }
      setWeeklyData(weekData);

      // Generate category data (mock categories for now)
      const categories = ['Health', 'Productivity', 'Learning', 'Fitness', 'Mindfulness'];
      const catData = categories.map(cat => ({
        name: cat,
        value: Math.floor(Math.random() * habitsWithStreaks.length) + 1,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));
      setCategoryData(catData);

      // Generate streak data
      const streakInfo = habitsWithStreaks.map(habit => ({
        name: habit.name.substring(0, 10) + (habit.name.length > 10 ? '...' : ''),
        streak: habit.currentStreak,
        completion: habit.completionRate
      }));
      setStreakData(streakInfo);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalHabits = habits.length;
  const avgCompletion = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length) : 0;
  const maxStreak = Math.max(...habits.map(h => h.currentStreak), 0);
  const todayCompleted = weeklyData[weeklyData.length - 1]?.completed || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">📊</div>
          <p className="text-muted-foreground">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-warm shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics 📊</h1>
                <p className="text-muted-foreground">Your habit insights and progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Monthly</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-glass">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Habits</p>
                <p className="text-2xl font-bold">{totalHabits}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-glass">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold">{avgCompletion}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-glass">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{maxStreak}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-glass">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayCompleted}/{totalHabits}</p>
              </div>
            </div>
          </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-8">
          {/* Weekly Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#FF6B5A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Habit Streaks */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Current Streaks</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={streakData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="streak" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
            </div>

            {/* Habit Performance */}
            <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Habit Performance</h3>
          <div className="space-y-4">
            {habits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{habit.emoji}</span>
                  <div>
                    <p className="font-medium">{habit.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {habit.currentStreak} day streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={habit.completionRate >= 80 ? "default" : habit.completionRate >= 60 ? "secondary" : "destructive"}>
                    {habit.completionRate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyAnalytics />
          </TabsContent>

          <TabsContent value="insights">
            <SmartSuggestions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
