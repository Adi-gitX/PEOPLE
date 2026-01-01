import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Generic hook for API fetching with loading/error states
 */
export const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { immediate = true } = options;

    const fetchData = useCallback(async () => {
        if (!endpoint) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(endpoint);
            setData(response.data);
        } catch (err) {
            setError(err.message);
            console.error(`API Error (${endpoint}):`, err);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        if (immediate) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [fetchData, immediate]);

    return { data, loading, error, refetch: fetchData, setData };
};

/**
 * Hook for fetching skills
 */
export const useSkills = () => {
    const result = useApi('/api/v1/skills');
    // Transform to simpler format
    return {
        ...result,
        skills: result.data || [],
    };
};

/**
 * Hook for fetching current user profile
 */
export const useCurrentUser = () => {
    return useApi('/api/v1/users/me');
};

/**
 * Hook for fetching missions with filters
 */
export const useMissions = (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
    });
    const queryString = queryParams.toString();
    const endpoint = `/api/v1/missions${queryString ? `?${queryString}` : ''}`;
    return useApi(endpoint);
};

/**
 * Hook for fetching user's own missions
 */
export const useMyMissions = () => {
    return useApi('/api/v1/missions/my');
};

/**
 * Hook for fetching a single mission
 */
export const useMission = (id) => {
    return useApi(id ? `/api/v1/missions/${id}` : null, { immediate: !!id });
};

/**
 * Hook for fetching contributors
 */
export const useContributors = () => {
    return useApi('/api/v1/contributors');
};

/**
 * Hook for fetching contributor profile
 */
export const useContributorProfile = () => {
    return useApi('/api/v1/contributors/me');
};

export default useApi;
