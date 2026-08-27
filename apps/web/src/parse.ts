import type { HexColor } from "./session";

const HEX_DIGITS = /^#?([0-9A-Fa-f]{6})$/;

export function parseHex(raw: string): HexColor | "refuse" {
  const match = HEX_DIGITS.exec(raw);
  return match === null ? "refuse" : `#${match[1]}`;
}

const INTEGER = /^[+-]?\d+$/;

export function parseInteger(raw: string): number | "refuse" {
  const trimmed = raw.trim();
  return INTEGER.test(trimmed) ? Number(trimmed) : "refuse";
}

const DECIMAL = /^[+-]?\d+(\.\d+)?$/;

export function parseScale(raw: string): number | "refuse" {
  const trimmed = raw.trim();
  if (!DECIMAL.test(trimmed)) {
    return "refuse";
  }
  const value = Number(`${Math.round(Number(`${trimmed}e2`))}e-2`);
  return value <= 0 ? "refuse" : value;
}

export function parseNonNegativeInteger(raw: string): number | "refuse" {
  const parsed = parseInteger(raw);
  return parsed === "refuse" || parsed < 0 ? "refuse" : parsed;
}

export function parseOpacityPercent(raw: string): number | "refuse" {
  const parsed = parseInteger(raw);
  return parsed === "refuse" || parsed < 0 || parsed > 100 ? "refuse" : parsed;
}

export function formatScale(value: number): string {
  return value.toFixed(2);
}
