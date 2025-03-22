"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className="fixed w-full top-0 z-50 bg-documenso-dark/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

        <Link href="/">
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-xl font-bold">AutoReason</span>
          </div>
        </Link>

          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <button className="text-gray-300 hover:text-white flex items-center space-x-1">
                <span>Solutions</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <Link href="/platform" className="text-gray-300 hover:text-white">
              Platform
            </Link>
            <div className="relative group">
              <button className="text-gray-300 hover:text-white flex items-center space-x-1">
                <span>Resources</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="relative group">
              <button className="text-gray-300 hover:text-white flex items-center space-x-1">
                <span>Developers</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <Link href="/pricing" className="text-gray-300 hover:text-white">
              Pricing
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button
              className="bg-[#99FF00] hover:brightness-110 text-black font-medium px-6 py-2 rounded-lg transition-all"
              onClick={() => router.push('/signin')}
            >
              Sign In
            </button>
            {/* <button className="bg-[#99FF00] hover:brightness-110 text-black font-medium px-8 py-3 rounded-lg transition-all">
                Start Mapping
              </button> */}
            <button
              className="bg-[#99FF00] hover:brightness-110 text-black font-medium px-6 py-2 rounded-lg transition-all"
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;