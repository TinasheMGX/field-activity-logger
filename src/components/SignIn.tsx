import { useState } from "react";
import { appUrl, supabase } from "../lib/supabase";
import { Button, Label, TextInput } from "./ui";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const addr = email.trim();
    if (!addr) return setError("Enter your email.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: appUrl() },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-1 text-lg font-semibold text-slate-900">
          Field Activity Logger
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Sign in to sync your log across devices. Your entries stay private to
          your account.
        </p>

        {sent ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Check your email</p>
            <p className="mt-1">
              We sent a sign-in link to <strong>{email.trim()}</strong>. Open it
              on this device to continue.
            </p>
            <button
              className="mt-3 text-xs font-semibold text-brand underline"
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <Label>Email</Label>
              <TextInput
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button className="w-full py-3 text-base" disabled={busy} onClick={send}>
              {busy ? "Sending…" : "Email me a magic link"}
            </Button>
          </div>
        )}
      </div>

      <p className="mt-4 px-2 text-center text-xs text-slate-400">
        Works offline once signed in — entries are captured locally and synced
        when you're back online.
      </p>
    </div>
  );
}
