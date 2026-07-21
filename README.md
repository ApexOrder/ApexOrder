# ApexOrder

ApexOrder is a gaming community and self-hosted platform for game servers, community projects, news, events, recruitment and future releases including Apex Bloodlines.

## Stack

- React 18
- Vite 6
- Express
- SQLite via `better-sqlite3`
- Google Identity Services for administrator login
- Tailwind CSS

The project is fully self-hosted and no longer depends on Base44 services.

## Local development

### Requirements

- Node.js 20 or newer
- npm
- A Google OAuth 2.0 Web client

### Install

```bash
git clone https://github.com/ApexOrder/ApexOrder.git
cd ApexOrder
npm install
cp .env.example .env
```

Configure `.env` with your Google client ID and authorised administrator email address.

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

## Google administrator login

Create an OAuth 2.0 client in Google Cloud Console using the **Web application** client type.

Add these authorised JavaScript origins:

```text
http://localhost:5173
https://your-domain.example
```

Then configure the application:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
ADMIN_EMAILS=admin@example.com,second-admin@example.com
SESSION_DAYS=7
```

Only addresses listed in `ADMIN_EMAILS` can create an administrator session. Google ID tokens are verified by the Node backend. Successful sessions are stored in SQLite and issued to the browser using an HTTP-only cookie.

The `/admin` page and all entity create, update and delete API routes require an authenticated administrator session. Public read endpoints remain available to the website.

## Production

Build the frontend:

```bash
npm run build
```

Start the production server:

```bash
NODE_ENV=production npm start
```

The Express server serves both the API and the compiled frontend from `dist`.

Recommended production environment:

```env
NODE_ENV=production
PORT=3001
DATA_DIR=/opt/apexorder-data
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
ADMIN_EMAILS=admin@example.com
SESSION_DAYS=7
```

Use HTTPS in production. Secure admin cookies are enabled when `NODE_ENV=production`, so Google login will not work over plain HTTP in that mode.

Using a separate `DATA_DIR` is recommended so the SQLite database and administrator sessions remain outside the Git checkout.

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

## License

Private community project. All rights reserved by ApexOrder.
