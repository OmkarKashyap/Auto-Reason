// src/components/client/Sidebar.tsx
'use client';

import React, { useEffect, useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { fetchUserThreads } from '@/lib/api';
import { Thread } from '@/lib/types';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import Link from 'next/link'; // Use Link for navigation if needed

export default function Sidebar() {
  // Get state and actions from Zustand store
  const {
    threads,
    setThreads,
    currentThreadId,
    setCurrentThreadId,
    isLoadingThreads,
    setIsLoadingThreads,
  } = useGraphStore();

  // Function to fetch/refresh threads
  const refreshThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const fetchedThreads = await fetchUserThreads();
      setThreads(fetchedThreads);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      setThreads([]); // Clear threads on error or show error state
      // TODO: Display user-friendly error message
    } finally {
        // isLoadingThreads is set to false by setThreads action
    }
  }, [setThreads, setIsLoadingThreads]);

  // Fetch threads on initial mount
  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  const handleNewGraph = () => {
    setCurrentThreadId(null); // Set state to indicate no graph is selected
    // Optionally, use Next.js router if you have a dedicated '/new' page
    // import { useRouter } from 'next/navigation';
    // const router = useRouter();
    // router.push('/');
  };

  return (
    <aside className="flex flex-col flex-shrink-0 p-4 bg-white border-r border-gray-200 shadow-lg w-60 md:w-72 dark:bg-gray-800 dark:border-gray-700">
      {/* Header/Title */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          My Graphs
        </h1>
         <button
            onClick={refreshThreads}
            disabled={isLoadingThreads}
            title="Refresh List"
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-wait"
        >
            <ArrowPathIcon className={`h-5 w-5 ${isLoadingThreads ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* New Graph Button */}
      <button
        onClick={handleNewGraph}
        className="flex items-center justify-center w-full px-4 py-2 mb-4 space-x-2 font-medium text-white transition duration-150 ease-in-out bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusIcon className="w-5 h-5" />
        <span>New Graph</span>
      </button>

      {/* Thread List */}
      <div className="flex-1 pr-1 -mr-1 space-y-1 overflow-y-auto"> {/* Adjust padding/margin for scrollbar */}
        {isLoadingThreads && (
          <div className="py-4 text-center">
             <p className="text-sm text-gray-500 dark:text-gray-400">Loading graphs...</p>
          </div>
        )}
        {!isLoadingThreads && threads.map((thread: Thread) => (
            // Using Link might be better if selecting a graph changes the URL
            // <Link href={`/graph/${thread.id}`} key={thread.id} passHref>
              <button
                 key={thread.id} // Key needed here if not using Link
                 onClick={() => setCurrentThreadId(thread.id)}
                 className={`w-full text-left p-2 rounded-md text-sm truncate transition duration-150 ease-in-out ${
                   currentThreadId === thread.id
                     ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold'
                     : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                 }`}
               >
                 {thread.name || `Graph ${thread.id.substring(0, 6)}...`}
              </button>
            // </Link>
        ))}
        {!isLoadingThreads && threads.length === 0 && (
            <p className="py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                No graphs found. <br/> Start by creating one!
            </p>
        )}
      </div>

      {/* Optional Footer */}
      <div className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
         {/* Placeholder for User profile / Settings / Logout */}
         <button className="w-full text-sm text-left text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
             Logout (Placeholder)
         </button>
      </div>
    </aside>
  );
}