import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'

// Aspire inyecta la URL del backend y el puerto que debe usar el dev server
// (ver src/AppHost/Program.cs). Fuera de Aspire se usan los valores por defecto.
const apiTarget =
  process.env['services__webapi__http__0'] ||
  process.env['services__webapi__https__0']

const proxy = apiTarget
  ? {
      '/api': { target: apiTarget, changeOrigin: true, secure: false },
      '/openapi': { target: apiTarget, changeOrigin: true, secure: false },
      '/scalar': { target: apiTarget, changeOrigin: true, secure: false },
    }
  : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
