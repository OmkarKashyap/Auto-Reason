"use client";
import Link from 'next/link';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Placeholder for authentication

  return (
    <nav className="bg-gray-900 text-white p-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold">
        Personal Thought Graph
      </Link>
      <div>
        {isLoggedIn ? (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => setIsLoggedIn(false)} // Placeholder logout
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => setIsLoggedIn(true)} // Placeholder login
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;