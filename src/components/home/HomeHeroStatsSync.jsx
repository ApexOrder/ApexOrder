import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

function formatCount(count, singular, plural = `${singular}S`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function updateHeroCard(title, value) {
  const headings = Array.from(document.querySelectorAll('h3'));
  const heading = headings.find((element) => element.textContent?.trim().toUpperCase() === title);
  if (!heading) return false;

  const card = heading.closest('.group');
  if (!card) return false;

  const links = Array.from(card.querySelectorAll('a'));
  const cta = links.find((link) => link.querySelector('div'))?.querySelector('div');
  if (!cta) return false;

  cta.textContent = value;
  return true;
}

export default function HomeHeroStatsSync() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') return undefined;

    let cancelled = false;
    let observer;

    const loadStats = async () => {
      const [servers, projects, events] = await Promise.all([
        base44.entities.Server.list('sort_order'),
        base44.entities.Project.list('sort_order'),
        base44.entities.Event.list('date'),
      ]);

      if (cancelled) return;

      const activeServers = servers.filter((server) => server.amp_enabled === true).length;
      const activeProjects = projects.filter((project) => ['live', 'in development'].includes(String(project.status || '').toLowerCase())).length;
      const now = Date.now();
      const upcomingEvents = events.filter((event) => {
        const date = new Date(event.date || event.start_date || event.start_time || 0).getTime();
        return Number.isFinite(date) && date >= now;
      }).length;

      const apply = () => {
        updateHeroCard('SERVERS', formatCount(activeServers, 'ACTIVE SERVER', 'ACTIVE SERVERS'));
        updateHeroCard('PROJECTS', formatCount(activeProjects, 'ACTIVE PROJECT', 'ACTIVE PROJECTS'));
        updateHeroCard('EVENTS', formatCount(upcomingEvents, 'UPCOMING EVENT', 'UPCOMING EVENTS'));
      };

      apply();
      observer = new MutationObserver(apply);
      observer.observe(document.body, { childList: true, subtree: true });
    };

    loadStats().catch((error) => {
      console.warn('[Home] Unable to load live hero statistics.', error);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [location.pathname]);

  return null;
}
