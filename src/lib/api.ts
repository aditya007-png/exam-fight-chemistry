// src/lib/api.ts
// Centralized API client for Exam Fight Chemistry
// Works seamlessly in both local development (proxied by Vite) and production (Vercel serverless API or dedicated backend)

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!BASE_URL) {
    return cleanEndpoint;
  }
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${cleanBase}${cleanEndpoint}`;
};

export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = apiUrl(endpoint);
  return fetch(url, options);
};
