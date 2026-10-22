import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/shakemap': {
        target: 'https://www.ign.es',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost')
          const evid = url.searchParams.get('evid') ?? ''
          const file = url.searchParams.get('file') ?? 'info.json'
          return `/web/resources/sismologia/tproximos/shakemaps/${evid}/${file}`
        },
      },
      '/api/qafi': {
        target: 'https://mapas.igme.es',
        changeOrigin: true,
        rewrite: () =>
          '/gis/rest/services/BasesDatos/IGME_QAFI/MapServer/0/query' +
          '?where=1%3D1&outFields=*&outSR=4326&f=geojson',
      },
    },
  },
})
