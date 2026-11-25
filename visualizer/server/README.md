# Private save development

The Worker serves the app and `/api/v1/*` behind an application-specific Cloudflare Access policy. It verifies the signed Access header against an exact issuer, audience and owner identity, including for static assets. The default build config leaves external routes and D1 disabled. Public GitHub Pages continues to build and serve a local-only app.

From `visualizer/` with Node 22.23+:

```sh
npm ci
npm test
npm run build -- --base=/RotationStudio/
npm run fixture:private
```

The fixture binds loopback and uses ephemeral keys and SQLite data. Its fixture sign-in is test-only and lives outside the Worker entrypoint. To exercise it, run `node scripts/smoke-authoring.mjs` with Playwright and Chromium installed. The fixture also runs the real Worker authorization and D1 SQL through a SQLite adapter. Stop the fixture after the check.

Build the private deployment bundle locally with `ROTATION_PRIVATE_BUILD=1 npx cf build`. Keep this build and the synthetic test server separate from production data.

Live activation is subject to [the documented owner approvals](../../docs/START_HERE.md#4-hosting-one-account-step-before-private-deployment). After those checks, use the current `cf` CLI with the approved account. Provision only the application-specific D1 database and Access-protected custom host, apply [the migration](migrations/0001_library.sql), and populate Worker secrets `ACCESS_ISSUER`, `ACCESS_AUDIENCE` and `ACCESS_OWNER_EMAIL` securely. Use the approved `ROTATION_D1_ID`, `ROTATION_PRIVATE_DOMAIN`, `ROTATION_PRIVATE_BUILD=1` and `ROTATION_PRIVATE_ACTIVATED=1` for the authorised deployment. The configuration disables the workers.dev and preview addresses. Verify authorised app and API access, denied unauthorised requests, save/reopen and stale-save recovery on the hosted app. No provider inference is part of private save.
