"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const sent = params.sent;

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg shadow-emerald-900/30 mb-5">
            C
          </div>
          <h1 className="text-[var(--text-primary)] font-bold text-2xl tracking-tight">
            Coach Chris
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1.5">
            Master the art of negotiation
          </p>
        </div>

        <div className="glass rounded-2xl p-7 space-y-5">
          {sent ? (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-[var(--text-primary)] font-semibold text-lg">
                  Check your email
                </h2>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  We sent you a sign-in link. Click it to access your account. It expires in 24 hours.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-[var(--text-primary)] font-semibold text-lg">Welcome back</h2>
                <p className="text-[var(--text-muted)] text-sm mt-1">Sign in with your email</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
                  {error === "AccessDenied"
                    ? "This email is not on the access list."
                    : error === "Configuration"
                      ? "Email service is not configured. Contact the admin."
                      : "Sign-in failed. Please try again."}
                </div>
              )}

              <form
                action={async (formData: FormData) => {
                  "use server";
                  const email = formData.get("email") as string;
                  try {
                    await signIn("resend", {
                      email: email.toLowerCase(),
                      redirectTo: params.callbackUrl ?? "/",
                      redirect: false,
                    });
                  } catch (e) {
                    if (e instanceof AuthError) {
                      redirect(`/auth/signin?error=${e.type}`);
                    }
                    throw e;
                  }
                  redirect("/auth/signin?sent=1");
                }}
                className="space-y-3"
              >
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-xl text-sm shadow-lg shadow-emerald-900/25"
                >
                  Continue with email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[var(--text-faint)] text-xs mt-6">
          Invite only
        </p>
      </div>
    </div>
  );
}
