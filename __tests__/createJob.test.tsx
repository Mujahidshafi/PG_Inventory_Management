import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import CreateJob from "../pages/createJob";

global.fetch = jest.fn();

jest.mock("../components/layout", () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock("../components/textFields", () => ({
  __esModule: true,
  default: ({ id, label, type, value, onChange }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} />
    </div>
  ),
}));

jest.mock("../components/button", () => ({
  __esModule: true,
  default: ({ label, onClick }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

describe("CreateJob page", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test("shows modal error when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<CreateJob />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(
      await screen.findByText(/productDescription cannot be empty\./i)
    ).toBeInTheDocument();
  });

  test("submits form with filled fields and resets on success", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "Success", data: null }),
    });

    render(<CreateJob />);

    const productDescriptionInput = screen.getByLabelText(/product description/i);
    const locationInput = screen.getByLabelText(/location/i);
    const lotNumberInput = screen.getByLabelText(/lot number/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const processIdInput = screen.getByLabelText(/process id/i);
    const jobTypeSelect = screen.getByLabelText(/job type/i);
    const saveButton = screen.getByRole("button", { name: /save/i });

    await user.type(productDescriptionInput, "Corn");
    await user.type(locationInput, "Silo 12");
    await user.type(lotNumberInput, "P23C3");
    await user.type(amountInput, "1000");
    await user.type(processIdInput, "1234");
    await user.selectOptions(jobTypeSelect, "Qsage");

    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe("/api/createJobBackend");

    const fetchOptions = fetchCall[1];
    expect(fetchOptions.method).toBe("POST");
    const body = JSON.parse(fetchOptions.body);
    expect(body).toEqual({
      productDescription: "Corn",
      location: "Silo 12",
      lotNumber: "P23C3",
      amount: "1000",
      processId: "1234",
      jobType: "Qsage",
    });

    expect((productDescriptionInput as HTMLInputElement).value).toBe("");
    expect((locationInput as HTMLInputElement).value).toBe("");
    expect((lotNumberInput as HTMLInputElement).value).toBe("");
    expect((amountInput as HTMLInputElement).value).toBe("");
    expect((processIdInput as HTMLInputElement).value).toBe("");
    expect((jobTypeSelect as HTMLSelectElement).value).toBe("");
  });

  test("shows backend validation error from 400 response", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Field "amount" is required' }),
    });

    render(<CreateJob />);

    const productDescriptionInput = screen.getByLabelText(/product description/i);
    const locationInput = screen.getByLabelText(/location/i);
    const lotNumberInput = screen.getByLabelText(/lot number/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const processIdInput = screen.getByLabelText(/process id/i);
    const jobTypeSelect = screen.getByLabelText(/job type/i);
    const saveButton = screen.getByRole("button", { name: /save/i });

    await user.type(productDescriptionInput, "Corn");
    await user.type(locationInput, "Silo 12");
    await user.type(lotNumberInput, "P23C3");
    await user.type(amountInput, "1000");
    await user.type(processIdInput, "1234");
    await user.selectOptions(jobTypeSelect, "Qsage");

    await user.click(saveButton);

    expect(
      await screen.findByText(/field "amount" is required/i)
    ).toBeInTheDocument();
  });
});
