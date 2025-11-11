import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MixingJob from '../pages/mixingJob';
import { supabase } from '../lib/supabaseClient';

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

jest.mock('../lib/supabaseClient', () => {
  const mockEq = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
  const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
  const mockUpsert = jest.fn().mockResolvedValue({ error: null });
  const mockInsert = jest.fn().mockResolvedValue({ error: null });
  const mockMaybeSingle = jest.fn();

  const mockClient = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
      insert: mockInsert,
    })),
  };

  return { supabase: mockClient };
});

jest.mock('../components/layout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe('MixingJob Page', () => {
  const mockBox = {
    Box_ID: '1234C1',
    Lot_Number: 'LOT-789',
    Product: 'Cherry',
    Amount: 45.5,
    Location: 'Field A',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from().maybeSingle.mockResolvedValue({ data: mockBox, error: null });
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  const getBoxInput = () => screen.getByPlaceholderText('Enter Box ID (e.g., 1234C1)');

  it('renders form with Process ID, CO2 Bin, and Notes', () => {
    render(<MixingJob />);
    expect(screen.getByPlaceholderText('Enter new process ID')).toBeInTheDocument();
    expect(screen.getByText('Select Bin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Optional notes')).toBeInTheDocument();
    expect(getBoxInput()).toBeInTheDocument();
  });

  it('adds a box when valid ID is entered', async () => {
    render(<MixingJob />);
    await userEvent.type(getBoxInput(), '1234C1');
    fireEvent.click(screen.getByText('+ Add Box'));
    await waitFor(() => expect(screen.getByText('1234C1')).toBeInTheDocument());
  });

  it('shows error if box not found', async () => {
    supabase.from().maybeSingle.mockResolvedValue({ data: null, error: null });
    render(<MixingJob />);
    await userEvent.type(getBoxInput(), '9999');
    fireEvent.click(screen.getByText('+ Add Box'));
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('No box found with ID "9999"'));
  });

  it('removes a box from the list', async () => {
    render(<MixingJob />);
    await userEvent.type(getBoxInput(), '1234C1');
    fireEvent.click(screen.getByText('+ Add Box'));
    await screen.findByText('1234C1');

    // THIS IS THE EXACT CHARACTER IN YOUR DOM: U+2715
    fireEvent.click(screen.getByText(/\u2715/));

    await waitFor(() => expect(screen.queryByText('1234C1')).not.toBeInTheDocument());
  });

  it('toggles partial box and enables new weight/location', async () => {
    render(<MixingJob />);
    await userEvent.type(getBoxInput(), '1234C1');
    fireEvent.click(screen.getByText('+ Add Box'));
    await screen.findByText('1234C1');
    await userEvent.click(screen.getByRole('checkbox'));
    const newWeightInput = screen.getByRole('spinbutton');
    expect(newWeightInput).toBeEnabled();
    expect(screen.getByPlaceholderText('Enter new location')).toBeInTheDocument();
  });

  it('calculates input weight correctly', async () => {
    render(<MixingJob />);
    await userEvent.type(getBoxInput(), '1234C1');
    fireEvent.click(screen.getByText('+ Add Box'));
    await screen.findByText('45.5', { selector: '.font-medium' });

    await userEvent.click(screen.getByRole('checkbox'));
    const newWeightInput = screen.getByRole('spinbutton');
    await userEvent.clear(newWeightInput);
    await userEvent.type(newWeightInput, '30');

    await waitFor(() => expect(screen.getByText('15.5')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.getByText('45.5', { selector: '.text-green-700' })).toBeInTheDocument());
  });

  it('completes mix: upserts bin, updates/deletes boxes, creates report', async () => {
    render(<MixingJob />);
    await userEvent.type(screen.getByPlaceholderText('Enter new process ID'), 'MIX-001');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Co2-1' } });

    // Box 1: partial
    await userEvent.type(getBoxInput(), '1234C1');
    fireEvent.click(screen.getByText('+ Add Box'));
    await screen.findByText('1234C1');
    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    await userEvent.type(screen.getByRole('spinbutton'), '20');

    // Box 2: full
    await userEvent.clear(getBoxInput());
    await userEvent.type(getBoxInput(), '5678C2');
    supabase.from().maybeSingle.mockResolvedValueOnce({
      data: { ...mockBox, Box_ID: '5678C2', Product: 'Apple' },
      error: null,
    });
    fireEvent.click(screen.getByText('+ Add Box'));
    await screen.findByText('5678C2');

    fireEvent.click(screen.getByText('Complete Mix'));

    await waitFor(() => {
      expect(supabase.from().upsert).toHaveBeenCalled();
      expect(supabase.from().update).toHaveBeenCalled();
      expect(supabase.from().delete).toHaveBeenCalled();
      expect(supabase.from().insert).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('✅ Mixing process complete and report saved!');
    });
  });

  it('shows total input weight', async () => {
    render(<MixingJob />);
    await userEvent.type(getBoxInput(), '1234C1');
    fireEvent.click(screen.getByText('+ Add Box'));
    await screen.findByText('45.5', { selector: '.font-medium' });
    expect(screen.getByText(/Total Input Weight: 45.5 lbs/)).toBeInTheDocument();
  });

  it('blocks completion if Process ID or CO2 Bin missing', () => {
    render(<MixingJob />);
    fireEvent.click(screen.getByText('Complete Mix'));
    expect(global.alert).toHaveBeenCalledWith('⚠️ Please enter a Process ID and select a Co2 bin.');
  });
});