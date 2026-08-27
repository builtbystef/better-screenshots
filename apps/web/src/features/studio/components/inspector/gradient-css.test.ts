import type { GradientBackground } from "@/features/studio/composition/session";
import { gradientCss } from "@/features/studio/components/inspector/gradient-css";
import { expect, test } from "vite-plus/test";

test("renders the angle and every stop as a CSS linear gradient", () => {
  const value: GradientBackground = {
    type: "gradient",
    angle: 135,
    stops: [
      { offset: 0, color: "#ff0000" },
      { offset: 0.5, color: "#00ff00" },
      { offset: 1, color: "#0000ff" },
    ],
  };

  expect(gradientCss(value)).toBe("linear-gradient(135deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)");
});
