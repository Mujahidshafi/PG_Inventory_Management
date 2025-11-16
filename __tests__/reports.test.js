import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ReportsPage, { ReportModal } from "../pages/reports";

jest.mock("../lib/supabaseClient", () => {
    const _MutationChain = {

        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),

        mockResolvedValue: jest.fn(),
        mockResolvedValueOnce: jest.fn(),
        mockRejectedValue: jest.fn(),
    };

    const _Mocks = {
        select: jest.fn().mockReturnThis(), 

        delete: jest.fn(() => _MutationChain), 
        update: jest.fn(() => _MutationChain),
        insert: jest.fn(() => _MutationChain),
        
        rpc: jest.fn(),
    };

    return {
        supabase: {
            from: jest.fn(() => _Mocks),
            rpc: _Mocks.rpc, 
        },
        _Mocks: _Mocks,
        _MutationChain: _MutationChain, 
    };
});

import { supabase, _Mocks, _MutationChain } from "../lib/supabaseClient";

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockReportRow = {
  id: 1,
  process_id: "12423",
  process_type: "qsage",
  employee: "Jesus",
  lot_numbers: "23MB",
  products: "TRIT",
  supplier: "John",
  output_total: 500,
  created_at: "2025-01-01T10:00:00Z",
};

const makeSupabaseSuccess = (data = [mockReportRow]) => ({
  data: data,
  error: null,
});


describe("ReportsPage (default layout)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    _Mocks.select.mockResolvedValue(makeSupabaseSuccess());
  });

  it("loads reports and displays at least one row", async () => {
    render(<ReportsPage />);

    const rows = await screen.findAllByText("12423");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("renders correct table headers", async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Select/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Process ID")).toBeInTheDocument();
    expect(screen.getByText("Process Type")).toBeInTheDocument();
    expect(screen.getByText("Employee")).toBeInTheDocument();
    expect(screen.getByText("Lot Numbers")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Supplier")).toBeInTheDocument();
    expect(screen.getByText("Output Total (lbs)")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("shows empty-state message when no reports are returned", async () => {
    _Mocks.select.mockResolvedValueOnce({
        data: [],
        error: null,
    })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

    render(<ReportsPage />);

    const emptyMessage = await screen.findByText(/No reports found/i);
    expect(emptyMessage).toBeInTheDocument();
    });

    it("handles process type filter change and re-fetches data", async () => {
    _Mocks.select.mockResolvedValueOnce(makeSupabaseSuccess([{ ...mockReportRow, process_type: "Qsage" }]))
                        .mockResolvedValueOnce(makeSupabaseSuccess([]))
                        .mockResolvedValueOnce(makeSupabaseSuccess([]))
                        .mockResolvedValueOnce(makeSupabaseSuccess([]))
                        .mockResolvedValueOnce(makeSupabaseSuccess([]));

    render(<ReportsPage />);
    await screen.findByText("Qsage");

    const select = screen.getByRole('combobox', { name: '' });

    fireEvent.change(select, { target: { value: "Mixing" } });

    await waitFor(() => {
        expect(_Mocks.select).toHaveBeenCalledTimes(10); 
    });
});
}); 

describe("ReportsPage (ReportModal)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });   

  it("bagging - shows inputs and outputs", () => {
    const mockBagging = {
      process_type: "Bagging",
      process_id: "8165",
      created_at: "2025-01-01T10:00:00Z",
      employee: "Jessie",
      lot_numbers: "23MB",
      products: "WC",
      supplier: "Amys Kitchen",
      inputs: JSON.stringify({
        boxes: [
          { sourceTable: "clean_product_storage", boxId: "7520C2", product: "Bean", lotNumber: "24MB", amount: 30 }
        ],
        co2_draws: [
          { co2_bin: "Co2-1", products: ["GB"], lotNumbers: ["24MB"], weightLbs: 50 }
        ]
      }),
      outputs: JSON.stringify([
        { pallet_id: "PAL1", product: "GL", bag_type: "25lb", num_bags: 50, total_weight: 500, storage_location: "Freezer" }
      ])
    };

    render(<ReportModal report={mockBagging} onClose={() => {}} />);

    expect(screen.getByText("Inputs")).toBeInTheDocument();
    expect(screen.getByText("7520C2")).toBeInTheDocument();
    expect(screen.getByText("CO₂ Tank Inputs")).toBeInTheDocument();
    expect(screen.getByText("PAL1")).toBeInTheDocument();
  });

  it("orders - displays fulfilled items table", () => {
    const mockOrder = {
      process_type: "Order Fulfillment",
      process_id: "700",
      created_at: "2025-01-01T10:00:00Z",
      items: [
        {
          sourceType: "Clean",
          identifier: "735C1",
          lotNumbers: "23MB",
          products: "TRIT",
          supplier: "Sill's Farm",
          availableWeight: 500,
          removeWeight: 200,
          isPartial: true,
          newRemainingWeight: 300,
        },
      ],
      total_weight: 200,
    };

    render(<ReportModal report={mockOrder} onClose={() => {}} />);

    expect(screen.getByText("Fulfilled Items")).toBeInTheDocument();
    expect(screen.getByText("735C1")).toBeInTheDocument();
    expect(screen.getByText(/Total Weight Fulfilled/i)).toBeInTheDocument();
  });

  it("mixing - shows mix boxes and total weight", () => {
    const mockMix = {
      process_type: "Mixing",
      process_id: "4300",
      created_at: "2025-01-01",
      co2_bin: "Co2-2",
      boxes: JSON.stringify([
        { Box_ID: "4321SA1", Product: "GL", Lot_Number: "23MB", Original_Weight: 40, New_Box_Weight: 10, IsPartial: true }
      ]),
      total_weight: 30,
    };

    render(<ReportModal report={mockMix} onClose={() => {}} />);

    expect(screen.getByText("Boxes Used in Mix")).toBeInTheDocument();
    expect(screen.getByText("4321SA1")).toBeInTheDocument();
    expect(screen.getByText(/Total Weight Added to Bin/i)).toBeInTheDocument();
  });

  it("qsage/sortex - shows totals table", () => {
    const mockQsage = {
      process_type: "qsage",
      process_id: "3245",
      created_at: "2025-01-01",
      input_total: 1000,
      output_total: 900,
      clean_total: 850,
      rerun_total: 20,
      screenings_total: 10,
      trash_total: 5,
      balance: 15,
      inbound_boxes: "{}",
      outputs: "{}",
      totals: "{}",
    };

    render(<ReportModal report={mockQsage} onClose={() => {}} />);

    expect(screen.getByText("Totals")).toBeInTheDocument();
    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
  });
});

describe("ReportsPage: Delete Actions", () => {
    const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});
    const mockConfirm = jest.spyOn(window, "confirm");
    
    beforeEach(() => {
        jest.clearAllMocks();

        _MutationChain.mockResolvedValue.mockClear(); 
        _MutationChain.mockResolvedValueOnce.mockClear(); 
        _MutationChain.mockRejectedValue.mockClear(); 

        const initialReports = [
            { ...mockReportRow, id: 101, process_type: "Qsage", process_id: "Q-101" },
            { ...mockReportRow, id: 201, process_type: "Sortex", process_id: "S-201" },
            { ...mockReportRow, id: 301, process_type: "Mixing", process_id: "M-301" },
            { ...mockReportRow, id: 401, process_type: "Bagging", process_id: "B-401" },
            { ...mockReportRow, id: 501, process_type: "Order Fulfillment", process_id: "O-501" },
        ];
        _Mocks.select.mockResolvedValue(makeSupabaseSuccess(initialReports));
        mockConfirm.mockReturnValue(true); 

        _MutationChain.mockResolvedValue({ data: [], error: null });
    });

    afterAll(() => {
        mockAlert.mockRestore();
        mockConfirm.mockRestore();
    });

    it("executes handleDeleteByYear successfully using RPC", async () => {
        _Mocks.rpc.mockResolvedValue({ error: null });

        render(<ReportsPage />);
        await screen.findByText("Sortex"); 

        const yearInput = screen.getByPlaceholderText(/Year \(e.g\. 2023\)/i);
        fireEvent.change(yearInput, { target: { value: "2024" } });

        fireEvent.click(screen.getByText("Delete by Year"));

        await waitFor(() => {
            expect(supabase.rpc).toHaveBeenCalledWith("delete_reports_by_year", {
                target_year: 2024,
            });
            expect(mockAlert).toHaveBeenCalledWith("Reports from 2024 deleted.");
        });
    });

    it("handles RPC failure by falling back to manual deletion (covering manual branch logic)", async () => {
        _Mocks.rpc.mockResolvedValue({ error: new Error("RPC not found") });
        
        render(<ReportsPage />);

        await screen.findByText("Sortex"); 

        const yearInput = screen.getByPlaceholderText(/Year \(e.g\. 2023\)/i);
        fireEvent.change(yearInput, { target: { value: "2024" } });

        fireEvent.click(screen.getByText("Delete by Year"));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith("qsage_reports");
            expect(supabase.from).toHaveBeenCalledWith("sortex_reports");
            expect(supabase.from).toHaveBeenCalledWith("mixing_reports");

            expect(_MutationChain.gte).toHaveBeenCalledWith("created_at", "2024-01-01");
            expect(mockAlert).toHaveBeenCalledWith("Reports from 2024 deleted.");

            expect(_Mocks.select).toHaveBeenCalledTimes(10); 
        });
    });

  it("shows error if manual deletion fallback fails", async () => {
    _Mocks.rpc.mockResolvedValue({ error: new Error("RPC not found") });
    _MutationChain.mockResolvedValueOnce({ data: null, error: { message: "Qsage manual fail" } });

    _MutationChain.mockResolvedValueOnce({ data: null, error: null });

    _MutationChain.mockResolvedValueOnce({ data: null, error: null });

    render(<ReportsPage />);
    await screen.findByText("Qsage");

    const yearInput = screen.getByPlaceholderText(/Year \(e.g\. 2023\)/i);
    fireEvent.change(yearInput, { target: { value: "2024" } });

    fireEvent.click(screen.getByText("Delete by Year"));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledTimes(1);
    });
  });
});