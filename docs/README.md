~## LibraAI

AI‑powered digital library companion built with Next.js App Router, NextAuth, and MongoDB.

This README covers the current project structure and the environment variables you need to run the app locally and in production.

## Project structure

```
eslint.config.mjs
jsconfig.json
middleware.js
next.config.mjs
package.json
postcss.config.mjs
README.md
public/
src/
	app/
		globals.css
		layout.js
		page.js
		admin/
			dashboard/
				page.js
			profile/
				page.js
			settings/
				page.js
		api/
			admin/
				seed-users/
					route.js
			auth/
				[...nextauth]/
					route.js
				login/
					route.js
				logout/
					route.js
				session/
					route.js
			db/
				ping/
					route.js
		auth/
			page.js
		dashboard/
			page.js
		student/
			dashboard/
				page.js
			profile/
				page.js
			settings/
				page.js
	components/
		dashboard-sidebar.jsx
		SessionProvider.jsx
		sign-out-button.jsx
	lib/
		mongodb.js
		passwords.js
```

## Required environment variables

Create a file named `.env.local` in the project root and add the values below. Keys marked required must be set for the app to work.

```
# Database (required) — primary variable the app looks for
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"

# NextAuth secret (required) — used for signing/encrypting JWTs and by middleware
NEXTAUTH_SECRET="<generate-a-strong-random-string>"

# Optional fallbacks supported by the code (if you prefer different names)
# MONGODB_URL=
# DATABASE_URL=

# Recommended in production for NextAuth absolute callback URLs
# NEXTAUTH_URL="https://your-domain.tld"
```

Tips
- To generate a strong secret on Windows PowerShell (requires Node.js):
  – Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Node.js version: the project targets Node >= 18.17.0 (see `package.json`).

## Running locally

1) Install dependencies

```powershell
npm install
```

2) Create `.env.local` with the variables above.

3) (Optional) Seed demo users into your MongoDB (development only)

After the dev server starts, open this in your browser:

```
http://localhost:3000/api/admin/seed-users
```

This will upsert two users into the `users` collection:
- student: student@demo.edu / ReadSmart123
- admin: admin@libra.ai / ManageStacks!

4) Start the dev server

```powershell
npm run dev
```

Then visit http://localhost:3000 and sign in at /auth. You can also test the DB connection at `/api/db/ping`.

## Authentication and roles

- Auth is powered by NextAuth using the Credentials provider and JWT sessions.
- Middleware enforces role‑based routing:
  - Admin routes under `/admin/*` require role `admin`.
  - Student routes under `/student/*` require role `student`.
  - `/dashboard` redirects to the role‑specific dashboard.

## Deploying

Any Next.js compatible platform will work. In addition to `.env` above, set at least:
- MONGODB_URI
- NEXTAUTH_SECRET
- NEXTAUTH_URL (recommended)

Build/start scripts:

```powershell
npm run build
npm start
```

For more details, see Next.js deployment docs.

## AI Chatbot Features

### PDF Document Analysis (NEW!)

The LibraAI chatbot can now read and analyze PDF documents. Users can upload PDFs and ask the AI to:
- **Summarize** the entire document or specific sections
- **Create bullet points** of key information
- **Answer questions** about the document content
- **Extract information** based on specific queries

**Quick Start:**
1. Click the 📎 (paperclip) icon in the chat
2. Upload a PDF file (max 10MB)
3. Ask: "Summarize this", "Create bullet points", or ask specific questions

**Example prompts:**
- "Summarize this research paper"
- "List the key findings in bullet points"
- "What methodology was used?"
- "What does page 5 say about [topic]?"

**Documentation:**
- Quick Start: `PDF_ANALYSIS_QUICK_START.md`
- Full Guide: `docs/CHATBOT_PDF_ANALYSIS.md`
- Examples: `docs/PDF_ANALYSIS_EXAMPLES.md`

**Technical Details:**
- Uses `pdfjs-dist` for text extraction
- Processes up to 50 pages per document
- Works with both Gemini and Qwen AI models
- Supports text-based PDFs (scanned PDFs may have limited support)

## Chat persistence database setup

LibraAI stores chat conversations in MongoDB for cross-device access and data persistence. Before using the chat feature, you need to initialize the database indexes.

### Initialize the conversations collection

Run this script once to create the necessary indexes:

```powershell
npm run init-conversations
```

This script will:
- Create an index on `userId` for efficient user-specific queries
- Create an index on `conversationId` for unique identification
- Create a compound index on `userId` and `lastUpdated` for efficient sorting
- Verify all indexes were created successfully

### What it does

The script connects to your MongoDB database using the `MONGODB_URI` from `.env.local` and creates optimized indexes for the `conversations` collection. These indexes ensure fast query performance when:
- Loading all conversations for a user
- Finding a specific conversation
- Sorting conversations by most recent activity

### Troubleshooting

If the script fails:
- Verify your `MONGODB_URI` is set correctly in `.env.local`
- Ensure your MongoDB user has write permissions
- Check that you can connect to MongoDB (test at `/api/db/ping`)

You can run the script multiple times safely - it will skip indexes that already exist.

## Email setup (password reset)

This app uses EmailJS for sending emails. EmailJS is a simple, client-side email service that doesn't require a backend server.

### Setting up EmailJS

1. Create a free account at https://www.emailjs.com/
2. Add an email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{to_email}}` - recipient email
   - `{{subject}}` - email subject
   - `{{message}}` or `{{message_html}}` - email body
   - `{{reset_url}}` - password reset link
   - `{{app_name}}` - application name
   - `{{expires_minutes}}` - token expiry time
   - `{{from_name}}` - sender name
   - `{{reply_to}}` - reply-to email
4. Get your credentials from the EmailJS dashboard

### Environment variables

```
# EmailJS Configuration (Required)
EMAILJS_SERVICE_ID="service_xxxxxxx"      # From EmailJS dashboard > Email Services
EMAILJS_TEMPLATE_ID="template_xxxxxxx"    # From EmailJS dashboard > Email Templates
EMAILJS_PRIVATE_KEY="xxxxxxxxxx"          # From EmailJS dashboard > Account > API Keys
EMAILJS_PUBLIC_KEY="xxxxxxxxxx"           # From EmailJS dashboard > Account > General

# Email sender info
EMAIL_FROM="LibraAI <no-reply@yourdomain.com>"

# Optional: controls expiry text in the email copy
PASSWORD_RESET_EXP_MIN="15"

# The base URL used to build email links
NEXTAUTH_URL="https://your-domain.tld"
```

### How it works
- `src/lib/email.js` sends emails via the EmailJS REST API
- All credentials are kept server-side for security
- The private key is never exposed to the client

### Tips
- Keep password reset tokens short-lived (15–60 minutes) and one-time use
- Test your email template in the EmailJS dashboard before deploying
- The API responds with a generic success message whether or not the email exists (prevents user enumeration)

