# Customer Tracking Integration Summary

## Overview
Implemented real-time ride tracking in the Customer App using Mapbox. The order tracking screen now displays a dynamic map with markers for the customer, rider, and restaurant.

## Changes

### 1. Map Integration (`app/order-tracking.tsx`)
- **Mapbox Implementation**: Replaced the static placeholder with `@rnmapbox/maps`.
- **Rider Animation**: Map updates as the order status changes (simulated for now).
- **Markers**: Added custom markers for:
  - **Customer**: Pin pointing to delivery location (`120.9850, 14.6010`).
  - **Rider**: Dynamic location marker with avatar/icon (`120.9842, 14.5995`).
  - **Restaurant**: Merchant location marker (`120.9842, 14.5995`).
- **Camera**: Auto-centers on the customer location with zoom level 15.

### 2. Configuration (`.env`)
- Added `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` for Mapbox authentication.

### 3. Components (`components/ui/icon-symbol.tsx`)
- Updated `IconSymbol` typings to support custom keys (e.g., 'food', 'phone') allowing more flexible icon usage across the app.

## How to Test

1. **Rebuild Native App**: Since `@rnmapbox/maps` includes native code, a new development build is usually required if not using Expo Go with config plugin support pre-loaded (though Expo Go *does not* support Mapbox natively without custom dev client usually). 
   - **NOTE**: Mapbox requires a custom Development Client or a native build (`npx expo run:android`). **It will likely NOT work in standard Expo Go.**
   
2. **Navigate to Tracking**:
   - Create an order or navigate to `/order-tracking`.
   - Observe the map loading (if token is valid and build is correct).
   - "Finding Rider" status shows standard UI.
   - After 4 seconds, "Rider Found" status appears, revealing the rider marker on the map.

## Important Note on Mapbox
- Mapbox is a native module. **It will not work in the standard Expo Go app.**
- You must create a **Development Build**:
  ```bash
  npx expo run:android
  ```
  or
  ```bash
  eas build --profile development --platform android
  ```
