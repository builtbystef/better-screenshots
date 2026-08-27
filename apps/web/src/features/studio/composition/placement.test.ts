import { expect, test } from "vite-plus/test";
import {
  browserWindowHeight,
  derivePlacement,
  gradientLine,
} from "@/features/studio/composition/placement";
import type { Composition } from "@/features/studio/composition/session";

const composition: Composition = {
  width: 1920,
  height: 1080,
  background: { type: "solid", color: "#112233" },
  screenshot: null,
  padding: 120,
  scale: 1,
  position: { x: 0, y: 0 },
  shadow: { offset: 16, blur: 32, opacity: 0.25 },
  border: { width: 0, color: "#FFFFFF" },
  radius: 16,
  browserWindow: "none",
  url: "",
};

test("placement fits an 800 by 600 Screenshot in the default Frame", () => {
  expect(derivePlacement(composition, { width: 800, height: 600 })).toEqual({
    inner: { x: 120, y: 120, width: 1680, height: 840 },
    fitted: { width: 1120, height: 840 },
    drawn: { x: 400, y: 120, width: 1120, height: 840 },
  });
});

test("placement includes the Browser window bar in the fitted height", () => {
  const placement = derivePlacement(
    { ...composition, browserWindow: "light" },
    { width: 800, height: 600 },
  );

  expect(placement.fitted.width).toBeCloseTo(1043.4782608695652);
  expect(placement.fitted.height).toBe(840);
  expect(browserWindowHeight(placement.drawn.width)).toBeCloseTo(57.391304347826086);
});

test("placement clamps excessive Padding while preserving a non-empty inner rect", () => {
  const placement = derivePlacement(
    { ...composition, padding: 10_000 },
    { width: 800, height: 600 },
  );

  expect(placement.inner).toEqual({ x: 539.5, y: 539.5, width: 841, height: 1 });
});

test("placement applies Scale and Position around the Frame center", () => {
  const placement = derivePlacement(
    { ...composition, scale: 2, position: { x: 100, y: -50 } },
    { width: 800, height: 600 },
  );

  expect(placement.drawn).toEqual({ x: -60, y: -350, width: 2240, height: 1680 });
});

test("gradient lines follow horizontal and vertical CSS angles", () => {
  expect(gradientLine(1920, 1080, 0)).toEqual({
    start: { x: 960, y: 1080 },
    end: { x: 960, y: 0 },
  });
  const horizontal = gradientLine(1920, 1080, 90);
  expect(horizontal.start.x).toBeCloseTo(0);
  expect(horizontal.start.y).toBeCloseTo(540);
  expect(horizontal.end.x).toBeCloseTo(1920);
  expect(horizontal.end.y).toBeCloseTo(540);
});
