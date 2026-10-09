import { describe, expect, it } from "vitest";
import {
  describeCombination,
  initialBuilder,
  parseShortcut,
  searchActions,
} from "../src/core/search";
import {
  buildExpression,
  dictionary,
  encodeExpression,
} from "../src/core/keycodes";
import { DataError, type Profile } from "../src/core/types";
import { advancedStringToKeycode } from "./reference/via-advanced-keys";
const profiles: Profile[] = ["legacy", "v8", "v9"];
describe.each(profiles)("single-key search / %s", (profile) => {
  it.each(["Ctrl+V", "ctrl + v", "CONTROL + V", "LCTL+KC_V"])(
    "parses %s as one paste chord",
    (query) => {
      const { results, error } = searchActions(query, "all", profile);
      expect(error).toBeUndefined();
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe("LCTL(KC_V)");
      expect(results[0].builder.modifiers).toEqual(["LCTL"]);
    },
  );
  it.each(["粘贴", "paste", "PASTE"])(
    "finds both platform presets with %s",
    (query) => {
      const { results } = searchActions(query, "all", profile);
      expect(results.map((r) => r.code)).toEqual(["LCTL(KC_V)", "LGUI(KC_V)"]);
      expect(results.map((r) => r.platform)).toEqual(["windowsLinux", "macOS"]);
    },
  );
  it.each([
    "复制",
    "剪切",
    "撤销",
    "重做",
    "全选",
    "保存",
    "查找",
    "Select all",
  ])("finds the named action %s", (query) => {
    expect(searchActions(query, "shortcuts", profile).results).toHaveLength(2);
  });
  it.each([
    ["Cmd+V", "LGUI(KC_V)"],
    ["Win+V", "LGUI(KC_V)"],
    ["Shift+Ctrl+Esc", "LCTL(LSFT(KC_ESC))"],
    ["RCtrl+RShift+A", "RCTL(RSFT(KC_A))"],
    ["Alt+F4", "LALT(KC_F4)"],
    ["ctrl+ctrl+v", "LCTL(KC_V)"],
    ["Ctrl++", "LCTL(LSFT(KC_EQL))"],
    ["Ctrl+Space", "LCTL(KC_SPC)"],
    ["Ctrl+!", "LCTL(LSFT(KC_1))"],
    ["Cmd+Shift+Z", "LSFT(LGUI(KC_Z))"],
    ["LCS(KC_ESCAPE)", "LCTL(LSFT(KC_ESC))"],
    ["LT(2, KC_SPACE)", "LT(2, KC_SPC)"],
  ])("generates %s through the shared encoder", (query, expected) => {
    const { results, error } = searchActions(query, "all", profile);
    expect(error).toBeUndefined();
    expect(results[0].code).toBe(expected);
    expect(buildExpression(results[0].builder, profile)).toBe(expected);
    expect(encodeExpression(expected, profile)).toBe(
      advancedStringToKeycode(expected, dictionary(profile)),
    );
  });
  it.each([
    "Ctrl+",
    "Ctrl+Bogus",
    "Hyper+V",
    "Ctrl+V+C",
    "Ctrl++V",
    "Ctrl+RShift+V",
    "Ctrl+Volume Up",
    "MO(32)",
  ])("does not offer an invalid result for %s", (query) => {
    const result = searchActions(query, "all", profile);
    expect(result.results).toEqual([]);
    expect(result.error).toBeInstanceOf(DataError);
  });
  it("returns single-key builders with clean modifiers", () => {
    const result = searchActions("KC_V", "basic", profile).results[0];
    expect(result.builder.mode).toBe("basic");
    expect(result.builder.modifiers).toEqual([]);
    expect(result.code).toBe("KC_V");
    const plus = searchActions("KC_PLUS", "symbols", profile).results[0];
    expect(plus.builder.mode).toBe("basic");
    expect(plus.code).toBe("LSFT(KC_EQL)");
  });
  it("respects categories and dictionary compatibility", () => {
    expect(searchActions("粘贴", "basic", profile).results).toEqual([]);
    expect(searchActions("Ctrl+V", "media", profile).results).toEqual([]);
    expect(searchActions("KC_ESC", "shortcuts", profile).results).toEqual([]);
    const results = searchActions("", "all", profile).results;
    expect(new Set(results.map((r) => r.id)).size).toBe(results.length);
    for (const result of results) {
      expect(buildExpression(result.builder, profile)).toBe(result.code);
      expect(encodeExpression(result.code, profile)).toBe(
        dictionary(profile)[result.code] ??
          advancedStringToKeycode(result.code, dictionary(profile)),
      );
    }
  });
});
it("keeps unrecognized plain text as empty search rather than interpreting it as a chord", () => {
  expect(parseShortcut("粘贴")).toBeNull();
  expect(searchActions("no-such-key", "all", "legacy")).toEqual({
    results: [],
  });
  expect(describeCombination(initialBuilder)).toBe("V");
});

it("prioritizes an exact basic keycode over shortcuts containing it", () => {
  const result = searchActions("KC_V", "all", "legacy").results[0];
  expect(result.code).toBe("KC_V");
  expect(result.builder.mode).toBe("basic");
});
it("finds literal symbols instead of treating them as expression syntax", () => {
  for (const [query, keycode] of [
    ["+", "KC_PLUS"],
    ["(", "KC_LPRN"],
    [")", "KC_RPRN"],
  ]) {
    const { results, error } = searchActions(query, "symbols", "legacy");
    expect(error).toBeUndefined();
    expect(results.map((r) => r.builder.keycode)).toContain(keycode);
  }
});
it("does not label a Win chord as a macOS action", () => {
  const result = searchActions("Win+V", "all", "legacy").results[0];
  expect(result.combination).toBe("Win+V");
  expect(result.platform).toBeUndefined();
  expect(result.name.en).toBe("Custom combination");
});
