import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the FastAPI backend during local development
      '/detect': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/download': 'http://localhost:8000',
      '/export': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
