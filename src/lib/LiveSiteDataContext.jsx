import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

const DEFAULT_DATA = {
  servers: [],
  projects: [],
  events: [],
  playerStats: [],
  news: [],
  loading: true,
};

const LiveSiteDataContext = createContext(DEFAULT_DATA);

function plural(count, singular, pluralWord = `${singular}S`) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function setCard(root, title, { nextTitle, cta, href, description }) {
  const headings = [...root.querySelectorAll('h3')];
  const heading = headings.find((node) => node.textContent?.trim().toUpperCase() === title);
  if (!heading) return;

  if (nextTitle) heading.textContent = nextTitle;
  const card = heading.closest('.group') || heading.parentElement?.parentElement;
  if (!card) return;

  const link = card.querySelector('a');
  if (link && href) link.setAttribute('href', href);

  const paragraphs = card.querySelectorAll('p');
  if (description && paragraphs[0]) paragraphs[0].textContent = description;

  if (cta && link) {
    const button = link.querySelector('div, span, button');
    if (button) button.textContent = cta;
    else link.textContent = cta;
  }
}

function setCommunityStat(root, label, value) {
  const labels = [...root.querySelectorAll('div')];
  const labelNode = labels.find((node) => node.children.length === 0 && node.textContent?.trim().toUpperCase() === label);
  if (!labelNode) return;
  const container = labelNode.parentElement;
  if (!container) return;
  const values = [...container.children].filter((node) => node !== labelNode && /text-3xl|text-4xl/.test(node.className || ''));
  if (values[0]) values[0].textContent = String(value);
}

function applyLiveData(data, settings) {
  if (typeof document === 'undefined') return undefined;

  const update = (root = document) => {
    const now = Date.now();
    const activeProjects = data.projects.filter((project) => ['Live', 'In Development'].includes(project.status));
    const liveProjects = data.projects.filter((project) => project.status === 'Live');
    const developmentProjects = data.projects.filter((project) => project.status === 'In Development');
    const upcomingEvents = data.events.filter((event) => {
      const timestamp = new Date(event.date).getTime();
      return Number.isFinite(timestamp) && timestamp >= now;
    });
    const publishedNews = data.news.filter((post) => post.published !== false);

    setCard(root, 'SERVERS', {
      cta: plural(data.servers.length, 'ACTIVE'),
      href: '/servers',
      description: `${data.servers.length || 'No'} community server${data.servers.length === 1 ? '' : 's'} currently listed.`,
    });
    setCard(root, 'PROJECTS', {
      cta: plural(activeProjects.length, 'ACTIVE'),
      href: '/projects',
      description: `${liveProjects.length} live and ${developmentProjects.length} in development.`,
    });
    setCard(root, 'EVENTS', {
      cta: plural(upcomingEvents.length, 'UPCOMING'),
      href: '/events',
      description: `${upcomingEvents.length || 'No'} upcoming community event${upcomingEvents.length === 1 ? '' : 's'}.`,
    });
    setCard(root, 'STATS', {
      cta: plural(data.playerStats.length, 'PLAYER'),
      href: '/stats',
      description: `${data.playerStats.length || 'No'} player profile${data.playerStats.length === 1 ? '' : 's'} currently tracked.`,
    });
    setCard(root, 'COMMUNITY', {
      cta: plural(data.playerStats.length, 'MEMBER'),
      href: '/community',
      description: 'A community built on respect, loyalty and shared passion.',
    });
    setCard(root, 'PARTNERS', {
      nextTitle: 'NEWS',
      cta: plural(publishedNews.length, 'POST'),
      href: '/news',
      description: `${publishedNews.length || 'No'} published update${publishedNews.length === 1 ? '' : 's'} from ApexOrder.`,
    });

    setCommunityStat(root, 'YEARS ACTIVE', Math.max(0, new Date().getFullYear() - 2007));
    setCommunityStat(root, 'COMMUNITY MEMBERS', data.playerStats.length);
    setCommunityStat(root, 'SERVERS HOSTED', data.servers.length);
    setCommunityStat(root, 'EVENTS HELD', data.events.length);

    root.querySelectorAll('span').forEach((node) => {
      if (node.textContent?.trim() === 'Online Now') node.textContent = 'Join Community';
    });

    if (settings?.hero_logo_url) {
      root.querySelectorAll('img[alt="ApexOrder Emblem"]').forEach((image) => { image.src = settings.hero_logo_url; });
    }
    if (settings?.hero_background_url) {
      root.querySelectorAll('img[alt=""]').forEach((image) => {
        if (image.style?.position === 'absolute' && image.style?.objectFit === 'cover') image.src = settings.hero_background_url;
      });
    }
    if (settings?.community_image_url) {
      root.querySelectorAll('img[alt="ApexOrder community gathering"]').forEach((image) => { image.src = settings.community_image_url; });
    }
  };

  update();
  const observer = new MutationObserver(() => update());
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export function LiveSiteDataProvider({ children }) {
  const { settings } = useSiteSettings();
  const [data, setData] = useState(DEFAULT_DATA);

  const refresh = async () => {
    const [servers, projects, events, playerStats, news] = await Promise.all([
      base44.entities.Server.list('-sort_order'),
      base44.entities.Project.list('sort_order'),
      base44.entities.Event.list('date'),
      base44.entities.PlayerStat.list('-score'),
      base44.entities.NewsPost.list('-created_date'),
    ]);
    setData({ servers, projects, events, playerStats, news, loading: false });
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => applyLiveData(data, settings), [data, settings]);

  const value = useMemo(() => ({ ...data, refresh }), [data]);
  return <LiveSiteDataContext.Provider value={value}>{children}</LiveSiteDataContext.Provider>;
}

export function useLiveSiteData() {
  return useContext(LiveSiteDataContext);
}
