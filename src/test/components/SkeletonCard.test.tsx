import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SkeletonCard from "@/components/shared/SkeletonCard";

describe("SkeletonCard", () => {
  it("renders skeleton lines", () => {
    const { container } = render(<SkeletonCard lines={3} />);
    // Should render a card with skeleton elements
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("defaults to rendering without crashing", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeTruthy();
  });
});
