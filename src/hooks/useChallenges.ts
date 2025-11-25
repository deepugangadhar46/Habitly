import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, Challenge } from '@/lib/database';

export type ChallengeWithProgress = Challenge & {
  progressPercent: number;
  completedDays: number;
};

const inRange = (dateStr: string, start: Date, end: Date) => {
  const dt = new Date(dateStr + 'T00:00:00');
  return dt >= start && dt <= end;
};

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const computeProgress = useCallback((c: Challenge): ChallengeWithProgress => {
    const dates = Array.isArray(c.completedDates) ? c.completedDates : [];
    const filtered = dates.filter(d => inRange(d, c.startDate, c.endDate));
    const uniqueCount = new Set(filtered).size;
    const pct = Math.min(100, Math.max(0, Math.round((uniqueCount / Math.max(1, c.targetDays)) * 100)));
    return { ...c, progressPercent: pct, completedDays: uniqueCount };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await db.challenges.toArray();
    setChallenges(all.map(computeProgress));
    setLoading(false);
  }, [computeProgress]);

  useEffect(() => { refresh(); }, [refresh]);

  const enrollChallenge = useCallback(async (challengeId: number) => {
    const c = await db.challenges.get(challengeId);
    if (!c) return;
    const updates: Partial<Challenge> = { isJoined: true };
    if (!c.isJoined) updates.participants = (c.participants || 0) + 1;
    await db.challenges.update(challengeId, updates);
    await refresh();
  }, [refresh]);

  const leaveChallenge = useCallback(async (challengeId: number) => {
    await db.challenges.update(challengeId, { isJoined: false });
    await refresh();
  }, [refresh]);

  const insertChallenge = useCallback(async (partial: Pick<Challenge, 'name'|'description'|'emoji'|'targetDays'> & { habitIds?: number[] }) => {
    const start = new Date();
    const end = new Date(start.getTime() + partial.targetDays * 24 * 60 * 60 * 1000);
    const c: Challenge = {
      name: partial.name,
      description: partial.description,
      emoji: partial.emoji,
      startDate: start,
      endDate: end,
      targetDays: partial.targetDays,
      habitIds: partial.habitIds || [],
      isActive: true,
      participants: 1,
      isJoined: true,
      completedDates: [],
    };
    await db.challenges.add(c);
    await refresh();
  }, [refresh]);

  const active = useMemo(() => challenges.filter(c => c.isActive && c.endDate > new Date()), [challenges]);
  const completed = useMemo(() => challenges.filter(c => !c.isActive || c.endDate <= new Date()), [challenges]);

  return {
    loading,
    challenges,
    activeChallenges: active,
    completedChallenges: completed,
    refresh,
    enrollChallenge,
    leaveChallenge,
    insertChallenge,
  };
};
