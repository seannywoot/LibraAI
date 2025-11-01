"use client";

import { useSession } from "next-auth/react";

export default function ClientUserName({ fallback = "Study Explorer" }) {
  const { data: session } = useSession();
  const name = session?.user?.name || fallback;
  return <>{name}</>;
}
