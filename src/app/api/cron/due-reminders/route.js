import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { buildDueReminderEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/email";

// This cron job sends due date reminders at:
// - 7 days before due (week reminder)
// - 3 days before due (three_days reminder)
// - 0-1 day before due (one_day_or_due reminder)

export async function GET(request) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");
    const users = db.collection("users");
    const books = db.collection("books");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate target dates for each reminder phase
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Find all borrowed books
    const borrowedTransactions = await transactions
      .find({ status: "borrowed" })
      .toArray();

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [],
    };

    for (const transaction of borrowedTransactions) {
      results.processed++;

      try {
        // Get user preferences
        const user = await users.findOne({ email: transaction.userId });
        
        // Skip if user has disabled email notifications
        if (user && user.emailNotifications === false) {
          results.skipped++;
          continue;
        }

        const dueDate = new Date(transaction.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        // Determine which phase this transaction falls into
        let phase = null;
        let daysUntilDue = null;

        if (dueDateOnly.getTime() === sevenDaysFromNow.getTime()) {
          phase = "week";
          daysUntilDue = 7;
        } else if (dueDateOnly.getTime() === threeDaysFromNow.getTime()) {
          phase = "three_days";
          daysUntilDue = 3;
        } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
          phase = "one_day_or_due";
          daysUntilDue = 1;
        } else if (dueDateOnly.getTime() === today.getTime()) {
          phase = "one_day_or_due";
          daysUntilDue = 0;
        }

        // Skip if not in any reminder window
        if (!phase) {
          console.log(`Skipping transaction ${transaction._id}: due date ${dueDateOnly.toISOString().split('T')[0]} not in reminder window`);
          continue;
        }
        
        console.log(`Processing transaction ${transaction._id}: phase=${phase}, daysUntilDue=${daysUntilDue}`);

        // Get book details
        const bookId = transaction.bookId instanceof ObjectId 
          ? transaction.bookId 
          : new ObjectId(transaction.bookId);
        
        const book = await books.findOne({ _id: bookId });
        if (!book) {
          results.errors.push(`Book not found for transaction ${transaction._id}`);
          continue;
        }

        // Format dates for display
        const formatDate = (date) => {
          return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        };

        // Build email content
        const emailData = buildDueReminderEmail({
          phase,
          studentName: user?.name || "Student",
          toEmail: transaction.userId,
          bookTitle: book.title,
          bookAuthor: book.author,
          borrowDate: formatDate(transaction.borrowedAt),
          dueDate: formatDate(transaction.dueDate),
          daysUntilDue,
          viewBorrowedUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/student/library`,
          libraryName: "LibraAI Library",
          supportEmail: process.env.EMAIL_FROM || "support@libra.ai",
        });

        // Send email via EmailJS
        await sendMail({
          to: transaction.userId,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          templateParams: emailData.templateParams,
          templateId: process.env.EMAILJS_DUE_TEMPLATE_ID,
        });

        results.sent++;
      } catch (error) {
        console.error(`Error processing transaction ${transaction._id}:`, error);
        const errorMsg = error?.message || error?.toString() || JSON.stringify(error);
        results.errors.push(`Transaction ${transaction._id}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Due reminders processed",
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
