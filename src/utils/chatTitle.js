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
  if (userMessages.length < 3) return false; // need at least 3 messages to detect drift
  
  const recent = userMessages.slice(-1)[0];
  const recentContent = recent.content.toLowerCase();
  
  // Get baseline from first 2 messages only (not including the recent one)
  const firstTwo = userMessages.slice(0, 2).map(m=>extractKeywords(m.content));
  const baselineKeywords = [...new Set(firstTwo.flat())];
  const recentKeywords = extractKeywords(recent.content);
  
  // Calculate similarity
  const similarity = jaccard(baselineKeywords, recentKeywords);
  
  // Check if recent message is substantial enough to warrant drift detection
  const recentTokens = tokenize(recent.content);
  if (recentTokens.length < 8) return false; // too short to be a topic shift
  
  // Strong indicators of topic shift
  const topicShiftPhrases = [
    'switching topic', 'change topic', 'different question', 
    'new question', 'moving on', 'instead', 'actually',
    'change of topic', 'different topic', 'new topic'
  ];
  const hasExplicitShift = topicShiftPhrases.some(phrase => 
    recentContent.includes(phrase.toLowerCase())
  );
  
  if (hasExplicitShift && similarity < 0.4) return true;
  
  // Very low similarity + long message indicates drift
  if (similarity < 0.15 && recentTokens.length > 10) return true;
  
  // Check if current title words are completely absent from recent message
  const titleTokens = tokenize(currentTitle).filter(t=>!STOPWORDS.has(t));
  const overlap = titleTokens.some(t => recentKeywords.includes(t));
  
  // Only regenerate if NO overlap AND very low similarity
  if (!overlap && similarity < 0.25 && recentTokens.length > 10) return true;
  
  return false;
}

// Fallback deterministic title when model unavailable
export function heuristicTitle(messages) {
  const userMessages = messages.filter(m=>m.role==='user');
  if (!userMessages.length) return 'Conversation';
  
  // Get first user message for context
  const firstMessage = userMessages[0].content;
  const tokens = tokenize(firstMessage);
  
  // Extract meaningful keywords (non-stopwords, length > 2)
  const keywords = tokens.filter(t => !STOPWORDS.has(t) && t.length > 2);
  
  // Take first 3-6 keywords in order of appearance (preserves natural flow)
  const titleWords = keywords.slice(0, 6);
  
  if (!titleWords.length) return 'Conversation';
  
  // Ensure we have at least 3 words for a good title
  const finalWords = titleWords.slice(0, Math.max(3, Math.min(6, titleWords.length)));
  
  return toTitleCase(finalWords.join(' '));
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
