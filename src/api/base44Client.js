const API_BASE_URL = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/+$/, '');

const USER_STORAGE_KEY = 'apexorder_user';
const TOKEN_STORAGE_KEY = 'apexorder_token';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  let result = null;

  if (contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof result === 'object' && result?.error
        ? result.error
        : typeof result === 'string' && result
          ? result
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return result;
}

function normaliseArray(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  if (Array.isArray(result?.results)) {
    return result.results;
  }

  return [];
}

function createEntityClient(entityName) {
  const encodedEntity = encodeURIComponent(entityName);

  return {
    async list(sort) {
      try {
        const params = new URLSearchParams();

        if (sort) {
          params.set('sort', sort);
        }

        const query = params.toString();

        const result = await request(
          `/entities/${encodedEntity}${query ? `?${query}` : ''}`
        );

        return normaliseArray(result);
      } catch (error) {
        console.warn(
          `[API] ${entityName}.list() unavailable; returning an empty list.`,
          error
        );

        return [];
      }
    },

    async filter(filters = {}, sort) {
      try {
        const params = new URLSearchParams();

        params.set('filters', JSON.stringify(filters));

        if (sort) {
          params.set('sort', sort);
        }

        const result = await request(
          `/entities/${encodedEntity}?${params.toString()}`
        );

        return normaliseArray(result);
      } catch (error) {
        console.warn(
          `[API] ${entityName}.filter() unavailable; returning an empty list.`,
          error
        );

        return [];
      }
    },

    async get(id) {
      if (!id) {
        return null;
      }

      try {
        return await request(
          `/entities/${encodedEntity}/${encodeURIComponent(id)}`
        );
      } catch (error) {
        console.warn(`[API] ${entityName}.get() failed.`, error);
        return null;
      }
    },

    async create(data) {
      try {
        return await request(`/entities/${encodedEntity}`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error(`[API] ${entityName}.create() failed.`, error);
        throw new Error(
          `The ${entityName} backend has not been connected yet.`
        );
      }
    },

    async update(id, data) {
      if (!id) {
        throw new Error(`Cannot update ${entityName}: missing ID.`);
      }

      try {
        return await request(
          `/entities/${encodedEntity}/${encodeURIComponent(id)}`,
          {
            method: 'PUT',
            body: JSON.stringify(data),
          }
        );
      } catch (error) {
        console.error(`[API] ${entityName}.update() failed.`, error);
        throw new Error(
          `The ${entityName} backend has not been connected yet.`
        );
      }
    },

    async delete(id) {
      if (!id) {
        throw new Error(`Cannot delete ${entityName}: missing ID.`);
      }

      try {
        return await request(
          `/entities/${encodedEntity}/${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
          }
        );
      } catch (error) {
        console.error(`[API] ${entityName}.delete() failed.`, error);
        throw new Error(
          `The ${entityName} backend has not been connected yet.`
        );
      }
    },
  };
}

const entityNames = [
  'Server',
  'StoreItem',
  'Event',
  'PlayerStat',
  'Project',
  'Order',
  'BanAppeal',
  'Recruitment',
  'NewsPost',
  'Changelog',
  'UserInventory',
  'SiteSetting',
];

const entities = Object.fromEntries(
  entityNames.map((entityName) => [
    entityName,
    createEntityClient(entityName),
  ])
);

function readStoredUser() {
  try {
    const value = localStorage.getItem(USER_STORAGE_KEY);

    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

const auth = {
  async me() {
    return readStoredUser();
  },

  async loginViaEmailPassword(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const user = {
      id: 'local-user',
      email,
      full_name: email.split('@')[0],
      role: 'admin',
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, 'local-development-token');

    return user;
  },

  async register({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    return {
      success: true,
      email,
      requires_verification: false,
    };
  },

  async verifyOtp({ email }) {
    const user = {
      id: 'local-user',
      email,
      full_name: email?.split('@')[0] || 'User',
      role: 'user',
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, 'local-development-token');

    return {
      access_token: 'local-development-token',
      user,
    };
  },

  async resendOtp() {
    return { success: true };
  },

  async resetPasswordRequest() {
    return { success: true };
  },

  async resetPassword() {
    return { success: true };
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },

  logout(redirectUrl) {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);

    window.location.href = redirectUrl || '/';
  },

  redirectToLogin(returnUrl) {
    const target = returnUrl
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/login';

    window.location.href = target;
  },

  loginWithProvider(provider, returnUrl = '/') {
    console.warn(`${provider} login has not been connected yet.`);

    window.location.href = returnUrl;
  },
};

export const base44 = {
  entities,
  auth,
};
