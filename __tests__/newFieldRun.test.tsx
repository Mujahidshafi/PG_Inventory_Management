import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewFieldRun from "../pages/newFieldRun";

jest.mock("../components/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock("../components/button", () => ({
  __esModule: true,
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

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

jest.mock("../lib/supabaseClient", () => {
  const select = jest.fn((cols: string) => {
    if (cols === "location") {
      return Promise.resolve({
        data: [{ location: "HQ-1" }],
        error: null,
      });
    }

    const builder = {
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116" }, 
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
  test("shows error when required fields are empty", async () => {
    render(<NewFieldRun />);

    const saveButton = await screen.findByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    expect(
      await screen.findByText(/Location cannot be empty/i)
    ).toBeInTheDocument();

    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  test("allows Moisture to be empty and saves successfully", async () => {
  render(<NewFieldRun />);

  const locationSelect = await screen.findByLabelText(/select location/i);

  await waitFor(() => {
    expect(locationSelect).not.toBeDisabled();
    expect(
      screen.getByRole("option", { name: "HQ-1" })
    ).toBeInTheDocument();
  });

  await userEvent.selectOptions(locationSelect, "HQ-1");

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

  expect(screen.queryByText(/cannot be empty/i)).toBeNull();

  await waitFor(() => {
    expect(
      screen.getByText(/added new entry for hq-1/i)
    ).toBeInTheDocument();
  });
});


  test("calls backend insert when saving a new bin", async () => {
    const { __mockFns } = require("../lib/supabaseClient");
    const { insert } = __mockFns;

    insert.mockClear();

    render(<NewFieldRun />);

    const locationSelect = await screen.findByLabelText(/select location/i);

    await waitFor(() => {
      expect(locationSelect).not.toBeDisabled();
      expect(
        screen.getByRole("option", { name: "HQ-1" })
      ).toBeInTheDocument();
    });

    await userEvent.selectOptions(locationSelect, "HQ-1");

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

    const saveButton = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(insert).toHaveBeenCalled();
    });

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
