import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/student/notes/[noteId] - Get a specific note
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("library");

    // Get user
    const user = await db.collection("users").findOne({
      email: session.user.email,
      role: "student",
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;
    const noteId = resolvedParams.noteId;
    
    console.log("[GET /api/student/notes/[noteId]] Request:", {
      noteId,
      userId: user._id.toString(),
      isValidObjectId: ObjectId.isValid(noteId),
    });

    if (!ObjectId.isValid(noteId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid note ID" },
        { status: 400 }
      );
    }

    const note = await db.collection("notes").findOne({
      _id: new ObjectId(noteId),
      userId: user._id,
    });

    console.log("[GET /api/student/notes/[noteId]] Found note:", !!note);

    if (!note) {
      return NextResponse.json(
        { ok: false, error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      note: {
        ...note,
        _id: note._id.toString(),
        userId: note.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

// PUT /api/student/notes/[noteId] - Update a note
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("library");

    // Get user
    const user = await db.collection("users").findOne({
      email: session.user.email,
      role: "student",
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;
    const noteId = resolvedParams.noteId;
    if (!ObjectId.isValid(noteId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid note ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content } = body;

    const updateData = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const result = await db.collection("notes").findOneAndUpdate(
      {
        _id: new ObjectId(noteId),
        userId: user._id,
      },
      { $set: updateData },
      { returnDocument: "after" }
    );

    console.log("[PUT /api/student/notes/[noteId]] Update result:", {
      hasResult: !!result,
      noteId,
      userId: user._id.toString(),
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      note: {
        ...result,
        _id: result._id.toString(),
        userId: result.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE /api/student/notes/[noteId] - Delete a note
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("library");

    // Get user
    const user = await db.collection("users").findOne({
      email: session.user.email,
      role: "student",
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;
    const noteId = resolvedParams.noteId;
    if (!ObjectId.isValid(noteId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid note ID" },
        { status: 400 }
      );
    }

    const result = await db.collection("notes").deleteOne({
      _id: new ObjectId(noteId),
      userId: user._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
