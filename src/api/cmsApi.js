const API_ROOT = '/api/entities';

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function listCmsEntities(entityType, sort = '') {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  const query = params.toString();
  const result = await request(`/${encodeURIComponent(entityType)}${query ? `?${query}` : ''}`);
  return Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
}

export async function filterCmsEntities(entityType, filters = {}, sort = '') {
  const params = new URLSearchParams({ filters: JSON.stringify(filters) });
  if (sort) params.set('sort', sort);
  const result = await request(`/${encodeURIComponent(entityType)}?${params}`);
  return Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
}

export function createCmsEntity(entityType, payload) {
  return request(`/${encodeURIComponent(entityType)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCmsEntity(entityType, id, payload) {
  return request(`/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCmsEntity(entityType, id) {
  return request(`/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
