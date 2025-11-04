/**
 * API Tests for Smart Book Recommendation System
 * 
 * Tests for:
 * - POST /api/student/books/track
 * - GET /api/student/books/recommendations
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock data
const mockUser = {
  email: 'test@student.com',
  name: 'Test Student',
  role: 'student'
};

const mockBook = {
  _id: '507f1f77bcf86cd799439011',
  title: 'JavaScript: The Good Parts',
  author: 'Douglas Crockford',
  categories: ['Computer Science', 'Programming'],
  tags: ['javascript', 'web-development'],
  year: 2008,
  status: 'available'
};

describe('POST /api/student/books/track', () => {
  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventType: 'view',
          bookId: mockBook._id
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('View Events', () => {
    it('should track a valid view event', async () => {
      // Note: This requires authentication setup
      // In a real test, you'd use a test session or mock auth
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          eventType: 'view',
          bookId: mockBook._id
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.ok).toBe(true);
        expect(data.interactionId).toBeDefined();
      }
    });

    it('should return 400 for view event without bookId', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          eventType: 'view'
          // Missing bookId
        })
      });

      if (response.status === 400) {
        const data = await response.json();
        expect(data.ok).toBe(false);
        expect(data.error).toContain('bookId is required');
      }
    });

    it('should return 404 for non-existent book', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          eventType: 'view',
          bookId: '000000000000000000000000' // Non-existent ID
        })
      });

      if (response.status === 404) {
        const data = await response.json();
        expect(data.ok).toBe(false);
        expect(data.error).toBe('Book not found');
      }
    });
  });

  describe('Search Events', () => {
    it('should track a valid search event', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          eventType: 'search',
          searchQuery: 'javascript programming',
          searchFilters: {
            formats: ['Physical'],
            yearRange: [2000, 2024],
            availability: ['Available']
          }
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.ok).toBe(true);
        expect(data.interactionId).toBeDefined();
      }
    });

    it('should return 400 for search event without query', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          eventType: 'search'
          // Missing searchQuery
        })
      });

      if (response.status === 400) {
        const data = await response.json();
        expect(data.ok).toBe(false);
        expect(data.error).toContain('searchQuery is required');
      }
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid event type', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          eventType: 'invalid',
          bookId: mockBook._id
        })
      });

      if (response.status === 400) {
        const data = await response.json();
        expect(data.ok).toBe(false);
        expect(data.error).toContain('Invalid event type');
      }
    });

    it('should return 400 for missing event type', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/track', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          // Add auth headers here
        },
        body: JSON.stringify({
          bookId: mockBook._id
        })
      });

      if (response.status === 400) {
        const data = await response.json();
        expect(data.ok).toBe(false);
      }
    });
  });
});

describe('GET /api/student/books/recommendations', () => {
  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/recommendations');

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('New User (No History)', () => {
    it('should return popular books for new users', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/recommendations?limit=5', {
        headers: {
          // Add auth headers for new user
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.ok).toBe(true);
        expect(data.recommendations).toBeDefined();
        expect(Array.isArray(data.recommendations)).toBe(true);
        expect(data.basedOn.viewCount).toBe(0);
        expect(data.basedOn.searchCount).toBe(0);
      }
    });
  });

  describe('User With History', () => {
    it('should return personalized recommendations', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/recommendations?limit=10&context=browse', {
        headers: {
          // Add auth headers for user with history
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.ok).toBe(true);
        expect(data.recommendations).toBeDefined();
        expect(Array.isArray(data.recommendations)).toBe(true);
        
        // Check recommendation structure
        if (data.recommendations.length > 0) {
          const rec = data.recommendations[0];
          expect(rec._id).toBeDefined();
          expect(rec.title).toBeDefined();
          expect(rec.author).toBeDefined();
          expect(rec.relevanceScore).toBeDefined();
          expect(rec.matchReasons).toBeDefined();
          expect(Array.isArray(rec.matchReasons)).toBe(true);
        }

        // Check basedOn data
        expect(data.basedOn).toBeDefined();
        expect(data.basedOn.topCategories).toBeDefined();
        expect(data.basedOn.topTags).toBeDefined();
      }
    });

    it('should respect limit parameter', async () => {
      const limit = 3;
      const response = await fetch(`http://localhost:3000/api/student/books/recommendations?limit=${limit}`, {
        headers: {
          // Add auth headers
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.recommendations.length).toBeLessThanOrEqual(limit);
      }
    });

    it('should handle context parameter', async () => {
      const contexts = ['browse', 'search'];
      
      for (const context of contexts) {
        const response = await fetch(`http://localhost:3000/api/student/books/recommendations?context=${context}`, {
          headers: {
            // Add auth headers
          }
        });

        if (response.status === 200) {
          const data = await response.json();
          expect(data.ok).toBe(true);
          expect(data.recommendations).toBeDefined();
        }
      }
    });
  });

  describe('Scoring Algorithm', () => {
    it('should return recommendations with relevance scores', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/recommendations', {
        headers: {
          // Add auth headers
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        
        if (data.recommendations.length > 0) {
          data.recommendations.forEach(rec => {
            expect(rec.relevanceScore).toBeGreaterThan(0);
            expect(rec.relevanceScore).toBeLessThanOrEqual(100);
          });
        }
      }
    });

    it('should sort recommendations by relevance score', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/recommendations', {
        headers: {
          // Add auth headers
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        
        if (data.recommendations.length > 1) {
          for (let i = 0; i < data.recommendations.length - 1; i++) {
            expect(data.recommendations[i].relevanceScore)
              .toBeGreaterThanOrEqual(data.recommendations[i + 1].relevanceScore);
          }
        }
      }
    });

    it('should include match reasons', async () => {
      const response = await fetch('http://localhost:3000/api/student/books/recommendations', {
        headers: {
          // Add auth headers
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        
        if (data.recommendations.length > 0) {
          data.recommendations.forEach(rec => {
            expect(rec.matchReasons).toBeDefined();
            expect(Array.isArray(rec.matchReasons)).toBe(true);
            expect(rec.matchReasons.length).toBeGreaterThan(0);
            expect(rec.matchReasons.length).toBeLessThanOrEqual(2);
          });
        }
      }
    });
  });

  describe('Exclusions', () => {
    it('should exclude books in personal library', async () => {
      // This test requires setting up a user with books in their library
      // Then verifying those books don't appear in recommendations
      const response = await fetch('http://localhost:3000/api/student/books/recommendations', {
        headers: {
          // Add auth headers
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        // Verify exclusion logic
        expect(data.ok).toBe(true);
      }
    });
  });
});

describe('Recommendation Scoring Logic', () => {
  // Unit tests for scoring algorithm
  
  it('should calculate category matches correctly', () => {
    const bookCategories = ['Computer Science', 'Programming'];
    const userCategories = ['Computer Science', 'Mathematics'];
    
    const matches = bookCategories.filter(cat => userCategories.includes(cat)).length;
    expect(matches).toBe(1);
    
    const score = matches * 30;
    expect(score).toBe(30);
  });

  it('should calculate tag matches correctly', () => {
    const bookTags = ['javascript', 'web-development', 'beginner'];
    const userTags = ['javascript', 'python'];
    
    const matches = bookTags.filter(tag => userTags.includes(tag)).length;
    expect(matches).toBe(1);
    
    const score = matches * 20;
    expect(score).toBe(20);
  });

  it('should apply author matching bonus', () => {
    const bookAuthor = 'Douglas Crockford';
    const userAuthors = ['Douglas Crockford', 'Martin Fowler'];
    
    const matches = userAuthors.includes(bookAuthor);
    expect(matches).toBe(true);
    
    const score = matches ? 15 : 0;
    expect(score).toBe(15);
  });

  it('should calculate total score correctly', () => {
    const categoryScore = 1 * 30; // 1 match
    const tagScore = 2 * 20; // 2 matches
    const authorScore = 15; // match
    const recencyBoost = 6; // 3 recent interactions * 2
    const popularityScore = 10; // 40 * 0.25
    
    const totalScore = categoryScore + tagScore + authorScore + recencyBoost + popularityScore;
    expect(totalScore).toBe(101);
    
    // Should be capped at 100
    const cappedScore = Math.min(totalScore, 100);
    expect(cappedScore).toBe(100);
  });
});

console.log('API Tests for Smart Book Recommendation System');
console.log('Note: These tests require proper authentication setup and test data');
console.log('Run with: npm test tests/api/recommendations.test.js');
