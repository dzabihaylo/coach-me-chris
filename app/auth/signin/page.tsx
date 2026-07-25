"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { VOSS_DIMENSIONS } from "@/lib/voss";

const FEATURES = [
  {
    title: "After-action review",
    body: "Paste or import a call transcript and get it scored across all 10 Voss dimensions, with the exact moments you nailed and the ones you missed.",
  },
  {
    title: "Practice drills",
    body: "Spar with an AI counterpart on mirroring, calibrated questions, and Ackerman price defense — with coaching after every line.",
  },
  {
    title: "Live coaching",
    body: "Real-time nudges during a call: label that emotion, mirror the last three words, run an accusation audit.",
  },
  {
    title: "Track your game",
    body: "Watch your weakest dimensions climb over time. The coaching adapts as you improve.",
  },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const sent = params.sent;

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        {/* ── Pitch ──────────────────────────────────────────── */}
        <div className="animate-fade-up order-2 lg:order-1">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-emerald-900/30">
              C
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-semibold text-[15px] leading-none">
                Coach Chris
              </p>
              <p className="text-[var(--text-faint)] text-[10px] mt-0.5">
                Negotiation coaching
              </p>
            </div>
          </div>

          <h1 className="text-[var(--text-primary)] font-bold text-3xl sm:text-4xl tracking-tight leading-[1.1]">
            Every sales call is a negotiation.{" "}
            <span className="text-emerald-400">Learn to win them.</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[15px] mt-4 leading-relaxed max-w-md">
            Coach Chris turns your real calls into practice reps against Chris
            Voss&rsquo;s <em>Never Split the Difference</em> framework — scoring
            every conversation, drilling the techniques, and coaching you in the
            moment.
          </p>

          <ul className="mt-8 space-y-4 max-w-md">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-[var(--text-secondary)] font-medium text-sm">
                    {f.title}
                  </p>
                  <p className="text-[var(--text-faint)] text-[13px] leading-relaxed mt-0.5">
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="text-[var(--text-faint)] text-[11px] uppercase tracking-wider mb-2.5">
              The 10 dimensions it scores
            </p>
            <div className="flex flex-wrap gap-1.5 max-w-md">
              {VOSS_DIMENSIONS.map((d) => (
                <span
                  key={d.key}
                  className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-full px-2.5 py-1"
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sign in ────────────────────────────────────────── */}
        <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto animate-fade-up order-1 lg:order-2">
          <div className="glass rounded-2xl p-7 space-y-5">
            {sent ? (
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
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-[var(--text-primary)] font-semibold text-lg">Sign in</h2>
                  <p className="text-[var(--text-muted)] text-sm mt-1">We&rsquo;ll email you a secure link</p>
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
            Invite only · Built on Chris Voss&rsquo;s negotiation method
          </p>
        </div>
      </div>
    </div>
  );
}
