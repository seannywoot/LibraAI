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

    const systemInstruction = `Generate a concise, descriptive title (3-6 words) for this conversation.

RULES:
- Use specific nouns and verbs that capture the main topic
- NO generic words like "help", "question", "chat", "conversation"
- NO articles (the, a, an) at the start
- Title Case format
- NO quotes, punctuation, or extra formatting
- Focus on what the user is asking about or discussing

EXAMPLES:
Good: "Sourdough Bread Baking Tips"
Good: "Python List Comprehension Guide"
Good: "Tokyo Travel Itinerary Planning"
Bad: "Help With Baking"
Bad: "Question About Python"
Bad: "Chat About Travel"

Return ONLY the title, nothing else.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', 
      generationConfig: { 
        temperature: 0.3, 
        maxOutputTokens: 20 
      } 
    });

    const result = await model.generateContent(`${systemInstruction}\n\nCHAT HISTORY:\n${convo}`);
    const raw = result.response.text();
    const title = normalizeModelTitle(raw);
    return NextResponse.json({ title });
  } catch (err) {
    console.error('Title generation error:', err);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
