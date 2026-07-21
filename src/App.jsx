import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Servers from './pages/Servers';
import Community from './pages/Community';
import Rules from './pages/Rules';
import Downloads from './pages/Downloads';
import Projects from './pages/Projects';
import StoreWithMemberLogin from './pages/StoreWithMemberLogin';
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

function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/community" element={<Community />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/store" element={<StoreWithMemberLogin />} />
        <Route path="/events" element={<Events />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/news" element={<News />} />
        <Route path="/ban-appeal" element={<BanAppeal />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/inventory" element={<Inventory />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
