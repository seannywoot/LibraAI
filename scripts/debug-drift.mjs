import { shouldRegenerateTitle, extractKeywords } from "../src/utils/chatTitle.js";

function tokenize(text='') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g,' ')
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(aArr, bArr) {
  const a = new Set(aArr);
  const b = new Set(bArr);
  if (!a.size && !b.size) return 1;
  let inter = 0;
  a.forEach(v => { if (b.has(v)) inter++; });
  return inter / (a.size + b.size - inter || 1);
}

const clearDrift = [
  { role: 'assistant', content: 'Hi!' },
  { role: 'user', content: 'How do I bake sourdough bread?' },
  { role: 'assistant', content: 'Here is a recipe...' },
  { role: 'user', content: 'What temperature should I use?' },
  { role: 'assistant', content: '450 degrees...' },
  { role: 'user', content: 'Switching topic: Can you help me plan a trip to Japan for 7 days?' },
];

const userMessages = clearDrift.filter(m=>m.role==='user');
console.log('User message count:', userMessages.length);
console.log('Recent message:', userMessages[userMessages.length-1].content);

const recent = userMessages.slice(-1)[0];
const recentContent = recent.content.toLowerCase();
console.log('Recent content (lowercase):', recentContent);
console.log('Contains "switching topic"?', recentContent.includes('switching topic'));

const firstFew = userMessages.slice(0, 3).map(m=>extractKeywords(m.content));
console.log('Baseline keywords:', firstFew);

const baselineKeywords = [...new Set(firstFew.flat())];
const recentKeywords = extractKeywords(recent.content);
console.log('Baseline (flat):', baselineKeywords);
console.log('Recent keywords:', recentKeywords);

const similarity = jaccard(baselineKeywords, recentKeywords);
console.log('Similarity:', similarity);

const recentTokens = tokenize(recent.content);
console.log('Recent token count:', recentTokens.length);

const result = shouldRegenerateTitle(clearDrift, 'Sourdough Bread Baking');
console.log('Should regenerate?', result);
