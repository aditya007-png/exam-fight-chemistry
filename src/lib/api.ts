// src/lib/api.ts
// Centralized API client for Exam Fight Chemistry with timeout protection
// Works seamlessly in both local development (proxied by Vite) and production (Vercel serverless API or dedicated backend)

const BASE_URL = import.meta.env.VITE_API_URL || '';
const DEFAULT_TIMEOUT_MS = 5000;

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!BASE_URL) {
    return cleanEndpoint;
  }
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${cleanBase}${cleanEndpoint}`;
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const url = apiUrl(endpoint);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};
