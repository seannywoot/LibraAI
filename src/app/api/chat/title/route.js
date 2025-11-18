import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { normalizeModelTitle } from "@/utils/chatTitle";

import Bytez from "bytez.js";
import qwenQueue from "@/lib/qwenQueue";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const bytezSDK = new Bytez(process.env.BYTEZ_API_KEY || "");

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || !messages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Validate GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Concatenate for prompt
    const convo = messages.map(m=> `${m.role.toUpperCase()}: ${m.content}` ).join('\n');

    let usingGemini = false;
    let title;

    const systemInstruction = `You are a professional editor creating a concise, descriptive title (3-6 words) for this conversation.

ANALYZE THE CONVERSATION:
1. Identify the MAIN TOPIC or PRIMARY QUESTION being discussed
2. If the conversation shifts topics, focus on the MOST RECENT or DOMINANT theme
3. Capture the essence of what the user is asking about or interested in
4. Ignore greetings, small talk, and off-topic tangents

CRITICAL GRAMMAR RULES:
1. MUST be a complete, grammatically correct phrase
2. MUST include necessary articles (a, an) and prepositions (to, for, about) WITHIN the title for proper grammar
3. MUST use proper verb forms (not fragments like "books available borrow")
4. MUST sound natural when read aloud
5. NO articles (the, a, an) at the START, but use them internally if needed for grammar
6. NEVER end with a preposition (to, for, about, from, etc.)

STRUCTURE PATTERNS (choose the most appropriate):
- "[Adjective] [Noun] [Preposition] [Verb]" → "Available Books To Borrow"
- "[Noun] [Noun] [Noun]" → "Python Programming Guide"  
- "[Verb+ing] [Noun] [Noun]" → "Baking Sourdough Bread"
- "[Noun] [Preposition] [Noun]" → "Guide To Python"
- "[Topic] [Noun]" → "Greek Mythology Questions"

HANDLING RANDOM/OFF-TOPIC QUESTIONS:
If the conversation is about random general knowledge (not library-related):
✓ "Greek Mythology Discussion" (for questions about Icarus, gods, etc.)
✓ "Philosophy and Love Questions" (for abstract questions)
✓ "General Knowledge Chat" (for trivia or random questions)
✓ "Random Questions Session" (for multiple unrelated questions)

GOOD EXAMPLES (grammatically complete):
✓ "Available Books To Borrow" (has preposition + verb)
✓ "Books Available For Borrowing" (has preposition + gerund)
✓ "Finding Available Fiction Books" (has verb + adjective + noun)
✓ "Greek Mythology Questions" (topic + noun)
✓ "Python Programming Guide" (noun phrase)
✓ "Planning Tokyo Travel" (gerund + noun phrase)

BAD EXAMPLES (grammatically broken):
✗ "The Sun Did Not Go To" (ends with preposition, incomplete)
✗ "What Books Available Borrow" (missing articles/prepositions, broken grammar)
✗ "Books Available Borrow" (missing "to" or "for", incomplete)
✗ "Help With Baking" (too generic)
✗ "Question About" (incomplete, ends with preposition)
✗ "Available Books" (too short, incomplete thought)

QUALITY CHECKLIST:
1. Read it aloud - does it sound natural?
2. Is it grammatically complete?
3. Are all necessary small words (to, for, a, an) included?
4. Does it NOT end with a preposition?
5. Would a native English speaker say this phrase?
6. Is it specific to the conversation topic?
7. Does it capture the MAIN or MOST RECENT topic?

Return ONLY the title, nothing else.`;

    // Prefer GPT-4o (via Bytez) for title generation, fallback to Gemini
    let raw;
    let triedBytez = false;

    if (process.env.BYTEZ_API_KEY) {
      try {
        console.log("🤖 Generating title with GPT-4o via Bytez...");
        const bytezModel = bytezSDK.model("openai/gpt-4o");

        const messages = [
          { role: "system", content: systemInstruction },
          { role: "user", content: `CHAT HISTORY:\n${convo}` },
        ];

        const { error, output } = await qwenQueue.add(async () => {
          return await bytezModel.run(messages, { temperature: 0.3 });
        });

        if (error) throw new Error(error);

        raw = typeof output === "string" ? output : (output?.content || output);
        triedBytez = true;
        console.log("✅ GPT-4o (Bytez) generated title successfully");
      } catch (e) {
        console.warn("⚠️ GPT-4o title generation failed, will fallback to Gemini:", e.message);
      }
    }

    if (!raw) {
      // Fallback to Gemini
      console.log("🤖 Generating title with Gemini 2.5 Flash...");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 20,
        },
      });

      const result = await model.generateContent(`${systemInstruction}\n\nCHAT HISTORY:\n${convo}`);
      raw = result.response.text();
      console.log("✅ Gemini generated title successfully");
    }

    title = normalizeModelTitle(raw);
    console.log("Generated title:", title, "(source:", triedBytez ? "gpt-4o" : "gemini", ")");
    
    // Validation: Check for common issues
    const hasObviousTypo = /\b(aer|teh|hte|taht|waht|whta|availble|availabe)\b/i.test(title);
    const hasIncompletePhrase = /\b(to|for|with|about|from)\s*$/i.test(title); // ends with preposition
    
    // Check for grammatically broken patterns
    const brokenPatterns = [
      /\b(what|which|how)\s+\w+\s+available\s+\w+$/i, // "What Books Available Borrow"
      /\bavailable\s+\w+$/i, // "Books Available Borrow" (missing preposition)
      /\b\w+\s+available\s+(?!for|to|in|on)\w+$/i, // Missing preposition after "available"
    ];
    const hasBrokenGrammar = brokenPatterns.some(pattern => pattern.test(title));
    
    // Check if title is too short or generic
    const words = title.split(/\s+/);
    const isTooShort = words.length < 3;
    
    if (hasObviousTypo || hasIncompletePhrase || hasBrokenGrammar || isTooShort) {
      console.warn('Generated title has issues, regenerating:', title);
      console.warn('Issues detected:', {
        hasTypo: hasObviousTypo,
        incompletePhrase: hasIncompletePhrase,
        brokenGrammar: hasBrokenGrammar,
        tooShort: isTooShort
      });
      
      // Try one more time with emphasis using Gemini
      const retryModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp', 
        generationConfig: { 
          temperature: 0.3, 
          maxOutputTokens: 20 
        } 
      });
      
      const retryResult = await retryModel.generateContent(
        `${systemInstruction}\n\nIMPORTANT: The previous attempt "${title}" had grammar issues. 

Common mistakes to avoid:
- "What Books Available Borrow" → Should be "Available Books To Borrow"
- "Books Available Borrow" → Should be "Books Available For Borrowing"
- Missing small words like "to", "for", "a", "an"

Please generate a PERFECT, grammatically complete title that sounds natural when read aloud.

CHAT HISTORY:\n${convo}`
      );
      const retryRaw = retryResult.response.text();
      title = normalizeModelTitle(retryRaw);
      console.log('Regenerated title:', title);
    }
    
    return NextResponse.json({ title });
  } catch (err) {
    console.error('Title generation error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Check if it's a rate limit error
    const isRateLimitError = err.message?.includes('429') || 
                            err.message?.includes('quota') || 
                            err.message?.includes('rate limit');
    
    if (isRateLimitError) {
      console.warn('Rate limit hit for title generation, will use fallback');
      // Return a success response with a flag indicating to use fallback
      return NextResponse.json({ 
        title: null,
        useFallback: true,
        rateLimited: true
      }, { status: 200 });
    }
    
    // Return more specific error message for other errors
    const errorMessage = err.message || 'Failed to generate title';
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
