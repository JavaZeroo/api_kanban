import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd'],
          'data-apis': ['./src/data/apis.js', './src/data/repoApis.js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
