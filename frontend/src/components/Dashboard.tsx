'use client';

import { GraphData } from '@/lib/types';
import { useGraphStore } from '@/store/graphStore';
import { useCallback, useEffect, useState } from 'react';
import { createGraph, getGraph, processText } from '../lib/api';
import GraphDisplay from './GraphDisplay';
import TextInput from './TextInput';

function defaultGraphName(text: string): string {
  const firstLine = text.trim().split('\n')[0].slice(0, 40);
  return firstLine || `Graph ${new Date().toLocaleString()}`;
}

export default function Dashboard() {
  const currentGraphId = useGraphStore((state) => state.currentGraphId);
  const setCurrentGraphId = useGraphStore((state) => state.setCurrentGraphId);
  const addGraphToList = useGraphStore((state) => state.addGraphToList);

  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async (graphId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getGraph(graphId);
      setGraphData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to load graph data.');
      } else {
        setError('Failed to load graph data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentGraphId) {
      loadGraph(currentGraphId);
    } else {
      setGraphData({
        nodes: [],
        edges: [],
      });
      setError(null);
    }
  }, [currentGraphId, loadGraph]);

  const handleTextInput = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let graphId = currentGraphId;
      let isNewGraph = false;
      if (!graphId) {
        const graph = await createGraph(defaultGraphName(text));
        graphId = graph.id;
        isNewGraph = true;
      }
      const updatedGraph = await processText(graphId, text);
      setGraphData(updatedGraph);
      if (isNewGraph) {
        // Set graph data first (above) so the store update below doesn't
        // trigger a redundant loadGraph() fetch that briefly shows an
        // empty graph before this same data arrives.
        addGraphToList({ id: updatedGraph.id, name: updatedGraph.name, updated_at: new Date().toISOString() });
        setCurrentGraphId(updatedGraph.id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to process text.');
      } else {
        setError('Failed to process text.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-gray-900 dark:text-gray-100">
      <div className="relative flex-1 mb-4 overflow-hidden border border-gray-200 rounded-lg shadow-inner bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 dark:border-gray-700 min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <p>Loading...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/30">
            <p className="text-red-600 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {!isLoading && !error && currentGraphId && (
          <GraphDisplay graphData={graphData} />
        )}

        {!isLoading && !error && !currentGraphId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Select a graph from the sidebar, or create a new one to get
              started.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-200 rounded-lg dark:bg-gray-800">
        <TextInput onSubmit={handleTextInput} />
      </div>
    </div>
  );
}