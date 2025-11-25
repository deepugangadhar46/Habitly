// src/lib/database.ts
import Dexie, { Table } from 'dexie';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

/**
 * Unified Habit Tracker DB (version 3)
 * - Single Dexie instance: "HabitTrackerDB"
 * - All features merged: habits, entries, goals, achievements, challenges,
 *   notifications, motivational quotes, streaks, points, helper functions.
 *
 * Important:
 * - Goals remain single-habit (goal.habitId: number) as requested.
 * - Goal progress is derived from db.entries (single source of truth).
 * - Global achievements use habitId === 0 to ensure indexed column is always numeric.
 */

///////////////////////
// Interfaces / Types
///////////////////////

export interface Habit {
  id?: number;
  name: string;
  description?: string;
  color: string;
  emoji: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  isActive: boolean;
  notes?: string;
  reminderTime?: string; // "09:00"
  reminderDays?: number[]; // 0-6 Sunday-Saturday
  reminderEnabled?: boolean;
  targetFrequency?: number; // times per week
}

export interface HabitEntry {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
  mood?: string;
  notes?: string;
  completedAt?: Date;
  points?: number;
}

export interface MotivationalQuote {
  id?: number;
  habitId?: number;
  quote: string;
  mood?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  createdAt: Date;
}

export interface Achievement {
  id?: number;
  name: string;
  description: string;
  icon: string;
  type: 'streak' | 'completion' | 'consistency' | 'milestone';
  requirement: number;
  unlockedAt?: Date;
  habitId?: number; // use 0 for global achievements
}

export interface Challenge {
  id?: number;
  name: string;
  description: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  targetDays: number;
  habitIds: number[]; // empty = applies to all
  isActive: boolean;
  participants?: number;
  isJoined?: boolean;
  completedDates?: string[]; // YYYY-MM-DD unique dates counted toward progress
}

export interface Goal {
  id?: number;
  habitId: number; // single habit per goal (current design)
  type: 'weekly' | 'monthly';
  target: number;
  period: string; // weekly -> 'yyyy-MM-dd' (week start); monthly -> 'yyyy-MM'
  achieved: boolean;
  createdAt: Date;
}

export interface NotificationSettings {
  id?: number;
  habitId: number;
  enabled: boolean;
  time: string; // HH:MM
  message: string;
  days: number[]; // 0-6
}

///////////////////////
// Dexie DB
///////////////////////

class HabitTrackerDB extends Dexie {
  habits!: Table<Habit, number>;
  entries!: Table<HabitEntry, number>;
  quotes!: Table<MotivationalQuote, number>;
  achievements!: Table<Achievement, number>;
  challenges!: Table<Challenge, number>;
  goals!: Table<Goal, number>;
  notifications!: Table<NotificationSettings, number>;

  constructor() {
    super('HabitTrackerDB');
    // Version 3 as decided
    this.version(3).stores({
      // Keep schema compact. Add a compound index for habitId+date to speed queries and to allow .where('[habitId+date]').equals([id, date])
      habits: '++id, name, createdAt, isActive, category, difficulty',
      entries: '++id, habitId, date, completed, completedAt, points, [habitId+date]',
      quotes: '++id, habitId, mood, timeOfDay, createdAt',
      achievements: '++id, type, habitId, unlockedAt',
      challenges: '++id, startDate, endDate, isActive',
      goals: '++id, habitId, type, period, achieved, createdAt',
      notifications: '++id, habitId, enabled'
    });
  }
}

export const db = new HabitTrackerDB();

///////////////////////
// Initialization helpers
///////////////////////

/**
 * Initialize default achievements (global achievements will have habitId === 0)
 * Call this once during app startup (e.g., in a wrapper or when app loads).
 */
export const initializeAchievements = async () => {
  try {
    const count = await db.achievements.count();
    if (count > 0) return;

    const defaults: Achievement[] = [
      { name: 'First Step', description: 'Complete your first habit', icon: '🌱', type: 'streak', requirement: 1, habitId: 0 },
      { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', type: 'streak', requirement: 7, habitId: 0 },
      { name: 'Month Master', description: 'Maintain a 30-day streak', icon: '💎', type: 'streak', requirement: 30, habitId: 0 },
      { name: 'Perfectionist', description: 'Achieve 100% completion rate', icon: '⭐', type: 'completion', requirement: 100, habitId: 0 },
      { name: 'Consistent Creator', description: 'Achieve 80% completion rate', icon: '🎯', type: 'completion', requirement: 80, habitId: 0 }
    ];

    await db.achievements.bulkAdd(defaults);
  } catch (err) {
    if (import.meta.env.DEV) console.error('initializeAchievements error:', err);
  }
};

///////////////////////
// Streaks / Stats
///////////////////////

/**
 * Returns active habits with streaks and completion rates.
 * Uses entries as single source of truth.
 */
export const getHabitsWithStreaks = async () => {
  const allHabits = await db.habits.toArray();
  const habits = allHabits.filter(h => h.isActive);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const enhanced = await Promise.all(
    habits.map(async habit => {
      // Get all completed entries for the habit (we'll use them to compute streak)
      const allEntries = await db.entries
        .where('habitId')
        .equals(habit.id!)
        .sortBy('date'); // oldest -> newest

      // Map entries by date for quick lookup
      const completedSet = new Set(allEntries.filter(e => e.completed).map(e => e.date));

      // Compute current streak (consecutive days up to yesterday or today if completed)
      let currentStreak = 0;
      let dateCursor = new Date(); // start from today
      for (let i = 0; i < 365; i++) {
        const dStr = format(dateCursor, 'yyyy-MM-dd');
        if (completedSet.has(dStr)) {
          currentStreak++;
        } else if (dStr === todayStr) {
          // If today isn't completed yet, we don't break the streak here (preserve yesterday's streak).
          // This mirrors your previous behavior.
        } else {
          break;
        }
        dateCursor.setDate(dateCursor.getDate() - 1);
      }

      const totalEntries = allEntries.length;
      const completedEntries = allEntries.filter(e => e.completed).length;
      const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

      return {
        ...habit,
        currentStreak,
        totalEntries,
        completedEntries,
        completionRate
      };
    })
  );

  return enhanced;
};

///////////////////////
// Helper: get today's entry via compound index
///////////////////////

export const getEntryByDate = async (habitId: number, dateStr: string) => {
  // Use compound index [habitId+date]
  return await db.entries.where('[habitId+date]').equals([habitId, dateStr]).first();
};

export const getTodayEntry = async (habitId: number) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return getEntryByDate(habitId, today);
};

///////////////////////
// Points calculation
///////////////////////

export const calculatePoints = (difficulty: 'easy' | 'medium' | 'hard' | undefined, streak: number) => {
  const basePoints = { easy: 1, medium: 2, hard: 3 };
  const diff = difficulty || 'easy';
  const streakMultiplier = Math.min(1 + streak * 0.1, 3);
  return Math.round(basePoints[diff] * streakMultiplier);
};

///////////////////////
// Achievement logic
///////////////////////

/**
 * Check achievements for a habit.
 * - habitId: number
 * - streak: current streak length for that habit
 * - completionRate: integer percentage 0-100 (for the habit)
 *
 * Global achievements should have habitId === 0.
 */
export const checkAchievements = async (habitId: number, streak: number, completionRate: number) => {
  try {
    const all = await db.achievements.toArray();

    const habitAchievements = all.filter(a => a.habitId === habitId);
    const globalAchievements = all.filter(a => a.habitId === 0);

    const unlocked: Achievement[] = [];

    for (const a of [...habitAchievements, ...globalAchievements]) {
      if (a.unlockedAt) continue;

      if (a.type === 'streak' && streak >= a.requirement) {
        await db.achievements.update(a.id!, { unlockedAt: new Date() });
        unlocked.push({ ...a, unlockedAt: new Date() });
      } else if (a.type === 'completion' && completionRate >= a.requirement) {
        await db.achievements.update(a.id!, { unlockedAt: new Date() });
        unlocked.push({ ...a, unlockedAt: new Date() });
      }
    }

    return unlocked;
  } catch (err) {
    if (import.meta.env.DEV) console.error('checkAchievements error:', err);
    return [];
  }
};

///////////////////////
// Challenges progress update
///////////////////////

/**
 * Update challenge progress when a habit is toggled for a date.
 * dateStr: YYYY-MM-DD
 */
export const updateChallengesProgressForHabit = async (habitId: number, completed: boolean, dateStr: string) => {
  try {
    const now = new Date();
    const activeJoined = await db.challenges
      .filter(c => (c.isJoined === true) && c.isActive && c.startDate <= now && c.endDate >= now)
      .toArray();

    if (!activeJoined.length) return;

    for (const challenge of activeJoined) {
      const applies = !challenge.habitIds || challenge.habitIds.length === 0 || challenge.habitIds.includes(habitId);
      if (!applies) continue;

      const dates = Array.isArray(challenge.completedDates) ? [...challenge.completedDates] : [];
      const idx = dates.indexOf(dateStr);

      if (completed) {
        if (idx === -1) dates.push(dateStr);
      } else {
        if (idx !== -1) dates.splice(idx, 1);
      }

      await db.challenges.update(challenge.id!, { completedDates: dates });
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('updateChallengesProgressForHabit error:', err);
  }
};

///////////////////////
// Goals: update logic (derived from entries)
// - Keeps goals record minimal: only achieved flag is stored
// - Progress (count) is computed from entries when needed
///////////////////////

/**
 * Recalculate goals for a habit for the provided dateStr (YYYY-MM-DD).
 * This will:
 * - Count unique completed dates for the goal period (week or month).
 * - Set achieved: boolean on the goal if completedDays >= target.
 *
 * Reason: keep Goal records minimal; progress computed from entries (single source).
 */
export const updateGoalsForHabit = async (habitId: number, completed: boolean, dateStr: string) => {
  try {
    const date = parseISO(dateStr);

    const goals = await db.goals.where('habitId').equals(habitId).toArray();
    if (!goals || goals.length === 0) return;

    for (const goal of goals) {
      let periodStart: Date;
      let periodEnd: Date;

      if (goal.type === 'weekly') {
        periodStart = startOfWeek(date, { weekStartsOn: 1 });
        periodEnd = endOfWeek(date, { weekStartsOn: 1 });
      } else {
        periodStart = startOfMonth(date);
        periodEnd = endOfMonth(date);
      }

      // Fetch all completed entries for habit during period
      const entriesInPeriod = await db.entries
        .where('habitId').equals(habitId)
        .and((e: HabitEntry) => {
          try {
            const d = parseISO(e.date);
            return d >= periodStart && d <= periodEnd && e.completed === true;
          } catch {
            return false;
          }
        })
        .toArray();

      const uniqueDates = new Set(entriesInPeriod.map(e => e.date));
      const completedDays = uniqueDates.size;
      const achieved = completedDays >= goal.target;

      await db.goals.update(goal.id!, { achieved });
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('updateGoalsForHabit error:', err);
  }
};

///////////////////////
// Notifications
///////////////////////

export const scheduleNotification = async (habitId: number, time: string, message: string) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Scheduling requires a server or service worker logic for precise scheduling.
      // We'll log for DEV and leave actual scheduling to your service worker integration.
      if (import.meta.env.DEV) {
        console.log(`Notification scheduled for ${habitId} at ${time}: ${message}`);
      }
    }
  }
};

///////////////////////
// Toggle habit completion (single place to update entries -> goals -> challenges -> achievements)
// - date used is today's date in 'yyyy-MM-dd' unless overridden
///////////////////////

/**
 * Toggle completion for today for a habit.
 * - If entry exists -> flips completed
 * - If not -> adds completed entry for today
 * After entry change:
 * - updateGoalsForHabit(...)
 * - updateChallengesProgressForHabit(...)
 * - recompute streak/completion rate and checkAchievements(...)
 */
export const toggleHabitCompletion = async (habitId: number, mood?: string, dateOverride?: string) => {
  const dateStr = dateOverride || format(new Date(), 'yyyy-MM-dd');

  try {
    const existing = await getEntryByDate(habitId, dateStr);

    if (existing) {
      const newCompleted = !existing.completed;
      await db.entries.update(existing.id!, {
        completed: newCompleted,
        mood: mood ?? existing.mood,
        completedAt: newCompleted ? new Date() : undefined
      });

      // Update downstream systems
      await updateGoalsForHabit(habitId, newCompleted, dateStr);
      await updateChallengesProgressForHabit(habitId, newCompleted, dateStr);
    } else {
      // Compute streak to calculate potential points (we'll update points later if needed)
      const now = new Date();
      await db.entries.add({
        habitId,
        date: dateStr,
        completed: true,
        mood,
        completedAt: now
      });

      await updateGoalsForHabit(habitId, true, dateStr);
      await updateChallengesProgressForHabit(habitId, true, dateStr);
    }

    // Recompute streak and completion rate for achievements check
    try {
      const habits = await getHabitsWithStreaks();
      const h = habits.find(x => x.id === habitId);
      if (h) {
        await checkAchievements(habitId, h.currentStreak, h.completionRate);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Post-toggle achievement check failed:', err);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('toggleHabitCompletion error:', err);
  }
};

///////////////////////
// Utility: create goal helper
///////////////////////

/**
 * Create a goal for a habit. period is computed from the current date if not provided.
 * - For weekly goals the period is the week-start date 'yyyy-MM-dd'
 * - For monthly goals the period is 'yyyy-MM'
 */
export const createGoal = async (habitId: number, type: 'weekly' | 'monthly', target: number, periodOverride?: string) => {
  try {
    const now = new Date();
    let period = periodOverride || '';

    if (!periodOverride) {
      if (type === 'weekly') {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        period = format(weekStart, 'yyyy-MM-dd');
      } else {
        period = format(startOfMonth(now), 'yyyy-MM');
      }
    }

    await db.goals.add({
      habitId,
      type,
      target,
      period,
      achieved: false,
      createdAt: new Date()
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error('createGoal error:', err);
    throw err;
  }
};

///////////////////////
// Utility: delete goal
///////////////////////

export const deleteGoal = async (goalId: number) => {
  try {
    await db.goals.delete(goalId);
  } catch (err) {
    if (import.meta.env.DEV) console.error('deleteGoal error:', err);
    throw err;
  }
};

///////////////////////
// Utility: get progress for UI (derived from entries)
// - Returns { completedDays, target, progressPercent, achieved }
///////////////////////

export const getGoalProgress = async (goal: Goal) => {
  try {
    // Determine period boundaries from goal.period or from today's date if malformed
    let periodStart: Date;
    let periodEnd: Date;
    const now = new Date();

    if (goal.type === 'weekly') {
      // goal.period expected to be 'yyyy-MM-dd' representing week start
      try {
        periodStart = parseISO(goal.period);
      } catch {
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
      }
      periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
    } else {
      // monthly: 'yyyy-MM'
      const parts = goal.period.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        periodStart = new Date(year, month - 1, 1);
        periodEnd = new Date(year, month, 0);
      } else {
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
      }
    }

    const entriesInPeriod = await db.entries
      .where('habitId').equals(goal.habitId)
      .and((e: HabitEntry) => {
        try {
          const d = parseISO(e.date);
          return d >= periodStart && d <= periodEnd && e.completed === true;
        } catch {
          return false;
        }
      })
      .toArray();

    const unique = new Set(entriesInPeriod.map(e => e.date));
    const completedDays = unique.size;
    const target = goal.target;
    const progressPercent = target === 0 ? 0 : Math.round((completedDays / target) * 100);
    const achieved = completedDays >= target;

    return { completedDays, target, progressPercent, achieved };
  } catch (err) {
    if (import.meta.env.DEV) console.error('getGoalProgress error:', err);
    return { completedDays: 0, target: goal.target, progressPercent: 0, achieved: false };
  }
};

///////////////////////
// Misc helpers: quotes, challenges CRUD, notifications CRUD
///////////////////////

export const addMotivationalQuote = async (q: MotivationalQuote) => {
  try {
    await db.quotes.add({ ...q, createdAt: q.createdAt || new Date() });
  } catch (err) {
    if (import.meta.env.DEV) console.error('addMotivationalQuote error:', err);
  }
};

export const addChallenge = async (c: Challenge) => {
  try {
    await db.challenges.add(c);
  } catch (err) {
    if (import.meta.env.DEV) console.error('addChallenge error:', err);
  }
};

export const updateChallenge = async (id: number, patch: Partial<Challenge>) => {
  try {
    await db.challenges.update(id, patch);
  } catch (err) {
    if (import.meta.env.DEV) console.error('updateChallenge error:', err);
  }
};

export const addNotificationSetting = async (n: NotificationSettings) => {
  try {
    await db.notifications.add(n);
  } catch (err) {
    if (import.meta.env.DEV) console.error('addNotificationSetting error:', err);
  }
};

export const updateNotificationSetting = async (id: number, patch: Partial<NotificationSettings>) => {
  try {
    await db.notifications.update(id, patch);
  } catch (err) {
    if (import.meta.env.DEV) console.error('updateNotificationSetting error:', err);
  }
};

///////////////////////
// DB maintenance helpers
///////////////////////

/**
 * Reset DB - use with caution.
 * This will clear ALL tables.
 */
export const resetAllData = async () => {
  try {
    await db.transaction('rw', [db.habits, db.entries, db.goals, db.achievements, db.challenges, db.quotes, db.notifications], async () => {
      await Promise.all([
        db.habits.clear(),
        db.entries.clear(),
        db.goals.clear(),
        db.achievements.clear(),
        db.challenges.clear(),
        db.quotes.clear(),
        db.notifications.clear()
      ]);
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error('resetAllData error:', err);
    throw err;
  }
};

///////////////////////
// Bootstrapping: recommended to call this once on app start
///////////////////////

export const bootstrapDatabase = async () => {
  try {
    await initializeAchievements();
    // (Optional) any future init tasks like seed challenges, quotes, etc.
  } catch (err) {
    if (import.meta.env.DEV) console.error('bootstrapDatabase error:', err);
  }
};

export default db;
