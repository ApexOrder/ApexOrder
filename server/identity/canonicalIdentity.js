const STEAM_ID_64 = /7656119\d{10}/;

function clean(value) {
  return String(value ?? '').trim();
}

function findSteamId(value, depth = 0, seen = new Set()) {
  if (depth > 5 || value === null || value === undefined) return null;

  if (typeof value === 'string' || typeof value === 'number') {
    return clean(value).match(STEAM_ID_64)?.[0] || null;
  }

  if (typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSteamId(item, depth + 1, seen);
      if (found) return found;
    }
    return null;
  }

  const preferredKeys = [
    'steamId', 'steamID', 'steamid', 'steam_id', 'steamId64', 'steamID64',
    'steamid64', 'steam_id_64', 'communityId', 'communityID', 'providerId',
    'accountName', 'playerId', 'profileUrl', 'identifiers', 'metadata',
  ];

  for (const key of preferredKeys) {
    if (!(key in value)) continue;
    const found = findSteamId(value[key], depth + 1, seen);
    if (found) return found;
  }

  for (const nested of Object.values(value)) {
    const found = findSteamId(nested, depth + 1, seen);
    if (found) return found;
  }

  return null;
}

export function canonicalisePlayerIdentity(player) {
  const originalProvider = clean(player?.provider).toLowerCase();
  const originalProviderId = clean(player?.providerId);
  const steamId = findSteamId(player);

  if (!steamId) {
    return {
      ...player,
      provider: originalProvider,
      providerId: originalProviderId,
      legacyProvider: clean(player?.legacyProvider).toLowerCase() || null,
      legacyProviderId: clean(player?.legacyProviderId) || null,
      canonicalType: originalProvider,
      canonicalId: originalProviderId,
    };
  }

  return {
    ...player,
    provider: 'steam',
    providerId: steamId,
    profileUrl: player?.profileUrl || `https://steamcommunity.com/profiles/${steamId}`,
    legacyProvider: originalProvider !== 'steam' ? originalProvider : clean(player?.legacyProvider).toLowerCase() || null,
    legacyProviderId: originalProvider !== 'steam' ? originalProviderId : clean(player?.legacyProviderId) || null,
    canonicalType: 'steam',
    canonicalId: steamId,
  };
}

export function rowMatchesCanonicalIdentity(row, canonicalType, canonicalId) {
  if (!row || !canonicalType || !canonicalId) return false;
  if (clean(row.provider).toLowerCase() === canonicalType && clean(row.provider_id) === canonicalId) return true;
  if (canonicalType !== 'steam') return false;
  return findSteamId({
    providerId: row.provider_id,
    profileUrl: row.profile_url,
    displayName: row.display_name,
  }) === canonicalId;
}
