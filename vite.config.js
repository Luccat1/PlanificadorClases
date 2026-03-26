import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Ajusta al nombre de tu repositorio en GitHub
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.js'],
        include: ['src/**/*.test.{js,jsx}'],
        exclude: ['node_modules', 'dist'],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
        },
    },
})
