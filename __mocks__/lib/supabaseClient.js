// __mocks__/lib/supabaseClient.js
// THIS IS THE ONLY VERSION THAT WORKS 100%

const mockAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getUser: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: {
      subscription: {
        unsubscribe: jest.fn(),
      },
    },
    error: null,
  })),
};

const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
  })),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

const mockSupabaseClient = {
  from: mockFrom,
  auth: mockAuth,
};

export const supabase = mockSupabaseClient;
export const createClient = () => mockSupabaseClient;
export default mockSupabaseClient;