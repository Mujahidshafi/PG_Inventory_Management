import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScreeningStorage from '../pages/screeningStorage';
import ScreeningStorageModify from '../pages/screeningStorageModify';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
beforeAll(() => {
  window.alert = jest.fn();
});
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../components/layout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

describe('ScreeningStorage Page', () => {
  const pushMock = jest.fn();
  const mockSupabaseProducts = {
    select: () => ({
      not: () =>
        Promise.resolve({
          data: [{ Product: 'Prod A, Prod B' }],
          error: null,
        }),
    }),
  };
  const mockSupabaseSuppliers = {
    select: () => ({
      not: () =>
        Promise.resolve({
          data: [{ Supplier: 'Supplier X' }],
          error: null,
        }),
    }),
  };
  const sampleRows = [
    {
      ID: 1,
      Box_ID: 'BOX1',
      Supplier: 'Supplier X',
      Lot_Number: 'LOT001',
      Process_ID: 'PROC100',
      Product: 'Prod A',
      Amount: '10',
      Date_Stored: '2024-01-01T00:00:00Z',
      Type: 'Air',
      Notes: 'Initial note',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    useRouter.mockReturnValue({ push: pushMock });
    supabase.from
      .mockReturnValueOnce(mockSupabaseProducts)
      .mockReturnValueOnce(mockSupabaseSuppliers);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleRows),
      })
    );
    window.confirm = jest.fn(() => true);
  });

  it('renders items from backend', async () => {
    render(<ScreeningStorage />);

    expect(global.fetch).toHaveBeenCalled();
    expect(await screen.findByText('LOT001')).toBeInTheDocument();

    const prodAElements = screen.getAllByText('Prod A');

    expect(prodAElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('BOX1')).toBeInTheDocument();
    expect(screen.getByText('PROC100')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Air')).toBeInTheDocument();
  });

  it('loads product and supplier filters', async () => {
    render(<ScreeningStorage />);

    const prodAOption = await screen.findByRole('option', { name: 'Prod A' });
    const prodBOption = screen.getByRole('option', { name: 'Prod B' });
    const supplierXOption = screen.getByRole('option', { name: 'Supplier X' });

    expect(screen.getByText(/Filter Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Filter Suppliers/i)).toBeInTheDocument();

    expect(prodAOption).toBeInTheDocument();
    expect(prodBOption).toBeInTheDocument();
    expect(supplierXOption).toBeInTheDocument();
  });

  it('Searching by Lot Number, then click search', async () => {
    render(<ScreeningStorage />);

    await screen.findByText('LOT001');

    global.fetch.mockClear();

    const lotInput = screen.getByPlaceholderText('Enter Lot Number...');

    fireEvent.change(lotInput, { target: { value: 'LOT001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    
    expect(body).toMatchObject({ lot: 'LOT001' });
    expect(body.product).toBeUndefined();
    expect(body.supplier).toBeUndefined();
  });

  it('Selecting a product in product filter, then click search', async () => {
    render(<ScreeningStorage />);
    
    await screen.findByRole('option', { name: 'Prod A' });
    
    global.fetch.mockClear();
    
    const selects = screen.getAllByRole('combobox');
    const productSelect = selects[0];
    
    fireEvent.change(productSelect, { target: { value: 'Prod A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    
    expect(body).toMatchObject({ product: 'Prod A' });
    expect(body.lot).toBeUndefined();
    expect(body.supplier).toBeUndefined();
  });

  it('Selecting a supplier in supplier filter, then click search', async () => {
    render(<ScreeningStorage />);
    
    await screen.findByRole('option', { name: 'Supplier X' });
    
    global.fetch.mockClear();
    
    const selects = screen.getAllByRole('combobox');
    const supplierSelect = selects[1];
    
    fireEvent.change(supplierSelect, { target: { value: 'Supplier X' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    
    expect(body).toMatchObject({ supplier: 'Supplier X' });
    expect(body.lot).toBeUndefined();
    expect(body.product).toBeUndefined();
  });

  it('clicking clear filter button, then click search', async () => {
    render(<ScreeningStorage />);
    
    await screen.findByText('LOT001');
    
    const lotInput = screen.getByPlaceholderText('Enter Lot Number...');
    const selects = screen.getAllByRole('combobox');
    const productSelect = selects[0];
    const supplierSelect = selects[1];

    fireEvent.change(lotInput, { target: { value: 'LOT999' } });
    fireEvent.change(productSelect, { target: { value: 'Prod A' } });
    fireEvent.change(supplierSelect, { target: { value: 'Supplier X' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

    expect(lotInput).toHaveValue('');
    expect(productSelect).toHaveValue('');
    expect(supplierSelect).toHaveValue('');
  });

  it('Navigating to screeningStorageModify page, changing weight to 100 , then click save ', async () => {
    render(<ScreeningStorage />);
    await screen.findByText('LOT001');

    const moreBtn = screen.getByAltText('more');
    fireEvent.click(moreBtn);
    const modifyBtn = await screen.findByText(/Modify/i);
    fireEvent.click(modifyBtn);

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining('/screeningStorageModify?id=')
    );
    global.fetch.mockReset();
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ID: 1,
          Box_ID: 'BOX1',
          Supplier: 'Supplier X',
          Lot_Number: 'LOT001',
          Process_ID: 'PROC100',
          Product: 'Prod A',
          Amount: '10',
          Date_Stored: '2024-01-01T00:00:00Z',
          Type: 'Air',
          Notes: 'Initial note',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    useRouter.mockReturnValue({
      query: { id: '1' },
      push: jest.fn(),
    });
    render(<ScreeningStorageModify />);
    const amountInput = await screen.findByPlaceholderText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '100' } });
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const [, putOptions] = global.fetch.mock.calls[1];
      const body = JSON.parse(putOptions.body);
      expect(body).toEqual(expect.objectContaining({ Amount: '100' }));
    });
    expect(amountInput).toHaveValue('100');
  });

  it('Adding notes to item', async () => {
    render(<ScreeningStorage />);
    await screen.findByText('LOT001');

    const moreBtn = screen.getByAltText('more');
    fireEvent.click(moreBtn);
    const addNotesBtn = await screen.findByText(/Add Notes/i);
    fireEvent.click(addNotesBtn);
    const textarea = await screen.findByPlaceholderText(/Enter notes/i);
    fireEvent.change(textarea, { target: { value: 'Updated note' } });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/screeningStorageBackend?id='),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ Notes: 'Updated note' }),
        })
      );
    });
  });

  it('Deleting an item', async () => {
    render(<ScreeningStorage />);
    await screen.findByText('LOT001');

    const moreBtn = screen.getByAltText('more');
    fireEvent.click(moreBtn);
    const deleteBtn = await screen.findByText(/Delete/i);
    fireEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/screeningStorageBackend?id='),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});