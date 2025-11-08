"use client";

import RoleProtection from "@/components/RoleProtection";

export default function StudentLayout({ children }) {
  return (
    <RoleProtection requiredRole="student">
      {children}
    </RoleProtection>
  );
}
