import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from '../pages/resetPassword';
import { supabase } from '../lib/supabaseClient';

jest.mock('next/image', () => () => null);
jest.mock('next/link', () => ({ children }) => children);

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      setSession: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

describe('ResetPassword Page', () => {
  const mockSetSession = supabase.auth.setSession;
  const mockUpdateUser = supabase.auth.updateUser;
  const mockSignOut = supabase.auth.signOut;

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.hash = '#access_token=valid&refresh_token=valid&type=recovery';
  });

  it('shows error for invalid or missing hash', () => {
    window.location.hash = '';
    render(<ResetPassword />);
    expect(screen.getByText('Invalid recovery link.')).toBeInTheDocument();
  });

  it('shows error for invalid token or type', () => {
    window.location.hash = '#access_token=valid&type=signup';
    render(<ResetPassword />);
    expect(screen.getByText('Invalid or expired recovery link.')).toBeInTheDocument();
  });

  it('initializes session on valid recovery link', async () => {
    mockSetSession.mockResolvedValue({ error: null });
    render(<ResetPassword />);
    await waitFor(() => expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'valid',
      refresh_token: 'valid',
    }));
  });

  it('shows password requirements error', async () => {
    mockSetSession.mockResolvedValue({ error: null });
    render(<ResetPassword />);
    await waitFor(() => expect(mockSetSession).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
  });

  it('updates password successfully', async () => {
    mockSetSession.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });

    render(<ResetPassword />);
    await waitFor(() => expect(mockSetSession).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'StrongPass123' }));
    await waitFor(() => expect(screen.getByText('Password updated successfully!')).toBeInTheDocument());
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows error if updateUser fails', async () => {
    mockSetSession.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: 'Server error' } });

    render(<ResetPassword />);
    await waitFor(() => expect(mockSetSession).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'ValidPass123' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
  });

  it('disables button while loading', async () => {
    mockSetSession.mockResolvedValue({ error: null });
    mockUpdateUser.mockImplementation(() => new Promise(() => {}));

    render(<ResetPassword />);
    await waitFor(() => expect(mockSetSession).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'ValidPass123' } });
    fireEvent.click(screen.getByText('Submit'));

    await screen.findByText('Resetting...');

    const button = screen.getByRole('button', { name: 'Resetting...' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Resetting...');
  });

  it('renders return to login link', () => {
    mockSetSession.mockResolvedValue({ error: null });
    render(<ResetPassword />);
    expect(screen.getByText('Return to the Login page')).toBeInTheDocument();
  });
});