import { GraphDetail, GraphSummary, Owner } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // credentials: 'include' is required so the identity cookie the backend
  // issues (anonymous session, or the account cookie after login/register)
  // is sent back on every subsequent request.
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export function listGraphs(): Promise<GraphSummary[]> {
  return apiFetch<GraphSummary[]>('/api/graphs', { method: 'GET' });
}

export function createGraph(name: string): Promise<GraphSummary> {
  return apiFetch<GraphSummary>('/api/graphs', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function getGraph(graphId: string): Promise<GraphDetail> {
  return apiFetch<GraphDetail>(`/api/graphs/${graphId}`, { method: 'GET' });
}

export function deleteGraph(graphId: string): Promise<void> {
  return apiFetch<void>(`/api/graphs/${graphId}`, { method: 'DELETE' });
}

export function processText(graphId: string, text: string): Promise<GraphDetail> {
  return apiFetch<GraphDetail>(`/api/graphs/${graphId}/process-text`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function registerUser(data: { fullName: string; email: string; password: string }) {
  return apiFetch<{ message: string; userId: string }>('/api/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }) {
  return apiFetch<{ message: string; userId: string }>('/api/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiFetch<{ message: string }>('/api/logout', { method: 'POST' });
}

export function getMe(): Promise<Owner> {
  return apiFetch<Owner>('/api/me', { method: 'GET' });
}
