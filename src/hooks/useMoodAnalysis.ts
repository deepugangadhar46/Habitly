import { useCallback, useMemo } from 'react';
import { db } from '@/lib/database';

interface MoodStats {
  totalEntries: number;
  positiveMoods: number; // 😊, 😌, 💪, 🔥, ✨
  neutralMoods: number;  // 😴, 😑
  negativeMoods: number; // 😔, 😮‍💨
  mostCommonMood: string;
}

interface HabitInsight {
  suggestion: string;
  type: 'time-change' | 'drop-habit' | 'keep-going' | 'time-optimization';
  priority: 'high' | 'medium' | 'low';
}

export const useMoodAnalysis = (habitId: number) => {
  const analyzeMood = useCallback(async (): Promise<MoodStats> => {
    const entries = await db.entries
      .where('habitId')
      .equals(habitId)
      .and(e => e.completed === true && !!e.mood)
      .toArray();

    const positiveEmojis = ['😊', '😌', '💪', '🔥', '✨'];
    const negativeEmojis = ['😔', '😮‍💨'];
    const neutralEmojis = ['😴', '😑'];

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const moodCounts: Record<string, number> = {};

    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        if (positiveEmojis.includes(entry.mood)) positive++;
        else if (negativeEmojis.includes(entry.mood)) negative++;
        else if (neutralEmojis.includes(entry.mood)) neutral++;
      }
    });

    const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '😊';

    return {
      totalEntries: entries.length,
      positiveMoods: positive,
      neutralMoods: neutral,
      negativeMoods: negative,
      mostCommonMood: mostCommon,
    };
  }, [habitId]);

  const getInsights = useCallback(async (): Promise<HabitInsight[]> => {
    const stats = await analyzeMood();
    const insights: HabitInsight[] = [];

    // Need at least 7 entries for meaningful analysis
    if (stats.totalEntries < 7) return insights;

    const negativeRate = (stats.negativeMoods / stats.totalEntries) * 100;
    const positiveRate = (stats.positiveMoods / stats.totalEntries) * 100;

    // High priority: Habit is consistently demotivating (60%+ negative)
    if (negativeRate >= 60 && stats.totalEntries >= 14) {
      insights.push({
        suggestion: `Your mood is ${stats.negativeMoods}% negative when completing this habit. Consider dropping it or taking a break.`,
        type: 'drop-habit',
        priority: 'high',
      });
    }
    // Medium priority: Habit is somewhat challenging (40-59% negative)
    else if (negativeRate >= 40 && negativeRate < 60) {
      insights.push({
        suggestion: `You've been feeling ${stats.negativeMoods}% negative. Try doing this at a different time of day or break it into smaller steps.`,
        type: 'time-change',
        priority: 'medium',
      });
    }
    // Positive: Keep going!
    else if (positiveRate >= 70) {
      insights.push({
        suggestion: `Great job! You're feeling positive ${stats.positiveMoods}% of the time. Keep going!`,
        type: 'keep-going',
        priority: 'low',
      });
    }

    // Time optimization suggestion
    if (stats.totalEntries >= 14 && positiveRate >= 50) {
      insights.push({
        suggestion: 'Track your completion times and do this habit when you feel most energized.',
        type: 'time-optimization',
        priority: 'low',
      });
    }

    return insights;
  }, [analyzeMood]);

  return { analyzeMood, getInsights };
};
