import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, Goal } from '@/lib/database';
import { startOfWeek, endOfWeek, format as fmt, isWithinInterval } from 'date-fns';

export type GoalWithCurrent = Goal & { current: number };

export const useGoals = () => {
  const [goals, setGoals] = useState<GoalWithCurrent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await db.goals.toArray();
    const now = new Date();
    const wStart = startOfWeek(now, { weekStartsOn: 1 });
    const wEnd = endOfWeek(now, { weekStartsOn: 1 });
    const entries = await db.entries.toArray();

    const withCurrent: GoalWithCurrent[] = all.map(g => {
      const count = entries.filter(e => e.habitId === g.habitId && e.completed && isWithinInterval(new Date(e.date + 'T00:00:00'), { start: wStart, end: wEnd })).length;
      return { ...g, current: count };
    });
    setGoals(withCurrent);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upsertGoal = useCallback(async (habitId: number, target: number) => {
    const now = new Date();
    const weekStartStr = fmt(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const existing = await db.goals.where('habitId').equals(habitId).and(g => g.period === weekStartStr && g.type === 'weekly').first();
    if (existing) {
      await db.goals.update(existing.id!, { target });
    } else {
      const g: Goal = {
        habitId,
        type: 'weekly',
        target,
        period: weekStartStr,
        achieved: false,
        createdAt: new Date(),
      };
      await db.goals.add(g);
    }
    await refresh();
  }, [refresh]);

  const weeklyGoals = useMemo(() => goals.filter(g => g.type === 'weekly'), [goals]);

  return { loading, goals: weeklyGoals, upsertGoal, refresh };
};
