'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GraphDisplay from './GraphDisplay';
import TextInput from './TextInput';
import { fetchGraphData, fetchAuthenticated } from '../lib/api';
import { GraphData } from '@/lib/types';

export default function Dashboard() {
  const [selectedGraph, setSelectedGraph] = useState<string | null>(null); // Track the selected graph
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [userGraphs, setUserGraphs] = useState<string[]>([]); // Store user-specific graphs
  const [newGraphName, setNewGraphName] = useState<string>(''); // Track the new graph name
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load graph data when a graph is selected
  const loadGraph = useCallback(async (graphName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGraphData(graphName);
      setGraphData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load graph data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle graph selection from the sidebar
  const handleGraphSelection = (graphName: string) => {
    setSelectedGraph(graphName);
    loadGraph(graphName);
  };

  // Handle text input submission
  const handleTextInput = async (text: string) => {
    if (!selectedGraph) {
      setError('Please select or create a graph first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse the text input to extract nodes and edges
      const lines = text.split('\n');
      const nodes = new Set<string>();
      const edges: { from: string; to: string }[] = [];

      lines.forEach((line) => {
        const match = line.match(/(\w+)\s*->\s*(\w+)/); // Match "A -> B" format
        if (match) {
          const from = match[1];
          const to = match[2];
          nodes.add(from);
          nodes.add(to);
          edges.push({ from, to });
        }
      });

      // Update the graph data
      setGraphData({
        nodes: Array.from(nodes).map((id) => ({ id, label: id })),
        edges: edges.map((edge) => ({ source: edge.from, target: edge.to })), // Map to match GraphEdge type
      });

      // Optionally, send the updated graph to the backend
      await fetchAuthenticated('/api/graphs/update', {
        method: 'POST',
        body: JSON.stringify({
          graphName: selectedGraph,
          nodes: Array.from(nodes).map((id) => ({ id, properties: { label: id } })),
          edges: edges.map((edge) => ({
            source: edge.from,
            target: edge.to,
            type: "RELATION",
            properties: {},
          })),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to process text.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user-specific graphs on component mount
  useEffect(() => {
    const loadUserGraphs = async () => {
      try {
        const response = await fetchAuthenticated<{ graphs: { name: string }[] }>('/api/graphs', { method: 'GET' });
        if (Array.isArray(response.graphs)) {
          // Map the response to an array of strings
          const graphNames = response.graphs.map((graph) => graph.name);
          setUserGraphs(graphNames); // Update state with the graph names
        } else {
          console.error('Unexpected response format:', response);
          setError('Failed to load user graphs.');
        }
      } catch (err: any) {
        console.error('Failed to load user graphs:', err);
        setError('Failed to load user graphs.');
      }
    };

    loadUserGraphs();
  }, []);

  // Create a new graph
  const createGraph = async () => {
    if (!newGraphName.trim()) {
      setError('Graph name cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await fetchAuthenticated('/api/graphs', {
        method: 'POST',
        body: JSON.stringify({ name: newGraphName }),
        headers: { 'Content-Type': 'application/json' },
      });
      setUserGraphs((prev) => [...prev, newGraphName]); // Add the new graph to the list
      setNewGraphName(''); // Clear the input field
    } catch (err: any) {
      console.error('Failed to create graph:', err);
      setError('Failed to create graph.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 p-4 text-white bg-gray-800">
        <h2 className="mb-4 text-xl font-bold">Graphs</h2>
        <div className="mb-4">
          <input
            type="text"
            value={newGraphName}
            onChange={(e) => setNewGraphName(e.target.value)}
            placeholder="Enter new graph name"
            className="w-full p-2 mb-2 rounded text-white-900"
          />
          <button
            onClick={createGraph}
            className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Create Graph
          </button>
        </div>
        <ul className="space-y-2">
          {userGraphs.length > 0 ? (
            userGraphs.map((graphName) => (
              <li
                key={graphName}
                onClick={() => handleGraphSelection(graphName)}
                className={`p-2 rounded cursor-pointer ${
                  selectedGraph === graphName ? 'bg-blue-500' : 'hover:bg-gray-700'
                }`}
              >
                {graphName}
              </li>
            ))
          ) : (
            <p>No graphs available. Please create one.</p>
          )}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Graph Display Area */}
        <div className="flex-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-lg shadow-inner mb-4 relative overflow-hidden border border-gray-200 dark:border-gray-700 min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <p>Loading...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/30">
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}
          {!isLoading && !error && selectedGraph && (
            <GraphDisplay graphData={graphData} />
          )}
          {!isLoading && !error && !selectedGraph && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Select or create a graph to display its details.</p>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="p-4 bg-gray-200 dark:bg-gray-800">
          <TextInput onSubmit={handleTextInput} disabled={!selectedGraph} />
        </div>
      </div>
    </div>
  );
}