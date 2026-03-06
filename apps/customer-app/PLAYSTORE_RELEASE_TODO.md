# Customer App Play Store Release TODO

## P0 - Must complete before submission
- [x] Remove cleartext traffic from release Android config.
- [x] Remove unnecessary dangerous permissions from release manifest.
- [x] Stop using debug keystore for `release` builds; require upload keystore properties.
- [x] Add backend endpoint for in-app account deletion/deactivation (`DELETE /users/me`).
- [x] Add app-side "Delete Account" flow in Account screen.
- [x] Reduce sensitive production logging in API client/services.
- [x] Prevent accidental `.env` commits and provide `.env.example` template.
- [x] Fix current lint error blockers in app code.
- [ ] Host Privacy Policy and Terms on a public URL and use that URL in Play Console.
- [ ] Complete Play Console Data Safety form based on actual runtime data handling.
- [ ] Verify all production API calls use HTTPS only.

## P1 - Should complete for a safer release
- [x] Persist terms/privacy consent metadata server-side (policy version + accepted timestamp).
- [ ] Move any remaining sensitive values out of logs and guard diagnostics behind `__DEV__`.
- [ ] Validate Mapbox token restrictions (Android package + scope limits) and rotate token if needed.
- [ ] Ensure support contact details are consistent across app, policy docs, and Play listing.
- [x] Add a short account deletion explanation screen (what gets deleted/deactivated and retention).

## P2 - Release hygiene
- [x] Align Expo dependency patch versions recommended by `expo-doctor`.
- [ ] Resolve high-signal lint warnings in navigation/order flows.
- [ ] Add `eas.json` release profile or document local Gradle release process.
- [ ] Add a release checklist script (lint + typecheck + export/build smoke test).
