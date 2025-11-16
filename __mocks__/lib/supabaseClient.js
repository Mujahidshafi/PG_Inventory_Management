const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
        data: {
            subscription: { unsubscribe: jest.fn() },
        },
        error: null,
    })),
};

export const _QueryChain = {
    order: jest.fn(),
    ilike: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),

    single: jest.fn(), 

    mockResolvedValue: jest.fn(), 
    mockResolvedValueOnce: jest.fn(),
    mockRejectedValue: jest.fn(),

    then: jest.fn(), 
};

const createChainableQuery = () => {
    Object.keys(_QueryChain).forEach(key => {
        if (typeof _QueryChain[key] === 'function' && 
            !['single', 'then', 'mockResolvedValue', 'mockResolvedValueOnce', 'mockRejectedValue'].includes(key)
        ) {
            _QueryChain[key].mockReturnThis();
        }
    });

    _QueryChain.mockResolvedValue.mockImplementation(() => _QueryChain);
    _QueryChain.mockRejectedValue.mockImplementation(() => _QueryChain);

    _QueryChain.then.mockImplementation((resolve, reject) => {
        return _QueryChain.mockResolvedValue(); 
    });

    return _QueryChain;
};


const mockFrom = jest.fn((tableName) => {
    return {
        select: jest.fn(() => createChainableQuery()),
        update: jest.fn(() => createChainableQuery()),
        insert: jest.fn(() => createChainableQuery()),
        delete: jest.fn(() => createChainableQuery()),
    };
});


const mockRpc = jest.fn();


const mockSupabaseClient = {
    from: mockFrom,
    auth: mockAuth,
    rpc: mockRpc,
};

export const supabase = mockSupabaseClient;
export const createClient = () => mockSupabaseClient;

export const _MutationChain = _QueryChain; 

export default mockSupabaseClient;