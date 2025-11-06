# Dark mode persistence and global styling

This project now persists the dark theme across all pages and routes, including server-rendered pages, and adapts most legacy utility classes to the dark palette without touching every component.

## How it works

- The `ThemeProvider` (`src/contexts/ThemeContext.js`) reads and writes the theme to both `localStorage` and a `theme` cookie. It also applies the `dark` class to `<html>` and listens to cross-tab updates.
- The root layout (`src/app/layout.js`) reads the `theme` cookie on the server via `next/headers` and applies `class="dark"` to `<html>` during SSR. An inline script keeps the cookie and DOM in sync on the client as a fallback.
- Global CSS overrides in `src/app/globals.css` map common Tailwind utility classes (e.g., `bg-white`, `text-gray-900`, `border-gray-200`) to the dark palette when `.dark` is present. This makes existing components look correct in dark mode without per-file edits.

## Notes

- If you add new components, prefer using the shared CSS variables: `bg-(--bg-1)`, `bg-(--bg-2)`, `text-(--text)`, `border-(--stroke)`, etc., instead of hard-coded light utilities. That ensures excellent results in both themes without relying on overrides.
- To toggle the theme programmatically, use `useTheme()` and call `toggleDarkMode()`.
- If you need to force a theme for a specific route, you can add/remove the `dark` class on `<html>` in a segment layout. In most cases this isn’t needed anymore.
