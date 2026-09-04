// src/components/client/Sidebar.tsx
'use client';

import { createGraph, deleteGraph, listGraphs } from '@/lib/api';
import { GraphSummary } from '@/lib/types';
import { useGraphStore } from '@/store/graphStore';
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useState } from 'react';

export default function Sidebar() {
  const {
    graphs,
    setGraphs,
    addGraphToList,
    removeGraphFromList,
    currentGraphId,
    setCurrentGraphId,
    isLoadingGraphs,
    setIsLoadingGraphs,
  } = useGraphStore();

  const [newGraphName, setNewGraphName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteGraph = async (e: React.MouseEvent, graphId: string) => {
    e.stopPropagation();

    if (!window.confirm('Delete this graph? This cannot be undone.')) {
      return;
    }

    setDeletingId(graphId);
    setError(null);

    try {
      await deleteGraph(graphId);
      removeGraphFromList(graphId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to delete graph.');
      } else {
        setError('Failed to delete graph.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside className="flex flex-col flex-shrink-0 p-4 bg-[#1a1a1a] border-r border-white/10 w-60 md:w-72">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
          My Graphs
        </h1>

        <button
          onClick={refreshGraphs}
          disabled={isLoadingGraphs}
          title="Refresh List"
          className="p-1 text-gray-500 hover:text-[#99FF00] disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${
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
          className="w-full p-2 text-sm text-white placeholder-gray-500 bg-[#232323] border border-white/10 rounded-md focus:outline-none focus:border-[#99FF00] transition-colors"
        />

        <button
          type="submit"
          disabled={isCreating || !newGraphName.trim()}
          className="flex items-center justify-center w-full px-4 py-2 space-x-2 text-sm font-medium text-black transition duration-150 ease-in-out bg-[#99FF00] rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-4 h-4" />
          <span>
            {isCreating ? 'Creating...' : 'New Graph'}
          </span>
        </button>

        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}
      </form>

      <div className="flex-1 pr-1 -mr-1 space-y-1 overflow-y-auto">
        {isLoadingGraphs && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500">
              Loading graphs...
            </p>
          </div>
        )}

        {!isLoadingGraphs &&
          graphs.map((graph: GraphSummary) => (
            <div
              key={graph.id}
              onClick={() => setCurrentGraphId(graph.id)}
              className={`group flex items-center justify-between w-full text-left p-2 rounded-md text-sm cursor-pointer transition duration-150 ease-in-out ${
                currentGraphId === graph.id
                  ? 'bg-[#99FF00]/10 text-[#99FF00] font-semibold border border-[#99FF00]/30'
                  : 'text-gray-300 border border-transparent hover:bg-white/5'
              }`}
            >
              <span className="truncate">{graph.name}</span>
              <button
                onClick={(e) => handleDeleteGraph(e, graph.id)}
                disabled={deletingId === graph.id}
                title="Delete graph"
                aria-label={`Delete ${graph.name}`}
                className="ml-2 shrink-0 p-1 rounded text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

        {!isLoadingGraphs && graphs.length === 0 && (
          <p className="py-4 text-sm text-center text-gray-500">
            No graphs yet.
            <br />
            Create one above to get started!
          </p>
        )}
      </div>
    </aside>
  );
}
