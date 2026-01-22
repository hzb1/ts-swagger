import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      vue(),
      vueJsx(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api-proxy': {
          // target: 'http://172.16.14.27:9999/',
          // target: 'http://172.16.14.48:9999/',
          // target: 'http://172.16.13.107:9999/',
          // luo
          // target: 'http://172.16.13.31:9999/',
          // huang
          // target: 'http://172.16.13.82:9999/',
          target: 'http://172.16.13.93:9000/',
          // target: 'https://tms-sit.glsytzjt.com/api',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        },
      },
    },
  }
})
