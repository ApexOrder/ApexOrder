import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AuthContext = createContext(null);

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await apiRequest('/api/auth/me');
      setUser(nextUser);
      setAuthError(null);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async (credential) => {
    setAuthError(null);

    try {
      const nextUser = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      setUser(null);
      setAuthError(error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setAuthError(null);
    }
  }, []);

  const checkAuth = useCallback(async () => Boolean(await refreshUser()), [refreshUser]);
  const navigateToLogin = useCallback(() => {
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      loading: isLoading,
      isLoadingAuth: isLoading,
      isLoadingPublicSettings: false,
      authError,
      error: authError,
      isAuthenticated: Boolean(user),
      authenticated: Boolean(user),
      loginWithGoogle,
      logout,
      refreshUser,
      checkAuth,
      navigateToLogin,
    }),
    [
      user,
      isLoading,
      authError,
      loginWithGoogle,
      logout,
      refreshUser,
      checkAuth,
      navigateToLogin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}

export default AuthContext;
