import { BasePlayerProvider } from './baseProvider.js';
import { queryServerStatus } from '../../gameQuery.js';

function normaliseName(value) {
  return String(value || '').trim();
}

function fallbackProviderId(serverId, playerName) {
  return `${serverId}:${playerName.toLocaleLowerCase('en-GB')}`;
}

export class SevenDaysToDiePlayerProvider extends BasePlayerProvider {
  constructor() {
    super('7dtd');
  }

  supports(server) {
    const queryType = String(server?.query_type || server?.queryType || '').trim().toLowerCase();
    const game = String(server?.game || server?.game_type || server?.gameType || '').trim().toLowerCase();
    return queryType === 'protocol-valve' && (game.includes('7 days') || game.includes('7dtd') || game === '');
  }

  async getOnlinePlayers(server) {
    const status = await queryServerStatus(server, true);
    if (!status?.online) return { online: false, players: [], status };

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

    return { online: true, players, status };
  }
}
