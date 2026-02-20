# Frontend Structure

## Pages
- **LandingPage** (`/`) - Landing design to be provided later
- **BlogPage** (`/blog`) - Public problems/solutions, SEO
- **TrackPage** (`/track`) - Track by number, no auth

## Adding New Features

### New Page
1. Create `src/pages/PageName.jsx`
2. Add route in `src/App.jsx`

### Components
- `src/components/` - Reusable UI components

### API Calls
- `src/api/` or `src/services/` - API client helpers

### No Auth
- This app has no authentication
- Track page uses track number only
