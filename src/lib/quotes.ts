export type MoodEmoji = '😊' | '😔' | '😐' | '😮‍💨' | '😤' | '🥳';

export const MOOD_QUOTES: Record<MoodEmoji, string[]> = {
  '😊': [
    "You're on fire! Keep the momentum going 🔥",
    "Great mood = great habits. Ride this wave!",
    "Your future self is cheering you on!",
    "Positivity + consistency = unstoppable 💪",
    "This energy is contagious. Keep shining! ✨"
  ],
  '😔': [
    "Rough day? One small step still counts 💪",
    "Clouds pass – habits stay. You've got this.",
    "Low energy ≠ no progress. Micro-win today!",
    "Be gentle with yourself. Progress > perfection.",
    "Tomorrow is a fresh start. Today? Just show up."
  ],
  '😐': [
    "Neutral is normal. Show up anyway ✨",
    "Consistency beats perfection. Tick it off!",
    "Auto-pilot mode: complete → mood → done.",
    "Meh days build character. You're doing great.",
    "Steady wins the race. Keep the streak alive."
  ],
  '😮‍💨': [
    "Exhausted? Try a 2-minute version 🕑",
    "Tired is temporary. Habits are forever.",
    "Rest is productive. Try again tomorrow?",
    "Low battery? Even 1% effort counts today.",
    "Swap time – morning might work better?"
  ],
  '😤': [
    "Channel that frustration into action! 💥",
    "Angry energy = powerful habit fuel 🔥",
    "Use it. Don't lose it. Complete and conquer!",
    "Turn irritation into motivation. You've got this.",
    "Bad mood? Good habits. Balance restored."
  ],
  '🥳': [
    "Celebration mode activated! 🎉",
    "You're crushing it! Keep the party going!",
    "Victory lap! But don't break the streak 😉",
    "Peak performance unlocked. Legendary!",
    "This is what consistency looks like. Iconic! 👑"
  ]
};

export const GENERAL_QUOTES = [
  "Small steps, big dreams 🌟",
  "Your only competition is yesterday's you",
  "Discipline is choosing between what you want now and what you want most",
  "The secret? Just start. Every. Single. Day.",
  "Habits maketh the person ✨",
  "One day or day one. You decide.",
  "Progress, not perfection 💪",
  "Your future self will thank you",
  "Consistency is the ultimate form of self-love",
  "Champions are made in daily choices"
];

export const STREAK_MILESTONES: Record<number, string> = {
  3: "3-day streak! The habit loop is forming 🔄",
  7: "1 week strong! You're building momentum 🚀",
  14: "2 weeks! This is becoming second nature ⚡",
  21: "21 days! Habit officially formed. Unstoppable! 💎",
  30: "30-day warrior! You're in the top 5% 🏆",
  50: "50 days! Habits are your superpower now 🦸",
  100: "CENTURY! Legendary commitment. Bow down 👑",
  365: "365 DAYS! You are the 1%. ICON status! 🌟"
};
