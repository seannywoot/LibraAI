import { heuristicTitle, shouldRegenerateTitle } from "../src/utils/chatTitle.js";

console.log('=== SIMULATING REAL USER CONVERSATIONS ===\n');

// Scenario 1: Book recommendation conversation
console.log('Scenario 1: Book Recommendations');
const bookConvo = [
  { role: 'assistant', content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?" },
  { role: 'user', content: 'Can you recommend some science fiction books?' },
  { role: 'assistant', content: 'Sure! Here are some great sci-fi books...' },
];
console.log('Title:', heuristicTitle(bookConvo));
console.log('');

// Scenario 2: Library system help
console.log('Scenario 2: Library System Help');
const libraryConvo = [
  { role: 'assistant', content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?" },
  { role: 'user', content: 'How do I borrow a book from the library?' },
  { role: 'assistant', content: 'To borrow a book, you need to...' },
];
console.log('Title:', heuristicTitle(libraryConvo));
console.log('');

// Scenario 3: Author information
console.log('Scenario 3: Author Information');
const authorConvo = [
  { role: 'assistant', content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?" },
  { role: 'user', content: 'Tell me about Ernest Hemingway and his writing style' },
  { role: 'assistant', content: 'Ernest Hemingway was known for...' },
];
console.log('Title:', heuristicTitle(authorConvo));
console.log('');

// Scenario 4: Book search
console.log('Scenario 4: Book Search');
const searchConvo = [
  { role: 'assistant', content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?" },
  { role: 'user', content: 'Do you have any books about World War 2 history?' },
  { role: 'assistant', content: 'Yes, we have several books about WWII...' },
];
console.log('Title:', heuristicTitle(searchConvo));
console.log('');

// Scenario 5: Topic drift - starts with books, shifts to account
console.log('Scenario 5: Topic Drift Detection');
const driftConvo = [
  { role: 'assistant', content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?" },
  { role: 'user', content: 'Can you recommend mystery novels?' },
  { role: 'assistant', content: 'Sure! Here are some great mystery novels...' },
  { role: 'user', content: 'What about detective stories?' },
  { role: 'assistant', content: 'Detective stories are a subgenre of mystery...' },
  { role: 'user', content: 'Actually, how do I change my account password?' },
];
console.log('Initial title: Mystery Novels');
console.log('Should regenerate after password question?', shouldRegenerateTitle(driftConvo, 'Recommend Mystery Novels'));
console.log('New title would be:', heuristicTitle([
  { role: 'assistant', content: 'Hello!' },
  { role: 'user', content: 'Actually, how do I change my account password?' },
  { role: 'assistant', content: 'To change your password...' },
]));
console.log('');

console.log('=== ALL SCENARIOS COMPLETE ===');
