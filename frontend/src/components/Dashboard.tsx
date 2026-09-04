'use client';

import { GraphData, GraphEdge } from '@/lib/types';
import { useGraphStore } from '@/store/graphStore';
import { useCallback, useEffect, useState } from 'react';
import { createGraph, getGraph, processText } from '../lib/api';
import EdgeDetail from './EdgeDetail';
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
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [highlightIds, setHighlightIds] = useState<{ nodes: string[]; edges: string[] }>({
    nodes: [],
    edges: [],
  });

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
    setSelectedEdge(null);
    setHighlightIds({ nodes: [], edges: [] });
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

    const previousNodeIds = new Set(graphData.nodes.map((n) => n.id));
    const previousEdgeIds = new Set(graphData.edges.map((e) => e.id));

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
      setHighlightIds({
        nodes: updatedGraph.nodes.filter((n) => !previousNodeIds.has(n.id)).map((n) => n.id),
        edges: updatedGraph.edges.filter((e) => !previousEdgeIds.has(e.id)).map((e) => e.id),
      });
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
    <div className="flex flex-col h-full text-gray-100">
      <div className="relative flex-1 mb-4 overflow-hidden border border-white/10 rounded-xl shadow-inner bg-[#161616] min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#161616]/80 backdrop-blur-sm">
            <p className="text-sm text-gray-300">Loading...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-red-950/40">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {!isLoading && !error && currentGraphId && (
          <>
            <GraphDisplay graphData={graphData} onEdgeSelect={setSelectedEdge} highlightIds={highlightIds} />
            {selectedEdge && (
              <EdgeDetail
                edge={selectedEdge}
                nodes={graphData.nodes}
                onClose={() => setSelectedEdge(null)}
              />
            )}
          </>
        )}

        {!isLoading && !error && !currentGraphId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">
              Select a graph from the sidebar, or create a new one to get
              started.
            </p>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#1a1a1a] border border-white/10 rounded-xl">
        <TextInput onSubmit={handleTextInput} disabled={isLoading} />
      </div>
    </div>
  );
}