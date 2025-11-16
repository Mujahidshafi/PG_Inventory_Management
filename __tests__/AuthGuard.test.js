/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import AuthGuard from "../components/AuthGuard";
import { supabase } from "../lib/supabaseClient";

beforeAll(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
});

// Mock Supabase client
jest.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock session and client hooks from supabase-auth-helpers
jest.mock("@supabase/auth-helpers-react", () => ({
  useSession: jest.fn(),
  useSupabaseClient: jest.fn(),
}));

// Mock router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("AuthGuard", () => {
  let pushMock;
  let replaceMock;

  beforeEach(() => {
    pushMock = jest.fn();
    replaceMock = jest.fn();

    useRouter.mockReturnValue({
      pathname: "/",
      push: pushMock,
      replace: replaceMock,
    });

    jest.clearAllMocks();
  });

  const setup = async (session = null, roleData = { data: { role: "employee" } }) => {
    useSession.mockReturnValue(session);
    useSupabaseClient.mockReturnValue(supabase);

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(roleData),
    });

    render(
      <AuthGuard>
        <div>Child content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  };

  test("redirects to /login if no session", async () => {
    await setup(null);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });

  test("renders child when user is logged in and authorized", async () => {
    await setup({ user: { id: "123" } }, { data: { role: "employee" } });
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  test("redirects admin away from /login to /adminMenu", async () => {
    useRouter.mockReturnValue({
      pathname: "/login",
      push: pushMock,
      replace: replaceMock,
    });

    await setup({ user: { id: "123" } }, { data: { role: "admin" } });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/adminMenu");
    });

  });

  test("redirects employee away from /login to /employeeMenu", async () => {
    useRouter.mockReturnValue({
      pathname: "/login",
      push: pushMock,
      replace: replaceMock,
    });

    await setup({ user: { id: "123" } }, { data: { role: "employee" } });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/employeeMenu");
    });

  });


  test("renders child if user is employee on /employeeMenu", async () => {
    useRouter.mockReturnValue({
      pathname: "/employeeMenu",
      push: pushMock,
      replace: replaceMock,
    });

    await setup({ user: { id: "123" } }, { data: { role: "employee" } });
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  test("handles missing role gracefully (no crash)", async () => {
    await setup({ user: { id: "123" } }, { data: null });
    expect(screen.queryByText("Child content")).not.toBeNull();
  });
});
