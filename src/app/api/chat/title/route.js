import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { normalizeModelTitle } from "@/utils/chatTitle";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || !messages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Concatenate for prompt
    const convo = messages.map(m=> `${m.role.toUpperCase()}: ${m.content}` ).join('\n');

    const systemInstruction = `Generate a concise (3-6 words) noun-phrase title for the following chat between a user and an AI assistant. Requirements:
- Reflect the dominant topic or task.
- Prefer concrete subject nouns over generic words.
- No leading articles (The, A, An) unless part of a proper noun.
- Title Case.
- No punctuation except internal hyphens.
- If multiple unrelated topics, pick the most recent substantial shift.
Return ONLY the title text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.4, maxOutputTokens: 16 } });

    const result = await model.generateContent(`${systemInstruction}\n\nCHAT HISTORY:\n${convo}`);
    const raw = result.response.text();
    const title = normalizeModelTitle(raw);
    return NextResponse.json({ title });
  } catch (err) {
    console.error('Title generation error:', err);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
