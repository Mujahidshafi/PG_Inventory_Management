import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import AccountsManager from '../pages/accountsManager'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useSession } from '@supabase/auth-helpers-react'

// Mock fetch for deleteUser API
global.fetch = jest.fn()

jest.mock('@supabase/auth-helpers-react', () => ({
  useSupabaseClient: jest.fn(),
  useSession: jest.fn(),
}))

describe('AccountsManager Page', () => {
  const mockSupabase = {
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useSupabaseClient.mockReturnValue(mockSupabase)
  })

  it('renders loading initially and then users table', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [
          { id: '1', email: 'user@test.com', role: 'employee', created_at: new Date().toISOString() },
        ],
        error: null,
      }),
    })

    render(<AccountsManager />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument()
    })
  })

  it('changes user role', async () => {
    const users = [
        { id: '1', email: 'user@test.com', role: 'employee', created_at: new Date().toISOString() }
    ]

    const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
    })

    mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: users, error: null }),
        update: updateMock,
    })

    render(<AccountsManager />)

    // wait for users table to render
    await waitFor(() => screen.getByText('user@test.com'))

    const roleSelect = screen.getByRole('combobox')
    fireEvent.change(roleSelect, { target: { value: 'admin' } })

    await waitFor(() => {
        // assert Supabase update was called with correct arguments
        expect(updateMock).toHaveBeenCalledWith({ role: 'admin' })
        // also check eq was called with the correct user id
        expect(updateMock().eq).toHaveBeenCalledWith('id', '1')
    })
  })

  it('opens delete popup and deletes user successfully', async () => {
    const users = [
      { id: '1', email: 'user@test.com', role: 'employee', created_at: new Date().toISOString() },
    ]
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: users, error: null }),
    })

    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<AccountsManager />)
    await waitFor(() => screen.getByText('user@test.com'))

    // Click the table Delete button for the first user
    const tableDeleteButton = screen.getAllByText('Delete', { selector: 'button' })[0]
    fireEvent.click(tableDeleteButton)

    // Confirm deletion in the popup
    const popup = screen.getByText('Confirm Delete').closest('div')
    const popupDeleteButton = within(popup).getByText('Delete', { selector: 'button' })
    fireEvent.click(popupDeleteButton)

    await waitFor(() => {
      expect(screen.queryByText('user@test.com')).not.toBeInTheDocument()
      expect(screen.getByText('User deleted successfully!')).toBeInTheDocument()
    })
  })

  it('shows error message if deletion fails', async () => {
    const users = [
      { id: '1', email: 'user@test.com', role: 'employee', created_at: new Date().toISOString() },
    ]
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: users, error: null }),
    })

    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Delete failed' }) })

    render(<AccountsManager />)
    await waitFor(() => screen.getByText('user@test.com'))

    // Open delete popup
    const tableDeleteButton = screen.getAllByText('Delete', { selector: 'button' })[0]
    fireEvent.click(tableDeleteButton)

    // Confirm deletion in the popup
    const popup = screen.getByText('Confirm Delete').closest('div')
    const popupDeleteButton = within(popup).getByText('Delete', { selector: 'button' })
    fireEvent.click(popupDeleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument()
    })
  })
})
