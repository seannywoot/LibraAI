import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST() {
  try {
    const db = await getDb();
    const faqCollection = db.collection("faqs");

    // Clear existing FAQs
    await faqCollection.deleteMany({});

    const faqData = [
      // Borrowing
      {
        question: "How many books can I borrow at once?",
        answer: "Up to 5 books for 7 days. You can renew your books up to 3 times if no one else has placed a hold on them.",
        category: "borrowing",
        keywords: ["borrow", "limit", "books", "renew", "renewal"],
      },
      {
        question: "What happens if I return a book late?",
        answer: "Late returns incur a fine of $0.25 per day per book. After 30 days, the book is considered lost and you will be charged the replacement cost plus a processing fee.",
        category: "borrowing",
        keywords: ["late", "fine", "fee", "overdue", "penalty"],
      },
      {
        question: "Can I place holds on books that are checked out?",
        answer: "Yes! You can place holds on any book that is currently checked out. You'll receive an email notification when the book becomes available for pickup.",
        category: "borrowing",
        keywords: ["hold", "reserve", "checked out", "notification"],
      },
      {
        question: "How do I renew my library card?",
        answer: "Library cards are valid for one year. You can renew your card online through your profile page or visit the circulation desk with a valid ID.",
        category: "borrowing",
        keywords: ["library card", "renew", "card", "valid", "ID"],
      },
      // Hours
      {
        question: "What are the library's operating hours?",
        answer: "Monday-Friday: 8:00 AM - 10:00 PM, Saturday: 10:00 AM - 6:00 PM, Sunday: 12:00 PM - 8:00 PM. Hours may vary during holidays and exam periods.",
        category: "hours",
        keywords: ["hours", "open", "close", "schedule", "time"],
      },
      {
        question: "Is the library open during holidays?",
        answer: "The library has reduced hours during major holidays. Please check our website or contact us for specific holiday schedules.",
        category: "hours",
        keywords: ["holiday", "closed", "schedule", "hours"],
      },
      // Facilities
      {
        question: "Are there printing services available?",
        answer: "Yes, we offer black & white printing at $0.10 per page and color printing at $0.50 per page. You can print from library computers or send documents to our print queue.",
        category: "facilities",
        keywords: ["print", "printing", "cost", "price", "black and white", "color"],
      },
      {
        question: "Can I access digital resources from home?",
        answer: "Absolutely! All students can access our digital collection, including e-books, journals, and databases from anywhere using their library credentials.",
        category: "facilities",
        keywords: ["digital", "online", "remote", "ebooks", "journals", "databases"],
      },
      {
        question: "Is there WiFi available in the library?",
        answer: "Yes, free high-speed WiFi is available throughout the library. Connect to the 'LibraryWiFi' network using your student credentials.",
        category: "facilities",
        keywords: ["wifi", "internet", "wireless", "network"],
      },
      // Policies
      {
        question: "What is the food and drink policy?",
        answer: "Covered beverages are allowed in all areas. Food is permitted in designated areas only. Please help us keep the library clean for everyone.",
        category: "policies",
        keywords: ["food", "drink", "beverage", "eating", "policy"],
      },
      {
        question: "Can I reserve study rooms?",
        answer: "Yes, study rooms can be reserved up to 7 days in advance through our online booking system. Reservations are limited to 2 hours per day.",
        category: "policies",
        keywords: ["study room", "reserve", "booking", "room"],
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
