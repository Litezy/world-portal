import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { settings } from "@/content/admin";
import { NotificationSettings } from "@/features/settings/components/notification-settings";

describe("NotificationSettings", () => {
  it("shows every staff alert as off and unavailable, never as working", () => {
    render(<NotificationSettings />);

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(settings.notifications.items.length);
    for (const toggle of switches) {
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveAttribute("aria-checked", "false");
    }
  });

  it("says why the alerts cannot be switched on", () => {
    render(<NotificationSettings />);

    expect(screen.getByText(settings.notifications.unavailable)).toBeInTheDocument();
  });
});
