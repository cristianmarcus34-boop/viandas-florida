import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/supabase/admin";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
