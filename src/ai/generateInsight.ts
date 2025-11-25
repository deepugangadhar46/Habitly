import { askLLM } from "./llmClient";

export async function generateAIInsight(summary: {
  habitName: string;
  category: string;
  moodType: "positive" | "neutral" | "negative";
  trend: string;
  baseSuggestion: string;
}) {
  const prompt = `
You are a gentle habit coach. Rewrite the suggestion.
Context:
Habit: ${summary.habitName}
Category: ${summary.category}
Mood: ${summary.moodType}
Trend: ${summary.trend}

Suggestion from rule-engine:
"${summary.baseSuggestion}"

Rules:
- Keep it short
- Keep it supportive
- No medical advice
- No intensity changes
- No telling user to quit habits
- Treat physical tiredness as normal

Give only final message.
`;

  return await askLLM(prompt);
}
