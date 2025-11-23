/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import EditFRStorageSuppliers from "../pages/editFRStorageSuppliers";


// Mocks

// Mock Layout
jest.mock("../components/layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock Supabase
jest.mock("../lib/supabase", () => {
  const from = jest.fn();
  return { supabase: { from } };
});

import { supabase } from "../lib/supabase";

// Mock Next.js Router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
}));


// Test Suite

describe("EditFRStorageSuppliers (unit tests)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn((url) => {
      if (url === "/api/fetchFRStorageLocation") {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { location: "Silo 1" },
            { location: "Silo 2" },
          ],
        });
      }

      if (url === "/api/fetchCustomers") {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { customer_id: "cust1", name: "John Doe", nickname: "JD" },
          ],
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  
  // 1) Basic Render
  
  it("renders main headings and form inputs", async () => {
    render(<EditFRStorageSuppliers />);

    expect(
      screen.getByText("Add / Delete Field Run Storage & Customers")
    ).toBeInTheDocument();

    expect(screen.getByText("Add Field Run Storage Location")).toBeInTheDocument();
    expect(screen.getByText("Add Customer")).toBeInTheDocument();
    expect(screen.getByText("Delete Field Run Storage Location")).toBeInTheDocument();
    expect(screen.getByText("Delete Customer")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter Field Run Storage Location")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter Customer Name")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Silo 1")).toBeInTheDocument();
      expect(screen.getByText("Silo 2")).toBeInTheDocument();
    });

    const johns = screen.getAllByText("John Doe");
    expect(johns.length).toBeGreaterThan(0);
  });

  
  // 2) Add Buttons Enable/Disable
  
  it("disables Add buttons when inputs are empty and enables them when filled", async () => {
    const user = userEvent.setup();
    render(<EditFRStorageSuppliers />);

    const storageInput = screen.getByPlaceholderText("Enter Field Run Storage Location");
    const customerInput = screen.getByPlaceholderText("Enter Customer Name");

    const [addStorageButton, addCustomerButton] = screen.getAllByRole("button", { name: "Add" });

    expect(addStorageButton).toBeDisabled();
    expect(addCustomerButton).toBeDisabled();

    await user.type(storageInput, "Silo X");
    expect(addStorageButton).not.toBeDisabled();

    await user.clear(storageInput);
    expect(addStorageButton).toBeDisabled();

    await user.type(customerInput, "New Customer");
    expect(addCustomerButton).not.toBeDisabled();
  });

  
  // 3) Duplicate Storage Error
  
  it("shows error message when Supabase insert returns duplicate location error", async () => {
    const user = userEvent.setup();

    const mockInsert = jest.fn().mockResolvedValue({
      error: { code: "23505" },
    });

    supabase.from.mockReturnValueOnce({ insert: mockInsert });

    render(<EditFRStorageSuppliers />);

    await screen.findByText("Silo 1");

    const input = screen.getByPlaceholderText("Enter Field Run Storage Location");
    const addStorageButton = screen.getAllByRole("button", { name: "Add" })[0];

    await user.type(input, "Silo 1");
    await user.click(addStorageButton);

    await waitFor(() => {
      expect(
        screen.getByText('Location "Silo 1" already exists.')
      ).toBeInTheDocument();
    });
  });

  
  // 4) Add Customer (Success)
  
  it("calls backend to add customer and shows success message", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn((url) => {
      if (url === "/api/addCustomer") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: "Customer added" }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(<EditFRStorageSuppliers />);

    const customerInput = screen.getByPlaceholderText("Enter Customer Name");
    const addCustomerButton = screen.getAllByRole("button", { name: "Add" })[1];

    await user.type(customerInput, "Alice");
    await user.click(addCustomerButton);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/addCustomer",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Customer added!")).toBeInTheDocument();
    });
  });

  
  // 5) Add Storage (Success)
  
  it("calls Supabase to add Field Run Storage and shows success message", async () => {
    const user = userEvent.setup();

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValueOnce({ insert: mockInsert });

    render(<EditFRStorageSuppliers />);

    await screen.findByText("Silo 1");

    const storageInput = screen.getByPlaceholderText("Enter Field Run Storage Location");
    const addStorageButton = screen.getAllByRole("button", { name: "Add" })[0];

    await user.type(storageInput, "Silo 3");
    await user.click(addStorageButton);

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        location: "Silo 3",
        lot_number: [],
        product: [],
        weight: 0,
        moisture: 0,
        date_stored: expect.any(String),
      }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("Field Run Storage location added!")).toBeInTheDocument();
    });

    expect(storageInput).toHaveValue("");
  });

  
  // 6) Duplicate Customer Error
  
  it("shows error message when backend rejects a duplicate customer name", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn((url) => {
      if (url === "/api/addCustomer") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Customer already exists" }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(<EditFRStorageSuppliers />);

    const customerInput = screen.getByPlaceholderText("Enter Customer Name");
    const addCustomerButton = screen.getAllByRole("button", { name: "Add" })[1];

    await user.type(customerInput, "Alice");
    await user.click(addCustomerButton);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/addCustomer",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Customer already exists")).toBeInTheDocument();
    });
  });

  
  // 7) Customer Nickname Menu Test
  
  it("opens the customer card menu and updates nickname via Supabase", async () => {
    const user = userEvent.setup();

    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));

    supabase.from.mockImplementation((tableName) => {
      return tableName === "customers" ? { update: updateMock } : {};
    });

    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Cool Nick");

    render(<EditFRStorageSuppliers />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    });

    const menuButtons = screen.getAllByRole("button", { name: "Open menu" });
    await user.click(menuButtons[0]);

    const editNicknameButton = await screen.findByText("Edit Nickname");
    await user.click(editNicknameButton);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ nickname: "Cool Nick" });
      expect(eqMock).toHaveBeenCalledWith("customer_id", "cust1");
    });

    expect(promptSpy).toHaveBeenCalledWith(
      'Set nickname for "John Doe"',
      "JD"
    );

    promptSpy.mockRestore();
  });

  
  // 8) Delete Dropdown: Storage
  
  it("populates the delete Field Run Storage dropdown with locations from the backend", async () => {
    render(<EditFRStorageSuppliers />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Silo 1" })).toBeInTheDocument();
    });

    const storageSelect = screen.getAllByRole("combobox")[0];
    const optionTexts = [...storageSelect.querySelectorAll("option")].map(
      (opt) => opt.textContent
    );

    expect(optionTexts).toEqual(
      expect.arrayContaining(["Select", "Silo 1", "Silo 2"])
    );
  });

  
  // 9) Delete Dropdown: Customer
  
  it("populates the delete Customer dropdown with customers from the backend", async () => {
    render(<EditFRStorageSuppliers />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "John Doe" })).toBeInTheDocument();
    });

    const customerSelect = screen.getAllByRole("combobox")[1];
    const optionTexts = [...customerSelect.querySelectorAll("option")].map(
      (opt) => opt.textContent
    );

    expect(optionTexts).toEqual(expect.arrayContaining(["Select", "John Doe"]));
  });

  
  // 10) Delete Storage
  
  it("deletes the selected Field Run Storage location when confirmed", async () => {
    const user = userEvent.setup();

    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<EditFRStorageSuppliers />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Silo 1" })).toBeInTheDocument();
    });

    const storageSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(storageSelect, "Silo 1");

    const deleteButton = screen.getAllByRole("button", { name: "Delete" })[0];
    await user.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/deleteFRStorageLocation",
        expect.objectContaining({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "Silo 1" }),
        })
      );
    });

    expect(alertSpy).toHaveBeenCalledWith('"Silo 1" deleted!');

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  
  // 11) Delete Customer
  
  it("deletes the selected customer when confirmed", async () => {
    const user = userEvent.setup();

    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<EditFRStorageSuppliers />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "John Doe" })).toBeInTheDocument();
    });

    const customerSelect = screen.getAllByRole("combobox")[1];
    await user.selectOptions(customerSelect, "cust1");

    const deleteButton = screen.getAllByRole("button", { name: "Delete" })[1];
    await user.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/delCustomer",
        expect.objectContaining({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "cust1" }),
        })
      );
    });

    expect(alertSpy).toHaveBeenCalledWith("Customer deleted!");

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

});
