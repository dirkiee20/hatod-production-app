# Mapbox Integration Setup

To enable Mapbox maps in the Hatod apps (Customer, Rider, Admin), follow these steps:

## 1. Get Mapbox Tokens
1.  Log in to [Mapbox](https://account.mapbox.com/).
2.  **Public Token**: Copy the "Default public token" from your dashboard.
    *   Format: `pk.eyJ...`
3.  **Secret Token**: Click **Create a token**.
    *   Name it "Hatod Android SDK".
    *   **Scopes**: Select only `DOWNLOADS:READ`.
    *   Create and copy the token.
    *   Format: `sk.eyJ...`

## 2. Configure Environment Variables
Create or update the `.env` file in the root of the project (or each app folder):

```bash
# Public Token for the App
EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN=pk.eyJ1...

# Secret Token for Building (Android)
# Note: For local builds, you might need to add this to your ~/.gradle/gradle.properties
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ1...
```

## 3. Configure Android Build (Windows)
For Android builds to succeed on your local machine, you need to configure your global Gradle properties to allow downloading the Mapbox SDK.

1.  Navigate to `C:\Users\Administrator\.gradle\` (create the folder if it doesn't exist).
2.  Create or edit `gradle.properties`.
3.  Add the following lines:

```properties
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ1... (your secret token)
```

## 4. Run Development Build
Mapbox requires native code, so it **will not work in standard Expo Go**. You must run a development build:

```bash
# For Customer App
cd apps/customer-app
npx expo run:android

# For Rider App
cd apps/rider-app
npx expo run:android

# For Admin App
cd apps/admin-app
npx expo run:android
```
