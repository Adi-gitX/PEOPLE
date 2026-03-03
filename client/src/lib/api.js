import { auth } from './firebase';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackApiUrl = import.meta.env.DEV ? 'http://localhost:5001' : '';
const API_URL = (configuredApiUrl && configuredApiUrl.length > 0
    ? configuredApiUrl
    : fallbackApiUrl
).replace(/\/+$/, '');
const API_BASE_LABEL = API_URL || 'same-origin';
export const AUTH_SESSION_INVALID_EVENT = 'people:auth-session-invalid';

const resolveRequestUrl = (endpoint) => {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;

    if (!API_URL) {
        return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    }

    return endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
};

const createAuthSessionError = (message, details = {}) => {
    const error = new Error(message);
    error.name = 'AuthSessionError';
    error.code = 'AUTH_SESSION_INVALID';
    Object.assign(error, details);
    return error;
};

const dispatchAuthSessionInvalid = (details = {}) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT, { detail: details }));
};

export const isAuthSessionError = (error) => {
    if (!error) return false;
    if (error.name === 'AuthSessionError' || error.code === 'AUTH_SESSION_INVALID') return true;
    if (error.status === 401) return true;
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return (
        message.includes('token') ||
        message.includes('auth') ||
        message.includes('session') ||
        message.includes('credential')
    );
};


const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
        return await user.getIdToken();
    } catch (error) {
        const authError = createAuthSessionError('Failed to retrieve auth session token', {
            cause: error,
            endpoint: null,
            apiBaseUrl: API_BASE_LABEL,
        });
        dispatchAuthSessionInvalid({
            reason: 'token_retrieval_failed',
            apiBaseUrl: API_BASE_LABEL,
        });
        throw authError;
    }
};


const apiRequest = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    const requestUrl = resolveRequestUrl(endpoint);

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
        const networkError = new Error(`Network request failed for ${endpoint} (API: ${API_BASE_LABEL}): ${message}`);
        networkError.name = 'NetworkError';
        networkError.cause = error;
        throw networkError;
    }


    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            if (response.status === 401 && token) {
                const authError = createAuthSessionError(
                    `Authentication session expired for ${endpoint}`,
                    {
                        status: 401,
                        endpoint,
                        apiBaseUrl: API_BASE_LABEL,
                        url: requestUrl,
                    }
                );
                dispatchAuthSessionInvalid({
                    reason: 'http_401_non_json',
                    endpoint,
                    apiBaseUrl: API_BASE_LABEL,
                });
                throw authError;
            }
            throw new Error(`API Error (${endpoint}): ${response.status} ${response.statusText}`);
        }
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && token) {
            const authError = createAuthSessionError(
                `Authentication session expired for ${endpoint}`,
                {
                    status: 401,
                    endpoint,
                    apiBaseUrl: API_BASE_LABEL,
                    url: requestUrl,
                    details: data.details,
                }
            );
            dispatchAuthSessionInvalid({
                reason: 'http_401',
                endpoint,
                apiBaseUrl: API_BASE_LABEL,
            });
            throw authError;
        }

        const baseMessage = data.message || data.error || 'API request failed';
        const error = new Error(`${baseMessage} (${endpoint})`);
        error.status = response.status;
        error.endpoint = endpoint;
        error.apiBaseUrl = API_BASE_LABEL;
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
