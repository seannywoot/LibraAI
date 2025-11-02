import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    const query = statusFilter ? { status: statusFilter } : {};

    const [items, total] = await Promise.all([
      transactions.find(query).sort({ requestedAt: -1, borrowedAt: -1 }).skip(skip).limit(pageSize).toArray(),
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
    const { transactionId, action, dueDate } = body;

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
            $set: { status: "checked-out", updatedAt: now },
            $unset: { reservedFor: "", reservedAt: "" },
          }
        ),
      ]);

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

      await Promise.all([
        transactions.updateOne(
          { _id: transaction._id },
          {
            $set: {
              status: "rejected",
              rejectedAt: now,
              rejectedBy: session.user?.email,
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

      await Promise.all([
        transactions.updateOne(
          { _id: transaction._id },
          {
            $set: {
              status: "returned",
              returnedAt: now,
              returnProcessedAt: now,
              returnProcessedBy: session.user?.email,
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

      return new Response(
        JSON.stringify({ ok: true, message: "Return completed" }),
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
