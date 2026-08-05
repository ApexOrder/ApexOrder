import { BasePlayerProvider } from './baseProvider.js';
import { queryServerStatus } from '../../gameQuery.js';

function clean(value) {
  return String(value || '').trim();
}

function extractSteamId(...values) {
  for (const value of values) {
    const match = clean(value).match(/7656119\d{10}/);
    if (match) return match[0];
  }
  return null;
}

function fallbackProviderId(serverId, player) {
  const stableId = clean(player?.playerId || player?.accountName);
  if (stableId) return stableId;
  return `${serverId}:${clean(player?.name).toLocaleLowerCase('en-GB')}`;
}

export class PalworldPlayerProvider extends BasePlayerProvider {
  constructor() {
    super('palworld');
  }

  supports(server) {
    const text = [server?.query_type, server?.queryType, server?.game, server?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return text.includes('palworld') || text.includes('pal world') || text.includes('apexpals');
  }

  async getOnlinePlayers(server) {
    const status = await queryServerStatus(server, true);
    if (!status?.online) return { online: false, complete: true, players: [], status };

    const players = (Array.isArray(status.players) ? status.players : [])
      .map((player) => {
        const displayName = clean(player?.name || player?.accountName);
        if (!displayName) return null;

        const legacyProviderId = fallbackProviderId(server.id, player);
        const steamId = extractSteamId(
          player?.steamId,
          player?.playerId,
          player?.accountName,
          player?.name,
        );

        return {
          provider: steamId ? 'steam' : this.providerName,
          providerId: steamId || legacyProviderId,
          displayName,
          profileUrl: steamId ? `https://steamcommunity.com/profiles/${steamId}` : null,
          legacyProvider: steamId ? this.providerName : null,
          legacyProviderId: steamId ? legacyProviderId : null,
          metadata: {
            playerId: clean(player?.playerId) || null,
            accountName: clean(player?.accountName) || null,
            level: Number.isFinite(Number(player?.level)) ? Number(player.level) : null,
          },
        };
      })
      .filter(Boolean);

    const reportedCount = Number(status.playersCurrent || 0);
    const complete = reportedCount === 0 || players.length >= reportedCount;
    return { online: true, complete, players, status };
  }
}
