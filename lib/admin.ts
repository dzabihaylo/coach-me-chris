import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const entry = await db.allowedEmail.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  if (entry?.role !== "admin") return null;
  return session;
}
