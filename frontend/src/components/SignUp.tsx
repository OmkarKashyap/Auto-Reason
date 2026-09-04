"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        fullName,
        email,
        password,
      });
      await refreshAuth();

      setSuccessMessage("Account created successfully!");

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Sign up failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while creating your account.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 min-h-screen flex items-center justify-center bg-[#1C1C1C] px-4">
      <div className="w-full max-w-4xl bg-[#232323] rounded-xl shadow-2xl border border-white/5 flex overflow-hidden">

        <div className="hidden md:flex flex-col justify-center p-10 md:w-1/2 bg-gradient-to-br from-[#1a2b0e] to-[#232323] border-r border-white/5">
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#99FF00] text-black font-bold">
            A
          </span>
          <h3 className="text-2xl font-semibold text-white leading-snug">
            Turn your notes into a living knowledge graph.
          </h3>
          <p className="mt-3 text-sm text-gray-400">
            Paste in text and let AutoReason extract entities and
            relationships automatically, building a graph you can keep
            growing over time.
          </p>
        </div>

        <div className="w-full p-8 md:w-1/2">
          <div className="mb-6 space-y-2 text-left">
            <h2 className="text-xl font-semibold text-white">
              Create a new account
            </h2>

            <p className="text-sm text-gray-400">
              Free to start. Your graphs stay tied to your account, not just
              this browser.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500">
                {successMessage}
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-300"
              >
                Full Name
              </label>

              <input
                type="text"
                id="fullName"
                className="w-full px-3 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors text-sm"
                placeholder="Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email Address
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
                  minLength={6}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute transform -translate-y-1/2 right-2 top-1/2 focus:outline-none"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#99FF00] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-md transition-all text-sm"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-[#99FF00] hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
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

export default SignUp;
