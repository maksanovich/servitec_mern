# Servitec — Technical Service and Warranty System

Servitec is a full-stack application for managing technical service workflows, warranties, spare parts, customer orders, and related operations. It combines a public-facing site (landing, blog, order tracking, pre-diagnosis) with a role-based admin area for staff.

This repository is an **npm workspaces monorepo** with a Node.js API and a React single-page app.

---

## What’s in the box

- **Public site** (same dev server as admin): landing page, blog, **order tracking** (`/track`), **pre-diagnosis** (`/diagnosis`).
- **Admin** (`/admin/*`): dashboard, orders (create/edit, stages, movements, print), clients, brands/models, accessories, products, services & spare parts, income, pre-diagnosis rules, company & mail settings, users & roles, internal documentation, and more.
- **Backend**: REST API under `/api`, JWT auth, file uploads served at `/uploads`, health check, scheduled jobs (Perseo sync, delivery reminders).

For the full product specification, see [JD.md](./JD.md).

---

## Repository layout

```
servitec/
├── apps/
│   ├── backend/          # Express API (default port 6190)
│   └── frontend/         # Vite + React: public pages + /admin (default port 6191)
├── JD.md                 # Requirements / product document
└── package.json          # Workspace root (scripts orchestrate backend + frontend)
```

The admin UI is **not** a separate package: it lives under `apps/frontend` and is routed at paths like `/admin`, `/admin/order`, etc.

---

## Prerequisites

- **Node.js** ≥ 18 ([engines](package.json))
- **MongoDB** reachable by the backend (local or remote URI)

Optional integrations (see [Environment variables](#environment-variables)):

- SMTP for transactional email (e.g. order progress)
- Twilio WhatsApp for stage notifications
- Perseo ERP API for hourly client + product sync

---

## Quick start (development)

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Configure the backend

Copy the example env file and edit values:

```bash
copy apps\backend\.env.example apps\backend\.env
```

On macOS/Linux use `cp` instead of `copy`. At minimum, set `MONGO_URI` and a strong `JWT_SECRET` for anything beyond local dev.

### 3. Start MongoDB

Ensure MongoDB is running and matches `MONGO_URI` (default: `mongodb://localhost:27017/servitec`).

### 4. Seed a super-admin user (optional)

If you need a guaranteed admin account before first boot, or the automatic seed did not run:

```bash
npm run seed:admin -w @servitec/backend
```

On startup, the backend also seeds roles and creates the default admin **if it does not already exist** (see [Default admin login](#default-admin-login)).

### 5. Run API + frontend together

```bash
npm run dev
```

Or run workspaces separately:

```bash
npm run backend    # API → http://localhost:6190
npm run frontend   # UI  → http://localhost:6191
```

The Vite dev server **proxies** `/api` and `/uploads` to the backend so the browser can use relative URLs during development.

---

## URLs (development)

| Service    | URL                         | Notes                                      |
|-----------|-----------------------------|--------------------------------------------|
| Frontend  | http://localhost:6191       | Public routes + `/admin`                   |
| Backend   | http://localhost:6190       | REST under `/api`, static uploads `/uploads` |
| Health    | http://localhost:6190/health | JSON status                               |
| API root  | http://localhost:6190/api   | API info / version                         |

---

## Default admin login

After a successful seed (manual or automatic on server start):

- **URL:** http://localhost:6191/admin/login  
- **Email:** `admin@servitec.local`  
- **Password:** `superadmin123`  

Change this user and password in production immediately after deployment.

---

## Environment variables

The backend reads configuration from `apps/backend/.env`. See `apps/backend/.env.example` for all keys. Summary:

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `6190`) |
| `NODE_ENV` | e.g. `development` / `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES` | Token lifetime (e.g. `1h`) |
| `SMTP_*` | Outgoing mail (host, port, user, password, from) |
| `TWILIO_*` | WhatsApp notifications (optional; can disable) |
| `PERSEO_API`, `PERSEO_DATA_C3_APP` | Perseo ERP integration for sync jobs |

The frontend does not require its own `.env` for typical dev: API calls use `/api` and rely on the Vite proxy.

---

## API overview

All JSON routes are mounted under **`/api`**. Main route groups:

| Prefix | Area |
|--------|------|
| `/api/auth` | Login / JWT |
| `/api/clients` | Clients / customers |
| `/api/company` | Company settings |
| `/api/roles`, `/api/users` | RBAC and users |
| `/api/brands`, `/api/models`, `/api/accessories` | Catalog |
| `/api/orders` | Orders |
| `/api/order-movements` | Order movements |
| `/api/order-progress-stages` | Progress stages |
| `/api/order-stage-email-templates` | Email templates for stages |
| `/api/services-spare-parts` | Services & spare parts |
| `/api/spare-server` | Spare server / catalog sync data |
| `/api/uploads` | Upload handling |
| `/api/products` | Products |
| `/api/pre-diagnosis` | Pre-diagnosis rules API |

Uploaded files are exposed by the backend at **`/uploads`** (static). In dev, the frontend proxy forwards `/uploads` to the backend so images work with relative URLs.

---

## Background jobs

When the backend starts, a scheduler registers:

- **Hourly** (at minute 0): Perseo-related sync (clients + SpareServer product data), using `PERSEO_*` env when configured.
- **Daily at 08:00** (timezone from `TZ`, default UTC): delivery pickup reminders and quarantine/abandonment moves.

---

## Production build

**Frontend** (outputs to `apps/frontend/dist`):

```bash
npm run build -w @servitec/frontend
```

Serve `dist` with any static host; configure that host to forward `/api` and `/uploads` to the backend origin, or set the app’s API base URL if you use a different deployment pattern.

**Backend**:

```bash
npm run start -w @servitec/backend
```

Set `NODE_ENV=production`, secure `JWT_SECRET`, and a production `MONGO_URI`. Ensure the process can write to the `uploads` directory if you use file uploads.

### Deploy on a VPS

Step-by-step instructions (Nginx, PM2, MongoDB, TLS, firewall) are in **[docs/DEPLOY-VPS.md](./docs/DEPLOY-VPS.md)**.

---

## Tech stack

- **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB), JWT, Multer, Nodemailer, Twilio, Sharp, PDFKit, Docx, node-cron, etc.
- **Frontend:** React 18, Vite, TypeScript, React Router, Tailwind CSS 4, Sonner, Lucide, Quill, jsPDF, XLSX, etc.

---

## Troubleshooting

- **MongoDB connection errors:** Confirm `MONGO_URI` and that `mongod` (or your cluster) is up.
- **401 on admin API calls:** Log in again at `/admin/login`; tokens are stored for the admin session.
- **Images or uploads 404 in dev:** Run the backend on port 6190 and the frontend dev server so `/uploads` is proxied correctly.

---

## License / project

Private project (`"private": true` in workspace `package.json`). Adjust this section if you publish or open-source the code.
