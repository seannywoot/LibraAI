import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/student/notes - Get all notes for the current student
export async function GET(request) {
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

    // Get all notes for this student
    const notes = await db
      .collection("notes")
      .find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      notes: notes.map((note) => ({
        ...note,
        _id: note._id.toString(),
        userId: note.userId.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/student/notes - Create a new note
export async function POST(request) {
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

    const body = await request.json();
    const { title = "Untitled", content = "" } = body;

    const newNote = {
      userId: user._id,
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("notes").insertOne(newNote);

    console.log("[POST /api/student/notes] Created note:", {
      noteId: result.insertedId.toString(),
      userId: user._id.toString(),
      title,
    });

    return NextResponse.json({
      ok: true,
      note: {
        ...newNote,
        _id: result.insertedId.toString(),
        userId: newNote.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create note" },
      { status: 500 }
    );
  }
}
