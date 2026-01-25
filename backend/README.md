# Hatod Food Delivery Backend

Structured and scalable backend for a mobile-only food delivery platform.

## Features
- **NestJS**: Structured architecture
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and Socket.IO adapter
- **Socket.IO**: Live order and rider tracking
- **JWT + RBAC**: Secure authentication with role-based access control
- **BullMQ**: Background job processing
- **Swagger**: API Documentation

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis

### 2. Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your local DB and Redis credentials
```

### 3. Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data (Admin, Merchant, Customer, Rider)
npm run prisma:seed
```

### 4. Running the App
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation
Once the server is running, visit:
`http://localhost:3000/api/docs`

## User Roles
The app supports 4 roles:
- `CUSTOMER`: Ordering and tracking
- `MERCHANT`: Menu management and order fulfillment
- `RIDER`: Delivery management
- `ADMIN`: Platform administration

## Testing with Postman/Insomnia
1. Use `POST /auth/register` to create a user.
2. Use `POST /auth/login` to get a JWT token.
3. Include the token in the `Authorization: Bearer <token>` header for protected routes.
