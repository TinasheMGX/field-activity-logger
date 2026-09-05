import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button, Label, TextInput } from "./ui";

type Mode = "signin" | "signup";

export function SignIn() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    const addr = email.trim();
    if (!addr) return setError("Enter your email.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: addr,
        password,
      });
      setBusy(false);
      if (error) return setError(error.message);
      // With email confirmation disabled, signUp returns a live session and
      // onAuthStateChange takes over. If it doesn't, confirmation is still on.
      if (!data.session) {
        setNotice(
          "Account created, but email confirmation is still enabled in Supabase. Disable it (Authentication → Sign In / Providers → Email → turn off 'Confirm email'), then sign in.",
        );
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: addr,
        password,
      });
      setBusy(false);
      if (error) setError(error.message);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-1 text-lg font-semibold text-slate-900">
          Field Activity Logger
        </div>
        <p className="mb-5 text-sm text-slate-500">
          {mode === "signup"
            ? "Create an account to sync your log across devices."
            : "Sign in to sync your log across devices."}
        </p>

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
            />
          </label>
          <label className="block">
            <Label hint={mode === "signup" ? "min 6 characters" : undefined}>
              Password
            </Label>
            <TextInput
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {notice}
            </p>
          )}

          <Button
            className="w-full py-3 text-base"
            disabled={busy}
            onClick={submit}
          >
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>
        </div>

        <div className="mt-4 text-center text-sm text-slate-500">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                className="font-semibold text-brand underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setNotice(null);
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                className="font-semibold text-brand underline"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setNotice(null);
                }}
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 px-2 text-center text-xs text-slate-400">
        Works offline once signed in — entries are captured locally and synced
        when you're back online.
      </p>
    </div>
  );
}
