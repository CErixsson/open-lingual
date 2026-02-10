import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyState from "@/components/shared/EmptyState";
import { BookOpen } from "lucide-react";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon={BookOpen} title="No items" description="Nothing here yet" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders action button and handles click", async () => {
    const onAction = vi.fn();
    render(
      <EmptyState icon={BookOpen} title="Empty" description="Desc" actionLabel="Add" onAction={onAction} />
    );
    await userEvent.click(screen.getByText("Add"));
    expect(onAction).toHaveBeenCalled();
  });

  it("does not render button when no actionLabel", () => {
    render(<EmptyState icon={BookOpen} title="Empty" description="Desc" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
