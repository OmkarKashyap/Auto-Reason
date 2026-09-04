'use client';

import { GraphEdge, GraphNode } from '@/lib/types';

interface EdgeDetailProps {
  edge: GraphEdge;
  nodes: GraphNode[];
  onClose: () => void;
}

function labelFor(nodes: GraphNode[], nodeId: string): string {
  return nodes.find((n) => n.id === nodeId)?.label ?? nodeId;
}

export default function EdgeDetail({ edge, nodes, onClose }: EdgeDetailProps) {
  const sourceLabel = labelFor(nodes, edge.source);
  const targetLabel = labelFor(nodes, edge.target);
  const confidencePct =
    typeof edge.confidence === 'number' ? Math.round(edge.confidence * 100) : null;

  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Relationship</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          &times;
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-900 dark:text-gray-100">
        <span className="font-medium">{sourceLabel}</span>{' '}
        <span className="text-gray-400">&rarr; {edge.label} &rarr;</span>{' '}
        <span className="font-medium">{targetLabel}</span>
      </p>

      <div className="mb-2">
        <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Evidence</p>
        <p className="text-sm italic text-gray-700 dark:text-gray-300">
          {edge.evidence ? `"${edge.evidence}"` : 'No evidence recorded for this relationship.'}
        </p>
      </div>

      <div className="mb-2">
        <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Confidence</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {confidencePct !== null ? `${confidencePct}%` : 'Not available'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Source</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{edge.source_label}</p>
      </div>
    </div>
  );
}
