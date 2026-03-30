import { Platform } from 'react-native';

const explicitBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const emulatorFallback = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_BASE_URL = explicitBaseUrl || emulatorFallback;

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

function getHeaders(customHeaders?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers),
  });

  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      ((data as { error?: string })?.error ?? response.statusText ?? 'İstek başarısız.')
    ) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};
