import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
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
import SiteLayout from './components/layout/SiteLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-emerald-glow/60">LOADING</span>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
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
      <Route path="/admin" element={<Admin />} />
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
  )
}

export default App