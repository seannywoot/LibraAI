import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const { message, history, conversationId } = await request.json();

    // Fetch FAQs from database
    const db = await getDb();
    const faqCollection = db.collection("faqs");
    const faqs = await faqCollection.find({ isActive: true }).toArray();

    // Build FAQ context from database
    const faqContext = faqs.map(faq => 
      `Q: ${faq.question}\nA: ${faq.answer}`
    ).join("\n\n");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // System instruction for LibraAI context with FAQ database
    const systemContext = `You are LibraAI Assistant, a helpful AI assistant for a library management system. 
You help students with:
- Finding books and literature recommendations
- Answering questions about library services, policies, and hours
- Providing information about borrowing, returns, and renewals
- Helping with research and study resources
- General literature and reading advice

Use the following FAQ database to answer questions accurately:

${faqContext}

Key Library Information Summary:
- Operating Hours: Mon-Fri 8AM-10PM, Sat 10AM-6PM, Sun 12PM-8PM
- Borrowing Limit: 5 books for 7 days, renewable up to 3 times
- Late Fee: $0.25 per day per book
- Printing: B&W $0.10/page, Color $0.50/page
- WiFi available throughout the library
- Study rooms can be reserved up to 7 days in advance

Be friendly, concise, and helpful. When answering questions, prioritize information from the FAQ database above. If you don't know something specific about the library, suggest they contact the library staff.`;

    // Build chat history for context
    const chatHistory = history?.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })) || [];

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemContext }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I'm LibraAI Assistant, ready to help students with library services, book recommendations, and literature questions." }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Log conversation to MongoDB
    const chatLogsCollection = db.collection("chat_logs");
    const logEntry = {
      userId: session?.user?.email || "anonymous",
      userName: session?.user?.name || "Anonymous User",
      conversationId: conversationId || null,
      userMessage: message,
      aiResponse: text,
      timestamp: new Date(),
      model: "gemini-2.5-flash",
      messageCount: (history?.length || 0) + 2, // +2 for current exchange
    };

    await chatLogsCollection.insertOne(logEntry);

    return NextResponse.json({ 
      message: text,
      success: true 
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get response from AI",
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        success: false 
      },
      { status: 500 }
    );
  }
}
