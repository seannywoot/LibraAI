import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function implementations for AI to call
async function searchBooks(db, query, status) {
  const booksCollection = db.collection("books");
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { author: { $regex: query, $options: "i" } },
      { isbn: { $regex: query, $options: "i" } },
      { publisher: { $regex: query, $options: "i" } },
    ],
  };

  if (status) {
    searchQuery.status = status;
  }

  const books = await booksCollection
    .find(searchQuery)
    .limit(10)
    .project({
      title: 1,
      author: 1,
      year: 1,
      status: 1,
      shelf: 1,
      isbn: 1,
      publisher: 1,
    })
    .toArray();

  return {
    count: books.length,
    books: books.map(book => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status,
      shelf: book.shelf,
      isbn: book.isbn,
      publisher: book.publisher,
    })),
  };
}

async function getBooksByCategory(db, shelfCode) {
  const booksCollection = db.collection("books");
  const books = await booksCollection
    .find({ shelf: shelfCode })
    .limit(20)
    .project({
      title: 1,
      author: 1,
      year: 1,
      status: 1,
      isbn: 1,
    })
    .toArray();

  return {
    shelfCode,
    count: books.length,
    books: books.map(book => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status,
    })),
  };
}

async function getAvailableShelves(db) {
  const shelvesCollection = db.collection("shelves");
  const shelves = await shelvesCollection
    .find({})
    .project({ code: 1, name: 1, location: 1 })
    .toArray();

  return {
    count: shelves.length,
    shelves: shelves.map(shelf => ({
      code: shelf.code,
      name: shelf.name,
      location: shelf.location,
    })),
  };
}

async function getBookDetails(db, bookId) {
  const booksCollection = db.collection("books");
  try {
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
    
    if (!book) {
      return { error: "Book not found" };
    }

    return {
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status,
      shelf: book.shelf,
      isbn: book.isbn,
      publisher: book.publisher,
      format: book.format,
      description: book.description,
      loanPolicy: book.loanPolicy,
    };
  } catch (error) {
    return { error: "Invalid book ID" };
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if request has file upload (FormData) or JSON
    const contentType = request.headers.get('content-type');
    let message, history, conversationId, fileData;

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      message = formData.get('message');
      history = JSON.parse(formData.get('history') || '[]');
      conversationId = formData.get('conversationId') || null;
      
      const file = formData.get('file');
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        fileData = {
          data: buffer.toString('base64'),
          mimeType: file.type,
          name: file.name,
        };
      }
    } else {
      // Handle regular JSON request
      const body = await request.json();
      message = body.message;
      history = body.history;
      conversationId = body.conversationId;
    }

    // Fetch FAQs from database
    const db = await getDb();
    const faqCollection = db.collection("faqs");
    const faqs = await faqCollection.find({ isActive: true }).toArray();

    // Build FAQ context from database
    const faqContext = faqs.map(faq => 
      `Q: ${faq.question}\nA: ${faq.answer}`
    ).join("\n\n");

    // Define function tools for the AI to call
    const tools = [
      {
        functionDeclarations: [
          {
            name: "searchBooks",
            description: "Search for books in the library catalog by title, author, ISBN, or publisher. Returns available books with their details.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query (title, author, ISBN, or publisher)",
                },
                status: {
                  type: "string",
                  description: "Filter by book status: 'available', 'borrowed', or 'reserved'",
                  enum: ["available", "borrowed", "reserved"],
                },
              },
              required: ["query"],
            },
          },
          {
            name: "getBooksByCategory",
            description: "Get books from a specific shelf/category in the library",
            parameters: {
              type: "object",
              properties: {
                shelfCode: {
                  type: "string",
                  description: "Shelf code (e.g., 'FIC' for Fiction, 'SCI' for Science, 'HIS' for History)",
                },
              },
              required: ["shelfCode"],
            },
          },
          {
            name: "getAvailableShelves",
            description: "Get list of all available shelves/categories in the library",
            parameters: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "getBookDetails",
            description: "Get detailed information about a specific book by its ID",
            parameters: {
              type: "object",
              properties: {
                bookId: {
                  type: "string",
                  description: "The MongoDB ObjectId of the book",
                },
              },
              required: ["bookId"],
            },
          },
        ],
      },
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800, // Reduced from 1024 to limit token usage per prompt
      },
      tools,
    });

    // System instruction for LibraAI context with FAQ database
    const systemContext = `You are LibraAI Assistant, a helpful AI assistant for a library management system with real-time access to the library catalog.

You help students with:
- Finding specific books in the library catalog (use searchBooks function)
- Browsing books by category/shelf (use getBooksByCategory function)
- Getting information about available shelves (use getAvailableShelves function)
- Answering questions about library services, policies, and hours
- Providing information about borrowing, returns, and renewals
- Helping with research and study resources
- General literature and reading advice

IMPORTANT: When users ask about specific books, availability, or categories:
1. Use the searchBooks function to find books by title, author, ISBN, or publisher
2. Use getBooksByCategory to show books from specific shelves (Fiction, Science, History, etc.)
3. Use getAvailableShelves to show all available categories
4. Always provide real-time data from the library system

Book Status Meanings:
- "available" = Book is on the shelf and can be borrowed
- "borrowed" = Book is currently checked out
- "reserved" = Book is reserved for another user

Use the following FAQ database to answer policy questions:

${faqContext}

Key Library Information Summary:
- Operating Hours: Mon-Fri 8AM-10PM, Sat 10AM-6PM, Sun 12PM-8PM
- Borrowing Limit: 5 books for 7 days, renewable up to 3 times
- Late Fee: $0.25 per day per book
- Printing: B&W $0.10/page, Color $0.50/page
- WiFi available throughout the library
- Study rooms can be reserved up to 7 days in advance

Common Shelf Codes:
- FIC = Fiction
- SCI = Science
- HIS = History
- BIO = Biography
- REF = Reference
- CHI = Children's

Be friendly, concise, and helpful. Always use the function tools to provide accurate, real-time information about books and availability. If you don't know something specific, suggest they contact the library staff.`;

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

    // Prepare message parts
    let messageParts = [{ text: message }];
    
    // Add file data if present
    if (fileData) {
      if (fileData.mimeType === 'application/pdf') {
        messageParts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType,
          },
        });
        messageParts[0].text = `${message}\n\n[User uploaded a PDF file: ${fileData.name}. Please analyze the document and help answer their question.]`;
      } else if (fileData.mimeType.startsWith('image/')) {
        messageParts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType,
          },
        });
        messageParts[0].text = `${message}\n\n[User uploaded an image: ${fileData.name}. Please analyze the image and help answer their question.]`;
      }
    }

    let result = await chat.sendMessage(messageParts);
    let response = result.response;

    // Handle function calls
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const functionName = call.name;
          const args = call.args;

          let functionResult;
          try {
            switch (functionName) {
              case "searchBooks":
                functionResult = await searchBooks(db, args.query, args.status);
                break;
              case "getBooksByCategory":
                functionResult = await getBooksByCategory(db, args.shelfCode);
                break;
              case "getAvailableShelves":
                functionResult = await getAvailableShelves(db);
                break;
              case "getBookDetails":
                functionResult = await getBookDetails(db, args.bookId);
                break;
              default:
                functionResult = { error: "Unknown function" };
            }
          } catch (error) {
            functionResult = { error: error.message };
          }

          return {
            functionResponse: {
              name: functionName,
              response: functionResult,
            },
          };
        })
      );

      // Send function results back to the model
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

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
      hasAttachment: !!fileData,
      attachmentType: fileData?.mimeType || null,
      attachmentName: fileData?.name || null,
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
