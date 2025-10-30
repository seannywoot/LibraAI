## LibraAI

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
