import { getAuth } from 'firebase/auth'; // Import Firebase auth
import { app } from '../lib/firebase'; // Your Firebase app instance initialization
import {
    GraphData,
    Thread,
    ProcessTextRequest,
    ProcessTextResponse,
    ApiErrorResponse,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // Your FastAPI backend URL

async function getAuthToken(): Promise<string | null> {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
  
    if (!currentUser) {
      console.warn('No user logged in for API call');
      return null;
    }
  
    try {
      const token = await currentUser.getIdToken(true); // Force refresh if needed
      console.log('Firebase ID token:', token); // Log the token for debugging
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
}

export async function fetchAuthenticated<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken(); // Retrieve Firebase ID token
    if (!token) {
      console.error('User is not authenticated.'); // Log the issue
      throw new Error('User is not authenticated.');
    }
  
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
    });
  
    if (!response.ok) {
      console.error(`Error: ${response.statusText}`); // Log the response error
      throw new Error(`Error: ${response.statusText}`);
    }
  
    return response.json();
}

// --- Specific API Functions ---

// Fetch the list of user threads (matches backend route `/api/graphs/list`)
export async function fetchUserThreads(): Promise<Thread[]> {
    return fetchAuthenticated<Thread[]>('/api/graphs/list', { method: 'GET' });
}

// Fetch graph data by ID (matches backend route `/api/graphs/{graphId}`)
export async function fetchGraphData(graphId: string): Promise<GraphData> {
    return fetchAuthenticated<GraphData>(`/api/graphs/${graphId}`, { method: 'GET' });
}

// Process text input (matches backend route `/api/process-text`)
export async function processText(data: { graphName: string; text: string }): Promise<GraphData> {
    return fetchAuthenticated<GraphData>('/api/process-text', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Add other API functions as needed (e.g., delete graph, rename graph)