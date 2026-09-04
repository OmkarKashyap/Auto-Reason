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
    <div className="absolute bottom-4 right-4 z-20 w-80 rounded-xl border border-white/10 bg-[#1e1e1e]/95 backdrop-blur-sm p-4 shadow-2xl">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-100">Relationship</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-500 hover:text-white transition-colors leading-none text-lg"
        >
          &times;
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-100">
        <span className="font-medium">{sourceLabel}</span>{' '}
        <span className="text-[#99FF00]">&rarr; {edge.label} &rarr;</span>{' '}
        <span className="font-medium">{targetLabel}</span>
      </p>

      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Evidence</p>
        <p className="text-sm italic text-gray-300">
          {edge.evidence ? `"${edge.evidence}"` : 'No evidence recorded for this relationship.'}
        </p>
      </div>

      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confidence</p>
        <p className="text-sm text-gray-300">
          {confidencePct !== null ? `${confidencePct}%` : 'Not available'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source</p>
        <p className="text-sm text-gray-300">{edge.source_label}</p>
      </div>
    </div>
  );
}
