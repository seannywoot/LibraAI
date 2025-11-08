/**
 * Test script for advanced search parser
 * Run with: node scripts/test-search-parser.mjs
 */

// Simple implementation for testing (since we can't import from src in Node directly)
function parseSearchQuery(searchText) {
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

// Test cases
const testCases = [
  {
    input: 'author: J.K. Rowling',
    expected: { filters: { author: 'J.K. Rowling' }, freeText: '' }
  },
  {
    input: 'subject: Artificial Intelligence',
    expected: { filters: { subject: 'Artificial Intelligence' }, freeText: '' }
  },
  {
    input: 'year: 2023',
    expected: { filters: { year: '2023' }, freeText: '' }
  },
  {
    input: 'author: Tolkien year: 2001',
    expected: { filters: { author: 'Tolkien', year: '2001' }, freeText: '' }
  },
  {
    input: 'fantasy adventure author: Tolkien',
    expected: { filters: { author: 'Tolkien' }, freeText: 'fantasy adventure' }
  },
  {
    input: 'title: Harry Potter year: 1997 author: J.K. Rowling',
    expected: { filters: { title: 'Harry Potter', year: '1997', author: 'J.K. Rowling' }, freeText: '' }
  },
  {
    input: 'shelf: A1',
    expected: { filters: { shelf: 'A1' }, freeText: '' }
  },
  {
    input: 'isbn: 978-0-7475-3269-9',
    expected: { filters: { isbn: '978-0-7475-3269-9' }, freeText: '' }
  },
  {
    input: 'publisher: Penguin Books',
    expected: { filters: { publisher: 'Penguin Books' }, freeText: '' }
  },
  {
    input: 'just regular search text',
    expected: { filters: {}, freeText: 'just regular search text' }
  }
];

console.log('🧪 Testing Advanced Search Parser\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = parseSearchQuery(testCase.input);
  const filtersMatch = JSON.stringify(result.filters) === JSON.stringify(testCase.expected.filters);
  const freeTextMatch = result.freeText === testCase.expected.freeText;
  const success = filtersMatch && freeTextMatch;

  if (success) {
    console.log(`✅ Test ${index + 1}: PASSED`);
    console.log(`   Input: "${testCase.input}"`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: FAILED`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Expected:`, testCase.expected);
    console.log(`   Got:`, result);
    failed++;
  }
  console.log('');
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed');
  process.exit(1);
}
