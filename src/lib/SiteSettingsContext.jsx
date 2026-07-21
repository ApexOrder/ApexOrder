import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_SETTINGS = {
  id: 'global',
  discord_url: 'https://discord.gg/apexorder',
};

const SiteSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
});

function applyDiscordUrl(discordUrl) {
  if (!discordUrl || typeof document === 'undefined') return;

  const updateLinks = (root = document) => {
    root.querySelectorAll?.('a[href*="discord.gg"], a[href*="discord.com/invite"], a[data-discord-link]').forEach((link) => {
      link.href = discordUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  };

  updateLinks();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.('a[href*="discord.gg"], a[href*="discord.com/invite"], a[data-discord-link]')) {
          node.href = discordUrl;
          node.target = '_blank';
          node.rel = 'noopener noreferrer';
        }
        updateLinks(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    const record = await base44.entities.SiteSetting.get('global');
    setSettings(record ? { ...DEFAULT_SETTINGS, ...record } : DEFAULT_SETTINGS);
    setLoading(false);
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => applyDiscordUrl(settings.discord_url), [settings.discord_url]);

  const value = useMemo(() => ({ settings, loading, refreshSettings }), [settings, loading]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
