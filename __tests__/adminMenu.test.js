import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminMenu from '../pages/adminMenu';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

jest.mock('@supabase/auth-helpers-react');

describe('AdminMenu Page', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
  };

  const mockSession = {
    user: { id: '123', email: 'test@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    };

    mockSupabase.from.mockImplementation(() => chain);
    useSupabaseClient.mockReturnValue(mockSupabase);
    useSession.mockReturnValue(mockSession);
  });

  it('renders all expected admin menu links', async () => {
    render(<AdminMenu />);
    await waitFor(() => expect(mockSupabase.from().select().eq().single).toHaveBeenCalledTimes(2));

    expect(screen.getByRole('link', { name: /new field run/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /transfer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mix/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create job/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /in process/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /storage dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /accounts manager/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /job history/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /qsage job/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sortex job/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /crop menu/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /process reports/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage people/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /order fulfillment/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bagging job/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /physical boxes/i })).toBeInTheDocument();
  });
});