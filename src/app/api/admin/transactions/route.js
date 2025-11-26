import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendMail } from "@/lib/email";
import {
  buildRequestApprovedEmail,
  buildRequestDeniedEmail,
  buildReturnConfirmationEmail
} from "@/lib/email-templates";
import { parseSearchQuery, escapeRegex } from "@/utils/searchParser";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const skip = (page - 1) * pageSize;
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    // Build query
    const query = {};

    // By default, exclude archived transactions unless explicitly requested
    const showArchived = searchParams.get("showArchived") === "true";
    if (!showArchived) {
      query.archived = { $ne: true };
    }

    if (statusFilter) {
      query.status = statusFilter;
    }

    // Add search filter with advanced syntax support
    if (search) {
      const { filters, freeText } = parseSearchQuery(search);
      const orConditions = [];

      // Handle specific field filters
      if (filters.title) {
        orConditions.push({ bookTitle: { $regex: escapeRegex(filters.title), $options: "i" } });
      }
      if (filters.author) {
        orConditions.push({ bookAuthor: { $regex: escapeRegex(filters.author), $options: "i" } });
      }

      // Add free text search across all fields
      if (freeText) {
        const escapedText = escapeRegex(freeText);
        orConditions.push(
          { bookTitle: { $regex: escapedText, $options: "i" } },
          { bookAuthor: { $regex: escapedText, $options: "i" } },
          { userName: { $regex: escapedText, $options: "i" } },
          { userEmail: { $regex: escapedText, $options: "i" } }
        );
      }

      // If no specific filters, search all fields
      if (orConditions.length === 0) {
        const escapedSearch = escapeRegex(search);
        orConditions.push(
          { bookTitle: { $regex: escapedSearch, $options: "i" } },
          { bookAuthor: { $regex: escapedSearch, $options: "i" } },
          { userName: { $regex: escapedSearch, $options: "i" } },
          { userEmail: { $regex: escapedSearch, $options: "i" } }
        );
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    // Sort by archivedAt if showing archived, otherwise by requestedAt/borrowedAt
    const sortOrder = showArchived
      ? { archivedAt: -1, requestedAt: -1 }
      : { requestedAt: -1, borrowedAt: -1 };

    const [items, total] = await Promise.all([
      transactions.find(query).sort(sortOrder).skip(skip).limit(pageSize).toArray(),
      transactions.countDocuments(query),
    ]);

    return new Response(
      JSON.stringify({ ok: true, items, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List transactions failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { transactionId, action, dueDate, reason, bookCondition, conditionNotes } = body;

    if (!transactionId || !ObjectId.isValid(transactionId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid transaction ID is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (!action || typeof action !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "Action is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const normalizedAction = action.toLowerCase();

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");
    const books = db.collection("books");

    const transaction = await transactions.findOne({ _id: new ObjectId(transactionId) });

    if (!transaction) {
      return new Response(
        JSON.stringify({ ok: false, error: "Transaction not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    const now = new Date();
    const bookObjectId = transaction.bookId instanceof ObjectId ? transaction.bookId : new ObjectId(transaction.bookId);

    if (normalizedAction === "approve") {
      if (transaction.status !== "pending-approval") {
        return new Response(
          JSON.stringify({ ok: false, error: "Only pending transactions can be approved" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const fallbackLoanDays = transaction.requestedLoanDays ?? (transaction.loanPolicy === "short-loan" ? 3 : 14);
      const fallbackDueDate = new Date(now.getTime() + fallbackLoanDays * 24 * 60 * 60 * 1000);
      const parsedDueDate = dueDate ? new Date(dueDate) : transaction.requestedDueDate ? new Date(transaction.requestedDueDate) : fallbackDueDate;

      if (Number.isNaN(parsedDueDate?.getTime())) {
        return new Response(
          JSON.stringify({ ok: false, error: "Provided due date is invalid" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      await Promise.all([
        transactions.updateOne(
          { _id: transaction._id },
          {
            $set: {
              status: "borrowed",
              borrowedAt: now,
              dueDate: parsedDueDate,
              approvedAt: now,
              approvedBy: session.user?.email,
              updatedAt: now,
            },
            $unset: {
              requestedDueDate: "",
              returnRequestedAt: "",
              rejectionReason: "",
            },
          }
        ),
        books.updateOne(
          { _id: bookObjectId },
          {
            $set: { status: "checked-out", updatedAt: now },
            $unset: { reservedFor: "", reservedAt: "" },
          }
        ),
      ]);

      // Send approval email notification
      try {
        const users = db.collection("users");
        const user = await users.findOne({ email: transaction.userId });

        // Only send if user has notifications enabled
        if (!user || user.emailNotifications !== false) {
          const book = await books.findOne({ _id: bookObjectId });

          if (book) {
            const formatDate = (date) => {
              return new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC"
              });
            };

            const emailData = buildRequestApprovedEmail({
              studentName: user?.name || "Student",
              toEmail: transaction.userId,
              bookTitle: book.title,
              bookAuthor: book.author,
              dueDate: formatDate(parsedDueDate),
              viewBorrowedUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/student/library`,
              libraryName: "LibraAI Library",
              supportEmail: process.env.EMAIL_FROM || "support@libra.ai",
            });

            await sendMail({
              to: transaction.userId,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
              templateParams: emailData.templateParams,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the transaction if email fails
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Transaction approved" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (normalizedAction === "reject") {
      if (transaction.status !== "pending-approval") {
        return new Response(
          JSON.stringify({ ok: false, error: "Only pending transactions can be rejected" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const rejectionReason = typeof reason === "string" ? reason.trim() : "";

      if (!rejectionReason) {
        return new Response(
          JSON.stringify({ ok: false, error: "Rejection reason is required" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      if (rejectionReason.length > 100) {
        return new Response(
          JSON.stringify({ ok: false, error: "Rejection reason must be 100 characters or fewer" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      await Promise.all([
        transactions.updateOne(
          { _id: transaction._id },
          {
            $set: {
              status: "rejected",
              rejectedAt: now,
              rejectedBy: session.user?.email,
              rejectionReason,
              updatedAt: now,
            },
            $unset: {
              requestedDueDate: "",
              returnRequestedAt: "",
            },
          }
        ),
        books.updateOne(
          { _id: bookObjectId },
          {
            $set: { status: "available", updatedAt: now },
            $unset: { reservedFor: "", reservedAt: "" },
          }
        ),
      ]);

      // Send rejection email notification
      try {
        const users = db.collection("users");
        const user = await users.findOne({ email: transaction.userId });

        // Only send if user has notifications enabled
        if (!user || user.emailNotifications !== false) {
          const book = await books.findOne({ _id: bookObjectId });

          if (book) {
            const emailData = buildRequestDeniedEmail({
              studentName: user?.name || "Student",
              toEmail: transaction.userId,
              bookTitle: book.title,
              bookAuthor: book.author,
              reason: rejectionReason, // Admin-provided reason
              browseUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/student/books`,
              libraryName: "LibraAI Library",
              supportEmail: process.env.EMAIL_FROM || "support@libra.ai",
            });

            await sendMail({
              to: transaction.userId,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
              templateParams: emailData.templateParams,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Don't fail the transaction if email fails
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Transaction rejected" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (normalizedAction === "return") {
      if (!["return-requested", "borrowed"].includes(transaction.status)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Only active transactions can be completed" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      // Validate book condition if provided
      const validConditions = ["good", "fair", "damaged"];
      const condition = bookCondition && validConditions.includes(bookCondition) ? bookCondition : "good";
      const notes = typeof conditionNotes === "string" ? conditionNotes.trim() : "";

      // Prepare transaction update
      const transactionUpdate = {
        status: "returned",
        returnedAt: now,
        returnProcessedAt: now,
        returnProcessedBy: session.user?.email,
        bookCondition: condition,
        updatedAt: now,
      };

      if (notes) {
        transactionUpdate.conditionNotes = notes;
      }

      // Prepare book update - mark as damaged if condition is damaged
      const bookUpdate = {
        status: condition === "damaged" ? "damaged" : "available",
        updatedAt: now,
      };

      await Promise.all([
        transactions.updateOne(
          { _id: transaction._id },
          {
            $set: transactionUpdate,
            $unset: {
              rejectionReason: "",
            },
          }
        ),
        books.updateOne(
          { _id: bookObjectId },
          {
            $set: bookUpdate,
            $unset: { reservedFor: "", reservedAt: "" },
          }
        ),
      ]);

      // Send return confirmation email
      try {
        const users = db.collection("users");
        const user = await users.findOne({ email: transaction.userId });

        // Only send if user has notifications enabled
        if (!user || user.emailNotifications !== false) {
          const book = await books.findOne({ _id: bookObjectId });

          if (book) {
            const formatDate = (date, useLocalTime = false) => {
              return new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: useLocalTime ? "Asia/Manila" : "UTC"
              });
            };

            const emailData = buildReturnConfirmationEmail({
              studentName: user?.name || "Student",
              toEmail: transaction.userId,
              bookTitle: book.title,
              bookAuthor: book.author,
              borrowDate: transaction.borrowedAt ? formatDate(transaction.borrowedAt, true) : "",
              returnDate: formatDate(now, true),
              bookCondition: condition,
              conditionNotes: notes,
              viewHistoryUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/student/library`,
              libraryName: "LibraAI Library",
              supportEmail: process.env.EMAIL_FROM || "support@libra.ai",
            });

            await sendMail({
              to: transaction.userId,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
              templateParams: emailData.templateParams,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send return confirmation email:", emailError);
        // Don't fail the transaction if email fails
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Return completed" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (normalizedAction === "archive") {
      if (!["rejected", "returned"].includes(transaction.status)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Only rejected or returned transactions can be archived" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      await transactions.updateOne(
        { _id: transaction._id },
        {
          $set: {
            archived: true,
            archivedAt: now,
            archivedBy: session.user?.email,
            updatedAt: now,
          },
        }
      );

      return new Response(
        JSON.stringify({ ok: true, message: "Transaction archived" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: "Unsupported action" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Update transaction failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
