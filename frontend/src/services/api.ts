// src/services/api.ts
// Axios instance with interceptors — JWT attach, error handling, 401 redirect

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes — AI calls can be slow
});

// ── Request Interceptor — Attach JWT Token ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Handle Auth Errors ────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('client');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
