/**
 * Browser Console Script to Fix Chat History Titles
 *
 * INSTRUCTIONS:
 * 1. Open your LibraAI application in the browser
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 *
 * This will:
 * - Load all conversations from localStorage
 * - Regenerate titles for conversations with issues
 * - Update both localStorage and database
 * - Show progress in console
 */

(async function fixChatTitles() {
  console.log("🚀 Starting title fix...\n");

  // Load conversations from localStorage
  const chatHistory = localStorage.getItem("chatHistory");
  if (!chatHistory) {
    console.log("❌ No chat history found in localStorage");
    return;
  }

  let conversations;
  try {
    conversations = JSON.parse(chatHistory);
  } catch (e) {
    console.error("❌ Failed to parse chat history:", e);
    return;
  }

  console.log(`📊 Found ${conversations.length} conversations\n`);

  if (conversations.length === 0) {
    console.log("✅ No conversations to update");
    return;
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    const currentTitle = conv.title || "Conversation";

    console.log(`\n[${i + 1}/${conversations.length}] Processing:`);
    console.log(`  Current title: "${currentTitle}"`);
    console.log(`  Messages: ${conv.messages?.length || 0}`);

    // Skip if no messages
    if (!conv.messages || conv.messages.length < 2) {
      console.log("  ⏭️  Skipped (not enough messages)");
      skipped++;
      continue;
    }

    // Check if title has obvious issues
    const hasTypo = /\b(aer|teh|hte|taht|waht|whta|availble|availabe)\b/i.test(
      currentTitle
    );
    const isGeneric =
      currentTitle === "Conversation" || currentTitle === "New Chat";
    const hasIncomplete = /\b(to|for|with|about|from)\s*$/i.test(currentTitle);

    if (!hasTypo && !isGeneric && !hasIncomplete) {
      console.log("  ✓ Title looks good, skipping");
      skipped++;
      continue;
    }

    // Generate new title via API
    console.log("  🔄 Generating new title...");

    try {
      // Prepare messages for title generation
      const messagesToSend = conv.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(0, 8)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat/title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("  ⚠️  API error:", errorData);
        throw new Error(
          `API returned ${response.status}: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      const newTitle = data.title;

      if (!newTitle || newTitle === "Conversation") {
        console.log("  ⚠️  API returned generic title, skipping");
        skipped++;
        continue;
      }

      console.log(`  ✨ New title: "${newTitle}"`);

      // Update conversation
      conv.title = newTitle;
      conv.lastUpdated = new Date().toISOString();

      // Save to database
      try {
        const saveResponse = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: conv.id,
            title: newTitle,
            messages: conv.messages,
          }),
        });

        if (saveResponse.ok) {
          console.log("  💾 Saved to database");
        } else {
          console.log(
            "  ⚠️  Failed to save to database (will save to localStorage)"
          );
        }
      } catch (dbError) {
        console.log("  ⚠️  Database save error:", dbError.message);
      }

      console.log("  ✅ Updated successfully");
      updated++;

      // Rate limiting - wait 1 second between API calls
      if (i < conversations.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("  ❌ Failed:", error.message);
      failed++;
    }
  }

  // Save updated conversations to localStorage
  localStorage.setItem("chatHistory", JSON.stringify(conversations));
  console.log("\n💾 Saved to localStorage");

  console.log("\n" + "=".repeat(50));
  console.log("📈 Summary:");
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total: ${conversations.length}`);
  console.log("=".repeat(50));

  console.log("\n✅ Done! Refresh the page to see updated titles.");
})();
