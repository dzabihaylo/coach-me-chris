import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const allowed = session.user?.email
    ? await db.allowedEmail.findUnique({
        where: { email: session.user.email.toLowerCase() },
      })
    : null;

  return (
    <AppShell
      user={{
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      }}
      isAdmin={allowed?.role === "admin"}
    />
  );
}
