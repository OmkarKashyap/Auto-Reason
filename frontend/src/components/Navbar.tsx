"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { logout } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useGraphStore } from '@/store/graphStore';

const Navbar = () => {
  const router = useRouter();
  const { owner, isLoading, refresh, clear } = useAuthStore();
  const setGraphs = useGraphStore((state) => state.setGraphs);
  const setCurrentGraphId = useGraphStore((state) => state.setCurrentGraphId);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      clear();
      setGraphs([]);
      setCurrentGraphId(null);
      router.push('/');
      refresh();
    }
  };

  const isSignedIn = !isLoading && owner?.type === 'user';
  const displayName = owner?.fullName || owner?.email || 'Account';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <nav className="fixed w-full top-0 z-50 border-b border-white/10 bg-[#141414]/85 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#99FF00] text-black text-sm font-bold transition-transform group-hover:scale-105">
                A
              </span>
              <span className="text-lg font-semibold tracking-tight">AutoReason</span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/25 px-4 py-2 rounded-lg transition-all"
            >
              Create Graph
            </button>
            {isLoading ? (
              <div className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
            ) : isSignedIn ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#99FF00] text-black text-xs font-bold">
                    {initial}
                  </span>
                  <span className="text-sm text-gray-200 max-w-[140px] truncate">{displayName}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/25 px-4 py-2 rounded-lg transition-all"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => router.push('/signin')}
                >
                  Sign In
                </button>
                <button
                  className="bg-[#99FF00] hover:brightness-110 text-black text-sm font-medium px-5 py-2 rounded-lg transition-all"
                  onClick={() => router.push('/signup')}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
