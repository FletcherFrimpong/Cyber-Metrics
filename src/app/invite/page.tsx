"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, Eye, EyeOff, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const token = searchParams.get("token");

  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    displayName: string;
    role: string;
  } | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalidError, setInvalidError] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on load
  useEffect(() => {
    if (!token) {
      setInvalidError("No invite token provided.");
      setValidating(false);
      return;
    }

    fetch(`/api/auth/accept-invite?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setInviteInfo(data);
          setDisplayName(data.displayName || "");
          // Suggest username from email
          setUsername(data.email.split("@")[0]);
        } else {
          setInvalidError(data.error || "Invalid invite link");
        }
      })
      .catch(() => setInvalidError("Failed to validate invite link"))
      .finally(() => setValidating(false));
  }, [token]);

  async function handleAccept(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, username, password, displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set up account");
        return;
      }

      setSuccess(true);

      // Auto-login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        await refresh();
        setTimeout(() => router.push("/"), 1500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Invalid/expired token
  if (invalidError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-white text-xl font-semibold mb-2">Invalid Invite</h1>
          <p className="text-neutral-400 text-sm mb-6">{invalidError}</p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-white text-xl font-semibold mb-2">Account Created!</h1>
          <p className="text-neutral-400 text-sm">Signing you in and redirecting to the dashboard...</p>
          <Loader2 className="w-5 h-5 text-orange-500 animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  const roleLabel = inviteInfo?.role === "admin" ? "Administrator" : "Viewer";

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
          <h2 className="text-white text-lg font-semibold mb-1">Set Up Your Account</h2>
          <p className="text-neutral-500 text-sm mb-2">
            You've been invited as <span className="text-white font-medium">{roleLabel}</span>.
          </p>
          <p className="text-neutral-600 text-xs mb-6">
            {inviteInfo?.email}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAccept}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  autoFocus
                  autoComplete="username"
                  className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                />
              </div>

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
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 pr-10 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-600 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Activate Account
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-neutral-700 text-xs text-center mt-6">
          SignalFoundry v1.0 &mdash; Secure Access
        </p>
      </div>
    </div>
  );
}
