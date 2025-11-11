"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * ProtectedLink - A Link component that can be intercepted by unsaved changes warnings
 * 
 * @param {function} onNavigate - Optional callback to intercept navigation
 * @param {object} props - All standard Next.js Link props
 */
export default function ProtectedLink({ onNavigate, children, href, ...props }) {
  const router = useRouter();

  const handleClick = (e) => {
    // If there's an onNavigate handler, let it decide whether to proceed
    if (onNavigate) {
      e.preventDefault();
      const shouldNavigate = onNavigate(() => {
        if (typeof href === 'string') {
          router.push(href);
        } else if (href?.pathname) {
          router.push(href.pathname);
        }
      });
      
      // If onNavigate returns true, proceed with navigation
      if (shouldNavigate) {
        if (typeof href === 'string') {
          router.push(href);
        } else if (href?.pathname) {
          router.push(href.pathname);
        }
      }
    }
    // Otherwise, let the Link handle navigation normally
  };

  return (
    <Link href={href} {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
