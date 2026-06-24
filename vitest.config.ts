import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // .advisor-output/ holds gitignored scratch copies (incl. stray test files
    // whose imports don't resolve there) — never run tests from it.
    exclude: ['**/node_modules/**', '**/.next/**', '.advisor-output/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
