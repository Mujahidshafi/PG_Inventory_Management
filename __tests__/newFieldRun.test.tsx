import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewFieldRun from "../pages/newFieldRun";

// Mock Layout so it doesn't affect the test
jest.mock("../components/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Simple mock Button component
jest.mock("../components/button", () => ({
  __esModule: true,
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

// Simple mock TextFields so we can use getByLabelText
jest.mock("../components/textFields", () => ({
  __esModule: true,
  default: ({
    id,
    label,
    type,
    value,
    onChange,
    placeholder,
  }: {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Simple mock DateTimeField (not critical for validation)
jest.mock("../components/dateTimeField", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      aria-label="date-time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock supabase client
jest.mock("../lib/supabaseClient", () => {
  const select = jest.fn((cols: string) => {
    // Initial load of locations in useEffect
    if (cols === "location") {
      return Promise.resolve({
        data: [{ location: "HQ-1" }],
        error: null,
      });
    }

    // For fetching a single bin or maybeSingle
    const builder = {
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116" }, // no rows
          }),
        maybeSingle: () =>
          Promise.resolve({
            data: null,
            error: null,
          }),
      }),
    };

    return builder as any;
  });

  const update = jest.fn(() => ({
    eq: () => Promise.resolve({ error: null }),
  }));

  const insert = jest.fn(() => Promise.resolve({ error: null }));

  const from = jest.fn(() => ({
    select,
    update,
    insert,
  }));

  return {
    supabase: { from },
    __mockFns: { from, select, update, insert },
  };
});

describe("NewFieldRun page", () => {
  test("shows error modal when required fields are empty", async () => {
    render(<NewFieldRun />);

    const saveButton = await screen.findByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    // Should show the first required field error (Location)
    expect(
      await screen.findByText(/Location cannot be empty/i)
    ).toBeInTheDocument();

    // And the modal OK button should be visible
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  test("allows Moisture to be empty and saves successfully", async () => {
  render(<NewFieldRun />);

  // First get the select element
  const locationSelect = await screen.findByLabelText(/select location/i);

  // Wait until the locations are loaded and HQ-1 appears as an option
  await waitFor(() => {
    expect(locationSelect).not.toBeDisabled();
    // this will throw if HQ-1 isn't there yet, causing waitFor to retry
    expect(
      screen.getByRole("option", { name: "HQ-1" })
    ).toBeInTheDocument();
  });

  // Now it's safe to select HQ-1
  await userEvent.selectOptions(locationSelect, "HQ-1");

  // Fill required fields, leave Moisture blank
  await userEvent.type(
    screen.getByLabelText(/field lot number/i),
    "FL-123"
  );
  await userEvent.type(
    screen.getByLabelText(/product description/i),
    "WC"
  );
  await userEvent.type(
    screen.getByLabelText(/weight \(lbs\)/i),
    "500"
  );

  const saveButton = screen.getByRole("button", { name: /save/i });
  await userEvent.click(saveButton);

  // Modal should NOT appear
  expect(screen.queryByText(/cannot be empty/i)).toBeNull();

  // Status should report new entry for HQ-1
  await waitFor(() => {
    expect(
      screen.getByText(/added new entry for hq-1/i)
    ).toBeInTheDocument();
  });
});


  test("calls backend insert when saving a new bin", async () => {
    // Access our supabase mock fns
    const { __mockFns } = require("../lib/supabaseClient");
    const { insert } = __mockFns;

    // Clear previous calls just in case
    insert.mockClear();

    render(<NewFieldRun />);

    // Wait for location dropdown to be populated (HQ-1)
    const locationSelect = await screen.findByLabelText(/select location/i);

    await waitFor(() => {
      expect(locationSelect).not.toBeDisabled();
      expect(
        screen.getByRole("option", { name: "HQ-1" })
      ).toBeInTheDocument();
    });

    await userEvent.selectOptions(locationSelect, "HQ-1");

    // Fill required fields
    await userEvent.type(
      screen.getByLabelText(/field lot number/i),
      "FL-999"
    );
    await userEvent.type(
      screen.getByLabelText(/product description/i),
      "WC"
    );
    await userEvent.type(
      screen.getByLabelText(/weight \(lbs\)/i),
      "123"
    );
    // Moisture left blank on purpose

    const saveButton = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    // Wait for the insert to be called
    await waitFor(() => {
      expect(insert).toHaveBeenCalled();
    });

    // Grab the payload that was sent to supabase.insert(...)
    const insertCallArgs = insert.mock.calls[0][0];

    expect(insertCallArgs).toEqual(
      expect.objectContaining({
        location: "HQ-1",
        lot_number: ["FL-999"],
        product: ["WC"],
        weight: 123,
        moisture: null,
      })
    );
  });

});
