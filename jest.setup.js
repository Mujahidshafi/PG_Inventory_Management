import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';

jest.mock('./lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: [], error: null }),
      delete: jest.fn().mockResolvedValue({ data: [], error: null }),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
      resetPasswordForEmail: jest.fn().mockImplementation(async (email) => ({
        data: null,
        error: email ? null : { message: 'Email is empty' },
      })),
    },
  },
}));

jest.mock('@supabase/auth-helpers-react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: '123' }, session: 'dummy-session' },
    status: 'authenticated',
  })),
  useSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: [], error: null }),
      delete: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    query: {},
  })),
}));
