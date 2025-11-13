import { render, screen, waitFor } from '@testing-library/react';
import EmployeeMenu from '../pages/employeeMenu';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

jest.mock('@supabase/auth-helpers-react'); // already mocked globally, but ensures isolation

describe('Employee Menu Tests', () => {
beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all expected employee menu buttons', async () => {
    const mockClient = useSupabaseClient();
    render(<EmployeeMenu />);

    // Wait for fetchRole() to finish and ensure the call happens
    await waitFor(() => {
      expect(useSupabaseClient().from).toHaveBeenCalledWith('users');
    });

    // Check important buttons
    expect(screen.getByRole('link', { name: /new field run/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /transfer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
  });
});