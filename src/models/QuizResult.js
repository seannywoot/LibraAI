/**
 * QuizResult Model
 * 
 * Defines the schema and indexes for quiz results/attempts.
 * Stores student quiz attempts, answers, and scores.
 */

import { getDefaultDb } from '../lib/mongodb.js';

const COLLECTION_NAME = 'quizResults';

/**
 * Get the quiz results collection
 * @returns {Promise<Collection>} MongoDB collection instance
 */
export async function getQuizResultsCollection() {
    const db = await getDefaultDb();
    return db.collection(COLLECTION_NAME);
}

/**
 * Create indexes for the quiz results collection
 * 
 * Indexes created:
 * - userId: For efficient user-specific queries
 * - quizId: For finding all attempts for a specific quiz
 * - userId + quizId: Compound index for user's quiz attempts
 * - userId + completedAt: For sorting user results by date
 * 
 * @returns {Promise<void>}
 */
export async function createQuizResultIndexes() {
    const collection = await getQuizResultsCollection();

    try {
        // Index on userId for efficient user-specific queries
        await collection.createIndex(
            { userId: 1 },
            { name: 'userId_1' }
        );

        // Index on quizId for finding all attempts
        await collection.createIndex(
            { quizId: 1 },
            { name: 'quizId_1' }
        );

        // Compound index on userId and quizId
        await collection.createIndex(
            { userId: 1, quizId: 1 },
            { name: 'userId_1_quizId_1' }
        );

        // Compound index on userId and completedAt for sorting
        await collection.createIndex(
            { userId: 1, completedAt: -1 },
            { name: 'userId_1_completedAt_-1' }
        );

        console.log('✅ Quiz result indexes created successfully');
        return true;
    } catch (error) {
        console.error('❌ Error creating quiz result indexes:', error);
        throw error;
    }
}

/**
 * Schema validation (for documentation purposes)
 */
export const QuizResultSchema = {
    userId: 'ObjectId',              // Reference to users collection
    quizId: 'ObjectId',              // Reference to quizzes collection
    quizTitle: 'String',             // Cached quiz title for quick display
    answers: ['Number'],             // Array of selected answer indices
    score: 'Number',                 // Number of correct answers
    totalQuestions: 'Number',        // Total number of questions
    percentage: 'Number',            // Score as percentage (0-100)
    completedAt: 'Date',            // ISO timestamp when quiz was completed
    timeSpent: 'Number'             // Time spent in seconds (optional)
};

export default {
    getQuizResultsCollection,
    createQuizResultIndexes,
    QuizResultSchema
};
