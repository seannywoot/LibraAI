import { heuristicTitle, shouldRegenerateTitle, normalizeModelTitle } from "../src/utils/chatTitle.js";

console.log('=== HEURISTIC TITLE TESTS ===\n');

// Test 1: Simple question
const test1 = [
  { role: 'assistant', content: 'Hi, how can I help?' },
  { role: 'user', content: 'How do I bake sourdough bread at home?' },
  { role: 'assistant', content: 'Here is a recipe...' },
];
console.log('Test 1 (Sourdough):', heuristicTitle(test1));

// Test 2: Programming question
const test2 = [
  { role: 'assistant', content: 'Hello!' },
  { role: 'user', content: 'Can you help me debug this Python code for list comprehension?' },
  { role: 'assistant', content: 'Sure!' },
];
console.log('Test 2 (Python):', heuristicTitle(test2));

// Test 3: Travel planning
const test3 = [
  { role: 'assistant', content: 'Hello!' },
  { role: 'user', content: 'I want to plan a 7-day trip to Tokyo Japan' },
  { role: 'assistant', content: 'Great!' },
];
console.log('Test 3 (Travel):', heuristicTitle(test3));

// Test 4: Book recommendation
const test4 = [
  { role: 'assistant', content: 'Hello!' },
  { role: 'user', content: 'Can you recommend science fiction books similar to Dune?' },
  { role: 'assistant', content: 'Sure!' },
];
console.log('Test 4 (Books):', heuristicTitle(test4));

console.log('\n=== NORMALIZATION TESTS ===\n');

console.log('With quotes:', normalizeModelTitle('"Python Code Debugging"'));
console.log('With prefix:', normalizeModelTitle('Title: Sourdough Bread Recipe'));
console.log('With punctuation:', normalizeModelTitle('Tokyo Travel Guide!'));
console.log('Too long:', normalizeModelTitle('This Is A Very Long Title With Many Words'));
console.log('Too short:', normalizeModelTitle('Help'));
console.log('Empty:', normalizeModelTitle(''));

console.log('\n=== DRIFT DETECTION TESTS ===\n');

// Test: No drift - same topic
const noDrift = [
  { role: 'assistant', content: 'Hi!' },
  { role: 'user', content: 'How do I bake sourdough bread?' },
  { role: 'assistant', content: 'Here is a recipe...' },
  { role: 'user', content: 'What temperature should I use?' },
  { role: 'assistant', content: '450 degrees...' },
  { role: 'user', content: 'How long should I bake it?' },
];
console.log('No drift (same topic):', shouldRegenerateTitle(noDrift, 'Sourdough Bread Baking'));

// Test: Clear drift - explicit topic change
const clearDrift = [
  { role: 'assistant', content: 'Hi!' },
  { role: 'user', content: 'How do I bake sourdough bread?' },
  { role: 'assistant', content: 'Here is a recipe...' },
  { role: 'user', content: 'What temperature should I use?' },
  { role: 'assistant', content: '450 degrees...' },
  { role: 'user', content: 'Switching topic: Can you help me plan a trip to Japan for 7 days?' },
];
console.log('Clear drift (explicit):', shouldRegenerateTitle(clearDrift, 'Sourdough Bread Baking'));

// Test: Subtle drift - related but different
const subtleDrift = [
  { role: 'assistant', content: 'Hi!' },
  { role: 'user', content: 'How do I bake sourdough bread?' },
  { role: 'assistant', content: 'Here is a recipe...' },
  { role: 'user', content: 'What temperature should I use?' },
  { role: 'assistant', content: '450 degrees...' },
  { role: 'user', content: 'What about making pasta from scratch?' },
];
console.log('Subtle drift (related):', shouldRegenerateTitle(subtleDrift, 'Sourdough Bread Baking'));

console.log('\n=== DONE ===');
