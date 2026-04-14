# Deploy Servitec on a VPS

This guide assumes a **Linux VPS** (Ubuntu 22.04 LTS or Debian 12 are common choices), a public domain or IP, and that you deploy **MongoDB** either on the same machine or as a managed service (e.g. MongoDB Atlas).

The app is a **monorepo**: Node.js backend (Express) + Vite/React SPA. The frontend calls the API with **relative URLs** (`/api`, `/uploads`), so in production you should put **Nginx (or similar)** in front: serve the built static files and **proxy** `/api` and `/uploads` to the backend.

---

## 1. What you will run

| Piece | Role |
|--------|------|
| **MongoDB** | Database (`MONGO_URI` in backend `.env`) |
| **Node.js** | Backend on a loopback port (default **6190**), `0.0.0.0` |
| **Nginx** | HTTPS, static files from `apps/frontend/dist`, reverse proxy to Node |
| **Process manager** | **PM2** or **systemd** so the API restarts on reboot |

Optional: **Certbot** for free TLS certificates.

---

## 2. Server prerequisites

- **Node.js** ≥ 18 ([`engines` in root `package.json`](../../package.json))
- **npm** (comes with Node)
- **Git**
- **Nginx** (recommended) or another reverse proxy
- **MongoDB** 6.x+ *or* a cloud URI

Firewall: open **22** (SSH), **80** and **443** (HTTP/HTTPS). Do **not** expose the backend port **6190** publicly if Nginx proxies to `127.0.0.1:6190`.

---

## 3. Install MongoDB

**Option A — MongoDB on the VPS**

Follow the official install for your distro, enable and start `mongod`, and create a database user if you do not bind only to localhost.

**Option B — MongoDB Atlas (or other hosted)**

Create a cluster, allow your VPS IP in the network allowlist, and copy the SRV connection string.

Set `MONGO_URI` in `apps/backend/.env` accordingly, for example:

- Local: `mongodb://127.0.0.1:27017/servitec`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/servitec?...`

---

## 4. Deploy the application code

Example: app lives at `/var/www/servitec` and runs as user `deploy`.

```bash
sudo mkdir -p /var/www/servitec
sudo chown deploy:deploy /var/www/servitec
cd /var/www/servitec
git clone <your-repo-url> .
```

### 4.1 Environment file

```bash
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env   # or vim
```

Set at least:

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `6190` (or another port; keep Nginx in sync) |
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Long random string; **never commit** |
| `JWT_EXPIRES` | e.g. `1h` |
| `SMTP_*` | If you use email for order progress |
| `TWILIO_*` | Optional WhatsApp |
| `PERSEO_*` | Optional ERP sync |
| `TZ` | Timezone for cron jobs (e.g. `Europe/Madrid`); defaults to UTC if unset |

The backend loads `.env` from `apps/backend` when started with `process.cwd()` under that app (see below — always start the backend from `apps/backend` or ensure cwd is correct).

### 4.2 Install dependencies and build

From the **repository root**:

```bash
npm install
npm run build -w @servitec/frontend
```

**Why `npm install` (not only production)?** The backend `start` script runs the API with **`tsx`**, which is currently a **devDependency**. A plain `npm install --omit=dev` would omit `tsx` and break `npm start`. Either install all dependencies as above, or move `tsx` to `dependencies` in `apps/backend/package.json` if you want a lean production install later.

### 4.3 Uploads directory

The API stores uploads under `uploads/` relative to the backend working directory (typically `apps/backend/uploads`). Ensure the process user can write there:

```bash
mkdir -p apps/backend/uploads
chmod 755 apps/backend/uploads
```

Back up this folder with your normal backup strategy.

---

## 5. Run the backend

Always run the backend with working directory `apps/backend` so uploads and `.env` resolve correctly:

```bash
cd /var/www/servitec/apps/backend
NODE_ENV=production npm start
```

Verify:

```bash
curl -s http://127.0.0.1:6190/health
```

You should see JSON like `{"status":"ok",...}`.

---

## 6. Process manager (PM2)

Install PM2 globally: `sudo npm install -g pm2`.

From repo root, an example **ecosystem** file `ecosystem.config.cjs` (adjust paths/user):

```javascript
module.exports = {
  apps: [
    {
      name: 'servitec-api',
      cwd: '/var/www/servitec/apps/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

```bash
cd /var/www/servitec
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command for systemd enable
```

---

## 7. Nginx: static SPA + API proxy

Point `root` to the Vite build output and forward API and uploads to Node.

Replace `servitec.example.com` and paths with yours.

```nginx
server {
    listen 80;
    server_name servitec.example.com;

    root /var/www/servitec/apps/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:6190;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25m;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:6190;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://127.0.0.1:6190/health;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site, test config, reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### HTTPS (Let’s Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d servitec.example.com
```

Certbot will adjust the server block for TLS.

---

## 8. After deployment

1. **Change the default admin** if you used the seeded account (`admin@servitec.local` / documented in [README](../README.md)); set a strong password in **Admin → Users** or the database.
2. **Smoke-test**: open `/`, `/track`, `/admin/login`, create a test order, upload an image, confirm `/uploads/...` loads.
3. **Monitor**: `pm2 logs servitec-api`, Nginx error log, and disk space for `uploads/` and MongoDB.

---

## 9. Updates (redeploy)

```bash
cd /var/www/servitec
git pull
npm install
npm run build -w @servitec/frontend
pm2 restart servitec-api
```

Run database migrations only if the project adds them in the future (currently Mongoose models evolve with the app; backup before major upgrades).

---

## 10. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| 502 from Nginx | Is PM2 running? `curl http://127.0.0.1:6190/health`. Wrong `PORT` in `.env`? |
| MongoDB errors | `MONGO_URI`, firewall to Atlas, `mongod` running locally |
| 401 on admin | Cookie/session; log in again; `JWT_SECRET` unchanged since tokens were issued |
| Uploads 404 | Backend cwd is `apps/backend`; `uploads/` exists and is readable; Nginx `/uploads` proxy |
| Blank SPA routes | `try_files ... /index.html` for client-side routing |
| Cron at wrong time | Set `TZ` in the environment for the PM2/systemd process |

---

## 11. Security checklist

- Strong `JWT_SECRET`, unique per environment
- No public exposure of MongoDB port unless strictly firewalled
- SSH keys, disable password login if possible
- Keep system packages and Node dependencies updated
- Restrict file permissions on `apps/backend/.env` (e.g. `chmod 600`)

This matches the architecture described in the [README](../README.md): production build of the frontend, `NODE_ENV=production` for the API, and a reverse proxy that preserves **same-origin** `/api` and `/uploads` for the browser.
