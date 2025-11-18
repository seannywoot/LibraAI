// Test script for improved title generation
const { shouldRegenerateTitle, heuristicTitle } = require('../src/utils/chatTitle.js');

console.log('=== Testing Improved Title Generation ===\n');

// Test 1: Random question about mythology
const mythologyMessages = [
  { role: 'user', content: 'who are you' },
  { role: 'assistant', content: 'I am LibraAI, your library assistant.' },
  { role: 'user', content: 'when did the sun go to icarus' },
];

console.log('Test 1: Random mythology question');
console.log('Messages:', mythologyMessages.map(m => m.content));
const title1 = heuristicTitle(mythologyMessages);
console.log('Generated title:', title1);
console.log('Expected: Something like "Icarus Mythology Questions" or "Greek Mythology Discussion"');
console.log('✓ Pass:', title1.length > 0 && !title1.endsWith('To'));
console.log('');

// Test 2: Philosophy question
const philosophyMessages = [
  { role: 'user', content: 'what is love' },
];

console.log('Test 2: Philosophy question');
console.log('Messages:', philosophyMessages.map(m => m.content));
const title2 = heuristicTitle(philosophyMessages);
console.log('Generated title:', title2);
console.log('Expected: Something like "Love Discussion" or "Love Philosophy Questions"');
console.log('✓ Pass:', title2.length > 0 && !title2.endsWith('To'));
console.log('');

// Test 3: Topic drift detection
const driftMessages = [
  { role: 'user', content: 'find me books about python programming' },
  { role: 'assistant', content: 'Here are some Python books...' },
  { role: 'user', content: 'what is love' },
];

console.log('Test 3: Topic drift detection');
console.log('Current title: "Finding Python Programming Books"');
const shouldRegenerate = shouldRegenerateTitle(driftMessages, 'Finding Python Programming Books');
console.log('Should regenerate?', shouldRegenerate);
console.log('Expected: true (topic changed from programming to philosophy)');
console.log('✓ Pass:', shouldRegenerate === true);
console.log('');

// Test 4: Library question
const libraryMessages = [
  { role: 'user', content: 'what books are available to borrow' },
];

console.log('Test 4: Library question');
console.log('Messages:', libraryMessages.map(m => m.content));
const title4 = heuristicTitle(libraryMessages);
console.log('Generated title:', title4);
console.log('Expected: "Available Books To Borrow"');
console.log('✓ Pass:', title4.includes('Available') && title4.includes('Books'));
console.log('');

// Test 5: Continuing same topic (no drift)
const sameTopicMessages = [
  { role: 'user', content: 'find me books about python' },
  { role: 'assistant', content: 'Here are Python books...' },
  { role: 'user', content: 'do you have more python programming books' },
];

console.log('Test 5: Same topic continuation');
console.log('Current title: "Finding Python Programming Books"');
const shouldNotRegenerate = shouldRegenerateTitle(sameTopicMessages, 'Finding Python Programming Books');
console.log('Should regenerate?', shouldNotRegenerate);
console.log('Expected: false (same topic)');
console.log('✓ Pass:', shouldNotRegenerate === false);
console.log('');

console.log('=== All Tests Complete ===');
