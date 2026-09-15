import { z } from "zod";

/**
 * An optional text field posted from a form.
 *
 * `FormData.get()` returns `null` for a control that is not in the DOM, and
 * Zod's `.optional()` accepts `undefined` but *not* `null` — so a field that is
 * conditionally rendered (a week picker on a course with no weeks, an office
 * picker for a coordinator with one office) fails validation with an error
 * message that has nowhere to render, and the form silently does nothing.
 *
 * This normalises null, undefined and "" to `undefined`, so "not provided" is
 * spelled one way regardless of whether the control existed.
 */
export function optionalFormString(max = 500) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v === "" ? undefined : v))
    .refine((v) => v === undefined || v.length <= max, `Keep this under ${max} characters`);
}

/** An optional id posted from a form — same null handling, no length message. */
export function optionalFormId() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v === "" ? null : v));
}
