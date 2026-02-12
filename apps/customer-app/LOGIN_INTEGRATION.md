# Customer Login Integration Summary

## Overview
Implemented phone number login for the Customer App. The app now starts with a login screen asking for credentials instead of auto-logging in.

## Changes

### 1. Backend Updates
- **`auth.service.ts`**: Updated `login` method to accept either `email` or `phone`.
- **`dto/auth.dto.ts`**: Updated `LoginDto` to make `email` optional and add `phone`.
- **`prisma/seed.ts`**: Updated default customer user to include phone number: `+639123456789`.

### 2. Customer App Updates
- **`app/login.tsx`**: Created new Login Screen with phone and password inputs.
- **`app/index.tsx`**: Created root index to check authentication and redirect to `/login` or `/(tabs)`.
- **`app/_layout.tsx`**: Registered `login` route and hid the header.
- **`api/client.ts`**: 
  - Removed hardcoded auto-login credentials.
  - Added `login(phone, password)` function.
  - Added `logout()` function.
- **`components/ui/icon-symbol.tsx`**: Added mappings for `phone` and `lock.fill` icons.

## How to Test

1. **Restart Backend** (to apply DTO/Service changes):
   ```bash
   cd backend
   npm start
   ```

2. **Restart Customer App**:
   ```bash
   cd apps/customer-app
   npm start
   ```

3. **Login Flow**:
   - App should open to **Login Screen**.
   - Enter Phone: `+639123456789`
   - Enter Password: `password123`
   - Click **Login**.
   - Should redirect to **Food Tab**.

## Notes
- To test validation, try empty fields or wrong password.
- Current session is not persisted across app restarts (requires AsyncStorage implementation in future).
