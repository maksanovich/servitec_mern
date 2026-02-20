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

# Run all apps
npm run dev

# Or run individually
npm run backend   # http://localhost:6190
npm run frontend  # http://localhost:6191
npm run admin     # http://localhost:6192
```

## Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React (landing, blog, track)
- **Admin**: React (admin panel)

See [JD.md](./JD.md) for full requirements.
