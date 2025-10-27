import Dexie, { Table } from 'dexie';

// Enhanced interfaces for new features
export interface Habit {
  id?: number;
  name: string;
  description?: string;
  color: string;
  emoji: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  isActive: boolean;
  targetFrequency?: number; // times per week
  reminderTime?: string; // HH:MM format
  notes?: string;
}

export interface HabitEntry {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  mood?: string; // emoji
  notes?: string;
  completedAt?: Date;
  points?: number;
}

export interface Achievement {
  id?: number;
  name: string;
  description: string;
  icon: string;
  type: 'streak' | 'completion' | 'consistency' | 'milestone';
  requirement: number;
  unlockedAt?: Date;
  habitId?: number; // specific to habit or global
}

export interface Challenge {
  id?: number;
  name: string;
  description: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  targetDays: number;
  habitIds: number[];
  isActive: boolean;
  participants?: number;
  // Optional, not indexed: user-specific state stored in the same record (single-user app)
  isJoined?: boolean;
  completedDates?: string[]; // YYYY-MM-DD unique dates counted toward progress
}

export interface Goal {
  id?: number;
  habitId: number;
  type: 'weekly' | 'monthly';
  target: number;
  period: string; // YYYY-WW or YYYY-MM
  achieved: boolean;
  createdAt: Date;
}

export interface NotificationSettings {
  id?: number;
  habitId: number;
  enabled: boolean;
  time: string; // HH:MM
  message: string;
  days: number[]; // 0-6 (Sunday-Saturday)
}

export class EnhancedHabitDatabase extends Dexie {
  habits!: Table<Habit>;
  entries!: Table<HabitEntry>;
  achievements!: Table<Achievement>;
  challenges!: Table<Challenge>;
  goals!: Table<Goal>;
  notifications!: Table<NotificationSettings>;

  constructor() {
    super('HabitTrackerDB');
    this.version(2).stores({
      habits: '++id, name, category, difficulty, createdAt, isActive',
      entries: '++id, habitId, date, completed, completedAt, points',
      achievements: '++id, type, habitId, unlockedAt',
      challenges: '++id, startDate, endDate, isActive',
      goals: '++id, habitId, type, period, achieved',
      notifications: '++id, habitId, enabled'
    });
  }
}

export const enhancedDb = new EnhancedHabitDatabase();

// Achievement checking functions
export const checkAchievements = async (habitId: number, streak: number, completionRate: number) => {
  const achievements = await enhancedDb.achievements.where({ habitId }).toArray();
  const globalAchievements = await enhancedDb.achievements.where('habitId').equals(undefined).toArray();
  
  const newAchievements = [];
  
  // Check streak achievements
  for (const achievement of [...achievements, ...globalAchievements]) {
    if (achievement.type === 'streak' && streak >= achievement.requirement && !achievement.unlockedAt) {
      await enhancedDb.achievements.update(achievement.id!, { unlockedAt: new Date() });
      newAchievements.push(achievement);
    }
    
    if (achievement.type === 'completion' && completionRate >= achievement.requirement && !achievement.unlockedAt) {
      await enhancedDb.achievements.update(achievement.id!, { unlockedAt: new Date() });
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
};

// Initialize default achievements
export const initializeAchievements = async () => {
  const existingCount = await enhancedDb.achievements.count();
  if (existingCount > 0) return;

  const defaultAchievements: Achievement[] = [
    {
      name: "First Step",
      description: "Complete your first habit",
      icon: "🌱",
      type: "streak",
      requirement: 1
    },
    {
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      type: "streak",
      requirement: 7
    },
    {
      name: "Month Master",
      description: "Maintain a 30-day streak",
      icon: "💎",
      type: "streak",
      requirement: 30
    },
    {
      name: "Perfectionist",
      description: "Achieve 100% completion rate",
      icon: "⭐",
      type: "completion",
      requirement: 100
    },
    {
      name: "Consistent Creator",
      description: "Achieve 80% completion rate",
      icon: "🎯",
      type: "completion",
      requirement: 80
    }
  ];

  await enhancedDb.achievements.bulkAdd(defaultAchievements);
};

// Notification functions
export const scheduleNotification = async (habitId: number, time: string, message: string) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Schedule notification logic would go here
      if (import.meta.env.DEV) {
        console.log(`Notification scheduled for habit ${habitId} at ${time}: ${message}`);
      }
    }
  }
};

// Points calculation
export const calculatePoints = (difficulty: string, streak: number): number => {
  const basePoints = {
    easy: 1,
    medium: 2,
    hard: 3
  };
  
  const streakMultiplier = Math.min(1 + (streak * 0.1), 3); // Max 3x multiplier
  return Math.round(basePoints[difficulty as keyof typeof basePoints] * streakMultiplier);
};

// Update challenge progress for a given habit completion toggle
// dateStr must be in YYYY-MM-DD format
export const updateChallengesProgressForHabit = async (
  habitId: number,
  completed: boolean,
  dateStr: string
) => {
  try {
    const now = new Date();
    const activeJoined = await enhancedDb.challenges
      .filter(c => (c.isJoined === true) && c.isActive && c.startDate <= now && c.endDate >= now)
      .toArray();

    if (activeJoined.length === 0) return;

    for (const challenge of activeJoined) {
      const appliesToHabit = !challenge.habitIds || challenge.habitIds.length === 0 || challenge.habitIds.includes(habitId);
      if (!appliesToHabit) continue;

      const dates = Array.isArray(challenge.completedDates) ? [...challenge.completedDates] : [];

      const idx = dates.indexOf(dateStr);
      if (completed) {
        if (idx === -1) {
          dates.push(dateStr);
        }
      } else {
        if (idx !== -1) {
          dates.splice(idx, 1);
        }
      }

      await enhancedDb.challenges.update(challenge.id!, {
        completedDates: dates
      });
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('Error updating challenge progress:', err);
    }
  }
};
