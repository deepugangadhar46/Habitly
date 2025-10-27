import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingDown, TrendingUp, Clock, X, AlertCircle } from 'lucide-react';
import { generateWeeklyMoodReport, WeeklyMoodReport, MoodPattern } from '@/lib/mood-analysis';
import { db } from '@/lib/database';

export const SmartSuggestions = () => {
  const [report, setReport] = useState<WeeklyMoodReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const weeklyReport = await generateWeeklyMoodReport();
      setReport(weeklyReport);
    } catch (error) {
      console.error('Error generating mood report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropHabit = async (habitId: number) => {
    if (confirm('Are you sure you want to deactivate this habit? You can reactivate it later in Settings.')) {
      await db.habits.update(habitId, { isActive: false });
      loadReport();
    }
  };

  const dismissSuggestion = (suggestion: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestion]));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Lightbulb className="w-5 h-5 animate-pulse" />
          <span>Analyzing your habits...</span>
        </div>
      </Card>
    );
  }

  if (!report || report.suggestions.length === 0) {
    return null;
  }

  const activeSuggestions = report.suggestions.filter(s => !dismissedSuggestions.has(s));

  if (activeSuggestions.length === 0) {
    return null;
  }

  const getMoodColor = (mood: number) => {
    if (mood >= 4) return 'text-green-500';
    if (mood >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return '😊';
    if (mood >= 4) return '😌';
    if (mood >= 3) return '😑';
    if (mood >= 2) return '😔';
    return '😮‍💨';
  };

  return (
    <div className="space-y-4">
      {/* Overall Mood Card */}
      <Card className="p-6 bg-gradient-glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Weekly Mood Insights</h3>
              <p className="text-sm text-muted-foreground">
                Based on your habit tracking this week
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl">{getMoodEmoji(report.overallMood)}</div>
            <p className={`text-sm font-medium ${getMoodColor(report.overallMood)}`}>
              {report.overallMood.toFixed(1)}/5.0
            </p>
          </div>
        </div>
      </Card>

      {/* Best Performing Habits */}
      {report.bestHabits.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold">Top Mood Boosters</h4>
          </div>
          <div className="space-y-3">
            {report.bestHabits.map((habit) => (
              <div
                key={habit.habitId}
                className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{habit.habitEmoji}</span>
                  <div>
                    <p className="font-medium">{habit.habitName}</p>
                    <p className="text-sm text-muted-foreground">
                      {habit.totalCompletions} completions • {habit.positiveCount} positive moods
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  {habit.averageMood.toFixed(1)} {getMoodEmoji(habit.averageMood)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Habits Needing Attention */}
      {report.worstHabits.length > 0 && (
        <Card className="p-6 border-orange-500/30">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold">Habits Needing Attention</h4>
          </div>
          <div className="space-y-3">
            {report.worstHabits.map((habit) => (
              <div
                key={habit.habitId}
                className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{habit.habitEmoji}</span>
                    <div>
                      <p className="font-medium">{habit.habitName}</p>
                      <p className="text-sm text-muted-foreground">
                        {habit.totalCompletions} completions • {habit.negativeCount} low moods
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                    {habit.averageMood.toFixed(1)} {getMoodEmoji(habit.averageMood)}
                  </Badge>
                </div>
                
                {habit.recommendation && (
                  <Alert className="mt-3 bg-background/50">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      {habit.recommendation}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDropHabit(habit.habitId)}
                    className="text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Deactivate Habit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Change Time
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* General Suggestions */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Smart Recommendations</h4>
        </div>
        <div className="space-y-2">
          {activeSuggestions.map((suggestion, index) => (
            <Alert key={index} className="bg-primary/5">
              <div className="flex items-start justify-between">
                <AlertDescription className="text-sm pr-4">
                  {suggestion}
                </AlertDescription>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissSuggestion(suggestion)}
                  className="h-6 w-6 p-0 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      </Card>
    </div>
  );
};
