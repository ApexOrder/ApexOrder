import { BasePlayerProvider } from './baseProvider.js';
import { queryServerStatus } from '../../gameQuery.js';

function normaliseName(value) {
  return String(value || '').trim();
}

function fallbackProviderId(serverId, playerName) {
  return `${serverId}:${playerName.toLocaleLowerCase('en-GB')}`;
}

export class DayZPlayerProvider extends BasePlayerProvider {
  constructor() {
    super('dayz');
  }

  supports(server) {
    const queryType = String(server?.query_type || server?.queryType || '').trim().toLowerCase();
    const game = String(server?.game || server?.game_type || server?.gameType || '').trim().toLowerCase();
    return queryType === 'dayz' || game === 'dayz' || game.includes('dayz');
  }

  async getOnlinePlayers(server) {
    const status = await queryServerStatus(server, true);
    if (!status?.online) return { online: false, complete: true, players: [], status };

    const players = (Array.isArray(status.players) ? status.players : [])
      .map((player) => {
        const displayName = normaliseName(player?.name);
        if (!displayName) return null;

        const battleyeGuid = String(player?.guid || '').trim();
        const steamId = String(player?.steamId || '').trim();
        const provider = battleyeGuid ? 'battleye' : steamId ? 'steam' : this.providerName;
        const providerId = battleyeGuid || steamId || fallbackProviderId(server.id, displayName);

        return {
          provider,
          providerId,
          identityId: battleyeGuid || null,
          displayName,
          profileUrl: steamId ? `https://steamcommunity.com/profiles/${steamId}` : null,
        };
      })
      .filter(Boolean);

    const reportedCount = Number(status.playersCurrent || 0);
    const complete = reportedCount === 0 || players.length >= reportedCount;
    return { online: true, complete, players, status };
  }
}
