# Rider App Backend Integration

This document summarizes the changes made to connect the Rider App to the backend API.

## Connected Screens

### 1. Dashboard (`app/(tabs)/index.tsx`)
- **API Endpoints**: 
  - `GET /users/me`: Fetches rider profile (Name, Online Status).
  - `GET /orders`: Fetches recent orders for "Recent Activity" and calculating stats.
- **Features**:
  - Displays real Rider Name.
  - Calculates "Earnings" and "Orders" count from delivered orders.
  - "Online" toggle updates UI (Backend sync pending separate endpoint if state persistence is needed, currently relies on user profile status).
  - "Recent Activity" list shows the last 5 orders.
  - Pull-to-refresh implemented.

### 2. My Deliveries (`app/(tabs)/orders.tsx`)
- **API Endpoints**:
  - `GET /orders`: Fetches full order history.
- **Features**:
  - Lists all assigned/completed orders sorted by date.
  - Shows Merchant Name, Delivery Fee, and Status.
  - Navigates to Order Details.
  - Pull-to-refresh implemented.

### 3. Order Details (`app/order-details/[id].tsx`)
- **API Endpoints**:
  - `GET /orders/:id`: Fetches specific order details.
- **Features**:
  - Shows detailed breakdown: Pickup/Dropoff locations, Customer Name, Merchant Name.
  - Displays Order Items list.
  - Shows Total Earnings (Delivery Fee).

### 4. Account (`app/(tabs)/account.tsx`)
- **API Endpoints**:
  - `GET /users/me`: Fetches profile for avatar, name, vehicle info, and rating.
- **Features**:
  - dynamic Profile Header.
  - Logout functionality (Clears SecureStore and redirects to Login).

## Services
- **API Service**: Uses `axios` with interceptors for JWT injection from `SecureStore` and auto-logout on 401.

## UI Components
- Updated `IconSymbol` to support `fees` (mapped to `attach-money` icon).

## Next Steps
- Implement **Distance Calculation**: Backend needs to provide distance or coordinates for client-side calculation.
- **Real-time Updates**: Integrate Socket.io for live order assignments and status updates without refreshing.
- **Status Toggle**: Connect the online/offline switch to a backend endpoint (e.g., `PATCH /riders/status`).
