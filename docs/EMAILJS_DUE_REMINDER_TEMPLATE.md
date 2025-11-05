# EmailJS Template: Borrowed Book Due Reminder

Use this when setting up your EmailJS template for due-date reminders. The template is designed to work with our `sendMail` helper and the `buildDueReminderEmail` function in `src/lib/email-templates.js`.

Supported phases: week (7 days before), three_days (3 days before), one_day_or_due (0–1 day being due; also handles overdue if negative).

## Variables (template_params)

Required:

- to_email: recipient email (auto-populated)
- student_name: string
- book_title: string
- due_date: string (display-ready)
- days_until_due: number (e.g., 7, 3, 1, 0, or negative if overdue)
- phase: 'week' | 'three_days' | 'one_day_or_due'

Optional:

- book_author: string
- borrow_date: string
- phase_label: string (derived label like "One-week reminder", "3-day reminder", "Due today", etc.)
- view_borrowed_url: string (link to the user’s borrowed books)
- library_name: string (defaults to "LibraAI Library")
- support_email: string (defaults to "support@example.com")
- fine_policy_url: string
- footer_message: string

Note: `subject`, `message`, and `message_html` are passed by code, but you can also render content purely from template variables if preferred.

## Suggested Subject

Configure subject dynamically in code, or copy the following logic into EmailJS:

- week: `Reminder: "{{book_title}}" is due in 7 days ({{due_date}})`
- three_days: `Reminder: "{{book_title}}" is due in 3 days ({{due_date}})`
- one_day_or_due (days_until_due==1): `Urgent: "{{book_title}}" is due tomorrow ({{due_date}})`
- one_day_or_due (days_until_due==0): `Due today: "{{book_title}}" ({{due_date}})`
- one_day_or_due (days_until_due<0): `Overdue: "{{book_title}}" was due {{due_date}}`

## HTML Body (paste into EmailJS template)

```
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 4px;">{{phase_label}}: Due {{#if days_until_due}}{{#gt days_until_due 1}}in {{days_until_due}} days{{else}}{{#eq days_until_due 1}}tomorrow{{else}}{{#eq days_until_due 0}}today{{else}}overdue by {{abs days_until_due}} day{{#neq (abs days_until_due) 1}}s{{/neq}}{{/eq}}{{/eq}}{{/gt}}{{else}}soon{{/if}}</h2>
  <p style="margin:0 0 16px;color:#6b7280">{{library_name}}</p>

  <p style="margin-top:0;">Hi {{student_name}},</p>
  <p>The book <strong>{{book_title}}</strong>{{#if book_author}} by {{book_author}}{{/if}} is due on <strong>{{due_date}}</strong>.</p>
  {{#if borrow_date}}
  <p style="margin:0;color:#6b7280">Borrowed on {{borrow_date}}</p>
  {{/if}}

  <div style="margin:16px 0;">
    {{#if view_borrowed_url}}
      <a href="{{view_borrowed_url}}" style="background:#ffffff;border:1px solid #d1d5db;color:#111827;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">View borrowed books</a>
    {{/if}}
  </div>

  <p style="color:#374151;">If you’ve already returned this book, you can ignore this message.</p>
  <p style="color:#374151;">Have questions? Contact us at <a href="mailto:{{support_email}}" style="color:#2563eb">{{support_email}}</a>.</p>
  {{#if fine_policy_url}}
  <p style="margin:0;color:#6b7280">See our <a href="{{fine_policy_url}}" style="color:#2563eb">fine policy</a> for details.</p>
  {{/if}}

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="margin:0;color:#9ca3af;font-size:12px;">You’re receiving this because you enabled due-date reminders in your profile settings.</p>
  {{#if footer_message}}
  <p style="margin-top:16px;color:#9ca3af;font-size:12px;">{{footer_message}}</p>
  {{/if}}
</div>
```

If your EmailJS plan doesn’t allow advanced helpers, simplify the “Due …” line using the exact subject your code provides, or pass a `when_text` variable from code.

## Plain Text Body (optional)

```
{{library_name}} — Due reminder
Hi {{student_name}},
The book "{{book_title}}"{{#if book_author}} by {{book_author}}{{/if}} is due on {{due_date}}.
{{#if borrow_date}}Borrowed on {{borrow_date}}.{{/if}}
{{#if view_borrowed_url}}View borrowed books: {{view_borrowed_url}}{{/if}}
If you’ve already returned this book, you can ignore this message.
Questions? Contact {{support_email}}.
```

## How to configure in EmailJS

1. Create a new Template in EmailJS (e.g., `book_due_reminder`).
2. Paste the HTML Body above into the template. Optionally add the Plain Text version.
3. Ensure the following variables are included in your template variables list: `to_email`, `student_name`, `book_title`, `due_date`, `days_until_due`, `phase`. Include any optional ones you plan to use.
4. In Account > API keys, enable “Allow non-browser requests” if you intend to trigger from server-side routes.
5. Note your Service ID, Template ID, and keys. Set environment variables in your app:
   - EMAILJS_SERVICE_ID
   - EMAILJS_TEMPLATE_ID (use this reminder template’s ID)
   - EMAILJS_PUBLIC_KEY (or EMAILJS_USER_ID)
   - EMAILJS_PRIVATE_KEY
   - EMAIL_FROM (optional, e.g., "LibraAI <no-reply@yourdomain>")

## Example params payload

```json
{
  "to_email": "jane@example.com",
  "student_name": "Jane Doe",
  "book_title": "Introduction to Algorithms",
  "book_author": "Cormen et al.",
  "borrow_date": "Oct 15, 2025",
  "due_date": "Nov 10, 2025",
  "days_until_due": 3,
  "phase": "three_days",
  "phase_label": "3-day reminder",
  "view_borrowed_url": "https://app.example.com/my-library",
  "library_name": "LibraAI Library",
  "support_email": "help@libra.ai",
  "fine_policy_url": "https://app.example.com/help/fines",
  "footer_message": "Update notification settings in your profile."
}
```

This template supports all three phases with a single EmailJS template. You can optionally create three separate templates if you prefer distinct designs for each phase.
