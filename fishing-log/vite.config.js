import { defineConfig } from 'vite'

export default defineConfig({
  base: '/oev-expanse/fishing-log/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
