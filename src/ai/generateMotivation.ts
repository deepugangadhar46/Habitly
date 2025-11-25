import { groq } from "../lib/kelvinClient";

export async function generateMotivation(habitName: string, category: string) {
  const prompt = `
Give a short motivating message for someone trying to stay consistent with the habit: "${habitName}".
Category: ${category}.
Do NOT give generic quotes. Make it personal, warm, human, and under 25 words.
Avoid emojis unless it's really needed.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.2-1b-preview",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 80,
    temperature: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
