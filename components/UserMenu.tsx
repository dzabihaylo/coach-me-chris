"use client";

import { signOut } from "next-auth/react";

interface Props {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function UserMenu({ name, email, image }: Props) {
  return (
    <div className="flex items-center gap-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? "User"}
          className="w-7 h-7 rounded-full"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold">
          {(name ?? email ?? "?")[0].toUpperCase()}
        </div>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors hidden sm:block"
      >
        Sign out
      </button>
    </div>
  );
}
