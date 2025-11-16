import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: "Job started" }),
  })
) as any;

jest.mock("../components/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock("../lib/supabaseClient", () => {
  //Import fake jobs
  const { fakeJobs } = require("../__mocks__/makeFakeJobs");
  
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

import Jobs from "../pages/jobs";

describe("Jobs page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TEST 1
  test("Shows created jobs that are not running AND not complete", async () => {
    render(<Jobs />);

    await waitFor(() => {
      const types = screen.getAllByText(/Sortex|Bagging|Qsage|Order Fulfillment/);
      expect(types.length).toBeGreaterThan(0);
    });

    const lots = screen.getAllByText(/P[1-9][0-2]?/);
    expect(lots.length).toBeGreaterThan(0);

    const runBtns = screen.getAllByRole("button", { name: /run/i });
    expect(runBtns.length).toBeGreaterThan(0);
  });

  // TEST 2
  test("Clicking Run button calls the backend", async () => {
    render(<Jobs />);

    const runBtns = await screen.findAllByRole("button", { name: /run/i });

    await userEvent.click(runBtns[0]);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const { fakeJobs } = require("../__mocks__/makeFakeJobs");
    const expectedProcessId = fakeJobs[0].process_id;

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/jobsBackend",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId: expectedProcessId }),
      })
    );
  });
});
