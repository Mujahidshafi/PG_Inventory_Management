// pages/CropMenu.test.js
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Virtual mock so the module doesn't need to exist on disk
jest.mock("../lib/supabase", () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        // load(): select().order()
        select: () => ({
          order: () => ({
            data: [
              { id: "1", name: "Wheat", crop_code: "WHT", show_in_dropdown: false },
            ],
            error: null,
          }),
        }),
        // toggleVisible(): update().eq()
        update: () => ({
          eq: () => ({ error: null }), // success by default
        }),
        // stubs for completeness
        insert: () => ({ error: null }),
        delete: () => ({ eq: () => ({ error: null }) }),
      })),
      channel: () => ({
        on: () => ({ subscribe: () => ({ status: "SUBSCRIBED" }) }),
      }),
      removeChannel: () => {},
    },
  };
}, { virtual: true }); // ← IMPORTANT

import CropMenu from "../pages/CropMenu";

test("checkbox toggles on click (optimistic)", async () => {
  render(<CropMenu />);

  const cb = await screen.findByRole("checkbox", { name: /show wheat in dropdown/i });
  expect(cb).not.toBeChecked();

  await userEvent.click(cb);
  expect(cb).toBeChecked();
});
