import { expect, test } from "vite-plus/test";
import { browserWindowHeight, derivePlacement, gradientLine } from "./placement";
import type { Composition } from "./session";

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

const catalogGradientLines = [
  { angle: 180, start: [960, 0], end: [960, 1080] },
  {
    angle: 160,
    start: [674.148678082, -245.370052292],
    end: [1245.851321918, 1325.370052292],
  },
  { angle: 135, start: [210, -210], end: [1710, 1290] },
  {
    angle: 150,
    start: [486.173140978, -280.692193817],
    end: [1433.826859022, 1360.692193817],
  },
  {
    angle: 140,
    start: [297.453031967, -249.592729416],
    end: [1622.546968033, 1329.592729416],
  },
] as const;

test.each(catalogGradientLines)(
  "a $angle degree Catalog gradient spans the full Frame diagonal",
  ({ angle, start, end }) => {
    const line = gradientLine(1920, 1080, angle);

    expect(line.start.x).toBeCloseTo(start[0]);
    expect(line.start.y).toBeCloseTo(start[1]);
    expect(line.end.x).toBeCloseTo(end[0]);
    expect(line.end.y).toBeCloseTo(end[1]);
  },
);
