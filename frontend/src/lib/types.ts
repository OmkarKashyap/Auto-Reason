// src/lib/types.ts
// Mirrors backend/app/schemas/graph.py exactly.

export interface GraphNode {
  id: string;
  label: string;
  description?: string | null;
}

export interface GraphEdge {
  id: string;
  source: string; // GraphNode.id
  target: string; // GraphNode.id
  label: string;
  evidence?: string | null;
  confidence?: number | null;
  source_label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphSummary {
  id: string;
  name: string;
  updated_at: string;
}

export interface GraphDetail extends GraphData {
  id: string;
  name: string;
  summary: string | null;
}

export interface ApiErrorResponse {
  detail: string;
}
