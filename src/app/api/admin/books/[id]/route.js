import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    if (session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid book ID" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db("library");
    const books = db.collection("books");

    // Check if book exists
    const book = await books.findOne({ _id: new ObjectId(id) });
    if (!book) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Check if book is currently borrowed
    if (book.status === "checked-out") {
      return new Response(
        JSON.stringify({ ok: false, error: "Cannot delete a book that is currently checked out" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Delete the book
    const result = await books.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to delete book" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Book deleted successfully" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
