import { expect, test } from "vite-plus/test";
import { cn } from "@/lib/utils";

test("cn keeps the last of two conflicting Tailwind utilities", () => {
  expect(cn("px-2 py-1", "px-3")).toBe("py-1 px-3");
});

test("cn drops falsy branches and joins what is left", () => {
  expect(cn("rounded-md", false, null, undefined, "border")).toBe("rounded-md border");
});
