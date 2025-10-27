import { db, HabitEntry } from './database';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

// Mood scoring system
const MOOD_SCORES: { [key: string]: number } = {
  '😊': 5,  // Very Happy
  '😌': 4,  // Content
  '💪': 5,  // Motivated
  '🔥': 5,  // Energized
  '✨': 4,  // Good
  '😴': 2,  // Tired
  '😑': 2,  // Neutral/Bored
  '😔': 1,  // Sad
  '😮‍💨': 1,  // Exhausted
};

export interface MoodPattern {
  habitId: number;
  habitName: string;
  habitEmoji: string;
  averageMood: number;
  totalCompletions: number;
  positiveCount: number;
  negativeCount: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendation?: string;
}

export interface WeeklyMoodReport {
  weekStart: Date;
  weekEnd: Date;
  overallMood: number;
  bestHabits: MoodPattern[];
  worstHabits: MoodPattern[];
  suggestions: string[];
}

export interface MonthlyComparison {
  currentMonth: {
    name: string;
    totalCompletions: number;
    topHabit: { name: string; count: number; emoji: string } | null;
    averageMood: number;
  };
  previousMonth: {
    name: string;
    totalCompletions: number;
    topHabit: { name: string; count: number; emoji: string } | null;
    averageMood: number;
  };
  change: {
    completions: number;
    mood: number;
    habitShift: boolean;
  };
}

// Calculate mood score from emoji
export const getMoodScore = (moodEmoji?: string): number => {
  if (!moodEmoji) return 3; // Neutral default
  return MOOD_SCORES[moodEmoji] || 3;
};

// Analyze mood patterns for a specific habit
export const analyzeHabitMood = async (habitId: number, habitName: string, habitEmoji: string, days: number = 7): Promise<MoodPattern> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = format(startDate, 'yyyy-MM-dd');

  const entries = await db.entries
    .where('habitId')
    .equals(habitId)
    .and(entry => entry.completed && entry.date >= startDateStr)
    .toArray();

  if (entries.length === 0) {
    return {
      habitId,
      habitName,
      habitEmoji,
      averageMood: 3,
      totalCompletions: 0,
      positiveCount: 0,
      negativeCount: 0,
      trend: 'stable',
    };
  }

  const moodScores = entries.map(e => getMoodScore(e.mood));
  const averageMood = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length;
  
  const positiveCount = moodScores.filter(score => score >= 4).length;
  const negativeCount = moodScores.filter(score => score <= 2).length;

  // Calculate trend (compare first half vs second half)
  const midPoint = Math.floor(moodScores.length / 2);
  const firstHalfAvg = moodScores.slice(0, midPoint).reduce((sum, s) => sum + s, 0) / midPoint;
  const secondHalfAvg = moodScores.slice(midPoint).reduce((sum, s) => sum + s, 0) / (moodScores.length - midPoint);
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg + 0.5) trend = 'improving';
  else if (secondHalfAvg < firstHalfAvg - 0.5) trend = 'declining';

  // Generate recommendation
  let recommendation: string | undefined;
  if (averageMood <= 2 && entries.length >= 3) {
    recommendation = `Consider taking a break or trying a different approach to "${habitName}"`;
  } else if (trend === 'declining' && averageMood < 3) {
    recommendation = `Your mood is declining with "${habitName}". Try changing the time or frequency.`;
  } else if (averageMood >= 4.5) {
    recommendation = `"${habitName}" is working great for you! Keep it up! 🎉`;
  }

  return {
    habitId,
    habitName,
    habitEmoji,
    averageMood,
    totalCompletions: entries.length,
    positiveCount,
    negativeCount,
    trend,
    recommendation,
  };
};

// Generate weekly mood report
export const generateWeeklyMoodReport = async (): Promise<WeeklyMoodReport> => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const allHabits = await db.habits.toArray();
  const habits = allHabits.filter(habit => habit.isActive);
  
  const moodPatterns = await Promise.all(
    habits.map(habit => 
      analyzeHabitMood(habit.id!, habit.name, habit.emoji, 7)
    )
  );

  const overallMood = moodPatterns.length > 0
    ? moodPatterns.reduce((sum, p) => sum + p.averageMood, 0) / moodPatterns.length
    : 3;

  const bestHabits = moodPatterns
    .filter(p => p.totalCompletions > 0)
    .sort((a, b) => b.averageMood - a.averageMood)
    .slice(0, 3);

  const worstHabits = moodPatterns
    .filter(p => p.totalCompletions >= 3 && p.averageMood < 3)
    .sort((a, b) => a.averageMood - b.averageMood)
    .slice(0, 3);

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (worstHabits.length > 0) {
    worstHabits.forEach(habit => {
      if (habit.averageMood <= 2) {
        suggestions.push(`🚫 Consider dropping "${habit.habitName}" - it's consistently lowering your mood`);
      } else if (habit.trend === 'declining') {
        suggestions.push(`⏰ Try doing "${habit.habitName}" at a different time of day`);
      }
    });
  }

  if (bestHabits.length > 0 && bestHabits[0].averageMood >= 4) {
    suggestions.push(`✨ "${bestHabits[0].habitName}" makes you happiest! Try to prioritize it.`);
  }

  if (overallMood < 3) {
    suggestions.push(`💡 Your overall mood is low this week. Consider reducing habit load or trying easier activities.`);
  } else if (overallMood >= 4) {
    suggestions.push(`🎉 Great week! Your habits are boosting your mood. Keep up the momentum!`);
  }

  return {
    weekStart,
    weekEnd,
    overallMood,
    bestHabits,
    worstHabits,
    suggestions,
  };
};

// Get monthly comparison data
export const getMonthlyComparison = async (): Promise<MonthlyComparison> => {
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const previousMonthStart = startOfMonth(subMonths(new Date(), 1));
  const previousMonthEnd = endOfMonth(subMonths(new Date(), 1));

  // Get current month data
  const currentEntries = await db.entries
    .where('date')
    .between(
      format(currentMonthStart, 'yyyy-MM-dd'),
      format(currentMonthEnd, 'yyyy-MM-dd'),
      true,
      true
    )
    .and(entry => entry.completed)
    .toArray();

  // Get previous month data
  const previousEntries = await db.entries
    .where('date')
    .between(
      format(previousMonthStart, 'yyyy-MM-dd'),
      format(previousMonthEnd, 'yyyy-MM-dd'),
      true,
      true
    )
    .and(entry => entry.completed)
    .toArray();

  // Calculate top habits for each month
  const getTopHabit = async (entries: HabitEntry[]) => {
    if (entries.length === 0) return null;
    
    const habitCounts: { [key: number]: number } = {};
    entries.forEach(entry => {
      habitCounts[entry.habitId] = (habitCounts[entry.habitId] || 0) + 1;
    });

    const topHabitId = Number(Object.keys(habitCounts).reduce((a, b) => 
      habitCounts[Number(a)] > habitCounts[Number(b)] ? a : b
    ));

    const habit = await db.habits.get(topHabitId);
    return habit ? {
      name: habit.name,
      count: habitCounts[topHabitId],
      emoji: habit.emoji,
    } : null;
  };

  const currentTopHabit = await getTopHabit(currentEntries);
  const previousTopHabit = await getTopHabit(previousEntries);

  // Calculate average moods
  const currentMoodScores = currentEntries.map(e => getMoodScore(e.mood));
  const previousMoodScores = previousEntries.map(e => getMoodScore(e.mood));

  const currentAvgMood = currentMoodScores.length > 0
    ? currentMoodScores.reduce((sum, s) => sum + s, 0) / currentMoodScores.length
    : 3;

  const previousAvgMood = previousMoodScores.length > 0
    ? previousMoodScores.reduce((sum, s) => sum + s, 0) / previousMoodScores.length
    : 3;

  return {
    currentMonth: {
      name: format(currentMonthStart, 'MMMM yyyy'),
      totalCompletions: currentEntries.length,
      topHabit: currentTopHabit,
      averageMood: currentAvgMood,
    },
    previousMonth: {
      name: format(previousMonthStart, 'MMMM yyyy'),
      totalCompletions: previousEntries.length,
      topHabit: previousTopHabit,
      averageMood: previousAvgMood,
    },
    change: {
      completions: currentEntries.length - previousEntries.length,
      mood: currentAvgMood - previousAvgMood,
      habitShift: currentTopHabit?.name !== previousTopHabit?.name,
    },
  };
};

// Get historical monthly data for charts
export interface MonthlyHistoryData {
  month: string;
  completions: number;
  averageMood: number;
  topHabit: string;
}

export const getMonthlyHistory = async (months: number = 6): Promise<MonthlyHistoryData[]> => {
  const history: MonthlyHistoryData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const entries = await db.entries
      .where('date')
      .between(
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd'),
        true,
        true
      )
      .and(entry => entry.completed)
      .toArray();

    // Get top habit for this month
    const habitCounts: { [key: number]: number } = {};
    entries.forEach(entry => {
      habitCounts[entry.habitId] = (habitCounts[entry.habitId] || 0) + 1;
    });

    let topHabitName = 'None';
    if (Object.keys(habitCounts).length > 0) {
      const topHabitId = Number(Object.keys(habitCounts).reduce((a, b) => 
        habitCounts[Number(a)] > habitCounts[Number(b)] ? a : b
      ));
      const habit = await db.habits.get(topHabitId);
      if (habit) topHabitName = habit.name;
    }

    const moodScores = entries.map(e => getMoodScore(e.mood));
    const avgMood = moodScores.length > 0
      ? moodScores.reduce((sum, s) => sum + s, 0) / moodScores.length
      : 3;

    history.push({
      month: format(monthDate, 'MMM yyyy'),
      completions: entries.length,
      averageMood: avgMood,
      topHabit: topHabitName,
    });
  }

  return history;
};
