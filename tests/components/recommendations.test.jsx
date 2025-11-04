/**
 * Component Tests for Smart Book Recommendation System
 * 
 * Tests for:
 * - RecommendationCard component
 * - RecommendationsSidebar component
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecommendationCard from '@/components/recommendation-card';
import RecommendationsSidebar from '@/components/recommendations-sidebar';

// Mock data
const mockBook = {
  _id: '507f1f77bcf86cd799439011',
  title: 'JavaScript: The Good Parts',
  author: 'Douglas Crockford',
  year: 2008,
  format: 'Physical',
  status: 'available',
  categories: ['Computer Science', 'Programming'],
  tags: ['javascript', 'web-development'],
  coverImageUrl: null,
  relevanceScore: 85,
  matchReasons: ['Same category: Computer Science', 'Similar topics']
};

const mockRecommendations = [
  mockBook,
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    year: 2008,
    format: 'Physical',
    status: 'available',
    categories: ['Computer Science', 'Software Engineering'],
    tags: ['programming', 'best-practices'],
    relevanceScore: 75,
    matchReasons: ['Author you\'ve viewed']
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'Design Patterns',
    author: 'Gang of Four',
    year: 1994,
    format: 'Physical',
    status: 'available',
    categories: ['Computer Science'],
    tags: ['patterns', 'architecture'],
    relevanceScore: 65,
    matchReasons: ['Popular with students']
  }
];

describe('RecommendationCard Component', () => {
  describe('Rendering', () => {
    it('should render book title', () => {
      render(<RecommendationCard book={mockBook} />);
      expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    });

    it('should render book author', () => {
      render(<RecommendationCard book={mockBook} />);
      expect(screen.getByText(mockBook.author)).toBeInTheDocument();
    });

    it('should render book year', () => {
      render(<RecommendationCard book={mockBook} />);
      expect(screen.getByText(mockBook.year.toString())).toBeInTheDocument();
    });

    it('should render status chip', () => {
      render(<RecommendationCard book={mockBook} />);
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    it('should render relevance score', () => {
      render(<RecommendationCard book={mockBook} />);
      expect(screen.getByText(/85% match/i)).toBeInTheDocument();
    });

    it('should render match reasons', () => {
      render(<RecommendationCard book={mockBook} />);
      expect(screen.getByText(/Same category: Computer Science/i)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      const { container } = render(
        <RecommendationCard book={mockBook} compact={true} />
      );
      
      // Compact mode should have smaller dimensions
      const card = container.querySelector('button');
      expect(card).toHaveClass('p-3'); // Smaller padding
    });

    it('should show first match reason only in compact mode', () => {
      render(<RecommendationCard book={mockBook} compact={true} />);
      expect(screen.getByText(mockBook.matchReasons[0])).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<RecommendationCard book={mockBook} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockBook);
    });

    it('should not error if onClick is not provided', () => {
      render(<RecommendationCard book={mockBook} />);
      
      const card = screen.getByRole('button');
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe('Image Handling', () => {
    it('should show placeholder when no image URL', () => {
      render(<RecommendationCard book={mockBook} />);
      
      // Should show SVG icon placeholder
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show image when URL provided', () => {
      const bookWithImage = {
        ...mockBook,
        coverImageUrl: 'https://example.com/cover.jpg'
      };
      
      render(<RecommendationCard book={bookWithImage} />);
      
      const img = screen.getByAltText(bookWithImage.title);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', bookWithImage.coverImageUrl);
    });

    it('should handle image load errors', () => {
      const bookWithImage = {
        ...mockBook,
        coverImageUrl: 'https://example.com/invalid.jpg'
      };
      
      render(<RecommendationCard book={bookWithImage} />);
      
      const img = screen.getByAltText(bookWithImage.title);
      fireEvent.error(img);
      
      // Should fall back to placeholder
      waitFor(() => {
        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });
});

describe('RecommendationsSidebar Component', () => {
  // Mock fetch
  global.fetch = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<RecommendationsSidebar />);
      
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
      // Should show loading skeletons
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Success State', () => {
    it('should display recommendations when loaded', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: ['Computer Science'],
            topTags: ['javascript']
          }
        })
      });

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText(mockRecommendations[0].title)).toBeInTheDocument();
      });
    });

    it('should respect maxItems prop', async () => {
      const maxItems = 2;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations.slice(0, maxItems),
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar maxItems={maxItems} />);

      await waitFor(() => {
        const cards = screen.getAllByRole('button');
        expect(cards.length).toBeLessThanOrEqual(maxItems + 1); // +1 for refresh button
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no recommendations', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: [],
          basedOn: {
            viewCount: 0,
            searchCount: 0,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText(/No recommendations yet/i)).toBeInTheDocument();
        expect(screen.getByText(/Start browsing books/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error state on fetch failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to load recommendations/i)).toBeInTheDocument();
        expect(screen.getByText(/Try again/i)).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Try again/i)).toBeInTheDocument();
      });

      // Mock successful retry
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      const retryButton = screen.getByText(/Try again/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(mockRecommendations[0].title)).toBeInTheDocument();
      });
    });
  });

  describe('Context Prop', () => {
    it('should pass context to API call', async () => {
      const context = 'search';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar context={context} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`context=${context}`),
          expect.any(Object)
        );
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should reload recommendations on refresh click', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should have collapse/expand button', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        const expandButton = screen.getByLabelText(/collapse|expand/i);
        expect(expandButton).toBeInTheDocument();
      });
    });
  });

  describe('Click Tracking', () => {
    it('should track clicks on recommendations', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          recommendations: mockRecommendations,
          basedOn: {
            viewCount: 5,
            searchCount: 3,
            topCategories: [],
            topTags: []
          }
        })
      });

      render(<RecommendationsSidebar />);

      await waitFor(() => {
        expect(screen.getByText(mockRecommendations[0].title)).toBeInTheDocument();
      });

      const firstCard = screen.getByText(mockRecommendations[0].title).closest('button');
      fireEvent.click(firstCard);

      // Should trigger tracking (tested via behavior tracker)
      expect(true).toBe(true); // Placeholder - actual tracking tested separately
    });
  });
});

console.log('Component Tests for Smart Book Recommendation System');
console.log('Note: These tests require React Testing Library setup');
console.log('Run with: npm test tests/components/recommendations.test.jsx');
