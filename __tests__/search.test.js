import { render, screen, fireEvent } from '@testing-library/react'
import Search from '../pages/search'
import { supabase } from '../lib/supabaseClient'

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing and shows Filters sidebar', async () => {
    render(<Search />)
    const filtersHeading = await screen.findByText(/Filters/i)
    expect(filtersHeading).toBeInTheDocument()
  })

  it('displays "No results found" when there is no data', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    render(<Search />)
    const noResults = await screen.findByText(/No results found/i)
    expect(noResults).toBeInTheDocument()
  })

  it('renders results when Supabase returns data', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        data: [
          {
            product: ['Tomato'],
            lot_number: ['123'],
            location: 'Field A',
            date_stored: '2025-10-01',
            source: 'Field Run Storage',
            weight: 10,
            moisture: 5,
            type: 'Fresh',
          },
        ],
        error: null,
      }),
    })

    render(<Search />)

    const product = await screen.findByText(/Tomato/i)
    const lot = await screen.findByText(/Lot #: 123/i)
    const source = await screen.findByText(/Field Run Storage/i)

    expect(product).toBeInTheDocument()
    expect(lot).toBeInTheDocument()
    expect(source).toBeInTheDocument()
  })

  it('filters results based on search input', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        data: [
          { product: ['Tomato'], lot_number: ['1'], location: 'A', date_stored: '2025-10-01', source: 'Field Run Storage' },
          { product: ['Carrot'], lot_number: ['2'], location: 'B', date_stored: '2025-10-02', source: 'Field Run Storage' },
        ],
        error: null,
      }),
    })

    render(<Search />)

    await screen.findByText(/Tomato/i)

    const input = screen.getByPlaceholderText(/Search/i)
    fireEvent.change(input, { target: { value: 'Carrot' } })

    expect(screen.queryByText(/Tomato/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Carrot/i)).toBeInTheDocument()
  })

  it('filters results based on year selection', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        data: [
          { product: ['Tomato'], lot_number: ['1'], location: 'A', date_stored: '2023-05-01', source: 'Field Run Storage' },
          { product: ['Carrot'], lot_number: ['2'], location: 'B', date_stored: '2024-06-01', source: 'Field Run Storage' },
        ],
        error: null,
      }),
    })

    render(<Search />)

    await screen.findByText(/Tomato/i)

    const yearSelect = screen.getByLabelText(/Year/i)
    fireEvent.change(yearSelect, { target: { value: '2024' } })

    expect(screen.queryByText(/Tomato/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Carrot/i)).toBeInTheDocument()
  })

  it('sorts results based on sort order', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        data: [
          { product: ['Tomato'], lot_number: ['1'], location: 'A', date_stored: '2025-10-01', source: 'Field Run Storage' },
          { product: ['Carrot'], lot_number: ['2'], location: 'B', date_stored: '2025-10-02', source: 'Field Run Storage' },
        ],
        error: null,
      }),
    })

    render(<Search />)
    await screen.findByText(/Tomato/i)

    const sortSelect = screen.getByLabelText(/Sort by:/i)
    fireEvent.change(sortSelect, { target: { value: 'oldest' } })

    const items = screen.getAllByText(/Field Run Storage/i)
    expect(items[0].closest('div')).toHaveTextContent(/Tomato/i)
  })
})
