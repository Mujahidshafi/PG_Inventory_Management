// __tests__/createAccount.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAccount from '../pages/createAccount';
import { supabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('CreateAccount Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields and Create Account button', () => {
    render(<CreateAccount />);
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('calls supabase.auth.signUp with correct data on valid input', async () => {
  supabase.auth.signUp.mockResolvedValue({
    data: { user: { id: '123' }, session: null },
    error: null,
  });

  render(<CreateAccount />);
  fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Amber' } });
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'amber@farm.com' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'employee' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password123!' } });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  await waitFor(() => {
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'amber@farm.com',
      password: 'Password123!',
    });
  });
});

  it('shows success message after account is created', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: '123' }, session: null },
      error: null,
    });

    render(<CreateAccount />);
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Amber' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'amber@farm.com' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeInTheDocument();
    });
  });

  it('shows Supabase error message on signUp failure', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email already in use' },
    });

    render(<CreateAccount />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'taken@farm.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });
});