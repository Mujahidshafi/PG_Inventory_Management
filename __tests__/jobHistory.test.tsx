import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JobHistory from "../pages/jobHistory";

jest.mock("../components/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock("../lib/supabaseClient", () => {
  const { fakeJobs } = require("../__mocks__/makeFakeJobs");

  console.log("JOB HISTORY FAKE JOBS:", fakeJobs);
  console.log("JOB HISTORY COUNT:", fakeJobs.length);

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

describe("JobHistory page", () => {
  test("Shows jobs that are not running AND complete", async () => {
    render(<JobHistory />);

    const { fakeJobs } = require("../__mocks__/makeFakeJobs");

    // Jobs that *should* be shown in JobHistory based on state
    const eligibleJobs = fakeJobs.filter(
      (job: any) => job.is_running === false && job.is_complete === true
    );
    console.log("Displayed Jobs:", eligibleJobs);

    await waitFor(() => {
      const lots = screen.queryAllByText(/P[1-9][0-2]?/);
      const displayedLotNumbers = lots.map((node) => node.textContent);

      for (const node of lots) {
        const lotText = node.textContent;
        const matchedJob = fakeJobs.find(
          (job: any) => job.lot_number === lotText
        );

        expect(matchedJob).toBeDefined();
        expect(matchedJob!.is_running).toBe(false);
        expect(matchedJob!.is_complete).toBe(true);
      }
    });
  });
});
