import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPassword from '../pages/forgotPassword'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

describe('ForgotPassword Page', () => {
  const backMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ back: backMock })
  })

  it('renders form elements correctly', () => {
    render(<ForgotPassword />)

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument()
    expect(screen.getByText('Enter your email address:')).toBeInTheDocument()
  })

  it('calls router.back() when Back button is clicked', () => {
    render(<ForgotPassword />)

    fireEvent.click(screen.getByText('Back'))
    expect(backMock).toHaveBeenCalled()
  })

  it('shows success message on successful reset', async () => {
    supabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {},
      error: null,
    })

    render(<ForgotPassword />)
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(
        screen.getByText(
          "If this email exists in our system, you’ll receive a reset link."
        )
      ).toBeInTheDocument()
    })
  })

  it('shows error message if Supabase returns an error', async () => {
    supabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Email not found' },
    })

    render(<ForgotPassword />)
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument()
    })
  })

  it('does not break if input is empty and submit is clicked', async () => {
    render(<ForgotPassword />)

    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)

    // Wait for the error message to appear
    await waitFor(() => {
        expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument()
    })

    // Supabase should not be called
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })
})
