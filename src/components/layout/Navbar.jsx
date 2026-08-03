import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LogIn, LogOut, Menu, User, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const fallbackLinks = [
  { label:'HOME', path:'/' },
  { label:'SERVERS', path:'/servers', dropdown:[{label:'Events',path:'/events'}] },
  { label:'PLAYERS', path:'/players' },
  { label:'COMMUNITY', path:'/community', dropdown:[{label:'Stats',path:'/stats'},{label:'Rules',path:'/rules'},{label:'Ban Appeal',path:'/ban-appeal'},{label:'Recruitment',path:'/recruitment'}] },
  { label:'NEWS', path:'/news', dropdown:[{label:'Changelog',path:'/changelog'}] },
  { label:'PROJECTS', path:'/projects' }, { label:'STORE', path:'/store' }, { label:'ADMIN', path:'/admin' },
];

function buildNavigation(rows) {
  const visible = rows.filter((row) => row.visible !== false).sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const children = new Map();
  visible.forEach((row) => { if (row.parent_id) children.set(row.parent_id,[...(children.get(row.parent_id) || []),row]); });
  return visible.filter((row) => !row.parent_id).map((row) => ({
    id: row.id, label: String(row.label || '').toUpperCase(), path: row.path || '#', external: Boolean(row.external),
    dropdown: (children.get(row.id) || []).map((child) => ({ label: child.label, path: child.path || '#', external: Boolean(child.external) })),
  }));
}

function NavTarget({ item, className, children, onClick }) {
  if (item.external || /^https?:\/\//i.test(item.path)) return <a href={item.path} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>{children}</a>;
  return <Link to={item.path} className={className} onClick={onClick}>{children}</Link>;
}

export default function Navbar() {
  const [isOpen,setIsOpen] = useState(false);
  const [scrolled,setScrolled] = useState(false);
  const [navLinks,setNavLinks] = useState(fallbackLinks);
  const location = useLocation();
  const { member,isLoading,loginWithDiscord,logoutMember } = useAuth();
  const isHome = location.pathname === '/';

  useEffect(() => { const handler = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll',handler); return () => window.removeEventListener('scroll',handler); },[]);
  useEffect(() => { setIsOpen(false); },[location]);
  useEffect(() => { let active = true; base44.entities.NavigationItem.list('sort_order').then((rows) => { const built = buildNavigation(Array.isArray(rows) ? rows : []); if (active && built.length) setNavLinks(built); }).catch(() => {}); return () => { active = false; }; },[]);
  const activeTop = useMemo(() => navLinks.find((item) => location.pathname === item.path || item.dropdown?.some((child) => child.path === location.pathname)),[navLinks,location.pathname]);

  return <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'backdrop-blur-xl' : 'backdrop-blur-sm'}`} style={{background:scrolled?'linear-gradient(to bottom,rgba(0,0,0,.92) 50%,transparent)':'linear-gradient(to bottom,rgba(0,0,0,.55) 30%,transparent)',...(isHome?{paddingBottom:'100px',marginBottom:'-100px'}:{})}}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex h-14 items-center justify-between lg:h-16">
      <Link to="/" className="flex shrink-0 items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded border border-gold/60 text-base font-black text-emerald-glow">A</div><div><span className="font-heading text-xl font-bold tracking-[.15em] text-white">APEX</span><span className="font-heading text-xl font-bold tracking-[.15em] text-emerald-glow">ORDER</span></div></Link>
      <div className="hidden items-center lg:flex">{navLinks.map((item) => <div key={item.id || item.path} className="group relative"><NavTarget item={item} className={`flex items-center gap-1 px-3 py-2 text-xs font-bold tracking-[.15em] transition ${activeTop === item ? 'text-emerald-glow' : 'text-gray-400 hover:text-white'}`}>{item.label}{item.dropdown?.length ? <ChevronDown size={12} /> : null}</NavTarget>{item.dropdown?.length ? <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100"><div className="min-w-[180px] rounded border border-emerald-glow/20 bg-black/95 backdrop-blur-xl">{item.dropdown.map((child) => <NavTarget key={child.path} item={child} className="block px-4 py-2.5 text-xs font-bold tracking-wider text-gray-400 hover:bg-emerald-glow/5 hover:text-emerald-glow">{child.label}</NavTarget>)}</div></div> : null}</div>)}</div>
      <div className="hidden items-center gap-3 lg:flex">{!isLoading && (member ? <div className="group relative"><button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-300">{member.avatar ? <img src={member.avatar} className="h-7 w-7 rounded-full" alt="" /> : <User size={16} />}<span className="max-w-28 truncate">{member.displayName}</span><ChevronDown size={12} /></button><div className="invisible absolute right-0 top-full pt-2 opacity-0 group-hover:visible group-hover:opacity-100"><div className="min-w-[180px] rounded border border-emerald-glow/20 bg-black/95"><Link to="/players" className="block px-4 py-3 text-xs text-gray-400 hover:text-emerald-glow">Players</Link><button onClick={logoutMember} className="flex w-full items-center gap-2 px-4 py-3 text-xs text-red-300"><LogOut size={14}/>Sign out</button></div></div></div> : <button onClick={() => loginWithDiscord(location.pathname)} className="flex items-center gap-2 rounded border border-emerald-glow/50 px-4 py-2 text-xs font-bold text-emerald-glow"><LogIn size={14}/> SIGN IN</button>)}</div>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white lg:hidden">{isOpen?<X size={22}/>:<Menu size={22}/>}</button>
    </div></div>
    {isOpen && <div className="border-t border-emerald-glow/10 bg-black/95 px-4 py-6 lg:hidden">{navLinks.map((item) => <div key={item.id || item.path}><NavTarget item={item} onClick={() => setIsOpen(false)} className="block px-4 py-3 text-sm font-bold tracking-wider text-gray-300">{item.label}</NavTarget>{item.dropdown?.map((child) => <NavTarget key={child.path} item={child} onClick={() => setIsOpen(false)} className="block px-8 py-2 text-xs font-bold text-gray-500 hover:text-emerald-glow">{child.label}</NavTarget>)}</div>)}</div>}
  </nav>;
}
