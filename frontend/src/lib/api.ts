// src/lib/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,//  This allows cookies (like refreshToken) to be sent and received
});

// to -> Add an interceptor to include the JWT token in requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token'); // Assuming to store access token in localStorage
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response interceptor for handling token refresh
// We need a way to access setToken from AuthContext, which is tricky here.
// A common pattern is to have a callback or event emitter, or pass the store/setter.
// For simplicity, we'll make a call and expect the AuthProvider to update if it gets a new token.
// A more robust solution might involve a shared service or directly calling a method exposed by AuthContext.

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];
//check this unknown types later
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if it's a 401 error, not a retry, and the error is not from the refresh token endpoint itself
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
      if (isRefreshing) {
        // If already refreshing, add this request to a queue to be retried later
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          if (originalRequest.headers) originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        const newAccessToken = data.token;

        // Update the token in localStorage (AuthContext will pick it up or needs a setter)
        localStorage.setItem('token', newAccessToken);
        
        // Update the Authorization header for the original request
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        
        processQueue(null, newAccessToken); // Process queued requests with new token
        isRefreshing = false;
        return api(originalRequest); // Retry the original request with the new token
      } catch (refreshError) {
        processQueue(refreshError, null); // Reject queued requests
        isRefreshing = false;
        // console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear user data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // This is a side-effect, ideally handled by AuthContext listening to an event or a global state change
        // Forcing a reload to login page might be too abrupt, but it ensures re-authentication.
        // A better way is for AuthContext to handle this based on an event or a failed refresh attempt.
        if (window.location.pathname !== '/login') {
           // alert('Your session has expired. Please log in again.'); // Optional: inform user
           window.location.href = '/'; // Redirect to login
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;