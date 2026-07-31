# 7DTD telemetry receiver

The receiver accepts signed batches from the `ApexOrder/ApexTelemetry` dedicated-server mod and stores events and player totals in the main ApexOrder SQLite database.

## Environment

```bash
TELEMETRY_PORT=3002
TELEMETRY_MAX_CLOCK_SKEW_SECONDS=300
TELEMETRY_KEYS_JSON='{"apex-7dtd-main":"replace-with-a-long-random-secret"}'
```

The key in `TELEMETRY_KEYS_JSON` must match `serverId` in the mod configuration. The value must match the mod's `apiKey`.

Generate a suitable secret with:

```bash
openssl rand -hex 32
```

## Run with PM2

```bash
cd /var/www/apexorder
npm install
pm2 start npm --name apexorder-telemetry -- run start:telemetry
pm2 save
```

The service binds to `127.0.0.1:3002`.

## Nginx

Proxy only the required paths from the public ApexOrder host:

```nginx
location = /api/telemetry/v1/events {
    proxy_pass http://127.0.0.1:3002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location = /api/leaderboards/7dtd {
    proxy_pass http://127.0.0.1:3002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Reload Nginx after validating the configuration:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Collector configuration

```json
{
  "enabled": true,
  "serverId": "apex-7dtd-main",
  "endpoint": "https://apexorder.uk/api/telemetry/v1/events",
  "apiKey": "replace-with-the-same-long-random-secret",
  "flushIntervalSeconds": 10,
  "maxBatchSize": 100,
  "requestTimeoutSeconds": 10
}
```

## Endpoints

- `POST /api/telemetry/v1/events` — HMAC-authenticated ingestion
- `GET /api/leaderboards/7dtd?limit=25` — public aggregated leaderboard data
- `GET /health` — local service health check

Requests are signed as HMAC-SHA256 over:

```text
<unix timestamp>.<exact JSON request body>
```

using these headers:

- `X-Apex-Server`
- `X-Apex-Timestamp`
- `X-Apex-Signature`

Duplicate event IDs are ignored, preventing retry batches from incrementing totals twice.
