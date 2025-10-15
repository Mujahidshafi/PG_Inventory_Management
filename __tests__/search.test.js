/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Search from '../pages/search'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}))

// Mock supabase client
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}))

// Mock layout (optional — prevents rendering heavy layout markup)
jest.mock('../components/layout', () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
})

describe('Search Page', () => {
  it('renders without crashing and shows Filters sidebar', async () => {
    render(<Search />)

    // Wait for async data fetch to complete
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  it('displays "No results found" when there is no data', async () => {
    render(<Search />)

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })
})
