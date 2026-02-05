
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react() as any],
    test: {
        environment: 'node', // Use node env for backend logic tests
        globals: true,
        setupFiles: ['./src/tests/setup-integration.ts'],
        include: ['src/tests/payment-flow.test.ts'],
        alias: {
            '@': resolve(__dirname, './src')
        },
        testTimeout: 30000 // Increase timeout for real network calls
    },
})
