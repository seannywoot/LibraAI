import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LibraAI - Your AI-powered digital library companion",
  description: "Discover, access, and organize course materials faster with targeted recommendations and a unified library workspace.",
};

export default function RootLayout({ children }) {
  // Inline script to set theme class ASAP on the client without relying on server cookies API
  const setThemeScript = `!function(){try{var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.cookie.match(/(?:^|; )theme=([^;]+)/);var v=c?decodeURIComponent(c[1]):null;var t=v||localStorage.getItem('theme');var isDark=t==='dark'||(!t&&m);var el=document.documentElement;el.dataset.theme=isDark?'dark':'light';isDark?el.classList.add('dark'):el.classList.remove('dark');document.cookie='theme='+(isDark?'dark':'light')+'; path=/; max-age=31536000'}catch(e){}}();`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-(--background) text-(--text-primary) transition-colors duration-200`}
      >
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
