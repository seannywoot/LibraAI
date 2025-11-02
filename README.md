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

## Email setup (password reset)

This app now uses a single email sender: SMTP via nodemailer in `src/lib/email.js`.

Environment variables used by the app:

```
# Who the email is from — use a verified sender/domain at your provider
EMAIL_FROM="LibraAI <no-reply@yourdomain.com>"

# SMTP settings (point these to your provider, e.g., Resend SMTP, SendGrid, Postmark, etc.)
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"                  # typically 587 (STARTTLS) or 465 (TLS)
SMTP_USER="<smtp-username>"
SMTP_PASS="<smtp-password-or-token>"

# Optional: controls expiry text in the email copy
PASSWORD_RESET_EXP_MIN="15"

# The base URL used to build email links (fallback order: NEXTAUTH_URL, APP_URL, then http://localhost:3000)
# Set one of these in production
NEXTAUTH_URL="https://your-domain.tld"
# or
APP_URL="https://your-domain.tld"
```

How it works:
- In production, `src/lib/email.js` uses the SMTP_* variables and `EMAIL_FROM`.
- In development, if SMTP vars are not set, it automatically provisions an Ethereal test inbox so you can preview emails in the console.

Deliverability tips:
- Verify your sending domain (SPF/DKIM) with your email provider and use a real `EMAIL_FROM` at that domain.
- Keep password‑reset tokens short‑lived (15–60 minutes) and one‑time use.
- Avoid user enumeration: the API responds with a generic success message whether or not the email exists (already implemented).

