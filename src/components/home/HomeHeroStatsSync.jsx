import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

function formatCount(count, singular, plural = `${singular}S`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function findCard(title) {
  const heading = Array.from(document.querySelectorAll('h3')).find(
    (element) => element.textContent?.trim().toUpperCase() === title
  );
  return heading ? { heading, card: heading.closest('.group') } : null;
}

function updateHeroCard(title, { value, description, nextTitle, href }) {
  const result = findCard(title);
  if (!result?.card) return;
  const { heading, card } = result;

  if (nextTitle) heading.textContent = nextTitle;
  const paragraph = card.querySelector('p');
  if (paragraph && description) paragraph.textContent = description;

  const link = Array.from(card.querySelectorAll('a')).find((item) => item.querySelector('div'));
  if (!link) return;
  if (href) link.setAttribute('href', href);
  const cta = link.querySelector('div');
  if (cta && value) cta.textContent = value;
}

function updateCommunityStat(label, value) {
  const labelNode = Array.from(document.querySelectorAll('div')).find(
    (element) => element.children.length === 0 && element.textContent?.trim().toUpperCase() === label
  );
  const container = labelNode?.parentElement;
  if (!container) return;
  const valueNode = Array.from(container.children).find((element) =>
    String(element.className || '').includes('text-3xl')
  );
  if (valueNode) valueNode.textContent = String(value);
}

function updateFooterServers(servers) {
  const heading = Array.from(document.querySelectorAll('h4')).find(
    (element) => element.textContent?.trim().toUpperCase() === 'SERVERS'
  );
  const list = heading?.parentElement?.querySelector('ul');
  if (!list) return;

  list.replaceChildren(...servers.slice(0, 5).map((server) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '/servers';
    link.className = 'text-muted-foreground hover:text-emerald-glow text-sm transition-colors';
    link.textContent = server.name || 'Unnamed Server';
    item.appendChild(link);
    return item;
  }));

  if (!servers.length) {
    const item = document.createElement('li');
    item.className = 'text-muted-foreground text-sm';
    item.textContent = 'No servers listed';
    list.appendChild(item);
  }
}

export default function HomeHeroStatsSync() {
  const location = useLocation();
  const { settings } = useSiteSettings();

  useEffect(() => {
    let cancelled = false;
    let observer;

    const loadStats = async () => {
      const [servers, projects, events, players, news] = await Promise.all([
        base44.entities.Server.list('sort_order'),
        base44.entities.Project.list('sort_order'),
        base44.entities.Event.list('date'),
        base44.entities.PlayerStat.list('-score'),
        base44.entities.NewsPost.list('-created_date'),
      ]);

      if (cancelled) return;

      const activeProjects = projects.filter((project) =>
        ['live', 'in development'].includes(String(project.status || '').toLowerCase())
      );
      const liveProjects = projects.filter((project) => String(project.status || '').toLowerCase() === 'live');
      const developmentProjects = projects.filter((project) => String(project.status || '').toLowerCase() === 'in development');
      const now = Date.now();
      const upcomingEvents = events.filter((event) => {
        const date = new Date(event.date || event.start_date || event.start_time || 0).getTime();
        return Number.isFinite(date) && date >= now;
      });
      const publishedNews = news.filter((post) => post.published !== false);

      const apply = () => {
        updateHeroCard('SERVERS', {
          value: formatCount(servers.length, 'ACTIVE SERVER', 'ACTIVE SERVERS'),
          description: `${servers.length || 'No'} community server${servers.length === 1 ? '' : 's'} currently listed.`,
          href: '/servers',
        });
        updateHeroCard('PROJECTS', {
          value: formatCount(activeProjects.length, 'ACTIVE PROJECT', 'ACTIVE PROJECTS'),
          description: `${liveProjects.length} live and ${developmentProjects.length} in development.`,
          href: '/projects',
        });
        updateHeroCard('EVENTS', {
          value: formatCount(upcomingEvents.length, 'UPCOMING EVENT', 'UPCOMING EVENTS'),
          description: `${upcomingEvents.length || 'No'} upcoming community event${upcomingEvents.length === 1 ? '' : 's'}.`,
          href: '/events',
        });
        updateHeroCard('STATS', {
          value: formatCount(players.length, 'TRACKED PLAYER', 'TRACKED PLAYERS'),
          description: `${players.length || 'No'} player profile${players.length === 1 ? '' : 's'} currently tracked.`,
          href: '/stats',
        });
        updateHeroCard('COMMUNITY', {
          value: formatCount(players.length, 'MEMBER'),
          href: '/community',
        });
        updateHeroCard('PARTNERS', {
          nextTitle: 'NEWS',
          value: formatCount(publishedNews.length, 'POST'),
          description: `${publishedNews.length || 'No'} published ApexOrder update${publishedNews.length === 1 ? '' : 's'}.`,
          href: '/news',
        });

        updateCommunityStat('YEARS ACTIVE', Math.max(0, new Date().getFullYear() - 2007));
        updateCommunityStat('COMMUNITY MEMBERS', players.length);
        updateCommunityStat('SERVERS HOSTED', servers.length);
        updateCommunityStat('EVENTS HELD', events.length);
        updateFooterServers(servers);

        document.querySelectorAll('span').forEach((element) => {
          if (element.textContent?.trim() === 'Online Now') element.textContent = 'Join Community';
        });

        if (settings?.hero_logo_url) {
          document.querySelectorAll('img[alt="ApexOrder Emblem"]').forEach((image) => { image.src = settings.hero_logo_url; });
        }
        if (settings?.hero_background_url) {
          document.querySelectorAll('img[alt=""]').forEach((image) => {
            if (image.style?.objectFit === 'cover') image.src = settings.hero_background_url;
          });
        }
        if (settings?.community_image_url) {
          document.querySelectorAll('img[alt="ApexOrder community gathering"]').forEach((image) => { image.src = settings.community_image_url; });
        }
      };

      apply();
      observer = new MutationObserver(apply);
      observer.observe(document.body, { childList: true, subtree: true });
    };

    loadStats().catch((error) => {
      console.warn('[Site data] Unable to load live website statistics.', error);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [location.pathname, settings]);

  return null;
}
