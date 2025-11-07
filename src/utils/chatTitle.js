// Utility functions for chat title generation and drift detection
// The goal: short (3-6 words) distinctive noun-phrase titles.

const STOPWORDS = new Set([
  'the','a','an','and','or','but','about','of','on','in','for','to','with','is','are','was','were','be','being','been','at','by','from','how','do','does','can','i','me','my','you','your','we','our','us','it','this','that','these','those','please','help','need','want','like'
]);

// Basic tokenizer
function tokenize(text='') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g,' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(messageText='', max=12) {
  const tokens = tokenize(messageText).filter(t => !STOPWORDS.has(t) && t.length > 2);
  // crude frequency ranking
  const freq = new Map();
  tokens.forEach(t => freq.set(t,(freq.get(t)||0)+1));
  return [...freq.entries()]
    .sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]))
    .slice(0,max)
    .map(([w])=>w);
}

function jaccard(aArr, bArr) {
  const a = new Set(aArr);
  const b = new Set(bArr);
  if (!a.size && !b.size) return 1;
  let inter = 0;
  a.forEach(v => { if (b.has(v)) inter++; });
  return inter / (a.size + b.size - inter || 1);
}

// Decide if topic drift likely occurred.
export function shouldRegenerateTitle(messages, currentTitle) {
  if (!currentTitle) return false; // no title yet -> handled elsewhere
  const userMessages = messages.filter(m=>m.role==='user');
  if (userMessages.length < 3) return false; // need some history to detect drift
  const recent = userMessages.slice(-1)[0];
  const firstTwo = userMessages.slice(0,2).map(m=>extractKeywords(m.content));
  const baselineKeywords = [...new Set(firstTwo.flat())];
  const recentKeywords = extractKeywords(recent.content);
  const similarity = jaccard(baselineKeywords, recentKeywords);
  // Low similarity + sufficiently long recent message indicates drift
  if (similarity < 0.2 && tokenize(recent.content).length > 6) return true;
  // Also: if current title words absent from recent keywords
  const titleTokens = tokenize(currentTitle).filter(t=>!STOPWORDS.has(t));
  const overlap = titleTokens.some(t => recentKeywords.includes(t));
  if (!overlap && similarity < 0.35) return true;
  return false;
}

// Fallback deterministic title when model unavailable
export function heuristicTitle(messages) {
  const userMessages = messages.filter(m=>m.role==='user');
  if (!userMessages.length) return 'Conversation';
  const joined = userMessages.slice(0,2).map(m=>m.content).join(' ');
  const keywords = extractKeywords(joined, 8).slice(0,6);
  if (!keywords.length) return 'Conversation';
  const words = keywords.map(w=> w.length > 20 ? w.slice(0,20) : w);
  const final = words.slice(0,6).join(' ');
  return toTitleCase(final);
}

export function toTitleCase(str='') {
  return str.split(/\s+/).filter(Boolean).map((w,i)=>{
    if (w.match(/^[A-Z0-9]{2,}$/)) return w; // keep acronyms
    return w.charAt(0).toUpperCase()+w.slice(1);
  }).join(' ');
}

// Post-process model output to enforce constraints
export function normalizeModelTitle(raw='', fallback='Conversation') {
  if (!raw) return fallback;
  let t = raw.trim();
  // Remove quotes or trailing punctuation
  t = t.replace(/^['"`]|['"`]+$/g,'');
  // Keep 3-6 words
  let words = t.split(/\s+/).filter(Boolean);
  if (words.length > 6) words = words.slice(0,6);
  if (words.length < 3) {
    // attempt to pad with keywords from itself
    const extra = extractKeywords(t, 6);
    words = [...new Set([...words, ...extra])].slice(0,3);
  }
  return toTitleCase(words.join(' ')) || fallback;
}

// Prepare payload for title generation API
export function buildTitleRequestPayload(messages) {
  const userAndAssistant = messages.filter(m=> m.role==='user' || m.role==='assistant');
  const limited = userAndAssistant.slice(0,8); // first context section
  const recent = userAndAssistant.slice(-4); // recent messages for drift
  const merged = [...new Set([...limited, ...recent])];
  return merged.map(m=> ({ role: m.role, content: m.content }));
}

const ChatTitleUtils = {
  extractKeywords,
  shouldRegenerateTitle,
  heuristicTitle,
  normalizeModelTitle,
  buildTitleRequestPayload,
  toTitleCase,
};

export default ChatTitleUtils;
