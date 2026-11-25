import { bindings, defineConfig } from 'cf/config'

// Live routes and D1 are opt-in only after the documented owner/account checks.
// The synthetic test server has its own signing keys and never imports this file.
export default defineConfig(({ isPreview, isDev }) => {
  const active = process.env.ROTATION_PRIVATE_ACTIVATED === '1' && !isPreview && !isDev
  const db = process.env.ROTATION_D1_ID
  const domain = process.env.ROTATION_PRIVATE_DOMAIN
  if (active && (!db || !domain)) throw new Error('Private deployment requires a pre-provisioned D1 database and Access-protected host.')
  return {
    worker: {
      name: 'rotationstudio-private',
      entrypoint: './server/worker.ts',
      compatibilityDate: '2026-11-25',
      workersDev: false,
      previewUrls: false,
      domains: active && domain ? [domain] : [],
      assets: { runWorkerFirst: true },
      env: {
        ASSETS: bindings.assets(),
        DB: active && db ? bindings.d1({ id: db, name: 'rotationstudio-private' }) : undefined,
        ACCESS_ISSUER: bindings.secret(),
        ACCESS_AUDIENCE: bindings.secret(),
        ACCESS_OWNER_EMAIL: bindings.secret(),
      },
    },
  }
})
