
const { buildReturnConfirmationEmail } = require('./src/lib/email-templates');

const mockInput = {
    studentName: 'John Doe',
    toEmail: 'john@example.com',
    bookTitle: 'The Great Gatsby',
    bookAuthor: 'F. Scott Fitzgerald',
    borrowDate: 'Oct 1, 2023',
    returnDate: 'Oct 15, 2023',
    viewHistoryUrl: 'http://localhost:3000/student/library',
    libraryName: 'LibraAI Library',
    supportEmail: 'support@libra.ai'
};

const conditions = ['good', 'fair', 'damaged'];

conditions.forEach(condition => {
    console.log(`\n--- Testing Condition: ${condition} ---`);
    const result = buildReturnConfirmationEmail({
        ...mockInput,
        bookCondition: condition,
        conditionNotes: condition === 'damaged' ? 'Cover torn' : ''
    });
    console.log('Subject:', result.subject);
    console.log('HTML snippet (Condition Part):');
    const conditionMatch = result.html.match(/<div style="margin-top:12px;[\s\S]*?<\/div>/);
    console.log(conditionMatch ? conditionMatch[0] : 'Condition part not found');
    console.log('Text snippet (Condition Part):');
    const textLines = result.text.split('\n');
    const conditionLine = textLines.find(line => line.startsWith('Condition:'));
    const notesLine = textLines.find(line => line.startsWith('Notes:'));
    console.log(conditionLine);
    if (notesLine) console.log(notesLine);
});
