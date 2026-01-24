import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with WordPress REST API base URL
export const apiClient: AxiosInstance = axios.create({
  baseURL: window.infinityData?.restUrl || '/wp-json/infinity/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add nonce to requests if user is logged in
apiClient.interceptors.request.use((config) => {
  if (window.infinityData?.nonce) {
    config.headers['X-WP-Nonce'] = window.infinityData.nonce;
  }
  return config;
});

// Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      // Handle specific error codes
      switch (status) {
        case 401:
          toast.error('Please log in to continue');
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Simulations
  checkSimulationAccess: (id: number) =>
    apiClient.get(`/simulation/${id}/access`),

  trackSimulation: (id: number, duration?: number) =>
    apiClient.post(`/simulation/${id}/track`, { duration }),

  // User
  getUserStats: () => apiClient.get('/user/stats'),

  // Blueprints
  voteBlueprint: (id: number, vote: 'up' | 'down' | 'remove') =>
    apiClient.post(`/blueprint/${id}/vote`, { vote }),

  forkBlueprint: (id: number) => apiClient.post(`/blueprint/${id}/fork`),

  // Challenges
  submitChallenge: (id: number, resultData: any) =>
    apiClient.post(`/challenge/${id}/submit`, { result_data: resultData }),

  // Config
  getConfig: () => apiClient.get('/config'),
};

export default api;
