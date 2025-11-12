import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CreateAccount from '../pages/createAccount';
import { supabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient');

jest.mock('../components/button', () => ({
  __esModule: true,
  default: (props) => <button {...props}>{props.label}</button>,
}));

jest.mock('../components/layout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

describe('CreateAccount Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.signUp.mockResolvedValue({ error: null });
    supabase.auth.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }));
  });

  const fillForm = () => {
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Amber' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'amber@farm.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'employee' } });
  };

  it('renders all form fields and Create Account button', async () => {
    await act(async () => {
      render(<CreateAccount />);
    });
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('calls supabase.auth.signUp with correct data on valid input', async () => {
    await act(async () => {
      render(<CreateAccount />);
    });
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'amber@farm.com',
        password: 'Password123!',
      });
    });
  });

  it('shows success message after signUp email is sent', async () => {
    await act(async () => {
      render(<CreateAccount />);
    });
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/sign-up email sent/i)).toBeInTheDocument();
    });
  });

  it('shows Supabase error message on signUp failure', async () => {
    supabase.auth.signUp.mockResolvedValue({ 
      error: { message: 'Email already registered' } 
    });

    await act(async () => {
      render(<CreateAccount />);
    });
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });
});