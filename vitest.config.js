import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      include: ['src/components/**'],
      exclude: ['src/components/lib/constants.js', 'src/components/lib/icons.jsx'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
