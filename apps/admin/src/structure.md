# Admin Panel Structure

## Roles (from JD)
- Super Administrator
- Administrator
- Cashiers
- Lead Technician
- Outsourced Technician

## Adding New Features

### New Page
1. Create `src/pages/PageName.jsx`
2. Add route in `src/App.jsx`
3. Add nav link in `src/components/Layout.jsx`

### Feature Areas
- Orders
- Areas (Entrance, Maintenance, Outsourced, etc.)
- Reports
- Revenue (Admin/Super Admin only)
- Settings (auto-email, etc.)
- Perseo integration
- Users/Roles

### Folders
- `src/components/` - Reusable components
- `src/pages/` - Page components
- `src/context/` - Auth context, etc.
- `src/api/` - API client
