# Android Release Signing

For Play Store uploads, never sign `release` with the debug keystore.

## Required Gradle properties

Set these in `~/.gradle/gradle.properties` (recommended) or pass them via `-P` flags:

```properties
HATOD_UPLOAD_STORE_FILE=C:\\path\\to\\upload-keystore.jks
HATOD_UPLOAD_STORE_PASSWORD=your-store-password
HATOD_UPLOAD_KEY_ALIAS=your-key-alias
HATOD_UPLOAD_KEY_PASSWORD=your-key-password
```

## Build command

```bash
cd apps/customer-app/android
./gradlew bundleRelease
```

If any `HATOD_UPLOAD_*` property is missing, release build should fail fast.
