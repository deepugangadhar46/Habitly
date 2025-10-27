import { MOOD_QUOTES, GENERAL_QUOTES, STREAK_MILESTONES, type MoodEmoji } from './quotes';

export function getQuoteForMood(mood?: MoodEmoji | null): string {
  if (!mood) {
    return GENERAL_QUOTES[Math.floor(Math.random() * GENERAL_QUOTES.length)];
  }
  
  const pool = MOOD_QUOTES[mood] || MOOD_QUOTES['😐'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getStreakMilestoneQuote(streak: number): string | null {
  // Check exact matches first
  if (STREAK_MILESTONES[streak]) {
    return STREAK_MILESTONES[streak];
  }
  
  // Check if it's a multiple of 10 above 100
  if (streak > 100 && streak % 10 === 0) {
    return `${streak} days! Absolute legend! 🌟`;
  }
  
  return null;
}

export function getRandomGeneralQuote(): string {
  return GENERAL_QUOTES[Math.floor(Math.random() * GENERAL_QUOTES.length)];
}

export function shouldShowEmotionalNudge(mood: MoodEmoji): boolean {
  // Show extra encouragement for negative moods
  return mood === '😔' || mood === '😮‍💨';
}

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning! Let's build great habits today 🌅";
  } else if (hour < 17) {
    return "Good afternoon! Keep that momentum going 💪";
  } else if (hour < 21) {
    return "Good evening! Finish strong today 🌆";
  } else {
    return "Late night habits? Respect the dedication 🌙";
  }
}
