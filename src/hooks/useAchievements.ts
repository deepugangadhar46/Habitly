import { useCallback, useEffect, useMemo, useState } from 'react';
import { enhancedDb, Achievement } from '@/lib/database-enhanced';
import { db, getHabitsWithStreaks } from '@/lib/database';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const toISO = (d: Date) => d.toISOString().split('T')[0];

export interface AchievementStat {
  total: number;
  unlocked: number;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await enhancedDb.achievements.toArray();
    setAchievements(list);
    setLoading(false);
  }, []);

  // Evaluate rules and unlock in DB when met
  const evaluateAndUnlock = useCallback(async () => {
    const [habitsWithStats, entries] = await Promise.all([
      getHabitsWithStreaks(),
      db.entries.toArray(),
    ]);

    const now = new Date();
    const wStart = startOfWeek(now, { weekStartsOn: 1 });
    const wEnd = endOfWeek(now, { weekStartsOn: 1 });
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);

    const entriesThisWeek = entries.filter(e => {
      const dt = new Date(e.date + 'T00:00:00');
      return isWithinInterval(dt, { start: wStart, end: wEnd });
    });
    const entriesThisMonth = entries.filter(e => {
      const dt = new Date(e.date + 'T00:00:00');
      return isWithinInterval(dt, { start: mStart, end: mEnd });
    });

    const firstStep = entries.length >= 1;
    const maxStreak = habitsWithStats.reduce((m, h) => Math.max(m, h.currentStreak), 0);

    // Weekly completion rates per habit (based on distinct days in current week)
    const daysElapsedThisWeek = Math.min(7, Math.max(1, Math.ceil((now.getDay() || 7))));
    const weeklyRates = new Map<number, number>();
    for (const h of habitsWithStats) {
      const completedDays = new Set(
        entriesThisWeek.filter(e => e.habitId === h.id && e.completed).map(e => e.date)
      ).size;
      weeklyRates.set(h.id!, Math.round((completedDays / daysElapsedThisWeek) * 100));
    }

    // Monthly completion rate (any habit >= 60% of elapsed days this month)
    const daysElapsedThisMonth = Math.max(1, Math.ceil((now.getDate())));
    let hasMonthly60 = false;
    for (const h of habitsWithStats) {
      const completedDays = new Set(
        entriesThisMonth.filter(e => e.habitId === h.id && e.completed).map(e => e.date)
      ).size;
      const rate = Math.round((completedDays / daysElapsedThisMonth) * 100);
      if (rate >= 60) { hasMonthly60 = true; break; }
    }

    const has100Week = Array.from(weeklyRates.values()).some(r => r >= 100);
    const has80Week = Array.from(weeklyRates.values()).some(r => r >= 80);

    // Map by name to update existing default achievements
    const list = await enhancedDb.achievements.toArray();
    const findByName = (name: string) => list.find(a => a.name.toLowerCase() === name.toLowerCase());

    const updates: Array<{ id: number; date: Date }> = [];
    const mark = (a?: Achievement, cond?: boolean) => {
      if (a && !a.unlockedAt && cond) updates.push({ id: a.id!, date: new Date() });
    };

    mark(findByName('First Step'), firstStep);
    mark(findByName('Week Warrior'), maxStreak >= 7);
    mark(findByName('Month Master'), maxStreak >= 30);
    mark(findByName('Perfectionist'), has100Week);
    mark(findByName('Consistent Creator'), has80Week);
    // Optional if present: Consistency King (60% month)
    mark(findByName('Consistency King'), hasMonthly60);

    for (const u of updates) {
      await enhancedDb.achievements.update(u.id, { unlockedAt: u.date });
    }

    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats: AchievementStat = useMemo(() => ({
    total: achievements.length,
    unlocked: achievements.filter(a => !!a.unlockedAt).length,
  }), [achievements]);

  return {
    loading,
    achievements,
    stats,
    refresh,
    evaluateAndUnlock,
  };
};
