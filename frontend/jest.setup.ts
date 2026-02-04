import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '/dashboard';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock @clerk/nextjs
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
  }),
  useUser: () => ({
    user: { id: 'test-user-id', firstName: 'Test', lastName: 'User' },
    isLoaded: true,
    isSignedIn: true,
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: () => null,
  SignUpButton: () => null,
  UserButton: () => null,
}));

// Mock fetch
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
