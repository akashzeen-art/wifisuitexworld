import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'exe-download-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes('/downloads/') && (req.url.endsWith('.exe') || req.url.endsWith('.apk'))) {
            const isApk = req.url.endsWith('.apk')
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="${isApk ? 'WiFiExtender-Android.apk' : 'WiFiExtender-Setup.exe'}"`
            )
            res.setHeader(
              'Content-Type',
              isApk ? 'application/vnd.android.package-archive' : 'application/octet-stream'
            )
          }
          next()
        })
      },
    },
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:8018',
      '/ws': {
        target: 'http://localhost:8018',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
