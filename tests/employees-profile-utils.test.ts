import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanNullableText,
  normalizeStatusLabel,
  normalizeTagList,
  toOptionalNumber,
} from "../lib/employees/profile";

test("normalizeStatusLabel handles canonical statuses", () => {
  assert.deepEqual(normalizeStatusLabel("Active"), {
    status: "Active",
    isActive: true,
  });
  assert.deepEqual(normalizeStatusLabel("inactive"), {
    status: "Inactive",
    isActive: false,
  });
  assert.deepEqual(normalizeStatusLabel("On Leave"), {
    status: "On leave",
    isActive: false,
  });
});

test("normalizeStatusLabel understands partial matches", () => {
  assert.deepEqual(normalizeStatusLabel("Temporarily inactive"), {
    status: "Inactive",
    isActive: false,
  });
  assert.deepEqual(normalizeStatusLabel("currently active"), {
    status: "Active",
    isActive: true,
  });
  assert.deepEqual(normalizeStatusLabel("Leave of absence"), {
    status: "On leave",
    isActive: false,
  });
});

test("normalizeStatusLabel defaults to Active", () => {
  assert.deepEqual(normalizeStatusLabel(undefined), {
    status: "Active",
    isActive: true,
  });
  assert.deepEqual(normalizeStatusLabel(""), {
    status: "Active",
    isActive: true,
  });
});

test("cleanNullableText trims and nulls empty input", () => {
  assert.equal(cleanNullableText("  hello "), "hello");
  assert.equal(cleanNullableText("   "), null);
  assert.equal(cleanNullableText(null), null);
});

test("normalizeTagList trims, filters, and deduplicates case-insensitively", () => {
  const values = normalizeTagList(["  Poodle  ", "poodle", "  ", "Labrador", "labRador"]);
  assert.deepEqual(values, ["Poodle", "Labrador"]);
});

test("toOptionalNumber converts strings and ignores invalid values", () => {
  assert.equal(toOptionalNumber(5), 5);
  assert.equal(toOptionalNumber(" 6.5 "), 6.5);
  assert.equal(toOptionalNumber(""), null);
  assert.equal(toOptionalNumber("abc"), null);
  assert.equal(toOptionalNumber(null), null);
});
