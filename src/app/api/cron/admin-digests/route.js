import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { 
  buildOverdueBooksDigestEmail, 
  buildPendingRequestsDigestEmail 
} from "@/lib/admin-email-templates";
import { sendMail } from "@/lib/email";

// This cron job sends daily digest emails to admins:
// - Overdue books summary
// - Pending borrow requests summary
// Recommended schedule: Daily at 8:00 AM

async function getAdminEmails() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    
    const admins = await db.collection('users')
      .find({ 
        role: 'admin',
        emailNotifications: { $ne: false }
      })
      .toArray();
    
    const emails = admins.map(admin => ({
      email: admin.email,
      name: admin.name || 'Admin'
    })).filter(admin => admin.email);
    
    if (emails.length === 0) {
      console.warn('[Admin Digests] No admin users found with email notifications enabled.');
      
      const fallbackEmail = process.env.ADMIN_EMAIL;
      if (fallbackEmail && fallbackEmail !== 'admin@libra.ai') {
        return [{ email: fallbackEmail, name: 'Admin' }];
      }
    }
    
    console.log(`[Admin Digests] Found ${emails.length} admin(s) to notify`);
    return emails;
  } catch (error) {
    console.error('[Admin Digests] Error fetching admin emails:', error);
    
    const fallbackEmail = process.env.ADMIN_EMAIL;
    if (fallbackEmail && fallbackEmail !== 'admin@libra.ai') {
      return [{ email: fallbackEmail, name: 'Admin' }];
    }
    
    return [];
  }
}

export async function GET(request) {
  try {
    // Verify cron secret for security
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

    // Get admin emails
    const admins = await getAdminEmails();
    if (admins.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "No admin emails configured",
        timestamp: now.toISOString(),
      });
    }

    const results = {
      overdueDigest: { sent: 0, errors: [] },
      pendingDigest: { sent: 0, errors: [] },
    };

    // ========================================================================
    // 1. OVERDUE BOOKS DIGEST
    // ========================================================================

    // Find all overdue borrowed books
    const overdueTransactions = await transactions
      .find({ 
        status: "borrowed",
        dueDate: { $lt: today }
      })
      .toArray();

    console.log(`[Admin Digests] Found ${overdueTransactions.length} overdue books`);

    // Enrich with book and user details
    const overdueBooks = [];
    for (const transaction of overdueTransactions) {
      try {
        const bookId = transaction.bookId instanceof ObjectId 
          ? transaction.bookId 
          : new ObjectId(transaction.bookId);
        
        const book = await books.findOne({ _id: bookId });
        const user = await users.findOne({ email: transaction.userId });

        if (book) {
          const dueDate = new Date(transaction.dueDate);
          const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

          overdueBooks.push({
            bookTitle: book.title,
            bookAuthor: book.author || 'Unknown Author',
            userName: user?.name || 'Unknown User',
            userEmail: transaction.userId,
            dueDate: dueDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            daysOverdue,
          });
        }
      } catch (error) {
        console.error(`Error processing overdue transaction ${transaction._id}:`, error);
      }
    }

    // Sort by days overdue (most overdue first)
    overdueBooks.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Send overdue digest to each admin
    for (const admin of admins) {
      try {
        const emailData = buildOverdueBooksDigestEmail({
          adminEmail: admin.email,
          overdueBooks,
          dashboardUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/transactions?status=borrowed`,
          libraryName: "LibraAI Library",
        });

        await sendMail({
          to: admin.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          templateParams: emailData.templateParams,
        });

        console.log(`✅ Overdue digest sent to ${admin.email}`);
        results.overdueDigest.sent++;
      } catch (error) {
        console.error(`❌ Failed to send overdue digest to ${admin.email}:`, error);
        results.overdueDigest.errors.push({
          email: admin.email,
          error: error.message,
        });
      }
    }

    // ========================================================================
    // 2. PENDING BORROW REQUESTS DIGEST
    // ========================================================================

    // Find all pending borrow requests
    const pendingTransactions = await transactions
      .find({ status: "pending-approval" })
      .sort({ requestedAt: 1 }) // Oldest first
      .toArray();

    console.log(`[Admin Digests] Found ${pendingTransactions.length} pending requests`);

    // Enrich with book and user details
    const pendingRequests = [];
    for (const transaction of pendingTransactions) {
      try {
        const bookId = transaction.bookId instanceof ObjectId 
          ? transaction.bookId 
          : new ObjectId(transaction.bookId);
        
        const book = await books.findOne({ _id: bookId });
        const user = await users.findOne({ email: transaction.userId });

        if (book) {
          const requestedAt = new Date(transaction.requestedAt);
          const daysWaiting = Math.floor((now - requestedAt) / (1000 * 60 * 60 * 24));

          pendingRequests.push({
            bookTitle: book.title,
            bookAuthor: book.author || 'Unknown Author',
            userName: user?.name || 'Unknown User',
            userEmail: transaction.userId,
            requestedAt: requestedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            daysWaiting,
          });
        }
      } catch (error) {
        console.error(`Error processing pending transaction ${transaction._id}:`, error);
      }
    }

    // Already sorted by requestedAt (oldest first)

    // Send pending requests digest to each admin
    for (const admin of admins) {
      try {
        const emailData = buildPendingRequestsDigestEmail({
          adminEmail: admin.email,
          pendingRequests,
          dashboardUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/transactions?status=pending-approval`,
          libraryName: "LibraAI Library",
        });

        await sendMail({
          to: admin.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          templateParams: emailData.templateParams,
        });

        console.log(`✅ Pending requests digest sent to ${admin.email}`);
        results.pendingDigest.sent++;
      } catch (error) {
        console.error(`❌ Failed to send pending digest to ${admin.email}:`, error);
        results.pendingDigest.errors.push({
          email: admin.email,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Admin digests processed",
      results: {
        admins: admins.length,
        overdueBooks: overdueBooks.length,
        pendingRequests: pendingRequests.length,
        overdueDigest: results.overdueDigest,
        pendingDigest: results.pendingDigest,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Admin digests cron job error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
