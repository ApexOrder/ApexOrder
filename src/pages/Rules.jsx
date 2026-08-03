import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Server, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeading from '@/components/ui/SectionHeading';
import { communityRules, serverRules, servers as fallbackServers } from '@/lib/serverData';

const iconFor = (slug) => slug === 'servers' ? Server : slug === 'appeal' ? AlertTriangle : Shield;

export default function Rules() {
  const [categories,setCategories] = useState([]);
  const [items,setItems] = useState([]);
  const [servers,setServers] = useState([]);
  const [activeCategory,setActiveCategory] = useState('community');
  const [activeServer,setActiveServer] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.RuleCategory.list('sort_order').catch(() => []),
      base44.entities.RuleItem.list('sort_order').catch(() => []),
      base44.entities.Server.list('sort_order').catch(() => []),
    ]).then(([categoryRows,itemRows,serverRows]) => {
      const visibleCategories = (categoryRows || []).filter((row) => row.visible !== false);
      setCategories(visibleCategories.length ? visibleCategories : [
        {id:'community',slug:'community',label:'COMMUNITY RULES',description:'Rules for every ApexOrder member'},
        {id:'servers',slug:'servers',label:'SERVER RULES',description:'Rules specific to each server'},
        {id:'appeal',slug:'appeal',label:'BAN APPEALS',description:'Appeals and moderation'},
      ]);
      setItems(itemRows || []);
      const nextServers = (serverRows || []).filter((row) => row.id !== 'coming-soon');
      setServers(nextServers.length ? nextServers : fallbackServers.filter((row) => row.id !== 'coming-soon'));
      setActiveServer((nextServers[0] || fallbackServers[0])?.id || '');
    });
  },[]);

  const categoryItems = useMemo(() => items.filter((item) => item.visible !== false && item.category_slug === activeCategory && (!item.server_id || item.server_id === activeServer)).sort((a,b) => Number(a.sort_order || 0)-Number(b.sort_order || 0)),[items,activeCategory,activeServer]);
  const fallbackItems = useMemo(() => {
    if (activeCategory === 'community') return communityRules.map((rule,index) => ({id:`community-${index}`,title:rule.title,description:rule.description}));
    if (activeCategory === 'servers') return (serverRules[activeServer] || []).map((rule,index) => ({id:`server-${index}`,title:`Rule ${index+1}`,description:rule}));
    return [
      {id:'appeal-1',title:'Submit one honest appeal',description:'Provide your in-game name, server and a clear explanation of why the ban should be reviewed.'},
      {id:'appeal-2',title:'Allow time for review',description:'Moderation reviews each appeal individually. Repeated or abusive submissions may be rejected.'},
    ];
  },[activeCategory,activeServer]);
  const visibleItems = categoryItems.length ? categoryItems : fallbackItems;

  return <div className="pb-20 pt-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading title="The Codex" subtitle="RULES & CONDUCT" />
    <p className="mx-auto -mt-8 mb-12 max-w-2xl text-center text-muted-foreground">Rules and categories on this page are now managed directly through Admin → Navigation & Pages.</p>
    <div className="grid gap-8 lg:grid-cols-4"><aside className="lg:sticky lg:top-24 lg:self-start"><div className="glass-panel space-y-1 rounded-xl p-4">{categories.map((category) => { const Icon = iconFor(category.slug); return <button key={category.id} onClick={() => setActiveCategory(category.slug)} className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold tracking-wider ${activeCategory===category.slug?'border-emerald-glow/20 bg-emerald-glow/10 text-emerald-glow':'border-transparent text-muted-foreground hover:text-foreground'}`}><Icon size={16}/>{category.label}</button>; })}</div></aside>
      <main className="lg:col-span-3">{activeCategory === 'servers' && <div className="mb-6 flex flex-wrap gap-2">{servers.map((server) => <button key={server.id} onClick={() => setActiveServer(server.id)} className={`rounded border px-4 py-2 text-xs font-mono ${activeServer===server.id?'border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow':'border-border text-muted-foreground'}`}>{server.name}</button>)}</div>}
        <div className="space-y-4">{visibleItems.map((rule,index) => <GlassCard key={rule.id || index} className="flex items-start gap-5 !p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-glow/20 bg-emerald-glow/10"><span className="font-mono text-sm font-bold text-emerald-glow">{index+1}</span></div><div><h3 className="mb-1 text-sm font-bold text-foreground">{rule.title || `Rule ${index+1}`}</h3><p className="text-sm leading-relaxed text-muted-foreground">{rule.description}</p></div></GlassCard>)}</div>
      </main></div>
  </div></div>;
}
