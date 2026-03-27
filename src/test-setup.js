import '@testing-library/jest-dom'
import { server } from './mocks/server.js'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// matchMedia mock — jsdom does not implement window.matchMedia
// Required by useDarkMode / PERS-01 tests. Override `.matches` per-test as needed.
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })),
});
