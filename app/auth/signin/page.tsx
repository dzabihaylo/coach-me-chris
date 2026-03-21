"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

async function handleGoogleSignIn() {
  "use server";
  await signIn("resend", { redirectTo: "/" });
}

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
          <h1 className="text-white font-bold text-2xl">Coach Me</h1>
          <p className="text-gray-500 text-sm mt-1">
            Never Split the Difference — live coaching
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-center">Sign in</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm text-center">
              {error === "OAuthCallback"
                ? "Something went wrong with Google sign-in. Try again."
                : "Sign-in failed. Please try again."}
            </div>
          )}

          {/* Google */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: params.callbackUrl ?? "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Magic link / email */}
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              try {
                await signIn("resend", {
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
              Send magic link
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Personal coaching tool — invite only
        </p>
      </div>
    </div>
  );
}
