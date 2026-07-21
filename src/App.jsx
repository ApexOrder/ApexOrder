import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Servers from './pages/Servers';
import Community from './pages/Community';
import Rules from './pages/Rules';
import Downloads from './pages/Downloads';
import Projects from './pages/Projects';
import Store from './pages/Store';
import Events from './pages/Events';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import Changelog from './pages/Changelog.jsx';
import News from './pages/News.jsx';
import BanAppeal from './pages/BanAppeal.jsx';
import Recruitment from './pages/Recruitment.jsx';
import Inventory from './pages/Inventory.jsx';
import Login from './pages/Login.jsx';
import SiteLayout from './components/layout/SiteLayout';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-glow/20 border-t-emerald-glow" />
        <span className="text-xs font-mono tracking-widest text-emerald-glow/60">LOADING</span>
      </div>
    </div>
  );
}

function ProtectedAdmin() {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) return <LoadingScreen />;

  if (!isAuthenticated || user?.role !== 'admin') {
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return <Admin />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <LoadingScreen />;

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/community" element={<Community />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/store" element={<Store />} />
        <Route path="/events" element={<Events />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/news" element={<News />} />
        <Route path="/ban-appeal" element={<BanAppeal />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/inventory" element={<Inventory />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedAdmin />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
