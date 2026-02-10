import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusChip from "@/components/shared/StatusChip";

vi.mock("@/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

describe("StatusChip", () => {
  it("renders the status label", () => {
    render(<StatusChip status="draft" />);
    expect(screen.getByText("lesson.status.draft")).toBeInTheDocument();
  });

  it("has aria-label with status", () => {
    render(<StatusChip status="published" />);
    expect(screen.getByText("lesson.status.published")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Status")
    );
  });
});
