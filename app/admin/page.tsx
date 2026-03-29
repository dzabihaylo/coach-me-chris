import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  return <AdminPanel adminEmail={session.user?.email ?? ""} />;
}
