export function initialiseIdentitySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apex_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT,
      email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_identities (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES apex_users(id) ON DELETE SET NULL,
      UNIQUE (provider, provider_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_identities_user ON user_identities (user_id);

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      identity_id TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      profile_url TEXT,
      country_code TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (identity_id) REFERENCES user_identities(id) ON DELETE SET NULL,
      UNIQUE (provider, provider_id)
    );
    CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players (last_seen_at DESC);
    CREATE INDEX IF NOT EXISTS idx_players_display_name ON players (display_name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_players_identity ON players (identity_id);

    CREATE TABLE IF NOT EXISTS player_sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      connected_at TEXT NOT NULL,
      disconnected_at TEXT,
      duration_seconds INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_player_sessions_player_connected ON player_sessions (player_id, connected_at DESC);
    CREATE INDEX IF NOT EXISTS idx_player_sessions_server_connected ON player_sessions (server_id, connected_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_player_sessions_open
      ON player_sessions (player_id, server_id)
      WHERE disconnected_at IS NULL;
  `);
}
