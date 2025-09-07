// Enhanced notification system for Habitly PWA

export interface NotificationConfig {
  habitId: number;
  habitName: string;
  time: string; // HH:MM format
  message: string;
  enabled: boolean;
  days: number[]; // 0-6 (Sunday-Saturday)
}

class NotificationManager {
  private registrations: Map<string, number> = new Map();

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async scheduleHabitReminder(config: NotificationConfig): Promise<boolean> {
    if (!config.enabled) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Calculate next notification time
      const now = new Date();
      const [hours, minutes] = config.time.split(':').map(Number);
      
      for (const dayOfWeek of config.days) {
        const notificationTime = new Date();
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for next occurrence
        if (notificationTime <= now) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        // Adjust to correct day of week
        while (notificationTime.getDay() !== dayOfWeek) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }

        const delay = notificationTime.getTime() - now.getTime();
        const notificationId = `habit-${config.habitId}-${dayOfWeek}`;
        
        // Schedule notification
        setTimeout(() => {
          this.showNotification(config.habitName, config.message, config.habitId);
        }, delay);

        this.registrations.set(notificationId, Date.now());
      }

      return true;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  }

  async showNotification(title: string, body: string, habitId?: number): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: habitId ? `habit-${habitId}` : 'general',
        requireInteraction: true,
        data: {
          habitId,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  cancelHabitReminders(habitId: number): void {
    // Remove scheduled notifications for this habit
    for (const [key] of this.registrations) {
      if (key.includes(`habit-${habitId}`)) {
        this.registrations.delete(key);
      }
    }
  }

  async showAchievementNotification(achievementName: string, description: string): Promise<void> {
    await this.showNotification(
      `🏆 Achievement Unlocked!`,
      `${achievementName}: ${description}`
    );
  }

  async showStreakNotification(habitName: string, streakDays: number): Promise<void> {
    const messages = [
      `🔥 ${streakDays} day streak with ${habitName}! You're on fire!`,
      `💪 ${streakDays} days strong! Keep up the amazing work!`,
      `⭐ ${streakDays} day streak achieved! You're unstoppable!`
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    await this.showNotification(`Streak Milestone!`, message);
  }

  async showWeeklyReport(completionRate: number, totalHabits: number): Promise<void> {
    const message = `This week: ${completionRate}% completion rate across ${totalHabits} habits. Keep building those positive routines! 💪`;
    await this.showNotification(`📊 Weekly Progress Report`, message);
  }
}

export const notificationManager = new NotificationManager();

// Default notification messages
export const defaultNotificationMessages = {
  morning: [
    "Good morning! Time to start your day right! ☀️",
    "Rise and shine! Your habits are waiting! ✨",
    "Morning motivation incoming! Let's do this! 💪"
  ],
  afternoon: [
    "Afternoon check-in! How are your habits going? 🌟",
    "Halfway through the day - keep the momentum! ⚡",
    "Time for your afternoon habit boost! 🚀"
  ],
  evening: [
    "Evening reflection time! Complete your habits! 🌙",
    "End your day strong! Finish those habits! ⭐",
    "Before bed habits - the perfect way to wind down! 😴"
  ]
};

export const getTimeBasedMessage = (time: string): string => {
  const hour = parseInt(time.split(':')[0]);
  
  if (hour < 12) {
    return defaultNotificationMessages.morning[Math.floor(Math.random() * defaultNotificationMessages.morning.length)];
  } else if (hour < 17) {
    return defaultNotificationMessages.afternoon[Math.floor(Math.random() * defaultNotificationMessages.afternoon.length)];
  } else {
    return defaultNotificationMessages.evening[Math.floor(Math.random() * defaultNotificationMessages.evening.length)];
  }
};
