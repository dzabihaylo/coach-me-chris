"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function UserMenu({ name, email, image }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? "User"}
          className="w-7 h-7 rounded-full ring-1 ring-[var(--border-default)]"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 ring-1 ring-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] text-[11px] font-semibold">
          {(name ?? email ?? "?")[0].toUpperCase()}
        </div>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] hidden sm:flex items-center gap-1.5 text-xs"
        title="Sign out"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}
