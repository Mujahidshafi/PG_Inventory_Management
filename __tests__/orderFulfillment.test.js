import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrderFulfillmentPage from "../pages/orderFulfillment";
import { supabase } from "../lib/supabaseClient";

jest.mock("../lib/supabaseClient");

beforeEach(() => {
  jest.clearAllMocks();

  supabase.from.mockImplementation((table) => {
    if (table === "field_run_storage_test") {
      return {
        select: jest.fn().mockResolvedValue({
          data: [
            { location: "HQ-1", weight: 100, lot_number: [], product: [] }
          ],
          error: null
        })
      };
    }

    if (table === "employees") {
      return {
        select: jest.fn().mockResolvedValue({
          data: [{ name: "John", active: true }],
          error: null
        }),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ name: "John", active: true }],
          error: null
        })
      };
    }

    if (table === "customers") {
      return {
        select: jest.fn().mockResolvedValue({
          data: [{ name: "ACME Foods" }],
          error: null
        }),
        order: jest.fn().mockResolvedValue({
          data: [{ name: "ACME Foods" }],
          error: null
        })
      };
    }

    // Fallback for unused tables
    return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
  });
});

// Test if page renders correctly
test("renders Order Fulfillment heading", () => {
  render(<OrderFulfillmentPage />);
  expect(screen.getByText(/Order Fulfillment/i)).toBeInTheDocument();
});

//Validation warning appears when clicking Complete Fulfillment with no data
test("shows validation warning when clicking Complete Fulfillment with no data", async () => {
  render(<OrderFulfillmentPage />);

  fireEvent.click(
    screen.getByRole("button", { name: /Complete Fulfillment/i })
  );

  expect(
    await screen.findByText(/Ensure Process ID, Employee/i)
  ).toBeInTheDocument();
});

//Adding a bin removal displays a new row
test("adds a bin removal", async () => {
  render(<OrderFulfillmentPage />);

  // Wait for bins to load (combo box appears once async fetch resolves)
  await waitFor(() => {
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
  });

  // First combobox corresponds to Bin select
  const binSelect = screen.getAllByRole("combobox")[0];
  fireEvent.change(binSelect, { target: { value: "HQ-1" } });

  //Weight input
  const weightInput = screen.getByRole("spinbutton");
  fireEvent.change(weightInput, { target: { value: "10" } });

  //Click "+ Add Bin Removal"
  const addButton = screen.getByRole("button", { name: /\+ Add Bin Removal/i });
  fireEvent.click(addButton);

  expect(await screen.findByText("HQ-1")).toBeInTheDocument();

});


// Saving a draft displays a "Draft saved." status message
test("shows status message when saving draft", async () => {
  render(<OrderFulfillmentPage />);

  // Click the Save Draft button
  fireEvent.click(
    screen.getByRole("button", { name: /Save Draft/i })
  );

  // Expect the status message to appear
  expect(
    await screen.findByText(/Draft saved\./i)
  ).toBeInTheDocument();
});

// Clearing a draft displays a "Draft cleared." status message
test("shows status message when clearing draft", async () => {
  jest.spyOn(window, "confirm").mockReturnValue(true);

  render(<OrderFulfillmentPage />);

  // Click the Clear Draft button
  fireEvent.click(
    screen.getByRole("button", { name: /Clear Draft/i })
  );

  expect(
    await screen.findByText(/Draft cleared\./i)
  ).toBeInTheDocument();

  window.confirm.mockRestore();
});


