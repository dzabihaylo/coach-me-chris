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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤝</div>
          <h1 className="text-white font-bold text-2xl">Coach Chris</h1>
          <p className="text-gray-500 text-sm mt-1">
            Never Split the Difference — live coaching
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          {sent ? (
            <>
              <h2 className="text-white font-semibold text-center">
                Check your email
              </h2>
              <p className="text-gray-400 text-sm text-center">
                A sign-in link has been sent to your email. Click the link to
                sign in. It expires in 24 hours.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-white font-semibold text-center">Sign in</h2>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm text-center">
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Send sign-in link
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Invite only — contact admin for access
        </p>
      </div>
    </div>
  );
}
