import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <AppShell
      user={{
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      }}
    />
  );
}
