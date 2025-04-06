// src/store/graphStore.ts
import { create } from 'zustand';
import { Thread } from '@/lib/types';

interface GraphState {
  threads: Thread[];
  currentThreadId: string | null;
  setThreads: (threads: Thread[]) => void;
  addThreadToList: (thread: Thread) => void; // Adds a new thread to the list
  setCurrentThreadId: (id: string | null) => void;
  isLoadingThreads: boolean;
  setIsLoadingThreads: (loading: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  threads: [],
  currentThreadId: null,
  isLoadingThreads: true, // Start as true initially
  setThreads: (threads) => set({ threads, isLoadingThreads: false }), // Set loading false when threads arrive
  addThreadToList: (thread) => set((state) => ({
     // Avoid duplicates if adding optimistically before a full refresh
    threads: state.threads.some(t => t.id === thread.id)
        ? state.threads
        : [thread, ...state.threads] // Add new thread to the beginning
    })),
  setCurrentThreadId: (id) => set({ currentThreadId: id }),
  setIsLoadingThreads: (loading) => set({ isLoadingThreads: loading }),
}));