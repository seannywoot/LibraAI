// Utility functions for chat title generation and drift detection
// The goal: short (3-6 words) distinctive noun-phrase titles.

const STOPWORDS = new Set([
  'the','a','an','and','or','but','about','of','on','in','for','to','with','is','are','was','were','be','being','been','at','by','from','how','do','does','can','i','me','my','you','your','we','our','us','it','this','that','these','those','please','help','need','want','like','some','any','have','has','had','will','would','could','should','may','might','must','tell','show','give','get'
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
  if (!currentTitle || currentTitle === 'Conversation') return false; // no title yet -> handled elsewhere
  const userMessages = messages.filter(m=>m.role==='user');
  if (userMessages.length < 2) return false; // need at least 2 messages to detect drift
  
  const recent = userMessages.slice(-1)[0];
  const recentContent = recent.content.toLowerCase();
  
  // Get baseline from earlier messages (not including the recent one)
  const earlier = userMessages.slice(0, -1);
  const earlierKeywords = [...new Set(earlier.flatMap(m => extractKeywords(m.content)))];
  const recentKeywords = extractKeywords(recent.content);
  
  // Calculate similarity
  const similarity = jaccard(earlierKeywords, recentKeywords);
  
  // Check if recent message is substantial enough to warrant drift detection
  const recentTokens = tokenize(recent.content);
  const meaningfulTokens = recentTokens.filter(t => !STOPWORDS.has(t));
  
  // Even short messages can indicate drift if they're completely different topics
  if (recentTokens.length < 3) return false; // too short (e.g., "yes", "ok")
  
  // Strong indicators of topic shift
  const topicShiftPhrases = [
    'switching topic', 'change topic', 'different question', 
    'new question', 'moving on', 'instead', 'actually',
    'change of topic', 'different topic', 'new topic',
    'by the way', 'also', 'another question'
  ];
  const hasExplicitShift = topicShiftPhrases.some(phrase => 
    recentContent.includes(phrase.toLowerCase())
  );
  
  // More aggressive drift detection
  if (hasExplicitShift) return true; // Always regenerate on explicit shift
  
  // Low similarity indicates drift (more aggressive threshold)
  if (similarity < 0.25 && meaningfulTokens.length >= 2) return true;
  
  // Check if current title words are mostly absent from recent message
  const titleTokens = tokenize(currentTitle).filter(t=>!STOPWORDS.has(t));
  const titleOverlap = titleTokens.filter(t => recentKeywords.includes(t)).length;
  const titleOverlapRatio = titleTokens.length > 0 ? titleOverlap / titleTokens.length : 0;
  
  // Regenerate if less than 40% of title words appear in recent message (more aggressive)
  if (titleOverlapRatio < 0.4 && similarity < 0.35 && meaningfulTokens.length >= 2) return true;
  
  // Check for completely different question types
  const earlierHasQuestion = earlier.some(m => /\b(who|what|when|where|why|how|which)\b/i.test(m.content));
  const recentHasQuestion = /\b(who|what|when|where|why|how|which)\b/i.test(recentContent);
  
  // If switching from statements to questions or vice versa with low similarity
  if (earlierHasQuestion !== recentHasQuestion && similarity < 0.25) return true;
  
  // Regenerate every 5 messages if similarity is consistently low
  if (userMessages.length % 5 === 0 && similarity < 0.3) return true;
  
  return false;
}

// Fallback deterministic title when model unavailable
export function heuristicTitle(messages) {
  const userMessages = messages.filter(m=>m.role==='user');
  if (!userMessages.length) return 'Conversation';
  
  // Prioritize recent messages for title (last 2 messages)
  const recentMessages = userMessages.slice(-2);
  const allText = recentMessages.map(m => m.content).join(' ').toLowerCase();
  const tokens = tokenize(allText);
  
  // Extract meaningful keywords (non-stopwords, length > 2)
  const keywords = tokens.filter(t => !STOPWORDS.has(t) && t.length > 2);
  
  if (!keywords.length) return 'Conversation';
  
  // Detect common patterns and add necessary grammar words
  let titleWords = [];
  
  // Pattern: Random questions (mythology, philosophy, etc.) - CHECK THIS FIRST
  if (allText.match(/\b(icarus|mythology|greek|god|goddess)\b/)) {
    titleWords = ['greek', 'mythology', 'questions'];
  }
  else if (allText.match(/\b(love|philosophy)\b/) && allText.match(/\bwhat\s+is\b/)) {
    const topic = keywords.filter(k => !['what', 'is'].includes(k)).slice(0, 2);
    titleWords = [...topic, 'discussion'];
  }
  // Pattern: Library-related questions
  else if (allText.includes('available') && allText.includes('borrow')) {
    titleWords = ['available', 'books', 'to', 'borrow'];
  }
  else if (allText.match(/\b(book|books)\b/) && allText.match(/\b(find|search|looking)\b/)) {
    const topicKeywords = keywords.filter(k => !['book', 'books', 'find', 'search', 'looking'].includes(k));
    titleWords = ['finding', ...topicKeywords.slice(0, 2), 'books'];
  }
  // Pattern: "how to..." → "Guide To [Topic]"
  else if (allText.match(/how\s+to\s+(\w+)/)) {
    const verb = allText.match(/how\s+to\s+(\w+)/)[1];
    titleWords = ['guide', 'to', verb, ...keywords.filter(k => k !== verb).slice(0, 2)];
  }
  // Pattern: "who are you" → Only if it's the ONLY topic
  else if (allText.match(/\b(who\s+are\s+you|introduce|yourself)\b/) && userMessages.length === 1) {
    titleWords = ['introduction', 'chat'];
  }
  // Pattern: General "what is..." → "[Topic] Discussion"
  else if (allText.match(/what\s+is\s+(\w+)/)) {
    const topic = keywords.filter(k => !['what', 'is'].includes(k)).slice(0, 2);
    titleWords = [...topic, 'discussion'];
  }
  // Pattern: "find/search..." → "Finding [Topic]"
  else if (allText.match(/\b(find|search|look|get)\b/)) {
    const filteredKeywords = keywords.filter(k => !['find', 'search', 'look', 'get'].includes(k));
    titleWords = ['finding', ...filteredKeywords.slice(0, 3)];
  }
  // Default: Take top keywords and add context
  else {
    titleWords = keywords.slice(0, 4);
    
    // Add "discussion" or "questions" if it seems like a Q&A
    if (allText.match(/\b(what|why|how|when|where|which)\b/)) {
      titleWords = [...titleWords.slice(0, 3), 'questions'];
    } else {
      titleWords = [...titleWords.slice(0, 3), 'discussion'];
    }
  }
  
  // Ensure we have 3-6 words
  titleWords = titleWords.slice(0, 6);
  if (titleWords.length < 3) {
    // Fallback to generic but complete title
    if (keywords.length >= 2) {
      titleWords = [...keywords.slice(0, 2), 'chat'];
    } else {
      titleWords = ['general', 'conversation'];
    }
  }
  
  // Clean up common incomplete patterns
  let title = titleWords.join(' ');
  
  // Remove trailing prepositions that make titles incomplete
  title = title.replace(/\s+(to|for|with|about|from|in|on|at|by)$/i, '');
  
  // Remove leading question words
  title = title.replace(/^(what|which|how|when|where|why)\s+/i, '');
  
  // Ensure title doesn't end with incomplete phrase
  if (title.split(/\s+/).length < 2) {
    title = title + ' Discussion';
  }
  
  return toTitleCase(title);
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
  
  // Remove quotes, trailing punctuation, and common prefixes
  t = t.replace(/^['"`]|['"`]+$/g,'');
  t = t.replace(/^(Title:|Topic:|Chat:|Conversation:)\s*/i, '');
  t = t.replace(/[.!?;,]+$/g, '');
  
  // Split into words
  let words = t.split(/\s+/).filter(Boolean);
  
  // If empty after cleaning, return fallback
  if (words.length === 0) return fallback;
  
  // Keep 3-6 words
  if (words.length > 6) {
    words = words.slice(0, 6);
  } else if (words.length < 3) {
    // If too short, try to extract more meaningful words
    const tokens = tokenize(t).filter(tok => !STOPWORDS.has(tok) && tok.length > 2);
    if (tokens.length >= 3) {
      words = tokens.slice(0, 3);
    } else if (words.length > 0) {
      // Keep what we have if it's at least 1 word
      // Don't force padding with generic words
    } else {
      return fallback;
    }
  }
  
  const result = toTitleCase(words.join(' '));
  return result || fallback;
}

// Prepare payload for title generation API
export function buildTitleRequestPayload(messages) {
  const userAndAssistant = messages.filter(m=> m.role==='user' || m.role==='assistant');
  
  // If conversation is short, send everything
  if (userAndAssistant.length <= 8) {
    return userAndAssistant.map(m=> ({ role: m.role, content: m.content }));
  }
  
  // For longer conversations, prioritize recent messages (last 6) + first 2 for context
  const first = userAndAssistant.slice(0, 2); // initial context
  const recent = userAndAssistant.slice(-6); // recent conversation (most important)
  
  // Merge without duplicates, preserving order
  const seen = new Set();
  const merged = [];
  
  for (const msg of [...first, ...recent]) {
    const key = `${msg.role}:${msg.content}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ role: msg.role, content: msg.content });
    }
  }
  
  return merged;
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
