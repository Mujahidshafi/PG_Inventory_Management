/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the same path the page imports
jest.mock('../lib/supabaseClient', () => {
  // point directly to your manual mock next to __tests__
  return require('../__mocks__/lib/supabaseClient.js');
});
import { supabase } from '../lib/supabaseClient';

// Page under test
import BaggingJob from '../pages/baggingJob';

// Silence jsdom's alert warning
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const [a] = args || [];
    if (a && typeof a === 'object' && /not implemented: window\.alert/i.test(String(a))) return;
  });
});

// Small helper to make an awaitable query object with a given result
const chainWith = (result) => {
  const q = {
    select: jest.fn(() => q),
    order: jest.fn(() => q),
    ilike: jest.fn(() => q),
    eq: jest.fn(() => q),

    single: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => result),

    insert: jest.fn(async (payload) => ({ data: null, error: null, payload })),
    update: jest.fn(async () => ({ data: null, error: null })),
    delete: jest.fn(async () => ({ data: null, error: null })),

    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
    catch: () => {},
  };
  return q;
};

beforeEach(() => {
  jest.clearAllMocks();
  global.alert = jest.fn();
  supabase.__reset();

  // Default Supabase behavior for Bagging page
  supabase.__setFromImpl((table) => {
    if (table === 'employees') {
      return chainWith({ data: [{ id: 1, name: 'Alex', active: true }], error: null });
    }
    if (table === 'customers') {
      return chainWith({ data: [{ id: 'acme-1', name: 'Acme' }], error: null });
    }
    if (table === 'inside_co2_bins') {
      // CO₂ bins list
      return chainWith({
        data: [{ id: 'CO2-1', location: 'Co2-1', lot_number: ['L-1'], product: ['GSP'], weight: 500 }],
        error: null
      });
    }
    if (table === 'physical_boxes') {
      return chainWith({ data: [], error: null });
    }
    if (table === 'clean_product_storage') {
      // When the user adds an input box
      return chainWith({
        data: [{ id: 'CB-1', box_id: 'CLEAN-100', product: 'GSP', weight: 50, source: 'clean_product_storage' }],
        error: null
      });
    }
    if (table === 'pallets' || table === 'bagging_reports') {
      // Writes target
      return chainWith({ data: null, error: null });
    }
    return chainWith({ data: null, error: null });
  });
});

async function renderReady() {
  render(<BaggingJob />);
  await screen.findByText(/Bagging Job/i);
}

test('renders and shows “Complete Job” button', async () => {
  await renderReady();

  expect(screen.getByRole('button', { name: /complete job/i })).toBeInTheDocument();

  const tables = supabase.__getFromCalls().map(([, t]) => t);
  expect(tables).toContain('employees');
});

test('fetches employees, CO₂ bins and physical_boxes on mount', async () => {
  await renderReady();

  const tables = supabase.__getFromCalls().map(([, t]) => t);
  expect(tables).toEqual(
    expect.arrayContaining(['employees', 'inside_co2_bins', 'physical_boxes'])
  );
});

test('blocks completion with validation alert when required fields are missing', async () => {
  await renderReady();

  await userEvent.click(screen.getByRole('button', { name: /complete job/i }));
  expect(global.alert).toHaveBeenCalled();
});

test.skip('happy path inserts pallets + report and updates CO₂ bins', async () => {
  await renderReady();

  // Select employee (find the select near the "Employee" label)
  const combos = screen.getAllByRole('combobox');
  const employeeSelect =
    combos.find((el) => el.previousElementSibling?.textContent?.match(/employee/i)) ||
    (screen.queryByText(/employee/i)?.closest('div')?.querySelector('select')) ||
    combos[0];

  await waitFor(() => {
    const hasAlex = within(employeeSelect).queryByRole('option', { name: /alex/i });
    expect(hasAlex).toBeInTheDocument();
  });
  await userEvent.selectOptions(employeeSelect, 'Alex');

  // Add an input box (from clean storage)
  const boxInput = screen.getByPlaceholderText(/Enter Box ID/i);
  await userEvent.type(boxInput, 'CLEAN-100');
  const addBoxBtn =
    screen.queryByRole('button', { name: /\+\s*add box/i }) ||
    screen.getByRole('button', { name: /add box/i });
  await userEvent.click(addBoxBtn);

  // Add one pallet output (+ 25 lb Pallet) and set bags to 1
  const add25Btn = screen.getByRole('button', { name: /\+\s*25 lb pallet/i });
  await userEvent.click(add25Btn);

  // Try to locate the "# Bags" number input and set it to 1
  // (Grab the first number input on the page after adding a pallet)
  const numberInputs = screen.getAllByRole('spinbutton');
  if (numberInputs.length) {
    await userEvent.clear(numberInputs[0]);
    await userEvent.type(numberInputs[0], '1');
  }

  // Complete Job
  await userEvent.click(screen.getByRole('button', { name: /complete job/i }));

  // We should have attempted writes to pallets and bagging_reports and touched CO₂ bins
  await waitFor(() => {
    const tables = supabase.__getFromCalls().map(([, t]) => t);
    expect(tables).toEqual(
      expect.arrayContaining(['pallets', 'bagging_reports', 'inside_co2_bins'])
    );
  });
});
