import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST() {
  try {
    const db = await getDb();
    const faqCollection = db.collection("faqs");

    // Clear existing FAQs
    await faqCollection.deleteMany({});

    const faqData = [
      // General Overview
      {
        question: "What is LibraAI?",
        answer: "LibraAI is an AI-powered Smart Library Assistant that helps users search, recommend, and manage books through intelligent chat-based interaction. It's designed to make research faster, smarter, and more personalized.",
        category: "general",
        keywords: ["libraai", "overview", "ai", "assistant", "library"],
      },
      {
        question: "Why was LibraAI created?",
        answer: "It was developed to address common library challenges — such as time-consuming manual searches, lack of personalization, and limited accessibility — by using modern AI technology to improve how students and librarians interact with library systems.",
        category: "general",
        keywords: ["purpose", "created", "why", "challenges"],
      },
      {
        question: "Who can access LibraAI?",
        answer: "Anyone! LibraAI is available to students, librarians, and faculty members within a specific institution. You just need to create your library and share it with others. Guest access may be added in future updates.",
        category: "general",
        keywords: ["access", "who", "users", "students", "librarians"],
      },
      {
        question: "Is LibraAI available on mobile devices?",
        answer: "Yes! LibraAI is fully responsive — it works on laptops, tablets, and smartphones without needing any installation.",
        category: "general",
        keywords: ["mobile", "responsive", "devices", "smartphone", "tablet"],
      },
      {
        question: "Can LibraAI work offline?",
        answer: "Not yet. Because LibraAI relies on a cloud-based MongoDB and AI API, an internet connection is required to use its full features.",
        category: "general",
        keywords: ["offline", "internet", "connection", "cloud"],
      },
      // Student / User Questions
      {
        question: "How can I search for books efficiently?",
        answer: "You can use keywords or natural language — for example: 'Find me research papers about data analytics published in 2022.' LibraAI understands context and filters results automatically.",
        category: "student",
        keywords: ["search", "books", "efficient", "keywords", "natural language"],
      },
      {
        question: "Can I filter search results by author or subject?",
        answer: "Yes! The search bar supports filters such as: author: J.K. Rowling, subject: Artificial Intelligence, year: 2023.",
        category: "student",
        keywords: ["filter", "author", "subject", "search", "results"],
      },
      {
        question: "How does the AI chatbot help me?",
        answer: "The AI chatbot can answer frequently asked library questions, recommend books, help you locate resources, assist with citations and references, and guide you in using library services.",
        category: "student",
        keywords: ["chatbot", "ai", "help", "recommend", "citations"],
      },
      {
        question: "Can I favorite or bookmark books?",
        answer: "Yes. You can click the ⭐ 'Add to Favorites' button to keep track of books or papers you plan to read later.",
        category: "student",
        keywords: ["favorite", "bookmark", "save", "track"],
      },
      {
        question: "How do I make notes while reading?",
        answer: "You can use the Notes Panel, which looks like Notion. Your notes are saved automatically, and you can export them to PDF, DOCX, or Markdown anytime.",
        category: "student",
        keywords: ["notes", "reading", "export", "notion", "save"],
      },
      {
        question: "What if I forget my password?",
        answer: "You can click 'Forgot Password?' on the login page. A reset link will be sent to your registered email.",
        category: "student",
        keywords: ["password", "forgot", "reset", "email"],
      },
      {
        question: "Can I request new books through LibraAI?",
        answer: "Yes! Use the Borrow option, and your librarian will review and approve it based on availability or demand.",
        category: "student",
        keywords: ["request", "books", "borrow", "librarian", "approval"],
      },
      // Librarian / Admin Questions
      {
        question: "What can librarians manage in the system?",
        answer: "Librarians can add, edit, or delete books; manage users and roles; view analytics and most searched topics; handle user requests and unanswered chatbot queries; and upload digital copies or metadata.",
        category: "admin",
        keywords: ["librarian", "manage", "admin", "books", "users", "analytics"],
      },
      {
        question: "How can librarians handle user feedback?",
        answer: "All chatbot feedback and book requests appear in the Feedback Center, where librarians can approve, reject, or respond to user inputs.",
        category: "admin",
        keywords: ["feedback", "librarian", "approve", "reject", "respond"],
      },
      // AI & Behavior Questions
      {
        question: "How does the chatbot learn new information?",
        answer: "When users ask unanswered questions, librarians can feed those into the FAQ Manager. LibraAI retrains its FAQ dataset periodically.",
        category: "ai",
        keywords: ["chatbot", "learn", "faq", "training", "questions"],
      },
      {
        question: "Does LibraAI replace librarians?",
        answer: "No — it assists, not replaces. Librarians still manage physical collections, verify AI data, and maintain system integrity.",
        category: "ai",
        keywords: ["replace", "librarians", "assist", "role"],
      },
      {
        question: "Can LibraAI summarize PDFs or research papers?",
        answer: "Yes! Users can upload a PDF, and LibraAI generates a summary, keywords, and highlights using its NLP (Natural Language Processing) model.",
        category: "ai",
        keywords: ["summarize", "pdf", "research", "nlp", "upload"],
      },
      {
        question: "Does LibraAI support multiple languages?",
        answer: "Currently, LibraAI supports English, but future updates may include Tagalog and other languages for accessibility.",
        category: "ai",
        keywords: ["languages", "multilingual", "english", "tagalog"],
      },
      {
        question: "Can LibraAI detect plagiarism?",
        answer: "In later updates, LibraAI will include a plagiarism detection module using API integration to help students ensure originality in reports or theses.",
        category: "ai",
        keywords: ["plagiarism", "detection", "originality", "future"],
      },
      // Troubleshooting & Support
      {
        question: "The chatbot isn't responding — what should I do?",
        answer: "Check your internet connection and refresh the page. If the issue continues, contact support at support@libraai.edu.ph.",
        category: "support",
        keywords: ["chatbot", "not responding", "troubleshoot", "support"],
      },
      {
        question: "My uploaded file didn't process. Why?",
        answer: "Ensure your file is in PDF, DOCX, or TXT format and under the 50MB limit. Cloudinary might reject larger uploads.",
        category: "support",
        keywords: ["upload", "file", "error", "format", "size"],
      },
      {
        question: "The dashboard isn't loading properly.",
        answer: "Clear your browser cache or try using Google Chrome or Edge. The system is optimized for modern browsers.",
        category: "support",
        keywords: ["dashboard", "loading", "browser", "cache"],
      },
      {
        question: "Who do I contact for technical issues?",
        answer: "You can email the development team or librarian support through the 'Email Us' button inside the system.",
        category: "support",
        keywords: ["contact", "technical", "support", "email"],
      },
      {
        question: "Can LibraAI recommend books by academic course?",
        answer: "Yes! Future updates will allow course-based filtering.",
        category: "support",
        keywords: ["recommend", "course", "academic", "filter", "future"],
      },
      {
        question: "Will AI voice assistant be added?",
        answer: "Voice search and read-aloud features are planned for accessibility in future versions.",
        category: "support",
        keywords: ["voice", "assistant", "accessibility", "future"],
      },
      // Library Hours & Facilities
      {
        question: "What are the library's operating hours?",
        answer: "The library is open from 8:00 AM to 6:00 PM, Monday through Friday. Weekend hours may vary depending on academic schedules or special events.",
        category: "hours",
        keywords: ["hours", "open", "schedule", "time", "operating"],
      },
      {
        question: "Is the library open during holidays?",
        answer: "No. The library is closed on official holidays and campus breaks. However, LibraAI's online catalog and chatbot remain available 24/7.",
        category: "hours",
        keywords: ["holidays", "closed", "online", "catalog"],
      },
      {
        question: "Can I access the library facilities without a library card?",
        answer: "Yes, you may enter the library to browse. However, a valid library card or student ID is required to borrow books.",
        category: "facilities",
        keywords: ["access", "library card", "browse", "borrow"],
      },
      {
        question: "What facilities are available in the library?",
        answer: "The library offers quiet study areas and reading zones, computers for digital access, and Wi-Fi access.",
        category: "facilities",
        keywords: ["facilities", "study", "computers", "wifi"],
      },
      // Borrowing & Returns
      {
        question: "How many books can I borrow at once?",
        answer: "Students can borrow up to 5 books at a time for 7 days. Faculty members may borrow up to 10 books for 14 days.",
        category: "borrowing",
        keywords: ["borrow", "limit", "books", "students", "faculty"],
      },
      {
        question: "What happens if I return a book late?",
        answer: "Late returns are subject to a fine of ₱5.00 per day per item. You won't be able to borrow new books until fines are cleared.",
        category: "borrowing",
        keywords: ["late", "fine", "return", "overdue"],
      },
      {
        question: "How do I renew borrowed books?",
        answer: "Go to 'My Borrowed Books' in LibraAI and click 'Renew' next to the title. Renewals are allowed once, provided there are no holds from other users.",
        category: "borrowing",
        keywords: ["renew", "borrowed", "books", "holds"],
      },
      {
        question: "What if the book I borrowed is damaged or lost?",
        answer: "Report it immediately to the librarian. You may be asked to replace the book or pay the current market value plus processing fees.",
        category: "borrowing",
        keywords: ["damaged", "lost", "replace", "report"],
      },
      {
        question: "Can I borrow reference or reserved books?",
        answer: "Reference and reserved materials are for in-library use only, but some may be borrowed for short-term use with librarian approval.",
        category: "borrowing",
        keywords: ["reference", "reserved", "in-library", "approval"],
      },
      // Library Policies
      {
        question: "Can I eat or drink inside the library?",
        answer: "Food is not allowed, but water in sealed containers is permitted.",
        category: "policies",
        keywords: ["food", "drink", "water", "policy"],
      },
      {
        question: "What are the rules for using library computers?",
        answer: "Computers are for academic and research use only. Users must log in with their student credentials and log out after use.",
        category: "policies",
        keywords: ["computers", "rules", "academic", "login"],
      },
      {
        question: "Can I bring my laptop to the library?",
        answer: "Absolutely! Free Wi-Fi and charging stations are provided in designated areas.",
        category: "policies",
        keywords: ["laptop", "wifi", "charging", "bring"],
      },
      {
        question: "What happens if I violate library rules?",
        answer: "Depending on the offense, you may face a temporary suspension of privileges, fines, or disciplinary actions as per school policy.",
        category: "policies",
        keywords: ["violate", "rules", "suspension", "disciplinary"],
      },
      {
        question: "Are eBooks available in LibraAI?",
        answer: "Yes! LibraAI includes a digital collection of eBooks and PDFs that can be accessed directly online.",
        category: "policies",
        keywords: ["ebooks", "digital", "pdf", "online"],
      },
    ];

    // Add timestamps to each FAQ
    const faqsWithTimestamps = faqData.map(faq => ({
      ...faq,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await faqCollection.insertMany(faqsWithTimestamps);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.insertedCount} FAQs`,
      count: result.insertedCount,
    });
  } catch (error) {
    console.error("FAQ seed error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed FAQs" },
      { status: 500 }
    );
  }
}
