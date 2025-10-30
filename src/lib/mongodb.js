import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment. Add it to .env.local");
}

// Re-use the client connection in dev to avoid creating multiple connections during hot reloads
let client;
let clientPromise;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper to get a db instance by name; defaults to the database from the URI
export async function getDb(dbName) {
  const client = await clientPromise;
  return client.db(dbName);
}
