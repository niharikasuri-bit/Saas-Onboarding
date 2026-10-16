import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5191,
    open: true,
  },
  build: {
    // The published digit-ui-components-css uses var() inside a media query,
    // which Vite 8's Lightning CSS minifier rejects. Minification stays off.
    cssMinify: false,
  },
})
