import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'apexorder_user';

function readStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('[Auth] Could not read stored user:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    try {
      setUser(readStoredUser());
    } catch (error) {
      console.error('[Auth] Initialisation failed:', error);
      setAuthError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials = {}) => {
    setAuthError(null);

    /*
     * Temporary local compatibility login.
     *
     * This will be replaced with:
     * POST /api/auth/login
     *
     * Do not treat this as secure authentication.
     */
    const nextUser = {
      id: 'local-admin',
      email: credentials.email || 'admin@apexorder.local',
      full_name: credentials.full_name || 'ApexOrder Admin',
      role: 'admin',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAuthError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedUser = readStoredUser();
    setUser(storedUser);
    return storedUser;
  }, []);

  const checkAuth = useCallback(async () => {
    return Boolean(readStoredUser());
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,

      isLoading,
      loading: isLoading,

      authError,
      error: authError,

      isAuthenticated: Boolean(user),
      authenticated: Boolean(user),

      login,
      logout,
      refreshUser,
      checkAuth,
    }),
    [
      user,
      isLoading,
      authError,
      login,
      logout,
      refreshUser,
      checkAuth,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}

export default AuthContext;