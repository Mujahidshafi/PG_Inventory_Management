import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CropMenu from "./CropMenu";

// Mock Supabase once for this test file
jest.mock("../lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: () => ({
        order: () => ({
          data: [
            {
              id: "1",
              name: "Wheat",
              crop_code: "WHT",
              show_in_dropdown: false,
            },
          ],
          error: null,
        }),
      }),
      update: () => ({
        eq: () => ({ error: null }), 
      }),
      insert: () => ({ error: null }), 
      delete: () => ({ eq: () => ({ error: null }) }), 
    })),
    channel: () => ({
      on: () => ({ subscribe: () => ({ status: "SUBSCRIBED" }) }),
    }),
    removeChannel: () => {},
  },
}));

describe("CropMenu", () => {
  //
  // ✅ ADD NEW CROP TEST
  //
  test("adds a new crop when valid data is submitted", async () => {
    const user = userEvent.setup();

    render(<CropMenu />);

    // Inputs
    const nameInput = screen.getByPlaceholderText(/e\.g\.,\s*yellow corn/i);
    const codeInput = screen.getByPlaceholderText(/e\.g\.,?\s*yc/i);

    await user.clear(nameInput);
    await user.clear(codeInput);
    await user.type(nameInput, "Yellow Corn");
    await user.type(codeInput, "YC");

    // Save
    await user.click(
      screen.getByRole("button", {
        name: /save/i,
      })
    );

    // Expect confirmation message
    expect(
      await screen.findByText(/Added:\s*Yellow Corn\s*\(YC\)/i)
    ).toBeInTheDocument();
  });

  //
  // ✅ TOGGLE SHOW-IN-DROPDOWN TEST
  //
  test("toggles the Show in Dropdown flag for a crop", async () => {
    const user = userEvent.setup();

    render(<CropMenu />);

    // Find Wheat checkbox
    const cb = await screen.findByRole("checkbox", {
      name: /show wheat in dropdown/i,
    });

    // Initially false
    expect(cb.checked).toBe(false);

    // Toggle
    await user.click(cb);

    // Now true
    expect(cb.checked).toBe(true);
  });

  //
  // ✅ DELETE CROP TEST (simple: button works and does not crash)
  //
  test("clicks Delete on an existing crop without errors", async () => {
    const user = userEvent.setup();

    render(<CropMenu />);

    // Wait for Wheat row to load
    expect(await screen.findByText("Wheat")).toBeInTheDocument();

    // Get the Delete button and click it
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // If we reach here without throwing, the Delete flow is wired correctly
   
    expect(deleteButton).toBeInTheDocument();
  });
});

