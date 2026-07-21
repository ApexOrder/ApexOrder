import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed with status ${response.status}`);
  return data;
}

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMember = useCallback(async () => {
    try {
      const next = await apiRequest('/api/member/me');
      setMember(next);
      return next;
    } catch {
      setMember(null);
      return null;
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    if (!window.location.pathname.startsWith('/admin')) return null;
    try {
      const next = await apiRequest('/api/admin/me');
      setAdmin(next);
      return next;
    } catch {
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshMember(), refreshAdmin()]).finally(() => setIsLoading(false));
  }, [refreshMember, refreshAdmin]);

  const loginWithDiscord = useCallback((returnTo = window.location.pathname) => {
    window.location.href = `/api/member/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  const logoutMember = useCallback(async () => {
    await apiRequest('/api/member/logout', { method: 'POST' }).catch(() => null);
    setMember(null);
    window.location.href = '/';
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdmin(null);
    window.location.href = '/cdn-cgi/access/logout';
  }, []);

  const value = useMemo(() => ({
    member,
    user: member,
    admin,
    isLoading,
    loading: isLoading,
    isLoadingAuth: isLoading,
    isAuthenticated: Boolean(member),
    authenticated: Boolean(member),
    isAdminAuthenticated: Boolean(admin),
    loginWithDiscord,
    logout: logoutMember,
    logoutMember,
    logoutAdmin,
    refreshMember,
    refreshAdmin,
    checkAuth: async () => Boolean(await refreshMember()),
    navigateToLogin: () => loginWithDiscord(),
  }), [member, admin, isLoading, loginWithDiscord, logoutMember, logoutAdmin, refreshMember, refreshAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}

export default AuthContext;
