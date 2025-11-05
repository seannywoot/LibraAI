// Test script for due date reminders system
// Run with: node scripts/test-due-reminders.js

const { MongoClient } = require('mongodb');

async function testDueReminders() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/test';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');

    console.log('🔍 Testing Due Date Reminders System\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Check users with email notifications enabled
    console.log('1️⃣  Checking user email notification preferences...');
    const users = db.collection('users');
    const allUsers = await users.find({}).toArray();
    const enabledCount = allUsers.filter(u => u.emailNotifications !== false).length;
    const disabledCount = allUsers.filter(u => u.emailNotifications === false).length;
    
    console.log(`   ✅ Total users: ${allUsers.length}`);
    console.log(`   📧 Email notifications enabled: ${enabledCount}`);
    console.log(`   🔕 Email notifications disabled: ${disabledCount}\n`);

    // Check borrowed books
    console.log('2️⃣  Checking borrowed books...');
    const transactions = db.collection('transactions');
    const borrowed = await transactions.find({ status: 'borrowed' }).toArray();
    
    console.log(`   📚 Total borrowed books: ${borrowed.length}\n`);

    if (borrowed.length === 0) {
      console.log('   ⚠️  No borrowed books found. Create some test data first.\n');
      return;
    }

    // Analyze due dates
    console.log('3️⃣  Analyzing due dates for reminder windows...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const reminderWindows = {
      week: [],
      threeDays: [],
      tomorrow: [],
      today: [],
      overdue: [],
      other: []
    };

    for (const transaction of borrowed) {
      const dueDate = new Date(transaction.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const diffTime = dueDateOnly - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const user = allUsers.find(u => u.email === transaction.userId);
      const notificationsEnabled = user ? user.emailNotifications !== false : true;

      const info = {
        bookId: transaction.bookId,
        userId: transaction.userId,
        dueDate: dueDate.toISOString().split('T')[0],
        daysUntilDue: diffDays,
        notificationsEnabled
      };

      if (diffDays === 7) reminderWindows.week.push(info);
      else if (diffDays === 3) reminderWindows.threeDays.push(info);
      else if (diffDays === 1) reminderWindows.tomorrow.push(info);
      else if (diffDays === 0) reminderWindows.today.push(info);
      else if (diffDays < 0) reminderWindows.overdue.push(info);
      else reminderWindows.other.push(info);
    }

    console.log(`   📅 Due in 7 days (week reminder): ${reminderWindows.week.length}`);
    if (reminderWindows.week.length > 0) {
      reminderWindows.week.forEach(b => {
        console.log(`      - ${b.userId} | Due: ${b.dueDate} | Notifications: ${b.notificationsEnabled ? '✅' : '❌'}`);
      });
    }

    console.log(`   📅 Due in 3 days (three-day reminder): ${reminderWindows.threeDays.length}`);
    if (reminderWindows.threeDays.length > 0) {
      reminderWindows.threeDays.forEach(b => {
        console.log(`      - ${b.userId} | Due: ${b.dueDate} | Notifications: ${b.notificationsEnabled ? '✅' : '❌'}`);
      });
    }

    console.log(`   📅 Due tomorrow (tomorrow reminder): ${reminderWindows.tomorrow.length}`);
    if (reminderWindows.tomorrow.length > 0) {
      reminderWindows.tomorrow.forEach(b => {
        console.log(`      - ${b.userId} | Due: ${b.dueDate} | Notifications: ${b.notificationsEnabled ? '✅' : '❌'}`);
      });
    }

    console.log(`   📅 Due today (due today reminder): ${reminderWindows.today.length}`);
    if (reminderWindows.today.length > 0) {
      reminderWindows.today.forEach(b => {
        console.log(`      - ${b.userId} | Due: ${b.dueDate} | Notifications: ${b.notificationsEnabled ? '✅' : '❌'}`);
      });
    }

    console.log(`   ⚠️  Overdue: ${reminderWindows.overdue.length}`);
    console.log(`   📆 Other due dates: ${reminderWindows.other.length}\n`);

    // Check environment variables
    console.log('4️⃣  Checking environment variables...');
    const requiredEnvVars = [
      'EMAILJS_SERVICE_ID',
      'EMAILJS_DUE_TEMPLATE_ID',
      'EMAILJS_PUBLIC_KEY',
      'EMAILJS_PRIVATE_KEY',
      'NEXTAUTH_URL'
    ];

    let allEnvVarsSet = true;
    for (const envVar of requiredEnvVars) {
      const isSet = !!process.env[envVar];
      console.log(`   ${isSet ? '✅' : '❌'} ${envVar}: ${isSet ? 'Set' : 'Missing'}`);
      if (!isSet) allEnvVarsSet = false;
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Summary
    const totalInReminderWindow = 
      reminderWindows.week.length + 
      reminderWindows.threeDays.length + 
      reminderWindows.tomorrow.length + 
      reminderWindows.today.length;

    const willReceiveReminders = [
      ...reminderWindows.week,
      ...reminderWindows.threeDays,
      ...reminderWindows.tomorrow,
      ...reminderWindows.today
    ].filter(b => b.notificationsEnabled).length;

    console.log('📊 Summary:');
    console.log(`   • Books in reminder windows: ${totalInReminderWindow}`);
    console.log(`   • Will receive reminders: ${willReceiveReminders}`);
    console.log(`   • Environment configured: ${allEnvVarsSet ? '✅ Yes' : '❌ No'}\n`);

    if (totalInReminderWindow === 0) {
      console.log('💡 Tip: To test reminders, create borrowed books with due dates:');
      console.log(`   • 7 days from now: ${new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
      console.log(`   • 3 days from now: ${new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
      console.log(`   • Tomorrow: ${new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
      console.log(`   • Today: ${today.toISOString().split('T')[0]}\n`);
    }

    if (willReceiveReminders > 0) {
      console.log('✅ Ready to send reminders! Run the cron job:');
      console.log('   curl http://localhost:3000/api/cron/due-reminders\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testDueReminders();
