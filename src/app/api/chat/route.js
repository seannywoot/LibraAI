import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import Bytez from "bytez.js";
import qwenQueue from "@/lib/qwenQueue";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const bytezSDK = new Bytez(process.env.BYTEZ_API_KEY);

// Helper: parse potential function calls returned by GPT-4o when instructed to output JSON
function parseFunctionCallsFromText(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  try {
    // Try direct JSON parse
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj.call_functions)) return obj.call_functions;
      if (obj.call_function) return [obj.call_function];
      if (Array.isArray(obj.tool_calls)) return obj.tool_calls; // alternate key
      if (obj.name && obj.arguments) return [obj];
    }
  } catch (_) {
    // Try to find JSON block inside text
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = trimmed.slice(start, end + 1);
      try {
        const obj = JSON.parse(candidate);
        if (obj && typeof obj === "object") {
          if (Array.isArray(obj.call_functions)) return obj.call_functions;
          if (obj.call_function) return [obj.call_function];
          if (Array.isArray(obj.tool_calls)) return obj.tool_calls;
          if (obj.name && obj.arguments) return [obj];
        }
      } catch (_) {
        // ignore
      }
    }
  }
  return null;
}

// Helper function to extract text from PDF using pdfjs-dist (Node.js compatible)
async function extractTextFromPDF(base64Data) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");

    // Ensure worker is configured for Node environment
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.js";
    }
// Convert base64 to Uint8Array
    const pdfBytes = Uint8Array.from(Buffer.from(base64Data, "base64"));

    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const doc = await loadingTask.promise;

    const numPages = doc.numPages || 1;
    const maxPages = 50;
    const pagesToRead = Math.min(numPages, maxPages);

    let fullText = "";

    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
    }

    fullText = fullText.trim();
    const wordCount = fullText ? fullText.split(/\s+/).length : 0;
    
    let formattedText = fullText;
    if (numPages > 50) {
      formattedText += `\n\n[Note: Document has ${numPages} pages. Only first 50 pages were extracted for analysis.]`;
    }
    
    return {
      success: true,
      text: formattedText.trim(),
      pageCount: numPages,
      pagesExtracted: Math.min(numPages, 50),
      wordCount: wordCount
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function implementations for AI to call
async function searchBooks(db, query, status) {
  const booksCollection = db.collection("books");
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { author: { $regex: query, $options: "i" } },
      { isbn: { $regex: query, $options: "i" } },
      { publisher: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
    ],
  };

  if (status) {
    searchQuery.status = status;
  }

  // Get total count of matching books
  const totalMatches = await booksCollection.countDocuments(searchQuery);

  // Get limited results for display
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
      category: 1,
      format: 1,
      description: 1,
      language: 1,
      pages: 1,
      loanPolicy: 1,
    })
    .toArray();

  return {
    totalMatches, // Total books matching the search
    displayedCount: books.length, // Books shown (max 10)
    limitReached: totalMatches > 10, // True if there are more results
    books: books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status,
      shelf: book.shelf,
      isbn: book.isbn,
      publisher: book.publisher,
      category: book.category,
      format: book.format,
      description: book.description,
      language: book.language,
      pages: book.pages,
      loanPolicy: book.loanPolicy,
    })),
  };
}

async function getBooksByCategory(db, shelfCode) {
  const booksCollection = db.collection("books");
  
  // Get total count for this shelf
  const totalInShelf = await booksCollection.countDocuments({ shelf: shelfCode });
  
  const books = await booksCollection
    .find({ shelf: shelfCode })
    .limit(20)
    .project({
      title: 1,
      author: 1,
      year: 1,
      status: 1,
      isbn: 1,
      category: 1,
      format: 1,
      description: 1,
      language: 1,
      pages: 1,
      loanPolicy: 1,
    })
    .toArray();

  return {
    shelfCode,
    totalInShelf, // Total books on this shelf
    displayedCount: books.length, // Books shown (max 20)
    limitReached: totalInShelf > 20,
    books: books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status,
      category: book.category,
      format: book.format,
      description: book.description,
      language: book.language,
      pages: book.pages,
      loanPolicy: book.loanPolicy,
    })),
  };
}

async function getAvailableShelves(db) {
  const shelvesCollection = db.collection("shelves");
  const booksCollection = db.collection("books");

  const shelves = await shelvesCollection
    .find({})
    .project({ code: 1, name: 1, location: 1 })
    .toArray();

  // Get book counts for each shelf
  const shelvesWithCounts = await Promise.all(
    shelves.map(async (shelf) => {
      const bookCount = await booksCollection.countDocuments({
        shelf: shelf.code,
      });
      return {
        code: shelf.code,
        name: shelf.name,
        location: shelf.location,
        bookCount,
      };
    })
  );

  return {
    count: shelvesWithCounts.length,
    shelves: shelvesWithCounts,
  };
}

async function getCatalogStats(db) {
  const booksCollection = db.collection("books");
  
  // Get total counts
  const totalBooks = await booksCollection.countDocuments({});
  const availableBooks = await booksCollection.countDocuments({ status: "available" });
  const borrowedBooks = await booksCollection.countDocuments({ status: "borrowed" });
  const reservedBooks = await booksCollection.countDocuments({ status: "reserved" });
  
  // Get category distribution
  const categoryStats = await booksCollection.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();
  
  return {
    totalBooks,
    availableBooks,
    borrowedBooks,
    reservedBooks,
    topCategories: categoryStats.map(cat => ({
      category: cat._id,
      count: cat.count
    }))
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
      category: book.category,
      description: book.description,
      language: book.language,
      pages: book.pages,
      loanPolicy: book.loanPolicy,
      borrowLink: `/student/books/${book._id.toString()}`,
    };
  } catch (error) {
    return { error: "Invalid book ID" };
  }
}

async function generateBorrowLink(db, bookId) {
  const booksCollection = db.collection("books");
  try {
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return { error: "Book not found" };
    }

    const canBorrow =
      book.status === "available" &&
      !["reference-only", "staff-only"].includes(book.loanPolicy || "");

    const borrowLink = `/student/books/${book._id.toString()}`;

    return {
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      status: book.status,
      canBorrow,
      borrowLink: borrowLink,
      formattedMessage: canBorrow
        ? `Great! You can borrow "${book.title}" by ${book.author} by clicking this link: ${borrowLink}\n\nThis will take you to the book details page where you can submit your borrow request.`
        : book.status === "borrowed"
        ? `"${book.title}" is currently checked out. You can view its details here: ${borrowLink}`
        : book.status === "reserved"
        ? `"${book.title}" is currently reserved. You can view its details here: ${borrowLink}`
        : book.loanPolicy === "reference-only"
        ? `"${book.title}" is reference only and cannot be borrowed. You can view it in the library. Details: ${borrowLink}`
        : `"${book.title}" is currently unavailable for borrowing. View details: ${borrowLink}`,
    };
  } catch (error) {
    return { error: "Invalid book ID" };
  }
}

export async function POST(request) {
  try {
    console.log("📨 Chat API request received");
    const session = await getServerSession(authOptions);

    // Check if request has file upload (FormData) or JSON
    const contentType = request.headers.get("content-type");
    let message, history, conversationId, fileData, pdfContext;

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      message = formData.get("message");
      history = JSON.parse(formData.get("history") || "[]");
      conversationId = formData.get("conversationId") || null;
      
      // Get PDF context if available (for follow-up questions)
      const pdfContextStr = formData.get("pdfContext");
      if (pdfContextStr) {
        try {
          pdfContext = JSON.parse(pdfContextStr);
          console.log("📄 Using existing PDF context:", pdfContext.name);
        } catch (e) {
          console.warn("Failed to parse PDF context:", e);
        }
      }

      const file = formData.get("file");
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        fileData = {
          data: base64Data,
          mimeType: file.type,
          name: file.name,
        };

        // Extract text from PDF if it's a PDF file
        if (file.type === "application/pdf") {
          console.log("📄 Extracting text from PDF...");
          const pdfExtraction = await extractTextFromPDF(base64Data);
          
          if (pdfExtraction.success) {
            console.log(`✅ PDF text extracted: ${pdfExtraction.pageCount} pages, ${pdfExtraction.wordCount} words`);
            fileData.extractedText = pdfExtraction.text;
            fileData.pageCount = pdfExtraction.pageCount;
            fileData.wordCount = pdfExtraction.wordCount;
          } else {
            console.warn("⚠️ PDF text extraction failed:", pdfExtraction.error);
            fileData.extractionError = pdfExtraction.error;
          }
        }
      }
    } else {
      // Handle regular JSON request
      const body = await request.json();
      message = body.message;
      history = body.history;
      conversationId = body.conversationId;
      pdfContext = body.pdfContext; // Get PDF context for follow-up questions
      
      if (pdfContext) {
        console.log("📄 Using existing PDF context from JSON:", pdfContext.name);
      }
    }

    console.log("📝 Message:", message?.substring(0, 50) + (message?.length > 50 ? "..." : ""));

    // Fetch FAQs from database
    const db = await getDb();
    const faqCollection = db.collection("faqs");
    const faqs = await faqCollection.find({ isActive: true }).toArray();

    // Build FAQ context from database
    const faqContext = faqs
      .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join("\n\n");

    // System instruction for LibraAI context with FAQ database (defined early for use in both AI models)
    const systemContext = `You are LibraAI Assistant, a knowledgeable AI librarian helping students with library services and book recommendations. You provide friendly, helpful responses about books, borrowing, and library policies.

CRITICAL: CONVERSATION FLOW
- ONLY answer the user's CURRENT question (the most recent message)
- DO NOT re-answer or revisit previous questions from the conversation history
- The conversation history is provided for context only, not for you to re-address
- If the user asks a new question, it means they're satisfied with previous answers
- Focus exclusively on the latest user message unless they explicitly reference a previous topic
- Example: If they previously asked about book counts and now ask about hours, ONLY answer about hours

IMPORTANT: SCOPE OF ASSISTANCE
You are a specialized library assistant. Your purpose is to help with:
- Library services, policies, and operations
- Finding and recommending books
- Borrowing, returns, and library resources
- Research and study assistance
- PDF document analysis (when uploaded)

For questions OUTSIDE your library scope (general knowledge, personal advice, philosophical questions, trivia, etc.):
- Politely acknowledge the question
- Briefly explain you're focused on library services
- Redirect to library-related help
- Keep your response SHORT (2-3 sentences max)

Example responses for out-of-scope questions:
- "That's an interesting question! However, I'm specifically designed to help with library services and book recommendations. Is there a book topic or library service I can help you with today?"
- "I appreciate your curiosity, but I'm focused on helping with our library catalog and services. Would you like me to help you find books on that topic instead?"

CORE CAPABILITIES:
You help students with:
- Providing library catalog overview and statistics (use getCatalogStats function)
- Finding books by title, author, topic, subject, or content (use searchBooks function)
- Discovering books based on themes, genres, or descriptions
- Browsing books by category/shelf with full details (use getBooksByCategory function)
- Getting comprehensive book information including descriptions, language, page count (use getBookDetails function)
- Answering questions about library services, policies, and hours
- Providing information about borrowing, returns, and renewals
- Helping with research and study resources
- Offering literature recommendations based on interests
- Analyzing PDF documents to provide summaries, bullet points, or answer questions about the content

PDF DOCUMENT ANALYSIS:
When a user uploads a PDF document, you can:
- Provide comprehensive summaries of the document content
- Extract key points and create bullet-point lists
- Answer specific questions about the document
- Identify main themes, arguments, or topics
- Highlight important information based on user requests
- Compare information across multiple sections

When analyzing PDFs, adapt your response based on the user's prompt:
- If they ask for a "summary", provide a concise overview (2-4 paragraphs)
- If they ask for "bullet points" or "key points", create a structured list
- If they ask specific questions, focus on relevant sections
- If they ask to "explain" or "analyze", provide detailed insights
- Always reference page numbers when citing specific information

CRITICAL: UNDERSTANDING SEARCH RESULTS
When you call searchBooks or getBooksByCategory, the results include:
- totalMatches / totalInShelf: The ACTUAL total number of books in the catalog/shelf
- displayedCount: Number of sample books shown (limited to 10 or 20)
- limitReached: Boolean indicating if there are more books than shown
- books: Array of sample books (NOT the complete list)

ALWAYS mention the TOTAL count when presenting results, not just the sample size!

Example response format:
❌ WRONG: "I found 10 books about habits"
✅ CORRECT: "I found [totalMatches] books about habits in our catalog. Here are [displayedCount] recommendations:"

❌ WRONG: "We have 20 fiction books"
✅ CORRECT: "We have [totalInShelf] fiction books on shelf A1-A3. Here are [displayedCount] popular titles:"

IMPORTANT: Use the ACTUAL numbers from the function results, NOT example numbers!

CRITICAL SEARCH BEHAVIOR:
When users ask about books by topic or theme (not exact title):
1. ALWAYS use searchBooks with relevant keywords from their query
2. Search for topic-related terms that might appear in titles, authors, or descriptions
3. If first search yields no results, try ONE alternative search with different keywords
4. After TWO failed searches, acknowledge no results and suggest browsing categories
5. Examples:
   - "books about habits" → searchBooks("habits")
   - "productivity books" → searchBooks("productivity") or searchBooks("effective")
   - "self-improvement" → searchBooks("self-help") or browse Self-Help category
   - "building better routines" → searchBooks("habits") or searchBooks("routine")

NEVER say a book doesn't exist without first calling searchBooks!

HANDLING NO RESULTS:
If searchBooks returns 0 results:
1. Try ONE alternative search with synonyms or related terms
2. If still no results, acknowledge this clearly
3. Suggest browsing related categories using getAvailableShelves
4. DO NOT repeatedly call searchBooks with the same or similar terms
5. Provide helpful alternatives instead of empty responses

ENHANCED SEARCH CAPABILITIES:
The searchBooks function searches across:
- Title and author (exact and partial matches)
- ISBN and publisher information
- Book descriptions and summaries (full-text search)
- Categories and genres
- Topics and themes mentioned in descriptions

This means you can help users find books by:
- Subject matter: "books about artificial intelligence", "quantum physics books"
- Themes: "books about friendship", "stories about overcoming adversity"
- Content type: "beginner programming books", "advanced mathematics"
- Specific topics: "machine learning", "World War II history", "Shakespeare analysis"
- Popular titles: "Atomic Habits", "Thinking Fast and Slow", "Clean Code"

BOOK INFORMATION AWARENESS:
Every book result includes:
- title, author, year, publisher, ISBN
- category: The subject classification (Fiction, Science, Technology, History, etc.)
- format: Physical book type (Hardcover, Paperback, eBook)
- description: Full book summary and content overview
- language: Book language (English, Spanish, etc.)
- pages: Page count for length estimation
- status: Current availability (available, borrowed, reserved)
- shelf: Physical location in library
- loanPolicy: Borrowing rules (standard, short-loan, reference-only, staff-only)

USE THIS INFORMATION TO:
1. Provide detailed, informative responses about book content
2. Help users understand what a book is about before borrowing
3. Filter and recommend books based on length (pages), language, or format
4. Explain borrowing terms and restrictions based on loanPolicy
5. Give context about book difficulty, target audience, or subject depth

INTELLIGENT FILTERING & RECOMMENDATIONS:
When users ask for books:
- Consider the description field to match topic relevance
- Mention key details like page count for time commitment
- Note the format (eBook vs physical) if relevant
- Highlight language if the user might need specific languages
- Explain loan policies if they affect borrowing (reference-only, short-loan)
- Use category information to suggest related books

WORKFLOW GUIDELINES:

1. GENERAL LIBRARY QUESTIONS:
   - When users ask "what books do you have" or "how many books" → Call getCatalogStats FIRST
   - This gives you the total catalog size and overview
   - Then suggest specific searches or categories based on their interests
   - Example: "We have [X] books total. What topics interest you?" (where X is from getCatalogStats)

2. SEARCHING FOR BOOKS:
   - Use searchBooks with topic keywords to find relevant books
   - The search covers descriptions, so use subject terms
   - ALWAYS mention totalMatches (the real count) not just displayedCount
   - Example format: "I found [totalMatches] books about [topic]. Here are [displayedCount] top recommendations:"
   - Always check the description field in results to verify relevance
   - NEVER make up numbers - only use actual values from function results

3. BROWSING CATEGORIES:
   - First call getAvailableShelves to get exact shelf codes
   - Then call getBooksByCategory with the correct shelf code
   - ALWAYS mention totalInShelf (the real count) not just displayedCount
   - Results include full descriptions to help users choose
   - Example: "We have 156 fiction books on shelves A1-A3. Here are 20 popular titles:"

4. BOOK DETAILS:
   - Use getBookDetails when users want comprehensive information
   - Share relevant parts of the description to help decision-making
   - Mention page count, language, and format when helpful

4. BORROWING WORKFLOW:
   When a student wants to borrow a book:
   a. Identify the specific book from previous search results
   b. Call generateBorrowLink with the book's ID
   c. ALWAYS provide a text response using the formattedMessage
   d. The link /student/books/[id] will become clickable
   e. Never leave response empty after calling generateBorrowLink

Book Status Meanings:
- "available" = On shelf, ready to borrow
- "borrowed" = Currently checked out
- "reserved" = Reserved for another user

Loan Policy Types:
- "standard" = Normal 7-day borrowing
- "short-loan" = Limited borrowing period (2-3 days)
- "reference-only" = Cannot be borrowed, library use only
- "staff-only" = Restricted to staff access

Use the following FAQ database to answer policy questions:

${faqContext}

Key Library Information:
- Operating Hours: Mon-Fri 8AM-10PM, Sat 10AM-6PM, Sun 12PM-8PM
- Borrowing Limit: 5 books for 7 days, renewable up to 3 times
- Late Fee: $0.25 per day per book
- Printing: B&W $0.10/page, Color $0.50/page
- WiFi available throughout the library
- Study rooms can be reserved up to 7 days in advance

Library Shelf Organization:
- Main Floor: Fiction (A1-A3), Science (B1-B3)
- Second Floor: Technology (C1-C3), History (D1-D2), Biography (E1-E2)
- Third Floor: Self-Help (F1-F2), Business (G1-G2), Non-Fiction (H1-H2)
- Fourth Floor: Arts (I1-I2), Education (J1-J2)
- Ground Floor: Children's Wing (K1-K2), Young Adult Wing (L1-L2)

RESPONSE STYLE:
- Be friendly, knowledgeable, and helpful
- Use book descriptions to provide context and help users decide
- Mention relevant details (pages, language, format) when useful
- Provide accurate, real-time information from the database
- If you don't know something specific, suggest contacting library staff
- Help users discover books they might not have known to search for`;

    // Define function tools for the AI to call
    const tools = [
      {
        functionDeclarations: [
          {
            name: "searchBooks",
            description:
              "Search for books in the library catalog by title, author, ISBN, publisher, description, or category. Returns up to 10 sample books with comprehensive details, plus the TOTAL count of matching books in the catalog. Use this to find books matching specific topics, genres, or content. ALWAYS call this function when users ask about books by topic, theme, or subject - don't assume books don't exist without searching first!",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Search query (title, author, ISBN, publisher, description content, or category). Can search for topics, themes, or subjects within book descriptions. Examples: 'habits', 'productivity', 'artificial intelligence', 'Atomic Habits', 'James Clear'",
                },
                status: {
                  type: "string",
                  description:
                    "Optional filter by book status: 'available', 'borrowed', or 'reserved'. Omit to search all books regardless of status.",
                  enum: ["available", "borrowed", "reserved"],
                },
              },
              required: ["query"],
            },
          },
          {
            name: "getBooksByCategory",
            description:
              "Get books from a specific shelf in the library with full details including descriptions, language, pages, format, and category. Returns up to 20 sample books plus the TOTAL count on that shelf. Use getAvailableShelves first to get the correct shelf codes. Shelf codes are alphanumeric like A1, B2, C3, etc. Returns comprehensive book information to help users understand book content and make informed choices.",
            parameters: {
              type: "object",
              properties: {
                shelfCode: {
                  type: "string",
                  description:
                    "Exact shelf code from the library system (e.g., 'A1', 'B1', 'C2'). Call getAvailableShelves first to get valid codes.",
                },
              },
              required: ["shelfCode"],
            },
          },
          {
            name: "getAvailableShelves",
            description:
              "Get list of all available shelves/categories in the library with their codes, names, locations, and book counts. ALWAYS call this first when users ask about categories or shelves to get the correct shelf codes.",
            parameters: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "getCatalogStats",
            description:
              "Get comprehensive statistics about the entire library catalog including total books, availability status breakdown, and top categories. Use this when users ask general questions like 'what books do you have', 'how many books', or want an overview of the library collection. This provides the big picture before diving into specific searches.",
            parameters: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "getBookDetails",
            description:
              "Get comprehensive detailed information about a specific book by its ID, including full description, language, page count, format, category, loan policy, and availability status. Use this when users want to know more about a specific book's content, length, or borrowing terms.",
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
          {
            name: "generateBorrowLink",
            description:
              "Generate a clickable link for a student to view and borrow a specific book. Use this when a student expresses interest in borrowing a book. The bookId should come from the 'id' field in previous searchBooks or getBookDetails results.",
            parameters: {
              type: "object",
              properties: {
                bookId: {
                  type: "string",
                  description:
                    "The MongoDB ObjectId of the book (use the 'id' field from searchBooks results)",
                },
              },
              required: ["bookId"],
            },
          },
        ],
      },
    ];

    // Build chat history for context (needed for both AI models)
    const chatHistory =
      history?.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })) || [];

    // Try GPT-4o via Bytez first (including function calling), fallback to Gemini
    let usingGemini = false;
    let model;
    let chat;
    let result;
    let response;

    if (!usingGemini) {
      try {
        console.log("🤖 Attempting to use GPT-4o via Bytez (with tool calling)...");
        const bytezModel = bytezSDK.model("openai/gpt-4o");
      
      // Build messages for OpenAI format
      let userMessageContent = message;
      const toolCallingInstruction = `\n\nFUNCTION CALLING INSTRUCTIONS (VERY IMPORTANT)\nIf answering requires library data (search, category, stats, details, borrow):\n- Do NOT fabricate data.\n- Instead, output ONLY a JSON object with one of these shapes:\n  {\n    "call_functions": [ { "name": "<functionName>", "arguments": { ... } } ]\n  }\n  or for a single call:\n  {\n    "call_function": { "name": "<functionName>", "arguments": { ... } }\n  }\nValid function names: searchBooks, getBooksByCategory, getAvailableShelves, getCatalogStats, getBookDetails, generateBorrowLink.\nArguments must follow the provided schemas.\nIf no function is needed, reply normally with text.`;
      
      // Add PDF context if available (for follow-up questions)
      if (!fileData && pdfContext && pdfContext.extractedText) {
        const pdfInfo = `\n\n[Context: User previously uploaded a PDF file: ${pdfContext.name} (${pdfContext.pageCount} pages, ${pdfContext.wordCount} words)]\n\nPDF Content:\n${pdfContext.extractedText}`;
        userMessageContent = `${message}${pdfInfo}\n\nPlease answer the user's question based on the PDF content above.`;
        console.log("📄 Including PDF context in Qwen follow-up question");
      }
      // Add new PDF data if uploaded
      else if (fileData && fileData.mimeType === "application/pdf" && fileData.extractedText) {
        const pdfInfo = `\n\n[User uploaded a PDF file: ${fileData.name} (${fileData.pageCount} pages, ${fileData.wordCount} words)]\n\nExtracted PDF Content:\n${fileData.extractedText}`;
        userMessageContent = `${message}${pdfInfo}\n\nPlease analyze this PDF document and respond to the user's request. If they asked for a summary, provide a concise overview. If they asked for bullet points, create a structured list of key points.`;
      }
      
      const openaiMessages = [
        {
          role: "system",
          content: systemContext
        },
        {
          role: "system",
          content: toolCallingInstruction
        },
        ...chatHistory.map(msg => ({
          role: msg.role === "model" ? "assistant" : (msg.role === "user" ? "user" : "assistant"),
          content: msg.parts[0].text
        })),
        {
          role: "user",
          content: userMessageContent
        }
      ];

      // Use queue to handle concurrency limit of 1
      const queueLength = qwenQueue.getQueueLength();
      if (queueLength > 0) {
        console.log(`⏳ Qwen queue has ${queueLength} pending requests, waiting...`);
      }
      
      const { error, output } = await qwenQueue.add(async () => {
        return await bytezModel.run(openaiMessages, {
          temperature: 0.7,
          // Note: max_tokens not supported by this model on Bytez
        });
      });
      
      if (error) {
        throw new Error(error);
      }

        console.log("✅ GPT-4o responded successfully");
        
        // Extract text from output
        const responseText = typeof output === 'string' ? output : (output?.content || output);

        // Try to parse tool calls from GPT-4o
        const gptFunctionCalls = parseFunctionCallsFromText(responseText);

        let finalText = null;
        let borrowLinkResult = null;

        if (gptFunctionCalls && gptFunctionCalls.length > 0) {
          console.log(
            "Function calls (GPT-4o) detected:",
            gptFunctionCalls.map((c) => c.name)
          );

          // Deduplicate function calls
          const uniqueFunctionCalls = [];
          const seenCalls = new Set();
          for (const call of gptFunctionCalls) {
            const name = call.name;
            const args = call.arguments || call.args || {};
            const callKey = `${name}:${JSON.stringify(args)}`;
            if (!seenCalls.has(callKey)) {
              seenCalls.add(callKey);
              uniqueFunctionCalls.push({ name, args });
            }
          }

          const functionResponses = await Promise.all(
            uniqueFunctionCalls.map(async (call) => {
              const functionName = call.name;
              const args = call.args || {};
              console.log(`Calling function (GPT-4o): ${functionName} with args:`, args);
              let functionResult;
              try {
                switch (functionName) {
                  case "searchBooks":
                    functionResult = await searchBooks(db, args.query, args.status);
                    if (functionResult.totalMatches === 0) {
                      functionResult.suggestion = `No books found for "${args.query}". Consider trying:\n- Different keywords or synonyms\n- Broader search terms\n- Checking available categories with getAvailableShelves\n- Browsing related shelves`;
                    }
                    break;
                  case "getBooksByCategory":
                    functionResult = await getBooksByCategory(db, args.shelfCode);
                    if (functionResult.totalInShelf === 0) {
                      functionResult.suggestion = `Shelf "${args.shelfCode}" has no books. Use getAvailableShelves to see available shelves.`;
                    }
                    break;
                  case "getAvailableShelves":
                    functionResult = await getAvailableShelves(db);
                    break;
                  case "getCatalogStats":
                    functionResult = await getCatalogStats(db);
                    break;
                  case "getBookDetails":
                    functionResult = await getBookDetails(db, args.bookId);
                    break;
                  case "generateBorrowLink":
                    functionResult = await generateBorrowLink(db, args.bookId);
                    borrowLinkResult = functionResult;
                    break;
                  default:
                    functionResult = { error: "Unknown function" };
                }
              } catch (err) {
                console.error(`Error in function ${functionName}:`, err);
                functionResult = { error: err.message };
              }

              return {
                functionResponse: {
                  name: functionName,
                  response: functionResult,
                },
              };
            })
          );

          // Second round: provide function results back to GPT-4o to compose final message
          const followUpMessages = [
            {
              role: "system",
              content: systemContext,
            },
            {
              role: "system",
              content:
                "You previously requested function calls. Here are the JSON results. Use them to answer the user. Do not include raw JSON in your final reply.",
            },
            ...chatHistory.map((msg) => ({
              role: msg.role === "model" ? "assistant" : (msg.role === "user" ? "user" : "assistant"),
              content: msg.parts[0].text,
            })),
            {
              role: "assistant",
              content: `FUNCTION_RESULTS:\n${JSON.stringify(functionResponses, null, 2)}`,
            },
            {
              role: "user",
              content:
                "Using the function results above, provide the final answer following all response rules. Do not fabricate counts or details.",
            },
          ];

          const { error: fuErr, output: fuOutput } = await qwenQueue.add(async () => {
            return await bytezModel.run(followUpMessages, { temperature: 0.7 });
          });
          if (fuErr) throw new Error(fuErr);
          finalText = typeof fuOutput === "string" ? fuOutput : (fuOutput?.content || fuOutput);

          // Fallback to borrow message if empty
          if ((!finalText || finalText.trim().length === 0) && borrowLinkResult) {
            if (borrowLinkResult.formattedMessage) {
              finalText = borrowLinkResult.formattedMessage;
            } else if (borrowLinkResult.error) {
              finalText = `I encountered an error: ${borrowLinkResult.error}`;
            }
          }
        } else {
          // No function call requested; treat as final text
          finalText = responseText;
        }

        // Create a response-like object for consistency downstream
        response = {
          text: () => finalText,
          functionCalls: () => null,
        };
        
      } catch (openaiError) {
        console.warn("⚠️ GPT-4o failed or unavailable, falling back to Gemini:", openaiError.message);
        usingGemini = true;
      }
    }

    // Initialize Gemini if needed
    if (usingGemini) {
      model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096, // Increased for PDF analysis and detailed responses
        },
        tools,
      });
    }

    // Only use Gemini if OpenAI failed
    if (usingGemini) {
      console.log("🔄 Using Gemini 2.5 Flash as fallback");
      
      chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemContext }],
          },
          {
            role: "model",
            parts: [
              {
                text: "Understood. I'm LibraAI Assistant, ready to help students with library services, book recommendations, and literature questions.",
              },
            ],
          },
          ...chatHistory,
        ],
      });

      // Prepare message parts
      let messageParts = [{ text: message }];

      // Add file data if present (new upload)
      if (fileData) {
        if (fileData.mimeType === "application/pdf") {
          // Include extracted text if available
          if (fileData.extractedText) {
            const pdfInfo = `\n\n[User uploaded a PDF file: ${fileData.name} (${fileData.pageCount} pages, ${fileData.wordCount} words)]\n\nExtracted PDF Content:\n${fileData.extractedText}`;
            messageParts[0].text = `${message}${pdfInfo}\n\nPlease analyze this PDF document and respond to the user's request. If they asked for a summary, provide a concise overview. If they asked for bullet points, create a structured list of key points.`;
          } else {
            // Fallback to sending PDF as binary if text extraction failed
            messageParts.push({
              inlineData: {
                data: fileData.data,
                mimeType: fileData.mimeType,
              },
            });
            messageParts[0].text = `${message}\n\n[User uploaded a PDF file: ${fileData.name}. Text extraction failed: ${fileData.extractionError || 'Unknown error'}. Attempting to analyze the PDF directly.]`;
          }
        } else if (fileData.mimeType.startsWith("image/")) {
          messageParts.push({
            inlineData: {
              data: fileData.data,
              mimeType: fileData.mimeType,
            },
          });
          messageParts[0].text = `${message}\n\n[User uploaded an image: ${fileData.name}. Please analyze the image and help answer their question.]`;
        }
      }
      // If no new file but PDF context exists (follow-up question), include it
      else if (pdfContext && pdfContext.extractedText) {
        const pdfInfo = `\n\n[Context: User previously uploaded a PDF file: ${pdfContext.name} (${pdfContext.pageCount} pages, ${pdfContext.wordCount} words)]\n\nPDF Content:\n${pdfContext.extractedText}`;
        messageParts[0].text = `${message}${pdfInfo}\n\nPlease answer the user's question based on the PDF content above.`;
        console.log("📄 Including PDF context in follow-up question");
      }

      result = await chat.sendMessage(messageParts);
      response = result.response;
    }

    // Handle function calls (Gemini native only; GPT-4o handled above)
    const functionCalls = usingGemini ? response.functionCalls() : null;
    let borrowLinkResult = null;
    const executedFunctions = new Set(); // Track executed functions to prevent duplicates

    if (functionCalls && functionCalls.length > 0) {
      console.log(
        "Function calls detected:",
        functionCalls.map((c) => c.name)
      );

      // Deduplicate function calls
      const uniqueFunctionCalls = [];
      const seenCalls = new Set();
      
      for (const call of functionCalls) {
        const callKey = `${call.name}:${JSON.stringify(call.args)}`;
        if (!seenCalls.has(callKey)) {
          seenCalls.add(callKey);
          uniqueFunctionCalls.push(call);
        } else {
          console.log(`Skipping duplicate function call: ${callKey}`);
        }
      }

      const functionResponses = await Promise.all(
        uniqueFunctionCalls.map(async (call) => {
          const functionName = call.name;
          const args = call.args;

          console.log(`Calling function: ${functionName} with args:`, args);

          let functionResult;
          try {
            switch (functionName) {
              case "searchBooks":
                functionResult = await searchBooks(db, args.query, args.status);
                
                // Add helpful context if no results
                if (functionResult.totalMatches === 0) {
                  functionResult.suggestion = `No books found for "${args.query}". Consider trying:
- Different keywords or synonyms
- Broader search terms
- Checking available categories with getAvailableShelves
- Browsing related shelves`;
                }
                break;
              case "getBooksByCategory":
                functionResult = await getBooksByCategory(db, args.shelfCode);
                
                if (functionResult.totalInShelf === 0) {
                  functionResult.suggestion = `Shelf "${args.shelfCode}" has no books. Use getAvailableShelves to see available shelves.`;
                }
                break;
              case "getAvailableShelves":
                functionResult = await getAvailableShelves(db);
                break;
              case "getCatalogStats":
                functionResult = await getCatalogStats(db);
                break;
              case "getBookDetails":
                functionResult = await getBookDetails(db, args.bookId);
                break;
              case "generateBorrowLink":
                functionResult = await generateBorrowLink(db, args.bookId);
                borrowLinkResult = functionResult; // Store for fallback
                console.log("generateBorrowLink result:", functionResult);
                break;
              default:
                functionResult = { error: "Unknown function" };
            }
            
            executedFunctions.add(functionName);
          } catch (error) {
            console.error(`Error in function ${functionName}:`, error);
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
      console.log("Sending function responses back to model");
      result = await chat.sendMessage(functionResponses);
      response = result.response;
      console.log("Got response after function calls");
    }

    let text = response.text();

    // Debug logging
    console.log("Function calls:", functionCalls?.length || 0);
    console.log("Response text length:", text?.length || 0);
    console.log("Response text:", text);

    // Fallback if text is empty - use generateBorrowLink formattedMessage if available
    if ((!text || text.trim().length === 0) && borrowLinkResult) {
      console.warn(
        "Empty response from Gemini, using formattedMessage from generateBorrowLink"
      );
      if (borrowLinkResult.formattedMessage) {
        text = borrowLinkResult.formattedMessage;
      } else if (borrowLinkResult.error) {
        text = `I encountered an error: ${borrowLinkResult.error}`;
      }
    }

    // Final fallback
    if (!text || text.trim().length === 0) {
      console.warn("No text available, using generic fallback");
      text =
        "I apologize, but I'm having trouble generating a response. Please try rephrasing your question.";
    }

    // Log conversation to MongoDB
    const chatLogsCollection = db.collection("chat_logs");
    const logEntry = {
      userId: session?.user?.email || "anonymous",
      userName: session?.user?.name || "Anonymous User",
      conversationId: conversationId || null,
      userMessage: message,
      aiResponse: text,
      timestamp: new Date(),
      model: usingGemini ? "gemini-2.5-flash" : "openai/gpt-4o",
      messageCount: (history?.length || 0) + 2, // +2 for current exchange
      hasAttachment: !!fileData,
      attachmentType: fileData?.mimeType || null,
      attachmentName: fileData?.name || null,
    };

    await chatLogsCollection.insertOne(logEntry);

    // Mark previous similar queries as resolved (user got a satisfactory answer)
    // If user asks a different question, it means the previous one was answered
    if (history && history.length > 0) {
      const unansweredQueriesCollection = db.collection("unanswered_queries");
      
      // Get the last user message from history
      const lastUserMessages = history.filter(m => m.role === 'user');
      if (lastUserMessages.length > 0) {
        const lastUserMessage = lastUserMessages[lastUserMessages.length - 1].content;
        
        // If current message is different from last message, mark last as resolved
        if (lastUserMessage.toLowerCase().trim() !== message.toLowerCase().trim()) {
          await unansweredQueriesCollection.updateMany(
            {
              userId: session?.user?.email || "anonymous",
              query: { $regex: new RegExp(`^${lastUserMessage}$`, 'i') },
              conversationId: conversationId || null,
              resolved: false
            },
            {
              $set: {
                resolved: true,
                resolvedAt: new Date()
              }
            }
          );
        }
      }
    }

    // Include PDF metadata in response if a PDF was processed
    const responseData = {
      message: text,
      success: true,
      model: usingGemini ? "gemini-2.5-flash" : "openai/gpt-4o",
    };

    // If PDF was uploaded and extracted, include metadata for frontend
    if (fileData && fileData.mimeType === "application/pdf" && fileData.extractedText) {
      responseData.pdfMetadata = {
        name: fileData.name,
        pageCount: fileData.pageCount,
        wordCount: fileData.wordCount,
        extractedText: fileData.extractedText // Include full text for follow-up questions
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Chat API Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      {
        error: "Failed to get response from AI",
        message:
          "I'm having trouble connecting right now. Please try again in a moment.",
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
