import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const palette = readFileSync(new URL("./palette.ts", import.meta.url), "utf8");

const required = [
  ["--color-brand-primary", "#B94735"],
  ["--color-brand-primary-hover", "#9E3D2F"],
  ["--color-brand-accent", "#F0D58A"],
  ["--color-brand-warm", "#DDAE99"],
  ["--color-background", "#FFF7E9"],
  ["--color-surface", "#FFFFFF"],
  ["--color-surface-subtle", "#FBF3E8"],
  ["--color-text", "#453B35"],
  ["--color-text-muted", "#756A62"],
  ["--color-border", "#E9DED1"],
  ["--color-success", "#39785A"],
  ["--color-warning", "#9A681C"],
  ["--color-danger", "#B33E32"],
];

test("los tokens Tomato & Butter están centralizados en CSS", () => {
  for (const [token, hex] of required) {
    assert.match(css, new RegExp(`${token}:\\s*${hex}`, "i"));
    assert.match(palette, new RegExp(hex, "i"));
  }
});

test("la paleta declarada en TypeScript coincide con el CSS", () => {
  const declared = [...palette.matchAll(/hex:\s*"(#[0-9A-Fa-f]{6})"/g)].map(
    (match) => match[1],
  );
  assert.equal(declared.length, required.length);
  for (const hex of declared) {
    assert.match(css, new RegExp(hex, "i"));
  }
});
