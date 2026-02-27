import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';


const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
};


const apiRequest = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    const requestUrl = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(requestUrl, {
            ...options,
            headers,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown network error';
        const networkError = new Error(`Network request failed for ${endpoint} (API: ${API_URL}): ${message}`);
        networkError.name = 'NetworkError';
        networkError.cause = error;
        throw networkError;
    }


    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error(`API Error (${endpoint}): ${response.status} ${response.statusText}`);
        }
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        const baseMessage = data.message || data.error || 'API request failed';
        const error = new Error(`${baseMessage} (${endpoint})`);
        error.status = response.status;
        error.endpoint = endpoint;
        error.apiBaseUrl = API_URL;
        error.url = requestUrl;
        error.details = data.details; // Pass validation details through
        throw error;
    }

    return data;
};

export const api = {
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),

    post: (endpoint, body) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    }),

    patch: (endpoint, body) => apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
    }),

    put: (endpoint, body) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    }),

    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;
