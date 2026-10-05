import AdminDashboard from "@/app/admin/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración | Viandas Florida",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
