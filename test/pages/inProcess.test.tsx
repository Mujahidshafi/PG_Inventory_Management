import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: "Job marked complete" }),
  })
) as any;

jest.mock("../../components/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock("../../lib/supabaseClient", () => {
  //Import fake jobs
  const { fakeJobs } = require("../data/makeFakeJobs"); 

  //Show fake jobs
  console.log("FAKE JOBS:", fakeJobs);
  console.log("COUNT:", fakeJobs.length);

  const order = jest.fn().mockResolvedValue({ data: fakeJobs, error: null });
  const eq2 = jest.fn(() => ({ order }));
  const eq1 = jest.fn(() => ({ eq: eq2 }));
  const select = jest.fn(() => ({ eq: eq1 }));
  const from = jest.fn(() => ({ select }));

  return {
    supabase: { from },
    __mockFns: { from, select, eq1, eq2, order, fakeJobs },
  };
});

import InProcess from "../../pages/inProcess";

describe("InProcess page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //TEST 1
  test("Shows jobs that are running AND not complete", async () => {
    render(<InProcess />);

    await waitFor(() => {
      const jobTypes = screen.getAllByText(/Sortex|Bagging|Qsage|Order Fulfillment/);
      expect(jobTypes.length).toBeGreaterThan(0);
    });

    const lotNumbers = screen.getAllByText(/P[0-9]+/);
    expect(lotNumbers.length).toBeGreaterThan(0);

    const buttons = screen.getAllByRole("button", { name: /complete/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  //TEST 2
  test("Clicking Complete button calls backend", async () => {
    render(<InProcess />);

    const buttons = await screen.findAllByRole("button", { name: /complete/i });

    await userEvent.click(buttons[0]);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const { fakeJobs } = require("../data/makeFakeJobs");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/inProcessBackend",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId: fakeJobs[0].process_id }),
      })
    );
  });
});
