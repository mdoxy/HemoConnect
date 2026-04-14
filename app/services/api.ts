const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (envUrl) {
    return stripTrailingSlash(envUrl);
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const backendUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};