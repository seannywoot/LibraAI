// Centralized Lucide icon exports and small helpers
// Prefer importing from this module: import { Home, Book, Users, Plus, Settings, User, Library, LogOut, Edit, Trash2 } from "@/components/icons";

export {
  // Navigation / essentials
  Home,
  Book,
  BookOpen,
  Plus,
  Users,
  LibraryBig as Library,
  Settings,
  User,
  LogOut,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  History,
  Archive,
  MessageCircle,
  Send,
  Paperclip,
  Camera,
  Upload,
  Download,
  X,
  Menu,
  ScanLine as Scan,
  Clock,
  AlertCircle,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Bookmark,
  Heart,
  Brain,
  CheckCircle,
  Loader2,
} from "lucide-react";

// Optional wrapper for consistent sizing in nav/buttons
export function NavIcon({ children, className = "h-4 w-4", ...props }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} {...props}>
      {children}
    </span>
  );
}
