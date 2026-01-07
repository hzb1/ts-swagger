import { defineConfig } from 'vite'
import { resolve } from 'path'
// @ts-ignore
import fs from 'fs'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,

    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  },
  plugins: [
    {
      name: 'copy-manifest',
      apply: 'build',
      closeBundle() {
        fs.copyFileSync(
          resolve(__dirname, 'src/manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        )
      }
    }
  ]
})
