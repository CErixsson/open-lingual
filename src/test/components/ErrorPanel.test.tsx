import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPanel from "@/components/shared/ErrorPanel";

vi.mock("@/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

describe("ErrorPanel", () => {
  it("renders error alert and retry button", () => {
    render(<ErrorPanel onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onRetry when button is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorPanel onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalled();
  });
});
