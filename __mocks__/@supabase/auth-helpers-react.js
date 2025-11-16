// __mocks__/@supabase/auth-helpers-react.js

const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();

const createChain = () => ({
  select: jest.fn().mockImplementation(() => ({
    eq: jest.fn().mockImplementation(() => ({
      single: mockSingle,
    })),
  })),
  insert: jest.fn().mockResolvedValue({ data: [], error: null }),
  update: jest.fn().mockResolvedValue({ data: [], error: null }),
  delete: jest.fn().mockResolvedValue({ data: [], error: null }),
});

const mockSupabase = {
  from: jest.fn(() => createChain()),
  auth: {
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: '123', email: 'test@example.com' } } },
      error: null,
    }),
  },
};

// Auto-configure default success response
mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });

const useSupabaseClient = jest.fn(() => mockSupabase);
const useSession = jest.fn(() => ({
  user: { id: '123', email: 'test@example.com' },
}));

module.exports = {
  useSupabaseClient,
  useSession,
  __esModule: true,
};