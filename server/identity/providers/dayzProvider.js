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

        return {
          provider: player.steamId ? 'steam' : this.providerName,
          providerId: player.steamId || fallbackProviderId(server.id, displayName),
          displayName,
          profileUrl: player.steamId ? `https://steamcommunity.com/profiles/${player.steamId}` : null,
        };
      })
      .filter(Boolean);

    const reportedCount = Number(status.playersCurrent || 0);
    const complete = reportedCount === 0 || players.length >= reportedCount;
    return { online: true, complete, players, status };
  }
}
