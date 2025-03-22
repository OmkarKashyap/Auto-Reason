"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SignUpProps {
  // Add any props if needed
}

const SignUp: React.FC<SignUpProps> = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign Up submitted:', { fullName, email, password });
  };

  return (
    <div className="mt-4 min-h-screen flex items-center justify-center bg-[#1C1C1C]">
      <div className="w-full max-w-4xl bg-[#232323] rounded-lg shadow-xl flex overflow-hidden">

        <div className="md:w-1/2 p-8 text-white text-center">
          
        </div>

        <div className="md:w-1/2 p-8">
          <div className="text-left space-y-2 mb-6">
            <h2 className="text-xl font-semibold text-white">
              Create a new account
            </h2>
            <p className="text-gray-400 text-sm">
              Create your account and start using state-of-the-art document signing. Open and beautiful signing is within your grasp.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
       
            <div className="space-y-1">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="w-full px-3 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors text-sm"
                placeholder="Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors text-sm"
                placeholder="Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full px-3 py-2 bg-[#2C2C2C] rounded-md border border-gray-600 text-white focus:outline-none focus:border-[#99FF00] transition-colors text-sm"
                  placeholder="Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* <div className="space-y-1"> */}
              {/* <label className="block text-sm font-medium text-gray-300">Sign Here</label> */}
              {/* <div className="bg-[#2C2C2C] rounded-md border border-gray-600 p-2 flex items-center justify-between text-sm"> */}
                {/* <span className="text-gray-400">Timur Ercan</span>  */}
                {/* <div className="flex space-x-2">
                  <button type="button" className="text-xs text-[#99FF00] hover:underline focus:outline-none">Upload Signature</button>
                  <button type="button" className="text-xs text-[#99FF00] hover:underline focus:outline-none">Clear Signature</button>
                </div> */}
              {/* </div> */}
            {/* </div> */}

            <button
              type="submit"
              className="w-full bg-[#99FF00] hover:brightness-110 text-black font-semibold py-2.5 rounded-md transition-all text-sm"
            >
              Create Account
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-xs">
              Already have an account? <Link href="/signin" className="text-[#99FF00] hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Eye Icons (reused from sign-in page)
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

export default SignUp;