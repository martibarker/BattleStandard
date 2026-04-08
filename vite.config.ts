import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Required for Sentry source maps
    sourcemap: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-404-fallback',
      closeBundle() {
        // Cloudflare Pages serves 404.html for unmatched paths — React Router handles the route
        copyFileSync('dist/index.html', 'dist/404.html');
      },
    },
    // Upload source maps to Sentry on production builds
    // Requires SENTRY_AUTH_TOKEN env var — set in Cloudflare Pages dashboard
    sentryVitePlugin({
      org: 'battle-standard',
      project: 'javascript-react',
      // Auth token is read from SENTRY_AUTH_TOKEN env var
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Don't fail the build if Sentry upload fails (e.g. missing token in dev)
      telemetry: false,
    }),
  ],
})
