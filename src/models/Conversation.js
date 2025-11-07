/**
 * Conversation Model
 * 
 * Defines the schema and indexes for chat conversations stored in MongoDB.
 * This model uses the native MongoDB driver (not Mongoose).
 */

import { getDefaultDb } from '../lib/mongodb.js';

const COLLECTION_NAME = 'conversations';

/**
 * Get the conversations collection
 * @returns {Promise<Collection>} MongoDB collection instance
 */
export async function getConversationsCollection() {
  const db = await getDefaultDb();
  return db.collection(COLLECTION_NAME);
}

/**
 * Create indexes for the conversations collection
 * This should be called during application initialization or via a setup script
 * 
 * Indexes created:
 * - userId: For efficient user-specific queries
 * - conversationId: For unique conversation identification
 * - userId + lastUpdated: Compound index for sorting user conversations by recency
 * 
 * @returns {Promise<void>}
 */
export async function createConversationIndexes() {
  const collection = await getConversationsCollection();
  
  try {
    // Index on userId for efficient user-specific queries
    await collection.createIndex(
      { userId: 1 },
      { name: 'userId_1' }
    );
    
    // Index on conversationId for unique identification
    await collection.createIndex(
      { conversationId: 1 },
      { name: 'conversationId_1' }
    );
    
    // Compound index on userId and lastUpdated for efficient sorting
    await collection.createIndex(
      { userId: 1, lastUpdated: -1 },
      { name: 'userId_1_lastUpdated_-1' }
    );
    
    console.log('✅ Conversation indexes created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating conversation indexes:', error);
    throw error;
  }
}

/**
 * Verify that all required indexes exist
 * @returns {Promise<boolean>} True if all indexes exist
 */
export async function verifyConversationIndexes() {
  const collection = await getConversationsCollection();
  
  try {
    const indexes = await collection.indexes();
    const indexNames = indexes.map(idx => idx.name);
    
    const requiredIndexes = [
      'userId_1',
      'conversationId_1',
      'userId_1_lastUpdated_-1'
    ];
    
    const missingIndexes = requiredIndexes.filter(name => !indexNames.includes(name));
    
    if (missingIndexes.length > 0) {
      console.log('⚠️  Missing indexes:', missingIndexes);
      return false;
    }
    
    console.log('✅ All required indexes exist');
    return true;
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    throw error;
  }
}

/**
 * Schema validation (for documentation purposes)
 * The actual validation is handled by the API layer
 */
export const ConversationSchema = {
  userId: 'ObjectId',           // Reference to users collection
  conversationId: 'Number',     // Client-generated timestamp ID
  title: 'String',              // Auto-generated conversation title
  messages: [                   // Array of message objects
    {
      role: 'String',           // "user" or "assistant"
      content: 'String',        // Message text content
      timestamp: 'String',      // Formatted time string
      hasFile: 'Boolean',       // Whether message has attachment
      fileName: 'String',       // Optional: attached file name
      fileType: 'String',       // Optional: MIME type
      filePreview: 'String',    // Optional: base64 image preview
      stopped: 'Boolean'        // Optional: if response was stopped
    }
  ],
  createdAt: 'Date',            // ISO timestamp of creation
  lastUpdated: 'Date'           // ISO timestamp of last update
};

export default {
  getConversationsCollection,
  createConversationIndexes,
  verifyConversationIndexes,
  ConversationSchema
};
