/**
 * Parse advanced search syntax like:
 * - author: J.K. Rowling
 * - subject: Artificial Intelligence
 * - year: 2023
 * - title: Harry Potter
 * - isbn: 978-0-7475-3269-9
 * - publisher: Penguin
 * - shelf: A1
 * 
 * Returns an object with parsed fields and remaining text
 */
export function parseSearchQuery(searchText) {
  if (!searchText || typeof searchText !== 'string') {
    return { filters: {}, freeText: '' };
  }

  const filters = {};
  const fieldNames = ['author', 'subject', 'category', 'year', 'title', 'isbn', 'publisher', 'shelf'];
  
  // Create a pattern to match any field
  const fieldPattern = new RegExp(`\\b(${fieldNames.join('|')}):\\s*`, 'gi');
  
  // Find all field positions
  const matches = [];
  let match;
  const regex = new RegExp(fieldPattern);
  
  while ((match = regex.exec(searchText)) !== null) {
    matches.push({
      field: match[1].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // Extract field values
  let remainingText = searchText;
  
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    // Get value from current position to next field or end of string
    const valueEnd = next ? next.start : searchText.length;
    const value = searchText.substring(current.end, valueEnd).trim();
    
    if (value) {
      // Map 'subject' to 'category' for consistency
      const key = current.field === 'subject' ? 'subject' : current.field;
      filters[key] = value;
    }
    
    // Remove this field:value from remaining text
    const fieldText = searchText.substring(current.start, valueEnd);
    remainingText = remainingText.replace(fieldText, ' ');
  }
  
  // Clean up remaining text
  const freeText = remainingText.trim().replace(/\s+/g, ' ');

  return { filters, freeText };
}

/**
 * Build MongoDB query from parsed search filters
 * For books catalog - only supports title, author, year
 */
export function buildSearchQuery(searchText, additionalQuery = {}) {
  const { filters, freeText } = parseSearchQuery(searchText);
  const query = { ...additionalQuery };

  const orConditions = [];

  // Add specific field filters (only title, author, year for catalog)
  if (filters.author) {
    orConditions.push({ author: { $regex: filters.author, $options: 'i' } });
  }
  
  if (filters.year) {
    query.year = parseInt(filters.year, 10);
  }
  
  if (filters.title) {
    orConditions.push({ title: { $regex: filters.title, $options: 'i' } });
  }

  // Add free text search across title and author only
  if (freeText) {
    orConditions.push(
      { title: { $regex: freeText, $options: 'i' } },
      { author: { $regex: freeText, $options: 'i' } }
    );
  }

  // Combine OR conditions if any exist
  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  return query;
}

/**
 * Build MongoDB query for shelf books - supports all fields
 */
export function buildShelfBooksSearchQuery(searchText, additionalQuery = {}) {
  const { filters, freeText } = parseSearchQuery(searchText);
  const query = { ...additionalQuery };

  const orConditions = [];

  // Add specific field filters
  if (filters.author) {
    orConditions.push({ author: { $regex: filters.author, $options: 'i' } });
  }
  
  if (filters.subject || filters.category) {
    const categoryValue = filters.subject || filters.category;
    orConditions.push({ category: { $regex: categoryValue, $options: 'i' } });
  }
  
  if (filters.year) {
    query.year = parseInt(filters.year, 10);
  }
  
  if (filters.title) {
    orConditions.push({ title: { $regex: filters.title, $options: 'i' } });
  }
  
  if (filters.isbn) {
    orConditions.push({ isbn: { $regex: filters.isbn, $options: 'i' } });
  }
  
  if (filters.publisher) {
    orConditions.push({ publisher: { $regex: filters.publisher, $options: 'i' } });
  }
  
  if (filters.shelf) {
    query.shelf = { $regex: filters.shelf, $options: 'i' };
  }

  // Add free text search across all fields
  if (freeText) {
    orConditions.push(
      { title: { $regex: freeText, $options: 'i' } },
      { author: { $regex: freeText, $options: 'i' } },
      { isbn: { $regex: freeText, $options: 'i' } },
      { publisher: { $regex: freeText, $options: 'i' } }
    );
  }

  // Combine OR conditions if any exist
  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  return query;
}

/**
 * Format search examples for UI hints
 */
export const SEARCH_EXAMPLES = [
  'author: J.K. Rowling',
  'subject: Artificial Intelligence',
  'year: 2023',
  'title: Harry Potter year: 2001',
  'author: Tolkien subject: Fantasy',
];
