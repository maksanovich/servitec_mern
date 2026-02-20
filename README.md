# Servitec - Technical Service and Warranty System

Monorepo for the technical service and warranty management system.

## Structure

```
servitec/
├── apps/
│   ├── backend/     # Express API (port 6190)
│   ├── frontend/    # Public site: landing, blog, track (port 6191)
│   └── admin/       # Admin panel (port 6192)
├── JD.md            # Full requirements document
└── package.json     # Workspace root
```

## Quick Start

```bash
# Install all dependencies
npm install

# Seed admin user (backend must have MongoDB running)
npm run seed:admin -w @servitec/backend

# Run all apps
npm run dev

# Or run individually
npm run backend   # http://localhost:6190
npm run frontend  # http://localhost:6191
npm run admin     # http://localhost:6192
```

### Admin Login
- URL: http://localhost:6192
- Email: `admin@servitec.local`
- Password: `admin123`

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, Vite, TypeScript, Tailwind CSS (landing, blog, track)
- **Admin**: React, Vite, TypeScript (admin panel)

See [JD.md](./JD.md) for full requirements.
