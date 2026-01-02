import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';


const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
};


const apiRequest = async (endpoint, options = {}) => {
    const token = await getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });


    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
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
