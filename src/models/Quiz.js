/**
 * Quiz Model
 * 
 * Defines the schema and indexes for quizzes generated from PDFs.
 * Students can upload PDFs and generate multiple-choice quizzes using AI.
 */

import { getDefaultDb } from '../lib/mongodb.js';

const COLLECTION_NAME = 'quizzes';

/**
 * Get the quizzes collection
 * @returns {Promise<Collection>} MongoDB collection instance
 */
export async function getQuizzesCollection() {
    const db = await getDefaultDb();
    return db.collection(COLLECTION_NAME);
}

/**
 * Create indexes for the quizzes collection
 * 
 * Indexes created:
 * - userId: For efficient user-specific queries
 * - createdAt: For sorting by creation date
 * - userId + createdAt: Compound index for efficient user quiz listing
 * 
 * @returns {Promise<void>}
 */
export async function createQuizIndexes() {
    const collection = await getQuizzesCollection();

    try {
        // Index on userId for efficient user-specific queries
        await collection.createIndex(
            { userId: 1 },
            { name: 'userId_1' }
        );

        // Index on createdAt for sorting
        await collection.createIndex(
            { createdAt: -1 },
            { name: 'createdAt_-1' }
        );

        // Compound index on userId and createdAt for efficient sorting
        await collection.createIndex(
            { userId: 1, createdAt: -1 },
            { name: 'userId_1_createdAt_-1' }
        );

        console.log('✅ Quiz indexes created successfully');
        return true;
    } catch (error) {
        console.error('❌ Error creating quiz indexes:', error);
        throw error;
    }
}

/**
 * Schema validation (for documentation purposes)
 */
export const QuizSchema = {
    userId: 'ObjectId',              // Reference to users collection
    pdfFileName: 'String',           // Original PDF filename
    title: 'String',                 // Generated or user-provided title
    questionCount: 'Number',         // Number of questions (5, 10, or 15)
    questions: [                     // Array of question objects
        {
            question: 'String',          // The question text
            options: ['String'],         // Array of 4 answer options
            correctAnswer: 'Number'      // Index of correct answer (0-3)
        }
    ],
    createdAt: 'Date',              // ISO timestamp of creation
    updatedAt: 'Date'               // ISO timestamp of last update
};

export default {
    getQuizzesCollection,
    createQuizIndexes,
    QuizSchema
};
