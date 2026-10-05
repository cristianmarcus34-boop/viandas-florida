import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function requireAdmin() {
  await connection();
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=configuration");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo verificar el acceso administrativo: ${error.message}`);
  }

  if (!admin) {
    redirect("/admin/login?error=unauthorized");
  }

  return { supabase, user };
}
