import { expect, test } from "vite-plus/test";
import { cn } from "@/lib/utils";

test("cn merges conflicting Tailwind classes and drops falsy entries", () => {
  expect(cn("px-2 py-1", undefined, "px-4")).toBe("py-1 px-4");
});
