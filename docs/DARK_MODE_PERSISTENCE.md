# Dark mode persistence and global styling

This project now persists the dark theme across all pages and routes, including server-rendered pages, and adapts most legacy utility classes to the dark palette without touching every component.

## How it works

- The `ThemeProvider` (`src/contexts/ThemeContext.js`) reads and writes the theme to both `localStorage` and a `theme` cookie. It also applies the `dark` class to `<html>` and listens to cross-tab updates.
- The root layout (`src/app/layout.js`) reads the `theme` cookie on the server via `next/headers` and applies `class="dark"` to `<html>` during SSR. An inline script keeps the cookie and DOM in sync on the client as a fallback.
- Global CSS overrides in `src/app/globals.css` map common Tailwind utility classes (e.g., `bg-white`, `text-gray-900`, `border-gray-200`) to the dark palette when `.dark` is present. This makes existing components look correct in dark mode without per-file edits.

## Instant theme switching (no save required)

As of the latest update, dark mode changes are applied **immediately** without requiring users to click a "Save" button:

- When users toggle dark mode in their profile settings, the theme changes instantly in the UI and is saved to localStorage
- The preference is automatically saved to the database in the background via the `/api/user/profile` PUT endpoint
- The session is updated to keep all tabs in sync
- No "pending" state or "dirty" flag tracking is needed
- Preferences are loaded only once on component mount to prevent conflicts with user changes

### Technical details

- The `/api/user/profile` PUT endpoint now accepts partial updates (theme-only, name-only, or any combination)
- The `preferencesLoadedRef` prevents re-fetching preferences after the initial load, avoiding theme reversion issues
- Theme changes persist across logout/login cycles via the database
- The `SessionProvider` syncs the theme from the session on login

### Cross-tab and cross-browser sync

All user preferences (theme, name, email notifications) now sync in real-time across tabs and browsers:

**Same browser (instant sync):**
- The `UserPreferencesContext` listens to `localStorage` storage events
- When you change any preference in one tab, all other tabs in the same browser update instantly
- Works for theme, profile name, and email notification settings

**Different browsers (15-second sync):**
- The `SessionProvider` polls the database every 15 seconds to check for preference changes
- Only polls when the tab is visible (saves ~50% of server load)
- Syncs immediately when you switch back to a background tab
- Updates all preferences: theme, name, and email notifications
- This allows changes to sync across different browsers (Chrome, Firefox, Safari, etc.) within 15 seconds

**Optimizations:**
- Polling only occurs when the tab is visible
- Uses lightweight GET requests with indexed queries
- Changes are broadcast via localStorage for instant same-browser sync
- Database is only queried when necessary

This provides a better user experience where all preference changes feel responsive and natural across all devices and browsers.

## Notes

- If you add new components, prefer using the shared CSS variables: `bg-(--bg-1)`, `bg-(--bg-2)`, `text-(--text)`, `border-(--stroke)`, etc., instead of hard-coded light utilities. That ensures excellent results in both themes without relying on overrides.
- To toggle the theme programmatically, use `useTheme()` and call `toggleDarkMode()` or `setDarkModePreference(isDark, { persist: true })`.
- The `DarkModeToggle` component can be used in two ways:
  - **Uncontrolled** (default): Manages its own state and persists changes immediately
  - **Controlled**: Pass `onChange` handler to customize behavior (e.g., save to database)
- If you need to force a theme for a specific route, you can add/remove the `dark` class on `<html>` in a segment layout. In most cases this isn't needed anymore.
