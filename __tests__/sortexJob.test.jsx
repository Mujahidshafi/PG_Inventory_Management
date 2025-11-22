/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the exact paths used by the page
jest.mock('../lib/supabaseClient', () => {
  // point directly to your manual mock next to __tests__
  return require('../__mocks__/lib/supabaseClient.js');
});
jest.mock('../components/scrollingLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock('../lib/labelPrint', () => ({
  printBoxLabel: jest.fn(),
}));

import { supabase } from '../lib/supabaseClient';
import SortexJob from '../pages/sortexJob';

// helper to produce an awaitable query object with a result
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

beforeAll(() => {
  // Quiet down jsdom “not implemented: alert”
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

beforeEach(() => {
  jest.clearAllMocks();
  supabase.__reset?.();

  // Default from() behavior used on mount and interactions
  supabase.__setFromImpl?.((table) => {
    if (table === 'employees') {
      return chainWith({ data: [{ name: 'Alex', active: true }], error: null });
    }
    if (table === 'customers') {
      return chainWith({ data: [], error: null });
    }
    if (table === 'field_run_storage_test') {
      return chainWith({ data: [], error: null });
    }
    if (table === 'physical_boxes') {
      return chainWith({ data: [], error: null });
    }
    // outputs / misc inserts during completion (not hit in these tests)
    return chainWith({ data: null, error: null });
  });

  // no-op alert so validation clicks don’t explode
  global.alert = jest.fn();
});

test('renders without crashing and shows a “Complete Job” button', async () => {
  render(<SortexJob />);

  // The page title should appear
  expect(await screen.findByText(/Sortex Cleaning Process/i)).toBeInTheDocument();

  // Button text is "Complete Job"
  expect(screen.getByRole('button', { name: /complete job/i })).toBeInTheDocument();

  // Smoke-check that employees were fetched
  const fromTables = supabase.__getFromCalls().map(([, t]) => t);
  expect(fromTables).toContain('employees');
});

test('fetches employees, customers, bins, and physical boxes on mount', async () => {
  render(<SortexJob />);

  await screen.findByText(/Sortex Cleaning Process/i);

  const fromTables = supabase.__getFromCalls().map(([, t]) => t);
  expect(fromTables).toEqual(
    expect.arrayContaining([
      'employees',
      'customers',
      'field_run_storage_test',
      'physical_boxes',
    ])
  );
});

test('blocks completion when required fields are missing', async () => {
  render(<SortexJob />);

  await screen.findByText(/Sortex Cleaning Process/i);

  await userEvent.click(screen.getByRole('button', { name: /complete job/i }));
  expect(global.alert).toHaveBeenCalled(); // validation alert fires
});
