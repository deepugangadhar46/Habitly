import { getQuoteForMood, shouldShowEmotionalNudge } from './quoteEngine';
import type { MoodEmoji } from './quotes';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

export async function scheduleEmotionalNudge(habitName: string, mood: MoodEmoji): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  if (!shouldShowEmotionalNudge(mood)) {
    return;
  }
  
  const quote = getQuoteForMood(mood);
  const body = `${habitName}: ${quote}`;
  
  try {
    new Notification('Habitly 💬', {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `emotional-nudge-${habitName}`,
      requireInteraction: false
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to show notification:', error);
    }
  }
}

export async function showStreakMilestoneNotification(habitName: string, streak: number): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const milestones = [3, 7, 14, 21, 30, 50, 100, 365];
  
  if (!milestones.includes(streak) && (streak <= 100 || streak % 10 !== 0)) {
    return;
  }
  
  const messages: Record<number, string> = {
    3: '3-day streak! The habit loop is forming 🔄',
    7: '1 week strong! Building momentum 🚀',
    14: '2 weeks! Becoming second nature ⚡',
    21: '21 days! Habit officially formed 💎',
    30: '30-day warrior! Top 5% territory 🏆',
    50: '50 days! Habits are your superpower 🦸',
    100: 'CENTURY! Legendary commitment 👑',
    365: '365 DAYS! You are the 1%! 🌟'
  };
  
  const body = messages[streak] || `${streak} days! Absolute legend! 🌟`;
  
  try {
    new Notification(`${habitName} - Milestone Unlocked! 🎉`, {
      body,
      icon: '/icon-512.png',
      badge: '/icon-192.png',
      tag: `milestone-${habitName}-${streak}`,
      requireInteraction: true
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to show milestone notification:', error);
    }
  }
}

export function scheduleHabitReminder(habitName: string, reminderTime: string, callback: () => void): number | null {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const msUntilReminder = scheduledTime.getTime() - now.getTime();
  
  const timerId = window.setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time to build your habit! ⏰', {
        body: `Don't forget: ${habitName}. Tap to log your mood 😊`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `reminder-${habitName}`,
        requireInteraction: false
      });
    }
    callback();
  }, msUntilReminder);
  
  return timerId;
}

export function cancelReminder(timerId: number): void {
  window.clearTimeout(timerId);
}
