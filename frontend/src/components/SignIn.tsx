"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const refreshAuth = useAuthStore((state) => state.refresh);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      await refreshAuth();

      setSuccessMessage("Sign in successful!");
      router.push("/dashboard");
    } catch (signInError: unknown) {
      const message =
        signInError instanceof Error
          ? signInError.message
          : "An error occurred during sign in.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-18 min-h-screen flex items-center justify-center bg-[#1C1C1C] px-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-[#232323] rounded-xl shadow-2xl border border-white/5">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold text-white">Sign in</h2>

          <p className="text-gray-400">
            Welcome back, we are happy to see you again.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {successMessage && (
            <div className="text-green-500 text-sm">{successMessage}</div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>

            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors text-sm"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full px-3 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors text-sm"
                placeholder="Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#99FF00] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-md transition-all"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#99FF00] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

export default SignIn;
