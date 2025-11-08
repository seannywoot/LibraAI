"use client";

import RoleProtection from "@/components/RoleProtection";

export default function AdminLayout({ children }) {
  return (
    <RoleProtection requiredRole="admin">
      {children}
    </RoleProtection>
  );
}
