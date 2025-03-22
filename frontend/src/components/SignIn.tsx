"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SignInProps {
  // Add any props if needed
}

const SignIn: React.FC<SignInProps> = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <div className="mt-18 min-h-screen flex items-center justify-center bg-[#1C1C1C]">
      <div className="w-full max-w-md p-6 space-y-6 bg-[#232323] rounded-lg shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold text-white">
            Sign in
          </h2>
          <p className="text-gray-400">
            Welcome back, we are happy to see you again.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full px-4 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-400 hover:text-[#99FF00] transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full bg-[#99FF00] hover:brightness-110 text-black font-semibold py-2.5 rounded-md transition-all"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-3 bg-[#232323] text-gray-400">or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            className="w-full px-4 py-2 bg-[#2C2C2C] hover:bg-[#333333] border border-gray-600 rounded-md text-white flex items-center justify-center space-x-3 transition-colors"
          >
            <svg viewBox="0 0 48 48" width="24" height="24">
              <defs>
                <clipPath id="a">
                  <path d="M44.5 20H24v8h11.3c-.6 2.3-2.3 4-5.3 4-4.1 0-7.4-3.3-7.4-7.4s3.3-7.4 7.4-7.4c1.8 0 3.1.6 4.1 1.6l3-3.1c-3.1-2.9-7.1-4.7-11.1-4.7C7 5.1 0 12.1 0 20.1s7 15 15 15c4.1 0 7.8-1.6 10.4-4.3l-2.7-2.7c-1.7 1.6-4.1 2.6-6.9 2.6-3.5 0-6.3-2.9-6.3-6.4s2.8-6.4 6.3-6.4c2.1 0 3.9.8 5.1 1.9 1.1-.8 2.5-1.6 3.8-2.1l-3.1 3.1c-3 2.9-6.7 4.7-10.7 4.7-8.8 0-16-7.1-16-16s7.2-16 16-16c4.1 0 7.8 1.6 10.3 4.1 2.4 2.4 3.9 5.5 3.9 9.3 0 3.7-1.4 6.9-3.9 9.3z" />
                </clipPath>
              </defs>
              <g clip-path="url(#a)">
                <path fill="#4285f4" d="M44.5 20H24v8h11.3c-.6 2.3-2.3 4-5.3 4-4.1 0-7.4-3.3-7.4-7.4s3.3-7.4 7.4-7.4c1.8 0 3.1.6 4.1 1.6l3-3.1c-3.1-2.9-7.1-4.7-11.1-4.7C7 5.1 0 12.1 0 20.1s7 15 15 15c4.1 0 7.8-1.6 10.4-4.3l-2.7-2.7c-1.7 1.6-4.1 2.6-6.9 2.6-3.5 0-6.3-2.9-6.3-6.4s2.8-6.4 6.3-6.4c2.1 0 3.9.8 5.1 1.9 1.1-.8 2.5-1.6 3.8-2.1l-3.1 3.1c-3 2.9-6.7 4.7-10.7 4.7-8.8 0-16-7.1-16-16s7.2-16 16-16c4.1 0 7.8 1.6 10.3 4.1 2.4 2.4 3.9 5.5 3.9 9.3 0 3.7-1.4 6.9-3.9 9.3z" />
              </g>
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="w-full px-4 py-2 bg-[#2C2C2C] hover:bg-[#333333] border border-gray-600 rounded-md text-white flex items-center justify-center space-x-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key">
              <path d="M2 18v3c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-3s-3-2-3-5V7c0-5-3-6-6-6S6 2 6 7v6c0 3-3 5-3 5z" />
              <circle cx="10" cy="10" r="2" />
            </svg>
            <span>Passkey</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Eye Icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default SignIn;