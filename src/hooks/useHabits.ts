import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, Habit, HabitEntry, getHabitsWithStreaks, toggleHabitCompletion } from '@/lib/database';

export type HabitWithStats = Habit & {
  currentStreak: number;
  totalEntries: number;
  completedEntries: number;
  completionRate: number;
};

const toISODate = (d: Date) => d.toISOString().split('T')[0];

export const useHabits = () => {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [todayEntries, setTodayEntries] = useState<Record<number, HabitEntry | undefined>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await getHabitsWithStreaks();
    setHabits(list);
    const today = toISODate(new Date());
    const entries = await db.entries.where('date').equals(today).toArray();
    const map: Record<number, HabitEntry | undefined> = {};
    for (const e of entries) map[e.habitId] = e;
    setTodayEntries(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insertHabit = useCallback(async (partial: Pick<Habit, 'name' | 'emoji' | 'difficulty'> & { category?: string }) => {
    const h: Habit = {
      name: partial.name,
      emoji: partial.emoji,
      difficulty: partial.difficulty,
      category: partial.category,
      color: '#8884d8',
      createdAt: new Date(),
      isActive: true,
    };
    await db.habits.add(h);
    await refresh();
  }, [refresh]);

  const duplicateHabit = useCallback(async (habitId: number) => {
    const h = await db.habits.get(habitId);
    if (!h) return;
    await db.habits.add({
      ...h,
      id: undefined,
      name: `${h.name} (copy)`,
      createdAt: new Date(),
      isActive: true,
    });
    await refresh();
  }, [refresh]);

  const archiveHabit = useCallback(async (habitId: number) => {
    await db.habits.update(habitId, { isActive: false });
    await refresh();
  }, [refresh]);

  const completeHabit = useCallback(async (habitId: number, mood?: string) => {
    await toggleHabitCompletion(habitId, mood);
    await refresh();
    if (navigator.vibrate) navigator.vibrate(10);
  }, [refresh]);

  const updateCompletionMood = useCallback(async (habitId: number, date: string, mood: string) => {
    const entry = await db.entries.where({ habitId, date }).first();
    if (!entry) return;
    await db.entries.update(entry.id!, { mood });
    await refresh();
  }, [refresh]);

  const activeHabits = useMemo(() => habits.filter(h => h.isActive), [habits]);

  return {
    loading,
    habits: activeHabits,
    todayEntries,
    refresh,
    insertHabit,
    duplicateHabit,
    archiveHabit,
    completeHabit,
    updateCompletionMood,
  };
};
