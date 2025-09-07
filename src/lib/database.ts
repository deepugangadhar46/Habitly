import Dexie, { Table } from 'dexie';

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
}

export interface HabitEntry {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  mood?: string; // emoji
  notes?: string;
  completedAt?: Date;
}

export interface MotivationalQuote {
  id?: number;
  habitId?: number;
  quote: string;
  mood?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  createdAt: Date;
}

export class HabitDatabase extends Dexie {
  habits!: Table<Habit>;
  entries!: Table<HabitEntry>;
  quotes!: Table<MotivationalQuote>;

  constructor() {
    super('HabitTrackerDB');
    this.version(1).stores({
      habits: '++id, name, createdAt, isActive',
      entries: '++id, habitId, date, completed, completedAt',
      quotes: '++id, habitId, mood, timeOfDay, createdAt'
    });
  }
}

export const db = new HabitDatabase();

// Helper functions
export const getHabitsWithStreaks = async () => {
  const allHabits = await db.habits.toArray();
  const habits = allHabits.filter(habit => habit.isActive);
  const today = new Date().toISOString().split('T')[0];
  
  const habitsWithStreaks = await Promise.all(
    habits.map(async (habit) => {
      const entries = await db.entries
        .where('habitId')
        .equals(habit.id!)
        .and(entry => entry.completed)
        .reverse()
        .sortBy('date');
      
      let currentStreak = 0;
      let date = new Date();
      
      // Calculate current streak
      for (let i = 0; i < 365; i++) {
        const dateStr = date.toISOString().split('T')[0];
        const entry = entries.find(e => e.date === dateStr);
        
        if (entry && entry.completed) {
          currentStreak++;
        } else if (dateStr === today) {
          // Today hasn't been completed yet, but don't break streak
        } else {
          break;
        }
        
        date.setDate(date.getDate() - 1);
      }
      
      const totalEntries = await db.entries.where('habitId').equals(habit.id!).count();
      const completedEntries = await db.entries
        .where('habitId').equals(habit.id!)
        .and(entry => entry.completed)
        .count();
      
      return {
        ...habit,
        currentStreak,
        totalEntries,
        completedEntries,
        completionRate: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0
      };
    })
  );
  
  return habitsWithStreaks;
};

export const getTodayEntry = async (habitId: number) => {
  const today = new Date().toISOString().split('T')[0];
  return await db.entries.where({ habitId, date: today }).first();
};

export const toggleHabitCompletion = async (habitId: number, mood?: string) => {
  const today = new Date().toISOString().split('T')[0];
  const existingEntry = await getTodayEntry(habitId);
  
  if (existingEntry) {
    await db.entries.update(existingEntry.id!, {
      completed: !existingEntry.completed,
      mood: mood || existingEntry.mood,
      completedAt: !existingEntry.completed ? new Date() : undefined
    });
  } else {
    await db.entries.add({
      habitId,
      date: today,
      completed: true,
      mood,
      completedAt: new Date()
    });
  }
};