import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CleanStorage from '../pages/cleanStorage';
import CleanStorageModify from '../pages/cleanStorageModify';
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

describe('CleanStorage Page', () => {
  const pushMock = jest.fn();
  const sampleRows = [
    {
      ID: 1,
      Box_ID: 'BOX1',
      Supplier: 'Supplier X',
      Lot_Number: 'LOT001',
      Process_ID: 'PROC100',
      Product: 'Prod A',
      Amount: '10',
      Date_Stored: '2023-12-31T00:00:00Z',
      Type: 'Air',
      Notes: 'Initial note',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: pushMock });
    supabase.from.mockImplementation((table) => {
      if (table === 'clean_product_storage') {
        return {
          select: (column) => ({
            not: () => {
              if (column === 'Product') {
                return Promise.resolve({
                  data: [{ Product: 'Prod A, Prod B' }],
                  error: null,
                });
              }
              if (column === 'Supplier') {
                return Promise.resolve({
                  data: [{ Supplier: 'Supplier X' }],
                  error: null,
                });
              }
              return Promise.resolve({ data: [], error: null });
            },
          }),
        };
      }
      return {
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    });
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleRows),
      })
    );
    window.confirm = jest.fn(() => true);
  });

  it('renders items from backend and groups them into all defined categories', async () => {
    const categoryRows = [
      {
        ID: 1,
        Box_ID: 'BOX-CORN',
        Supplier: 'Supplier Corn',
        Lot_Number: 'LOT-CORN',
        Process_ID: 'PROC-CORN',
        Product: 'YPCBL', // Corn Products
        Amount: '10',
        Date_Stored: '2024-01-01T00:00:00Z',
        Type: 'Type',
        Notes: 'Corn note',
      },
      {
        ID: 2,
        Box_ID: 'BOX-WHEAT',
        Supplier: 'Supplier Wheat',
        Lot_Number: 'LOT-WHEAT',
        Process_ID: 'PROC-WHEAT',
        Product: 'SWW', // Wheat Products
        Amount: '20',
        Date_Stored: '2024-01-02T00:00:00Z',
        Type: 'Type',
        Notes: 'Wheat note',
      },
      {
        ID: 3,
        Box_ID: 'BOX-PULSES',
        Supplier: 'Supplier Pulses',
        Lot_Number: 'LOT-PULSES',
        Process_ID: 'PROC-PULSES',
        Product: 'DRK', // Pulses Products
        Amount: '30',
        Date_Stored: '2024-01-03T00:00:00Z',
        Type: 'Type',
        Notes: 'Pulses note',
      },
      {
        ID: 4,
        Box_ID: 'BOX-NONFOOD',
        Supplier: 'Supplier NonFood',
        Lot_Number: 'LOT-NONFOOD',
        Process_ID: 'PROC-NONFOOD',
        Product: 'BELL', // Non-Food Products / Seeds
        Amount: '40',
        Date_Stored: '2024-01-04T00:00:00Z',
        Type: 'Type',
        Notes: 'Non-food note',
      },
      {
        ID: 5,
        Box_ID: 'BOX-UNCAT',
        Supplier: 'Supplier Uncat',
        Lot_Number: 'LOT-UNCAT',
        Process_ID: 'PROC-UNCAT',
        Product: 'UNKNOWNCODE', // Uncategorized Products
        Amount: '50',
        Date_Stored: '2024-01-05T00:00:00Z',
        Type: 'Type',
        Notes: 'Uncat note',
      },
    ];

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(categoryRows),
      })
    );
    render(<CleanStorage />);

    expect(await screen.findByText('LOT-CORN')).toBeInTheDocument();

    expect(screen.getByText('Corn Products')).toBeInTheDocument();
    expect(screen.getByText('Wheat Products')).toBeInTheDocument();
    expect(screen.getByText('Pulses Products')).toBeInTheDocument();
    expect(screen.getByText('Non-Food Products / Seeds')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized Products')).toBeInTheDocument();

    expect(screen.getByText('LOT-CORN')).toBeInTheDocument();
    expect(screen.getByText('LOT-WHEAT')).toBeInTheDocument();
    expect(screen.getByText('LOT-PULSES')).toBeInTheDocument();
    expect(screen.getByText('LOT-NONFOOD')).toBeInTheDocument();
    expect(screen.getByText('LOT-UNCAT')).toBeInTheDocument();
  });

  it('loads product and supplier filters', async () => {
    render(<CleanStorage />);

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
    render(<CleanStorage />);

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
    render(<CleanStorage />);

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
    render(<CleanStorage />);

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

  it('clicking clear filter button resets filters', async () => {
    render(<CleanStorage />);

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

  it('Navigating to cleanStorageModify page, changing weight to 100, then click save', async () => {
    render(<CleanStorage />);
    await screen.findByText('LOT001');

    const moreBtn = screen.getByAltText('more');
    fireEvent.click(moreBtn);
    const modifyBtn = await screen.findByText(/Modify/i);
    fireEvent.click(modifyBtn);

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining('/cleanStorageModify?id=')
    );
    const updateSpy = jest.fn((payload) => ({
      eq: () => Promise.resolve({ error: null }),
    }));
    supabase.from.mockImplementation((table) => {
      if (table === 'storage_location_list') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [{ id: 1, storage_location_name: 'LOC1' }],
                error: null,
              }),
          }),
        };
      }
      if (table === 'crop_types') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [{ id: 1, name: 'Crop 1', crop_code: 'Prod A' }],
                error: null,
              }),
          }),
        };
      }
      if (table === 'customers') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [{ customer_id: 1, name: 'Supplier X' }],
                error: null,
              }),
          }),
        };
      }
      if (table === 'clean_product_storage') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    ID: 1,
                    Product: 'Prod A',
                    Amount: 10,
                    Supplier: 'Supplier X',
                    Notes: 'Initial note',
                    Location: 'LOC1',
                    Date_Stored: '2024-01-01T00:00:00Z',
                    Box_ID: 'BOX1',
                    Process_ID: 'PROC100',
                    Lot_Number: 'LOT001',
                  },
                  error: null,
                }),
            }),
          }),
          update: updateSpy,
          insert: jest.fn(),
        };
      }
      return {
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    });
    const modifyPushMock = jest.fn();
    useRouter.mockReturnValue({
      query: { id: '1' },
      push: modifyPushMock,
    });
    render(<CleanStorageModify />);
    const weightInput = await screen.findByLabelText(/Weight \(kg\)/i);
    fireEvent.change(weightInput, { target: { value: '100' } });
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    const updatePayload = updateSpy.mock.calls[0][0];
    expect(updatePayload).toEqual(
      expect.objectContaining({
        Product: 'Prod A',
        Amount: 100,
        Supplier: 'Supplier X',
        Location: 'LOC1',
        Box_ID: 'BOX1',
        Process_ID: 'PROC100',
        Lot_Number: 'LOT001',
      })
    );
    expect(modifyPushMock).toHaveBeenCalledWith('/cleanStorage');
  });

  it('Adding notes to item', async () => {
    render(<CleanStorage />);
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
        expect.stringContaining('/api/cleanStorageBackend?id='),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ Notes: 'Updated note' }),
        })
      );
    });
  });

  it('Deleting an item', async () => {
    render(<CleanStorage />);
    await screen.findByText('LOT001');

    const moreBtn = screen.getByAltText('more');
    fireEvent.click(moreBtn);
    const deleteBtn = await screen.findByText(/Delete/i);
    fireEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cleanStorageBackend?id='),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});