'use client';

import { askGraph } from '@/lib/api';
import { AskResponse } from '@/lib/types';
import React, { useState } from 'react';

interface AskBoxProps {
  graphId: string;
  onViewEdge: (edgeId: string) => void;
  disabled?: boolean;
}

export default function AskBox({ graphId, onViewEdge, disabled }: AskBoxProps) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking || disabled) return;

    setIsAsking(true);
    setError(null);
    try {
      const response = await askGraph(graphId, question);
      setResult(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get an answer.');
      setResult(null);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this graph..."
          disabled={disabled || isAsking}
          className="flex-1 p-2.5 text-sm text-white placeholder-gray-500 bg-[#232323] border border-white/10 rounded-md focus:outline-none focus:border-[#99FF00] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || isAsking || !question.trim()}
          className="px-4 py-2.5 text-sm font-medium text-black bg-[#99FF00] rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isAsking ? 'Asking...' : 'Ask'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      {result && !error && (
        <div className="mt-3 p-3 bg-[#1e1e1e] border border-white/10 rounded-md">
          <p className="text-sm text-gray-100">{result.answer}</p>
          {result.claims.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.claims.map((claim, i) => (
                <li key={i} className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
                  <span>{claim.claim}</span>
                  {claim.edge_ids.map((edgeId) => (
                    <button
                      key={edgeId}
                      type="button"
                      onClick={() => onViewEdge(edgeId)}
                      className="text-[#99FF00] hover:underline"
                    >
                      [view edge]
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
