import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPassword from '../pages/forgotPassword';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

describe('ForgotPassword Page', () => {
  const mockResetPassword = supabase.auth.resetPasswordForEmail;
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ back: mockBack });
  });

  it('renders form elements', () => {
    render(<ForgotPassword />);
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('shows error when email is empty', async () => {
    render(<ForgotPassword />);
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Please enter your email')).toBeInTheDocument();
  });

  it('shows success message on successful request', async () => {
    mockResetPassword.mockResolvedValue({ data: {}, error: null });

    render(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@farm.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText(
      'If this email exists in our system, you’ll receive a reset link.'
    )).toBeInTheDocument();
  });

  it('shows error message when Supabase returns error', async () => {
    mockResetPassword.mockResolvedValue({
      data: null,
      error: { message: 'Rate limit exceeded' },
    });

    render(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'spam@farm.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Rate limit exceeded')).toBeInTheDocument();
  });

  it('shows "Sending..." while loading', async () => {
    mockResetPassword.mockImplementation(() => new Promise(() => {}));

    render(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'wait@farm.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Sending...')).toBeInTheDocument();
  });

  it('calls router.back() when Back button is clicked', () => {
    render(<ForgotPassword />);
    fireEvent.click(screen.getByText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders logo and title', () => {
    render(<ForgotPassword />);
    expect(screen.getByText('Pleasant Grove Farms')).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument(); // NOW WORKS!
  });
});