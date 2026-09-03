// src/components/client/Sidebar.tsx
'use client';

import { createGraph, listGraphs } from '@/lib/api';
import { GraphSummary } from '@/lib/types';
import { useGraphStore } from '@/store/graphStore';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useState } from 'react';

export default function Sidebar() {
  const {
    graphs,
    setGraphs,
    addGraphToList,
    currentGraphId,
    setCurrentGraphId,
    isLoadingGraphs,
    setIsLoadingGraphs,
  } = useGraphStore();

  const [newGraphName, setNewGraphName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGraphs = useCallback(async () => {
    setIsLoadingGraphs(true);

    try {
      const fetched = await listGraphs();
      setGraphs(fetched);
    } catch (err: unknown) {
      console.error('Failed to fetch graphs:', err);
      setGraphs([]);
    } finally {
      setIsLoadingGraphs(false);
    }
  }, [setGraphs, setIsLoadingGraphs]);

  useEffect(() => {
    refreshGraphs();
  }, [refreshGraphs]);

  const handleCreateGraph = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGraphName.trim()) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const graph = await createGraph(newGraphName.trim());

      addGraphToList(graph);
      setCurrentGraphId(graph.id);
      setNewGraphName('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to create graph.');
      } else {
        setError('Failed to create graph.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="flex flex-col flex-shrink-0 p-4 bg-white border-r border-gray-200 shadow-lg w-60 md:w-72 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          My Graphs
        </h1>

        <button
          onClick={refreshGraphs}
          disabled={isLoadingGraphs}
          title="Refresh List"
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-wait"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${
              isLoadingGraphs ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>

      <form onSubmit={handleCreateGraph} className="mb-4 space-y-2">
        <input
          type="text"
          value={newGraphName}
          onChange={(e) => setNewGraphName(e.target.value)}
          placeholder="New graph name"
          className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />

        <button
          type="submit"
          disabled={isCreating || !newGraphName.trim()}
          className="flex items-center justify-center w-full px-4 py-2 space-x-2 font-medium text-white transition duration-150 ease-in-out bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5" />

          <span>
            {isCreating ? 'Creating...' : 'New Graph'}
          </span>
        </button>

        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}
      </form>

      <div className="flex-1 pr-1 -mr-1 space-y-1 overflow-y-auto">
        {isLoadingGraphs && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading graphs...
            </p>
          </div>
        )}

        {!isLoadingGraphs &&
          graphs.map((graph: GraphSummary) => (
            <button
              key={graph.id}
              onClick={() => setCurrentGraphId(graph.id)}
              className={`w-full text-left p-2 rounded-md text-sm truncate transition duration-150 ease-in-out ${
                currentGraphId === graph.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {graph.name}
            </button>
          ))}

        {!isLoadingGraphs && graphs.length === 0 && (
          <p className="py-4 text-sm text-center text-gray-500 dark:text-gray-400">
            No graphs yet.
            <br />
            Create one above to get started!
          </p>
        )}
      </div>
    </aside>
  );
}
