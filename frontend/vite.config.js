import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5174 so Flowers 4U can run next to the original system (5173)
  server: { port: 5174, strictPort: true },
})
