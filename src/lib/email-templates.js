// Email notification templates for LibraAI
// Focus: Borrowed book due reminders (week-before, three-days-before, and 0–1 day due)
//
// Contract (inputs):
// - phase: 'week' | 'three_days' | 'one_day_or_due'
// - studentName: string
// - toEmail: string
// - bookTitle: string
// - bookAuthor?: string
// - borrowDate?: string (display-ready, e.g. 'Oct 15, 2025')
// - dueDate: string (display-ready)
// - daysUntilDue: number (0 for today, 1 for tomorrow, 7 for a week, negative if overdue)
// - viewBorrowedUrl?: string
// - libraryName?: string (default: 'LibraAI Library')
// - supportEmail?: string (default: 'support@example.com')
// - finePolicyUrl?: string
// - footerMessage?: string
//
// Outputs:
// { subject, html, text, templateParams }
// templateParams are designed to be passed to EmailJS template variables.

const DEFAULT_LIBRARY_NAME = 'LibraAI Library';
const DEFAULT_SUPPORT_EMAIL = 'support@example.com';

function phaseLabel(phase, daysUntilDue) {
  if (phase === 'week') return 'One-week reminder';
  if (phase === 'three_days') return '3-day reminder';
  if (phase === 'one_day_or_due') {
    if (daysUntilDue === 1) return 'Due tomorrow';
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue < 0) return 'Overdue';
    return 'Due soon';
  }
  return 'Reminder';
}

function getDueReminderSubject(phase, { bookTitle, dueDate, daysUntilDue }) {
  const baseTitle = bookTitle ? `"${bookTitle}"` : 'your borrowed book';
  if (phase === 'week') return `Reminder: ${baseTitle} is due in 7 days (${dueDate})`;
  if (phase === 'three_days') return `Reminder: ${baseTitle} is due in 3 days (${dueDate})`;
  if (phase === 'one_day_or_due') {
    if (daysUntilDue === 1) return `Urgent: ${baseTitle} is due tomorrow (${dueDate})`;
    if (daysUntilDue === 0) return `Due today: ${baseTitle} (${dueDate})`;
    if (typeof daysUntilDue === 'number' && daysUntilDue < 0) return `Overdue: ${baseTitle} was due ${dueDate}`;
    return `Reminder: ${baseTitle} is due soon (${dueDate})`;
  }
  return `Reminder: ${baseTitle} is due ${dueDate}`;
}

function buildDueReminderTemplateParams(input) {
  const {
    phase,
    studentName,
    toEmail,
    bookTitle,
    bookAuthor,
    borrowDate,
    dueDate,
  daysUntilDue,
    viewBorrowedUrl,
    libraryName = DEFAULT_LIBRARY_NAME,
    supportEmail = DEFAULT_SUPPORT_EMAIL,
    finePolicyUrl,
    footerMessage,
  } = input || {};

  return {
    // Primary recipients/identity
    to_email: toEmail,
    student_name: studentName,

    // Book details
    book_title: bookTitle,
    book_author: bookAuthor,
    borrow_date: borrowDate,
    due_date: dueDate,
    days_until_due: daysUntilDue,
    phase,
    phase_label: phaseLabel(phase, daysUntilDue),

  // Helpful links
    view_borrowed_url: viewBorrowedUrl,

    // Org details
    library_name: libraryName,
    support_email: supportEmail,
    fine_policy_url: finePolicyUrl,

    // Misc
    footer_message: footerMessage,
  };
}

function buildDueReminderHTML(params) {
  const {
    student_name,
    book_title,
    book_author,
    borrow_date,
    due_date,
  days_until_due,
  phase_label,
    view_borrowed_url,
    library_name,
    support_email,
    fine_policy_url,
    footer_message,
  } = params;

  const whenText = typeof days_until_due === 'number'
    ? (days_until_due > 1
        ? `in ${days_until_due} days`
        : days_until_due === 1
          ? 'tomorrow'
          : days_until_due === 0
            ? 'today'
            : `overdue by ${Math.abs(days_until_due)} day${Math.abs(days_until_due) === 1 ? '' : 's'}`)
    : 'soon';

  const authorPart = book_author ? ` by ${escapeHTML(book_author)}` : '';
  const borrowPart = borrow_date ? `<p style="margin:0;color:#6b7280">Borrowed on ${escapeHTML(borrow_date)}</p>` : '';
  const finePolicyPart = fine_policy_url
    ? `<p style="margin:0;color:#6b7280">See our <a href="${escapeAttr(fine_policy_url)}" style="color:#2563eb">fine policy</a> for details.</p>`
    : '';
  const footerPart = footer_message
    ? `<p style="margin-top:16px;color:#9ca3af;font-size:12px;">${escapeHTML(footer_message)}</p>`
    : '';

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;">${escapeHTML(phase_label)}: Due ${escapeHTML(whenText)}</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHTML(library_name)}</p>

    <p style="margin-top:0;">Hi ${escapeHTML(student_name || 'there')},</p>
    <p>The book <strong>${escapeHTML(book_title)}</strong>${authorPart} is due on <strong>${escapeHTML(due_date)}</strong> (due ${escapeHTML(whenText)}).</p>
    ${borrowPart}

    <div style="margin:16px 0;">
      ${view_borrowed_url ? `<a href="${escapeAttr(view_borrowed_url)}" style="background:#ffffff;border:1px solid #d1d5db;color:#111827;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">View borrowed books</a>` : ''}
    </div>

    <p style="color:#374151;">If you’ve already returned this book, you can ignore this message.</p>
    <p style="color:#374151;">Have questions? Contact us at <a href="mailto:${escapeAttr(support_email)}" style="color:#2563eb">${escapeHTML(support_email)}</a>.</p>
    ${finePolicyPart}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;color:#9ca3af;font-size:12px;">You’re receiving this because you enabled due-date reminders in your profile settings.</p>
    ${footerPart}
  </div>
  `;
}

function buildDueReminderText(params) {
  const {
    student_name,
    book_title,
    book_author,
    borrow_date,
    due_date,
  days_until_due,
    view_borrowed_url,
    library_name,
    support_email,
  } = params;

  const whenText = typeof days_until_due === 'number'
    ? (days_until_due > 1
        ? `in ${days_until_due} days`
        : days_until_due === 1
          ? 'tomorrow'
          : days_until_due === 0
            ? 'today'
            : `overdue by ${Math.abs(days_until_due)} days`)
    : 'soon';

  return [
    `${library_name || DEFAULT_LIBRARY_NAME} — Due reminder`,
    `Hi ${student_name || 'there'},`,
    `The book "${book_title}"${book_author ? ` by ${book_author}` : ''} is due on ${due_date} (due ${whenText}).`,
  borrow_date ? `Borrowed on ${borrow_date}.` : null,
    view_borrowed_url ? `View borrowed books: ${view_borrowed_url}` : null,
    `If you’ve already returned this book, you can ignore this message.`,
    `Questions? Contact ${support_email || DEFAULT_SUPPORT_EMAIL}.`,
  ].filter(Boolean).join('\n');
}

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  // For URL and mailto attributes
  return String(str ?? '').replace(/"/g, '&quot;');
}

export function buildDueReminderEmail(input) {
  const templateParams = buildDueReminderTemplateParams(input);
  const subject = getDueReminderSubject(input?.phase, {
    bookTitle: input?.bookTitle,
    dueDate: input?.dueDate,
    daysUntilDue: input?.daysUntilDue,
  });
  const html = buildDueReminderHTML(templateParams);
  const text = buildDueReminderText(templateParams);
  return { subject, html, text, templateParams };
}

export const DueReminderParamSchema = {
  required: [
    'phase',
    'studentName',
    'toEmail',
    'bookTitle',
    'dueDate',
    'daysUntilDue',
  ],
  optional: [
    'bookAuthor',
    'borrowDate',
    'viewBorrowedUrl',
    'libraryName',
    'supportEmail',
    'finePolicyUrl',
    'footerMessage',
  ],
  notes:
    'phase must be one of: week, three_days, one_day_or_due. daysUntilDue is an integer: 7 (week), 3 (three_days), 1/0 (one_day_or_due). Negative values indicate overdue.',
};

// Example usage (not executed here):
// const { subject, html, text, templateParams } = buildDueReminderEmail({
//   phase: 'three_days',
//   studentName: 'Jane Doe',
//   toEmail: 'jane@example.com',
//   bookTitle: 'Introduction to Algorithms',
//   bookAuthor: 'Cormen et al.',
//   borrowDate: 'Oct 15, 2025',
//   dueDate: 'Nov 10, 2025',
//   daysUntilDue: 3,
//   viewBorrowedUrl: 'https://app.example.com/my-library',
//   libraryName: 'LibraAI Library',
//   supportEmail: 'help@libra.ai',
//   finePolicyUrl: 'https://app.example.com/help/fines',
//   footerMessage: 'You can update notification settings in your profile.',
// });
