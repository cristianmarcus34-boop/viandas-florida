"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ unauthorized }: { unauthorized: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(
    unauthorized
      ? "Tu cuenta no tiene permisos para administrar este sitio."
      : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")).trim(),
      password: String(formData.get("password")),
    });

    if (signInError) {
      setError("No pudimos iniciar sesión. Revisá el correo y la contraseña.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="admin-email">Correo electrónico</label>
      <input autoComplete="email" id="admin-email" name="email" required type="email" />
      <label htmlFor="admin-password">Contraseña</label>
      <input autoComplete="current-password" id="admin-password" name="password" required type="password" />
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <button className="admin-primary-button" disabled={loading} type="submit">
        {loading ? "Ingresando..." : "Ingresar al panel"}
      </button>
    </form>
  );
}
