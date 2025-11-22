// __mocks__/lib/supabaseClient.js

// helper so chains are awaitable
const makeThenable = (result) => ({
  then: (resolve) => resolve(result),
  catch: () => {},
});

const makeQuery = (result = { data: null, error: null }) => {
  const q = {
    // chainable reads
    select: jest.fn(() => q),
    order: jest.fn(() => q),
    ilike: jest.fn(() => q),
    eq: jest.fn(() => q),

    // “finalizers”
    single: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => result),

    // writes
    insert: jest.fn(async (payload) => ({ data: null, error: null, payload })),
    update: jest.fn(async () => ({ data: null, error: null })),
    delete: jest.fn(async () => ({ data: null, error: null })),

    // allow `await supabase.from(...).select()...`
    ...makeThenable(result),
  };
  return q;
};

let __impl = null;
let __fromCalls = [];

const mockFrom = jest.fn((table) => {
  __fromCalls.push(['from', table]);
  return __impl ? __impl(table) : makeQuery({ data: null, error: null });
});

const mockAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getUser: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
    error: null,
  })),
};

const supabase = {
  from: mockFrom,
  auth: mockAuth,

  // testing helpers used by the tests
  __setFromImpl: (impl) => { __impl = impl; },
  __reset: () => {
    __impl = null;
    __fromCalls = [];
    mockFrom.mockClear();
    Object.values(mockAuth).forEach((fn) => fn?.mockClear?.());
  },
  __getFromCalls: () => __fromCalls.slice(),
};

export { supabase };
export const createClient = () => supabase;
export default supabase;
