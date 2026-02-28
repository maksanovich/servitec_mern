const API_BASE = '/api';
const TOKEN_KEY = 'servitec_admin_token';

function handleUnauthorized(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
  window.location.href = '/admin/login';
}

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}
