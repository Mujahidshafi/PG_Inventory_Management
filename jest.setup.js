import '@testing-library/jest-dom';

// mock next router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
    query: {},
    pathname: '/',
    asPath: '/',
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

jest.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}));

// fake supabase keys for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.local';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake';

const originalError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    const msg = args[0];
    if (
      /Warning.*not wrapped in act/.test(msg) || // older React versions
      /An update to .* was not wrapped in act/.test(msg) || // React 18 phrasing
      /Warning.*Can't perform a React state update on an unmounted component/.test(msg)
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
