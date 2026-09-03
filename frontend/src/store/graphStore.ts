// src/store/graphStore.ts
import { create } from 'zustand';
import { GraphSummary } from '@/lib/types';

interface GraphState {
  graphs: GraphSummary[];
  currentGraphId: string | null;
  setGraphs: (graphs: GraphSummary[]) => void;
  addGraphToList: (graph: GraphSummary) => void;
  setCurrentGraphId: (id: string | null) => void;
  isLoadingGraphs: boolean;
  setIsLoadingGraphs: (loading: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graphs: [],
  currentGraphId: null,
  isLoadingGraphs: true,
  setGraphs: (graphs) => set({ graphs, isLoadingGraphs: false }),
  addGraphToList: (graph) =>
    set((state) => ({
      graphs: state.graphs.some((g) => g.id === graph.id) ? state.graphs : [graph, ...state.graphs],
    })),
  setCurrentGraphId: (id) => set({ currentGraphId: id }),
  setIsLoadingGraphs: (loading) => set({ isLoadingGraphs: loading }),
}));
