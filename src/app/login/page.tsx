"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

type Mode = "login" | "signup" | "setup";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [signupPolicy, setSignupPolicy] = useState<"open" | "domain" | "invite_only">("open");
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((data) => {
        setNeedsSetup(data.needsSetup);
        setSignupPolicy(data.signup || "open");
        setAllowedDomains(data.allowedDomains || []);
        if (data.needsSetup) setMode("setup");
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  function resetForm() {
    setUsername("");
    setPassword("");
    setDisplayName("");
    setEmail("");
    setError("");
    setShowPassword(false);
  }

  function switchMode(newMode: Mode) {
    resetForm();
    setMode(newMode);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      await refresh();
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign up failed");
        return;
      }

      // Auto-login after signup
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        await refresh();
        router.push("/");
      } else {
        // Account created but login failed — switch to login
        switchMode("login");
        setError("Account created. Please sign in.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed");
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        await refresh();
        router.push("/");
      } else {
        setNeedsSetup(false);
        setMode("login");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (needsSetup === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
      </div>
    );
  }

  const isSetup = mode === "setup";
  const isSignup = mode === "signup";
  const isLogin = mode === "login";

  const heading = isSetup
    ? "Create Owner Account"
    : isSignup
    ? "Create Account"
    : "Sign In";

  const subtitle = isSetup
    ? "Set up the first account. It becomes the workspace owner."
    : isSignup
    ? signupPolicy === "domain"
      ? `Sign up with your ${allowedDomains.map((d) => "@" + d).join(" or ")} email. You join as a viewer.`
      : "Create a viewer account. An administrator can change your role later."
    : "Enter your credentials to access the dashboard.";

  const onSubmit = isSetup ? handleSetup : isSignup ? handleSignup : handleLogin;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 mb-4">
            <Shield className="w-8 h-8 text-neutral-900" />
          </div>
          <h1 className="text-neutral-900 font-bold text-2xl">
            SIGNAL FOUNDRY
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            Cyber Risk Quantification Platform
          </p>
        </div>

        {/* Tab switcher — hidden during first-run setup */}
        {!isSetup && signupPolicy === "invite_only" && (
          <p className="mb-6 text-center text-[13px] text-neutral-500">
            This workspace is invitation only. Ask a teammate for an invite link.
          </p>
        )}
        {!isSetup && signupPolicy !== "invite_only" && (
          <div className="flex mb-6 bg-white border border-neutral-200 rounded-lg p-1">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isSignup
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-8">
          <h2 className="text-neutral-900 text-lg font-semibold mb-1">{heading}</h2>
          <p className="text-neutral-500 text-sm mb-6">{subtitle}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1.5">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isLogin ? "Enter username" : "Choose a username"}
                  required
                  autoFocus
                  autoComplete="username"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-orange-500/50 focus-visible:border-neutral-900"
                />
              </div>

              {(isSignup || isSetup) && (
                <>
                  <div>
                    <label className="block text-sm text-neutral-500 mb-1.5">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-orange-500/50 focus-visible:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-500 mb-1.5">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isSetup ? "admin@company.com" : "you@company.com"}
                      className="bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-orange-500/50 focus-visible:border-neutral-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm text-neutral-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? "Enter password" : "Min. 8 characters"}
                    required
                    minLength={isLogin ? undefined : 8}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 pr-10 focus-visible:ring-orange-500/50 focus-visible:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSetup ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Admin Account
                </>
              ) : isSignup ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {isSignup && (
            <p className="text-neutral-400 text-xs text-center mt-4">
              New accounts are created with viewer (read-only) access.
              An admin can upgrade your role later.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-neutral-300 text-xs text-center mt-6">
          SignalFoundry v1.0 &mdash; Secure Access
        </p>
      </div>
    </div>
  );
}
