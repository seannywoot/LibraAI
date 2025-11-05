import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    console.log('[TEST-DB] Attempting MongoDB connection...');
    console.log('[TEST-DB] MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    const client = await clientPromise;
    const db = client.db();
    
    console.log('[TEST-DB] Connected successfully!');
    
    // Try a simple query
    const users = await db.collection("users").countDocuments();
    
    return Response.json({
      ok: true,
      message: "MongoDB connected successfully",
      usersCount: users,
      dbName: db.databaseName
    });
  } catch (error) {
    console.error('[TEST-DB] Connection failed:', error);
    return Response.json({
      ok: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
