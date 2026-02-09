"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { betterAuthWrapper } from "@/lib/auth-wrapper";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setLoading(true);

    try {
      const result = await betterAuthWrapper.signIn.email({
        email,
        password,
      });

      // Check for errors in the result
      if (result?.error) {
        const errorMsg = result.error.message || "Invalid email or password";
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Check if sign-in was successful
      if (result?.data) {
        // Successful login - redirect to dashboard
        router.push("/dashboard");
      } else {
        // No error but also no data - something went wrong
        setError("Authentication failed. Please check your credentials.");
        setLoading(false);
      }
    } catch (err: any) {
      // Catch any unexpected errors
      console.error("Login error:", err);
      const errorMsg = err?.message || err?.toString() || "Invalid email or password. Please try again.";
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg relative flex items-center justify-center p-4 overflow-hidden">
      {/* Matrix-style background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-neon-green to-transparent animate-matrix-rain" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-neon-cyan to-transparent animate-matrix-rain" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-neon-green to-transparent animate-matrix-rain" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative w-full max-w-md animate-fadeIn z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded border-2 border-neon-cyan bg-terminal-bgLight shadow-[0_0_30px_rgba(0,255,255,0.5)] mb-4 animate-pulse-glow">
            <span className="text-4xl text-neon-cyan">{'</>'}</span>
          </div>
          <h1 className="text-4xl font-bold font-terminal text-neon-green mb-2 flex items-center justify-center gap-2">
            <span>{'>'}</span> ACCESS_TERMINAL
          </h1>
          <p className="text-neon-cyan/70 font-mono text-sm">
            [AUTHENTICATION REQUIRED]
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-terminal-bgLight/90 backdrop-blur-xl rounded border border-neon-green/40 shadow-[0_0_30px_rgba(0,255,65,0.2)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Error Message */}
            {error && (
              <div className="rounded bg-neon-pink/20 p-4 border-2 border-neon-pink animate-slideInLeft shadow-[0_0_20px_rgba(255,0,110,0.5)]">
                <div className="flex items-center gap-3">
                  <span className="text-neon-pink text-2xl animate-pulse">⚠</span>
                  <div className="flex-1">
                    <p className="text-base text-neon-pink font-mono font-bold">[AUTHENTICATION FAILED]</p>
                    <p className="text-sm text-neon-pink font-mono mt-2 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-neon-cyan/80 font-mono">
                [EMAIL_ADDRESS]
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-neon-cyan/60">{'>'}</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-terminal-bg border border-neon-cyan/30 rounded focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all text-neon-cyan font-mono placeholder-neon-cyan/30 focus:outline-none"
                  placeholder="user@terminal.sys"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neon-green/80 font-mono">
                [PASSWORD]
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-neon-green/60">{'>'}</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-terminal-bg border border-neon-green/30 rounded focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all text-neon-green font-mono placeholder-neon-green/30 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neon-green/60 hover:text-neon-green transition-colors"
                >
                  {showPassword ? (
                    <span className="text-sm">👁️</span>
                  ) : (
                    <span className="text-sm">🔒</span>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-neon-cyan/20 border border-neon-cyan hover:bg-neon-cyan/30 hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] text-neon-cyan font-semibold font-mono rounded disabled:bg-terminal-border/20 disabled:border-terminal-border disabled:text-neon-green/30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>{'>'} ENTER SYSTEM</span>
                  <span className="text-lg">⚡</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-neon-green/20"></div>
            <span className="px-4 text-sm text-neon-green/50 font-mono">[OR]</span>
            <div className="flex-1 border-t border-neon-green/20"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-neon-cyan/70 font-mono">
              New user?{" "}
              <Link
                href="/register"
                className="font-semibold text-neon-green hover:text-neon-cyan transition-colors hover:underline"
              >
                {'>'} Initialize account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neon-green/40 mt-8 font-mono">
          [TASKMASTER_v2.0.26] © 2026
        </p>
      </div>
    </div>
  );
}
