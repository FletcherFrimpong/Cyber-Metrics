"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
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
      .then((data) => setNeedsSetup(data.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

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

      // Auto-login after setup
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        await refresh();
        router.push("/");
      } else {
        setNeedsSetup(false); // Show login form
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

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
          <h2 className="text-white text-lg font-semibold mb-1">
            {needsSetup ? "Create Admin Account" : "Sign In"}
          </h2>
          <p className="text-neutral-500 text-sm mb-6">
            {needsSetup
              ? "Set up your first administrator account to get started."
              : "Enter your credentials to access the dashboard."}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={needsSetup ? handleSetup : handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoFocus
                  autoComplete="username"
                  className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                />
              </div>

              {needsSetup && (
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
                      placeholder="admin@company.com"
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
                    placeholder={needsSetup ? "Min. 8 characters" : "Enter password"}
                    required
                    minLength={needsSetup ? 8 : undefined}
                    autoComplete={needsSetup ? "new-password" : "current-password"}
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
              ) : needsSetup ? (
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

          {!needsSetup && (
            <p className="text-neutral-600 text-xs text-center mt-4">
              Default credentials: admin / SignalFoundry2024!
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
