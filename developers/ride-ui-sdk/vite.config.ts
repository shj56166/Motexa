import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const sdkRoot = fileURLToPath(new URL('./vendor/ride-ui-sdk/dist/', import.meta.url))

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [vue(), {
    name: 'local-vue-diagnostics',
    // Vue's production error reference is diagnostic text, not a network resource.
    generateBundle(_, bundle) {
      if (mode !== 'runtime') return
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk') output.code = output.code.replaceAll('https://vuejs.org/error-reference/', 'vue-error-reference/')
      }
    },
  }],
  resolve: {
    alias: {
      '@motexa/ride-ui-sdk/client': `${sdkRoot}client.js`,
      '@motexa/ride-ui-sdk/contract': `${sdkRoot}contract.js`,
      '@motexa/ride-ui-sdk/replay': `${sdkRoot}replay.js`,
    },
  },
  // The mock host loads the theme in an opaque-origin sandboxed iframe.
  // Vite module requests therefore use Origin: null during local development.
  server: { cors: true },
  preview: { cors: true },
  build: {
    outDir: mode === 'runtime' ? 'dist/runtime-web' : 'dist/development',
    // Runtime packages must carry images as independently hashed ZIP resources;
    // never silently inline a large or unreviewed data URL into JavaScript/CSS.
    modulePreload: { polyfill: false },
    assetsInlineLimit: mode === 'runtime' ? 0 : undefined,
    rollupOptions: {
      input: mode === 'runtime'
        ? fileURLToPath(new URL('./index.html', import.meta.url))
        : {
            theme: fileURLToPath(new URL('./index.html', import.meta.url)),
            mockHost: fileURLToPath(new URL('./mock-host.html', import.meta.url)),
          },
    },
  },
}))
