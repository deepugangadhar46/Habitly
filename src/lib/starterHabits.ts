// Curated starter habits to help users get started quickly

export const starterHabits = [
  {
    name: "Morning Meditation",
    description: "Start your day with 10 minutes of mindfulness",
    emoji: "🧘‍♀️",
    color: "#8B5CF6",
    category: "Mindfulness",
    difficulty: "easy" as const
  },
  {
    name: "Daily Exercise",
    description: "Get your body moving for at least 30 minutes",
    emoji: "🏃‍♂️",
    color: "#EF4444",
    category: "Fitness",
    difficulty: "medium" as const
  },
  {
    name: "Read for 20 Minutes",
    description: "Expand your knowledge with daily reading",
    emoji: "📚",
    color: "#3B82F6",
    category: "Learning",
    difficulty: "easy" as const
  },
  {
    name: "Drink 8 Glasses of Water",
    description: "Stay hydrated throughout the day",
    emoji: "💧",
    color: "#06B6D4",
    category: "Health",
    difficulty: "easy" as const
  },
  {
    name: "Write in Journal",
    description: "Reflect on your day and thoughts",
    emoji: "✍️",
    color: "#F59E0B",
    category: "Mindfulness",
    difficulty: "medium" as const
  },
  {
    name: "Practice Gratitude",
    description: "Write down 3 things you're grateful for",
    emoji: "🙏",
    color: "#10B981",
    category: "Mindfulness",
    difficulty: "easy" as const
  },
  {
    name: "Learn Something New",
    description: "Spend time learning a new skill or topic",
    emoji: "🎓",
    color: "#8B5CF6",
    category: "Learning",
    difficulty: "hard" as const
  },
  {
    name: "Connect with Loved Ones",
    description: "Reach out to family or friends",
    emoji: "💝",
    color: "#EC4899",
    category: "Social",
    difficulty: "easy" as const
  }
];

export const habitCategories = [
  { name: "Health", emoji: "🏥", color: "#10B981" },
  { name: "Fitness", emoji: "💪", color: "#EF4444" },
  { name: "Mindfulness", emoji: "🧘‍♀️", color: "#8B5CF6" },
  { name: "Learning", emoji: "📚", color: "#3B82F6" },
  { name: "Productivity", emoji: "⚡", color: "#F59E0B" },
  { name: "Social", emoji: "👥", color: "#EC4899" },
  { name: "Creative", emoji: "🎨", color: "#06B6D4" },
  { name: "Financial", emoji: "💰", color: "#84CC16" }
];

export const habitTemplates = [
  {
    category: "Health",
    habits: [
      { name: "Take Vitamins", description: "Daily vitamin supplements", emoji: "💊", difficulty: "easy" },
      { name: "Floss Teeth", description: "Daily dental care", emoji: "🦷", difficulty: "easy" },
      { name: "Skincare Routine", description: "Morning and evening skincare", emoji: "✨", difficulty: "medium" },
      { name: "Posture Check", description: "Maintain good posture throughout the day", emoji: "🧍‍♀️", difficulty: "medium" }
    ]
  },
  {
    category: "Fitness",
    habits: [
      { name: "10,000 Steps", description: "Walk at least 10,000 steps daily", emoji: "👟", difficulty: "medium" },
      { name: "Strength Training", description: "Resistance exercises 3x per week", emoji: "🏋️‍♀️", difficulty: "hard" },
      { name: "Yoga Practice", description: "Daily yoga or stretching", emoji: "🧘‍♀️", difficulty: "medium" },
      { name: "Bike Ride", description: "Cycling for cardio fitness", emoji: "🚴‍♂️", difficulty: "medium" }
    ]
  },
  {
    category: "Mindfulness",
    habits: [
      { name: "Deep Breathing", description: "5 minutes of focused breathing", emoji: "🌬️", difficulty: "easy" },
      { name: "Mindful Eating", description: "Eat without distractions", emoji: "🍽️", difficulty: "medium" },
      { name: "Nature Walk", description: "Mindful walk in nature", emoji: "🌳", difficulty: "easy" },
      { name: "Body Scan", description: "Progressive muscle relaxation", emoji: "🧘‍♂️", difficulty: "medium" }
    ]
  },
  {
    category: "Learning",
    habits: [
      { name: "Language Practice", description: "Study a new language daily", emoji: "🗣️", difficulty: "medium" },
      { name: "Online Course", description: "Complete course modules", emoji: "💻", difficulty: "hard" },
      { name: "Podcast Learning", description: "Listen to educational podcasts", emoji: "🎧", difficulty: "easy" },
      { name: "Skill Practice", description: "Practice a specific skill", emoji: "🎯", difficulty: "medium" }
    ]
  },
  {
    category: "Productivity",
    habits: [
      { name: "Plan Tomorrow", description: "Plan next day before bed", emoji: "📋", difficulty: "easy" },
      { name: "Inbox Zero", description: "Clear email inbox daily", emoji: "📧", difficulty: "medium" },
      { name: "Time Blocking", description: "Schedule tasks in time blocks", emoji: "⏰", difficulty: "hard" },
      { name: "Single Tasking", description: "Focus on one task at a time", emoji: "🎯", difficulty: "medium" }
    ]
  }
];

export const getRandomStarterHabits = (count: number = 3) => {
  const shuffled = [...starterHabits].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};