# Hatod Food Delivery Backend

Structured and scalable backend for a mobile-only food delivery platform.

## Features
- **NestJS**: Structured architecture
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and Socket.IO adapter (optional)
- **Socket.IO**: Live order and rider tracking
- **JWT + RBAC**: Secure authentication with role-based access control
- **BullMQ**: Background job processing (requires Redis)
- **Swagger**: API Documentation

### Redis Configuration
Redis is optional for development. To disable Redis:
1. Set `REDIS_ENABLED=false` in your `.env` file
2. The app will start without Redis, but queue features will be disabled

To use Redis:
1. Install and start Redis locally (default port: 6379)
2. Or set `REDIS_HOST` and `REDIS_PORT` in your `.env` file

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (optional - can be disabled by setting `REDIS_ENABLED=false` in `.env`)

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
