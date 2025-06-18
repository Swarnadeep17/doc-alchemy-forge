import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
    port: 8080,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
      '@components': join(__dirname, 'src/components'),
      '@context': join(__dirname, 'src/context')
    }
  }
})
