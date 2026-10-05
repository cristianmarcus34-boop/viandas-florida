import LoginForm from "@/app/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresar | Viandas Florida",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const configured = isSupabaseConfigured();
  const params = await searchParams;

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <Link className="brand" href="/"><span>viandas</span> florida<span className="brand-dot">.</span></Link>
        <p className="eyebrow">Panel de administración</p>
        <h1>Hola de nuevo.</h1>
        {!configured ? (
          <div className="admin-notice admin-notice-error">
            El panel todavía no está conectado. Configurá las variables de Supabase indicadas en la guía de puesta en marcha.
          </div>
        ) : (
          <LoginForm unauthorized={params.error === "unauthorized"} />
        )}
        <Link className="admin-back-link" href="/">Volver al sitio</Link>
      </div>
    </main>
  );
}
