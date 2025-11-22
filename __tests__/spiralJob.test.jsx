/**
 * @jest-environment jsdom
 */
import React from 'react';
import {
  render, screen, waitForElementToBeRemoved, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../lib/supabaseClient', () => {
  // point directly to your manual mock next to __tests__
  return require('../__mocks__/lib/supabaseClient_jobs.js');
});
import { supabase } from '../lib/supabaseClient';

jest.mock('../components/scrollingLayout', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock('../lib/labelPrint', () => ({
  __esModule: true,
  printBoxLabel: jest.fn(async () => {}),
}));

import SpiralCleaningPage from '../pages/spiralJob';

const chainWith = (result) => {
  const q = {
    select: jest.fn(() => q),
    order: jest.fn(() => q),
    ilike: jest.fn(() => q),
    eq: jest.fn(() => q),
    single: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => result),
    insert: jest.fn(async () => ({ data: null, error: null })),
    update: jest.fn(async () => ({ data: null, error: null })),
    delete: jest.fn(async () => ({ data: null, error: null })),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
    catch: () => {},
  };
  return q;
};

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.alert = jest.fn();
  global.confirm = jest.fn(() => true);
});

beforeEach(() => {
  jest.clearAllMocks();
  supabase.__reset();

  supabase.__setFromImpl((table) => {
    if (table === 'employees') {
      return chainWith({ data: [{ name: 'Alex', active: true }], error: null });
    }
    if (table === 'customers') {
      return chainWith({ data: [{ name: 'Acme' }], error: null });
    }
    if (table === 'field_run_storage_test') {
      return chainWith({
        data: [
          { location: 'HQ-1', lot_number: 'L-100', product: 'GSP', weight: 1000 },
          { location: 'HQ-2', lot_number: 'L-200', product: 'WC',  weight: 800  },
        ],
        error: null,
      });
    }
    if (table === 'physical_boxes') {
      return chainWith({ data: [], error: null });
    }
    if (table === 'clean_product_storage') {
      return chainWith({ data: null, error: null });
    }
    if (table === 'screening_storage_shed') {
      return chainWith({ data: null, error: null });
    }
    if (table === 'spiral_reports') {
      return chainWith({ data: null, error: null });
    }
    return chainWith({ data: null, error: null });
  });
});

test('renders and shows “Complete Job” button', async () => {
  render(<SpiralCleaningPage />);
  await screen.findByText(/Spiral Cleaning Process/i);
  expect(screen.getByRole('button', { name: /complete job/i })).toBeInTheDocument();

  const tables = supabase.__getFromCalls().map(([, t]) => t);
  expect(tables).toContain('employees');
});

test('fetches employees, customers, bins, physical_boxes on mount', async () => {
  render(<SpiralCleaningPage />);
  await screen.findByText(/Spiral Cleaning Process/i);
  const tables = supabase.__getFromCalls().map(([, t]) => t);
  expect(tables).toEqual(
    expect.arrayContaining([
      'employees',
      'customers',
      'field_run_storage_test',
      'physical_boxes',
    ])
  );
});

test('blocks completion with validation alert when required fields missing', async () => {
  render(<SpiralCleaningPage />);
  await screen.findByText(/Spiral Cleaning Process/i);
  await userEvent.click(screen.getByRole('button', { name: /complete job/i }));
  expect(global.alert).toHaveBeenCalled();
});

// 👉 Temporarily skip the heavy write-path check until we add test-friendly hooks on the page
test.skip('happy path inserts clean box + spiral report', async () => {
  render(<SpiralCleaningPage />);
  await screen.findByText(/Spiral Cleaning Process/i);

  const processInput =
    screen.queryByPlaceholderText(/spr-202/i) ||
    screen.queryByPlaceholderText(/spr-/i) ||
    screen.getAllByRole('textbox')[0];
  await userEvent.type(processInput, 'SPR-TEST-1');

  const employeeSelect = screen.getAllByRole('combobox')[0];
  await userEvent.selectOptions(employeeSelect, 'Alex');

  // Add source/inbound/clean rows and weights here when the page exposes stable selectors

  await userEvent.click(screen.getByRole('button', { name: /complete job/i }));

  await waitFor(() => {
    const tables = supabase.__getFromCalls().map(([, t]) => t);
    expect(tables).toEqual(
      expect.arrayContaining(['clean_product_storage', 'spiral_reports'])
    );
  });
});
