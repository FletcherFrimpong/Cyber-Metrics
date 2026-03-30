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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isSetup = mode === "setup";
  const isSignup = mode === "signup";
  const isLogin = mode === "login";

  const heading = isSetup
    ? "Create Admin Account"
    : isSignup
    ? "Create Account"
    : "Sign In";

  const subtitle = isSetup
    ? "Set up your first administrator account to get started."
    : isSignup
    ? "Create a new viewer account to access the dashboard."
    : "Enter your credentials to access the dashboard.";

  const onSubmit = isSetup ? handleSetup : isSignup ? handleSignup : handleLogin;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-orange-500 font-bold text-2xl tracking-wider">
            SIGNAL FOUNDRY
          </h1>
          <p className="text-neutral-500 text-xs mt-1 tracking-wide">
            Cyber Risk Quantification Platform
          </p>
        </div>

        {/* Tab switcher — hidden during first-run setup */}
        {!isSetup && (
          <div className="flex mb-6 bg-neutral-900 border border-neutral-700 rounded-lg p-1">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin
                  ? "bg-orange-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isSignup
                  ? "bg-orange-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
          <h2 className="text-white text-lg font-semibold mb-1">{heading}</h2>
          <p className="text-neutral-500 text-sm mb-6">{subtitle}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
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
                  className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                />
              </div>

              {(isSignup || isSetup) && (
                <>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1.5">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1.5">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isSetup ? "admin@company.com" : "you@company.com"}
                      className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
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
                    className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 pr-10 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
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
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-medium"
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
            <p className="text-neutral-600 text-xs text-center mt-4">
              New accounts are created with viewer (read-only) access.
              An admin can upgrade your role later.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-neutral-700 text-xs text-center mt-6">
          SignalFoundry v1.0 &mdash; Secure Access
        </p>
      </div>
    </div>
  );
}
