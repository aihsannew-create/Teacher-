import { handleLocalApiFallback } from './localBackendFallback';

const TOKEN_KEY = 'prerna_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch {
    return handleLocalApiFallback(url, { ...options, headers });
  }

  const isExpressBackend = response.headers.get('X-Prerna-Api') === '1';
  const contentType = response.headers.get('content-type') || '';

  // If deployed to static hosting (GitHub Pages / Vercel / Netlify / static preview) where /api/* returns 404/405/5xx or SPA HTML
  if (
    !isExpressBackend ||
    !contentType.includes('application/json') ||
    (url.startsWith('/api/auth/') && (response.status === 404 || response.status === 405 || response.status >= 500))
  ) {
    return handleLocalApiFallback(url, { ...options, headers });
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    return handleLocalApiFallback(url, { ...options, headers });
  }

  if (!response.ok) {
    if (response.status === 401) {
      setStoredToken(null);
    }
    const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    if (data?.code) err.code = data.code;
    if (data?.studentName) err.studentName = data.studentName;
    if (data?.rollNumber) err.rollNumber = data.rollNumber;
    throw err;
  }

  return data;
}
