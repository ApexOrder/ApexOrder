# ApexOrder

ApexOrder is a gaming community and self-hosted platform for game servers, community projects, news, events, recruitment and future releases including Apex Bloodlines.

## Stack

- React 18
- Vite 6
- Express
- SQLite via `better-sqlite3`
- Tailwind CSS

The project is fully self-hosted and no longer depends on Base44 services.

## Local development

### Requirements

- Node.js 20 or newer
- npm

### Install

```bash
git clone https://github.com/ApexOrder/ApexOrder.git
cd ApexOrder
npm install
```

### Run the API

```bash
npm run dev:server
```

The API runs on `http://localhost:3001` and stores data in:

```text
data/apexorder.sqlite
```

### Run the frontend

Open a second terminal and run:

```bash
npm run dev
```

Vite runs on `http://localhost:5173` and proxies `/api` requests to the local Express server.

## Production

Build the frontend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The Express server serves both the API and the compiled frontend from `dist`.

Optional environment variables:

```text
PORT=3001
DATA_DIR=/opt/apexorder-data
```

Using a separate `DATA_DIR` is recommended in production so the SQLite database remains outside the Git checkout.

## Updating a server deployment

```bash
cd /path/to/ApexOrder
git pull origin main
npm install
npm run build
sudo systemctl restart apexorder
```

Adjust the final command if the site is managed by PM2, Docker or another process manager.

## Data and backups

The SQLite database is intentionally excluded from Git. Back up the database file and its WAL files while the application is stopped, or use SQLite's online backup tooling.

## Security note

The current frontend authentication compatibility layer is intended for the existing site migration. Before public admin access is exposed, replace it with server-side authentication and restrict the admin routes behind HTTPS.

## License

Private community project. All rights reserved by ApexOrder.
