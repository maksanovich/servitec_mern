# Backend Structure

## Adding New Features

### 1. Create Model (if needed)
```
src/models/FeatureName.js
```
- Define Mongoose schema
- Export model

### 2. Create Controller
```
src/controllers/featureNameController.js
```
- Handle request/response
- Call service layer

### 3. Create Service
```
src/services/featureNameService.js
```
- Business logic
- Database operations

### 4. Create Routes
```
src/routes/featureNameRoutes.js
```
- Define endpoints
- Apply middleware (auth, validation)

### 5. Register in routes/index.js
```js
import featureNameRoutes from './featureNameRoutes.js';
apiRouter.use('/feature-name', featureNameRoutes);
```

## Folder Structure
```
src/
├── config/       # Configuration
├── db/           # Database connection
├── middleware/   # Auth, validation, etc.
├── models/       # Mongoose models
├── routes/       # API routes
├── services/     # Business logic
└── utils/        # Helpers
```
