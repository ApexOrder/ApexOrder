const API_ROOT = '/api/entities';

const DEFAULT_NAVIGATION = [
  { label: 'HOME', path: '/', children: [] },
  { label: 'SERVERS', path: '/servers', children: [['Events', '/events']] },
  { label: 'PLAYERS', path: '/players', children: [] },
  {
    label: 'COMMUNITY',
    path: '/community',
    children: [
      ['Stats', '/stats'],
      ['Rules', '/rules'],
      ['Ban Appeal', '/ban-appeal'],
      ['Recruitment', '/recruitment'],
    ],
  },
  { label: 'NEWS', path: '/news', children: [['Changelog', '/changelog']] },
  { label: 'PROJECTS', path: '/projects', children: [] },
  { label: 'STORE', path: '/store', children: [] },
  { label: 'ADMIN', path: '/admin', children: [] },
];

let navigationSeedPromise = null;

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

function normaliseList(result) {
  return Array.isArray(result)
    ? result
    : Array.isArray(result?.items)
      ? result.items
      : [];
}

async function rawList(entityType, sort = '') {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  const query = params.toString();
  const result = await request(`/${encodeURIComponent(entityType)}${query ? `?${query}` : ''}`);
  return normaliseList(result);
}

function rawCreate(entityType, payload) {
  return request(`/${encodeURIComponent(entityType)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function seedDefaultNavigationOnce() {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/admin')) return;
  if (navigationSeedPromise) return navigationSeedPromise;

  navigationSeedPromise = (async () => {
    const setupRows = await rawList('NavigationMenuSetup');
    if (setupRows.length) return;

    const existing = await rawList('NavigationItem', 'sort_order');
    const working = [...existing];

    for (let index = 0; index < DEFAULT_NAVIGATION.length; index += 1) {
      const item = DEFAULT_NAVIGATION[index];
      let parent = working.find((row) => !row.parent_id && row.path === item.path);

      if (!parent) {
        parent = await rawCreate('NavigationItem', {
          label: item.label,
          path: item.path,
          parent_id: '',
          sort_order: (index + 1) * 10,
          visible: true,
          external: false,
        });
        working.push(parent);
      }

      for (let childIndex = 0; childIndex < item.children.length; childIndex += 1) {
        const [label, path] = item.children[childIndex];
        const alreadyExists = working.some((row) => row.path === path);
        if (alreadyExists) continue;

        const child = await rawCreate('NavigationItem', {
          label,
          path,
          parent_id: parent.id,
          sort_order: childIndex + 1,
          visible: true,
          external: false,
        });
        working.push(child);
      }
    }

    await rawCreate('NavigationMenuSetup', {
      version: 1,
      completed_at: new Date().toISOString(),
    });
  })().catch((error) => {
    navigationSeedPromise = null;
    throw error;
  });

  return navigationSeedPromise;
}

export async function listCmsEntities(entityType, sort = '') {
  if (entityType === 'NavigationItem') {
    try {
      await seedDefaultNavigationOnce();
    } catch (error) {
      console.warn('[CMS] Default navigation could not be added:', error?.message || error);
    }
  }

  return rawList(entityType, sort);
}

export async function filterCmsEntities(entityType, filters = {}, sort = '') {
  const params = new URLSearchParams({ filters: JSON.stringify(filters) });
  if (sort) params.set('sort', sort);
  const result = await request(`/${encodeURIComponent(entityType)}?${params}`);
  return normaliseList(result);
}

export function createCmsEntity(entityType, payload) {
  return rawCreate(entityType, payload);
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
