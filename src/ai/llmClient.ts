export async function askLLM(prompt: string) {
  const provider = import.meta.env.VITE_LLM_PROVIDER;

  if (provider === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });

    const json = await res.json();
    return json.choices[0].message.content;
  }
}