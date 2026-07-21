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

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    window.location.href = '/cdn-cgi/access/logout';
  }, []);

  const checkAuth = useCallback(async () => Boolean(await refreshUser()), [refreshUser]);
  const navigateToLogin = useCallback(() => {
    window.location.href = '/admin';
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
      logout,
      refreshUser,
      checkAuth,
      navigateToLogin,
    }),
    [
      user,
      isLoading,
      authError,
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
