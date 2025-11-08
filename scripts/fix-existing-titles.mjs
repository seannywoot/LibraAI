import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeModelTitle } from '../src/utils/chatTitle.js';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envFile = readFileSync('.env.local', 'utf8');
    const lines = envFile.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return env;
  } catch (error) {
    console.error('❌ Error loading .env.local:', error.message);
    return {};
  }
}

const env = loadEnv();
const MONGODB_URI = env.MONGODB_URI;
const GEMINI_API_KEY = env.GEMINI_API_KEY;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateTitle(messages) {
  try {
    // Build conversation context
    const convo = messages
      .slice(0, 8) // First 8 messages for context
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const systemInstruction = `Generate a concise, descriptive title (3-6 words) for this conversation.

CRITICAL REQUIREMENTS:
- MUST be grammatically correct with proper spelling
- MUST use complete, natural phrases (not fragments)
- Use specific nouns and verbs that capture the main topic
- NO generic words like "help", "question", "chat", "conversation"
- NO articles (the, a, an) at the start
- Title Case format
- NO quotes, punctuation, or extra formatting
- Focus on what the user is asking about or discussing

EXAMPLES:
Good: "Available Books To Borrow"
Good: "Sourdough Bread Baking Tips"
Good: "Python List Comprehension Guide"
Good: "Tokyo Travel Itinerary Planning"
Bad: "What Books Aer Available Borrow" (typo and incomplete)
Bad: "Help With Baking" (too generic)
Bad: "Question About Python" (too generic)
Bad: "Chat About Travel" (too generic)

Double-check your title for:
✓ Correct spelling
✓ Complete grammar
✓ Natural phrasing

Return ONLY the title, nothing else.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', 
      generationConfig: { 
        temperature: 0.3, 
        maxOutputTokens: 20 
      } 
    });

    const result = await model.generateContent(`${systemInstruction}\n\nCHAT HISTORY:\n${convo}`);
    const raw = result.response.text();
    let title = normalizeModelTitle(raw);
    
    // Validation: Check for common issues
    const hasObviousTypo = /\b(aer|teh|hte|taht|waht|whta|availble|availabe)\b/i.test(title);
    const hasIncompletePhrase = /\b(to|for|with|about|from)\s*$/i.test(title);
    
    if (hasObviousTypo || hasIncompletePhrase) {
      console.log(`  ⚠️  Title has issues, regenerating: "${title}"`);
      const retryResult = await model.generateContent(
        `${systemInstruction}\n\nIMPORTANT: The previous attempt had spelling or grammar errors. Please generate a PERFECT title with correct spelling and complete grammar.\n\nCHAT HISTORY:\n${convo}`
      );
      const retryRaw = retryResult.response.text();
      title = normalizeModelTitle(retryRaw);
    }
    
    return title;
  } catch (error) {
    console.error('  ❌ Error generating title:', error.message);
    return null;
  }
}

async function fixExistingTitles() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    
    const db = client.db('libraai');
    const conversationsCollection = db.collection('conversations');
    
    // Find all conversations
    const conversations = await conversationsCollection.find({}).toArray();
    
    console.log(`📊 Found ${conversations.length} conversations\n`);
    
    if (conversations.length === 0) {
      console.log('✅ No conversations to update');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      const currentTitle = conv.title || 'Conversation';
      
      console.log(`\n[${i + 1}/${conversations.length}] Processing conversation:`);
      console.log(`  ID: ${conv._id}`);
      console.log(`  Current title: "${currentTitle}"`);
      console.log(`  Messages: ${conv.messages?.length || 0}`);
      
      // Skip if no messages
      if (!conv.messages || conv.messages.length < 2) {
        console.log('  ⏭️  Skipped (not enough messages)');
        skipped++;
        continue;
      }
      
      // Check if title has obvious issues
      const hasTypo = /\b(aer|teh|hte|taht|waht|whta|availble|availabe)\b/i.test(currentTitle);
      const isGeneric = currentTitle === 'Conversation' || currentTitle === 'New Chat';
      const hasIncomplete = /\b(to|for|with|about|from)\s*$/i.test(currentTitle);
      
      if (!hasTypo && !isGeneric && !hasIncomplete) {
        console.log('  ✓ Title looks good, skipping');
        skipped++;
        continue;
      }
      
      // Generate new title
      console.log('  🔄 Generating new title...');
      const newTitle = await generateTitle(conv.messages);
      
      if (!newTitle) {
        console.log('  ❌ Failed to generate title');
        failed++;
        continue;
      }
      
      console.log(`  ✨ New title: "${newTitle}"`);
      
      // Update in database
      await conversationsCollection.updateOne(
        { _id: conv._id },
        { 
          $set: { 
            title: newTitle,
            lastUpdated: new Date()
          } 
        }
      );
      
      console.log('  ✅ Updated successfully');
      updated++;
      
      // Rate limiting - wait 1 second between API calls
      if (i < conversations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Total: ${conversations.length}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🚀 Starting title fix script...\n');
fixExistingTitles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
