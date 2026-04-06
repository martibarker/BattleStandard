import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
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
  ],
})
