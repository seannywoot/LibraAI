import { Home, Book, BookOpen, Plus, Users, Library as LibraryIcon, User, Settings, History, MessageCircle } from "@/components/icons";
import { HelpCircle } from "lucide-react";

// Centralized navigation link builders for consistent sidebars
// Sidebar will filter out Profile/Settings from the main list and surface them in the account menu.

export function getStudentLinks() {
  return [
    { key: "student-dashboard", label: "Dashboard", href: "/student/dashboard", exact: true, icon: <Home className="h-4 w-4" /> },
    { key: "student-books", label: "Browse Books", href: "/student/books", exact: true, icon: <Book className="h-4 w-4" /> },
    { key: "student-borrowed", label: "My Books", href: "/student/borrowed", exact: true, icon: <BookOpen className="h-4 w-4" /> },
    { key: "student-chat", label: "Chat", href: "/student/chat", exact: true, icon: <MessageCircle className="h-4 w-4" /> },
    { key: "student-faq", label: "FAQ", href: "/student/faq", exact: true, icon: <HelpCircle className="h-4 w-4" /> },
    { key: "student-profile", label: "Profile", href: "/student/profile", exact: true, icon: <User className="h-4 w-4" /> },
    { key: "student-settings", label: "Settings", href: "/student/settings", exact: true, icon: <Settings className="h-4 w-4" /> },
  ];
}

export function getAdminLinks() {
  return [
    { key: "admin-dashboard", label: "Dashboard", href: "/admin/dashboard", exact: true, icon: <Home className="h-4 w-4" /> },
    { key: "admin-books", label: "Books", href: "/admin/books", exact: true, icon: <Book className="h-4 w-4" /> },
    { key: "admin-add-book", label: "Add Book", href: "/admin/books/add", exact: true, icon: <Plus className="h-4 w-4" /> },
    { key: "admin-transactions", label: "Transactions", href: "/admin/transactions", exact: true, icon: <History className="h-4 w-4" /> },
    { key: "admin-authors", label: "Authors", href: "/admin/authors", exact: true, icon: <Users className="h-4 w-4" /> },
    { key: "admin-shelves", label: "Shelves", href: "/admin/shelves", exact: true, icon: <LibraryIcon className="h-4 w-4" /> },
    { key: "admin-profile", label: "Profile", href: "/admin/profile", exact: true, icon: <User className="h-4 w-4" /> },
    { key: "admin-settings", label: "Settings", href: "/admin/settings", exact: true, icon: <Settings className="h-4 w-4" /> },
  ];
}
