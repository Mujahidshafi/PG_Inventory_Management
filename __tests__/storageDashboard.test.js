// __tests__/storageDashboard.test.js
import { render, screen } from "@testing-library/react";
import StorageDashboard from "../pages/storageDashboard";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("Storage Dashboard Page", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: pushMock });
  });

  // 4.16.1 Storage Dashboard / Render
  it("renders the Storage Dashboard page title", () => {
    render(<StorageDashboard />);
    expect(screen.getByText("Storage Dashboard")).toBeInTheDocument();
  });

  // 4.16.2 Storage Dashboard / Storage options present
  it("shows all storage category buttons", () => {
    render(<StorageDashboard />);

    expect(screen.getByText("Field Run Storage")).toBeInTheDocument();
    expect(screen.getByText("Clean Storage")).toBeInTheDocument();
    expect(screen.getByText("Screening Storage")).toBeInTheDocument();
    expect(screen.getByText("Inside Co2 Tanks")).toBeInTheDocument();
    expect(screen.getByText("Bagged Storage")).toBeInTheDocument();
    expect(screen.getByText("Rerun Storage")).toBeInTheDocument();
    expect(screen.getByText("Trash Storage")).toBeInTheDocument();
  });

  // 4.16.3 Storage Dashboard / Back button
  it("renders the Back button", () => {
    render(<StorageDashboard />);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });
});
