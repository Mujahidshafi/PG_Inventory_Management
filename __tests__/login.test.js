import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../pages/login';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { signInWithPassword: jest.fn() },
    from: jest.fn(),
  },
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('Login Page', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: pushMock });

    // Reset supabase mocks
    supabase.auth.signInWithPassword.mockReset();
    supabase.from.mockReset();
  });

  it('renders login form elements', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('shows error if email or password is empty', async () => {
    render(<Login />);
    fireEvent.click(screen.getByText('Log In'));

    await waitFor(() => {
      expect(screen.getByText('Please enter both email and password.')).toBeInTheDocument();
    });
  });

  it('logs in and redirects admin user', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });

    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'admin' }, error: null }),
        }),
      }),
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Log In'));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/adminMenu'));
  });

  it('shows error for invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login' },
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('Log In'));

    await waitFor(() => expect(screen.getByText('Invalid login')).toBeInTheDocument());
  });

  it('shows error if user role is invalid', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });

    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'guest' }, error: null }),
        }),
      }),
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Log In'));

    await waitFor(() => expect(screen.getByText('User role is not valid')).toBeInTheDocument());
  });
});