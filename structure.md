# Servitec - Project Structure

## Monorepo Layout

```
servitec/
├── apps/
│   ├── backend/           # API (port 6190)
│   │   └── src/
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── db/
│   │       ├── middleware/
│   │       ├── models/
│   │       ├── routes/
│   │       ├── services/
│   │       └── utils/
│   ├── frontend/          # Public site (port 6191)
│   │   └── src/
│   │       ├── pages/     # Landing, Blog, Track
│   │       └── components/
│   └── admin/             # Admin panel (port 6192)
│       └── src/
│           ├── pages/
│           └── components/
├── JD.md                  # Requirements
├── package.json           # Workspace root
└── structure.md           # This file
```

## Adding New Features

### Backend
1. Add model in `apps/backend/src/models/`
2. Add service in `apps/backend/src/services/`
3. Add controller in `apps/backend/src/controllers/`
4. Add routes in `apps/backend/src/routes/`
5. Register routes in `apps/backend/src/routes/index.js`

### Frontend (Public)
- No auth. Add pages in `apps/frontend/src/pages/`
- Track page uses track number only

### Admin
- Add pages in `apps/admin/src/pages/`
- Add nav in `apps/admin/src/components/Layout.jsx`
- Auth/roles to be implemented

## Ports
- Backend: 6190
- Frontend: 6191
- Admin: 6192
