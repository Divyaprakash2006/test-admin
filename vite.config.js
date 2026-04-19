import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    force: true,
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'axios',
      'react-icons/hi2',
      'recharts'
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Removing fixed HMR host to allow it to match localhost/127.0.0.1 dynamically
    hmr: {
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'https://test-backend-8l27.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
