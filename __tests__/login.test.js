import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/login'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

describe('Login Page', () => {
  const pushMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: pushMock })
  })

  it('renders login form elements', () => {
    render(<Login />)

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByText('Log In')).toBeInTheDocument()
  })

  it('shows error if email or password is empty', async () => {
    render(<Login />)

    fireEvent.click(screen.getByText('Log In'))

    await waitFor(() => {
      expect(screen.getByText('Please enter both email and password.')).toBeInTheDocument()
    })
  })

  it('logs in and redirects admin user', async () => {
    // Mock Supabase signIn
    supabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    })

    // Mock Supabase from().select().eq().single() for role
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        }),
      }),
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByText('Log In'))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/adminMenu')
    })
  })

  it('shows error for invalid credentials', async () => {
    supabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login' },
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByText('Log In'))

    await waitFor(() => {
      expect(screen.getByText('Invalid login')).toBeInTheDocument()
    })
  })

  it('shows error if user role is invalid', async () => {
    supabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    })

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { role: 'guest' }, // invalid role
            error: null,
          }),
        }),
      }),
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByText('Log In'))

    await waitFor(() => {
      expect(screen.getByText('User role is not valid')).toBeInTheDocument()
    })
  })
})
