"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤝</div>
          <h1 className="text-white font-bold text-2xl">Coach Me Chris</h1>
          <p className="text-gray-500 text-sm mt-1">
            Never Split the Difference — live coaching
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-center">Sign in</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm text-center">
              Sign-in failed. Please try again.
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              try {
                await signIn("credentials", {
                  email,
                  redirectTo: params.callbackUrl ?? "/",
                });
              } catch (e) {
                if (e instanceof AuthError) {
                  redirect(`/auth/signin?error=${e.type}`);
                }
                throw e;
              }
            }}
            className="space-y-3"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Personal coaching tool
        </p>
      </div>
    </div>
  );
}
