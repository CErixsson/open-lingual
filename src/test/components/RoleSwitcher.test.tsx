import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleSwitcher from "@/components/shared/RoleSwitcher";

vi.mock("@/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k.split(".").pop() }),
}));

describe("RoleSwitcher", () => {
  it("renders nothing with a single role", () => {
    const { container } = render(
      <RoleSwitcher roles={["learner"]} activeRole="learner" onRoleChange={() => {}} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders tabs for multiple roles", () => {
    render(
      <RoleSwitcher roles={["learner", "author"]} activeRole="learner" onRoleChange={() => {}} />
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("calls onRoleChange when tab is clicked", async () => {
    const onChange = vi.fn();
    render(
      <RoleSwitcher roles={["learner", "author"]} activeRole="learner" onRoleChange={onChange} />
    );
    await userEvent.click(screen.getByRole("tab", { name: "author" }));
    expect(onChange).toHaveBeenCalledWith("author");
  });
});
