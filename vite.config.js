import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    minify: 'terser',
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
})