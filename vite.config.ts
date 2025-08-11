import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // {
    //   name: 'html-transform',
    //   transformIndexHtml(html) {
    //     return html.replace(/%VITE_META_PIXEL_ID%/g, process.env.VITE_META_PIXEL_ID || 'YOUR_META_PIXEL_ID');
    //   },
    // },
  ],
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
})
