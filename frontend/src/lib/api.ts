import { getAuth } from 'firebase/auth';
import { app } from '../config/firebaseConfig';
import { GraphDetail, GraphSummary } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function getAuthToken(): Promise<string | null> {
  const currentUser = getAuth(app).currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  Object.assign(headers, options.headers); // explicit headers win over the auto-attached token

  // credentials: 'include' is required so the anonymous session cookie the
  // backend issues on first visit is sent back on every subsequent request.
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
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

export function signIn(idToken: string) {
  return apiFetch<{ message: string; userId: string }>('/api/signin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({}),
  });
}
