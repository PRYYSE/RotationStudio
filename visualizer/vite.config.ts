import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [react(), ...(process.env.ROTATION_PRIVATE_BUILD === '1' ? [cloudflare()] : [])],
  server: { port: 5188, host: true },
})
