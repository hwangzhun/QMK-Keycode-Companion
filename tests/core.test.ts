import { describe, it, expect } from "vitest";
import { keycodes, searchKeycodes } from "../src/data/keycodes";
import {
  buildExpression,
  dictionary,
  encodeExpression,
  readBuilder,
} from "../src/core/keycodes";
import { type Builder, DataError, type Profile } from "../src/core/types";
import { advancedStringToKeycode } from "./reference/via-advanced-keys";
import { messages } from "../src/i18n";
const profiles: Profile[] = ["legacy", "v8", "v9"];
const builder: Builder = {
  mode: "basic",
  keycode: "KC_ESC",
  modifiers: [],
  layer: 1,
  action: "MO",
};
function expectError(action: () => unknown, key: string) {
  expect(action).toThrow(DataError);
  try {
    action();
  } catch (error) {
    expect((error as DataError).key).toBe(key);
  }
}
describe("bilingual catalog and compatibility", () => {
  it.each(["音量增加", "Volume Up", "KC_AUDIO_VOL_UP", "KC_VOLU"])(
    "finds volume with %s",
    (query) =>
      expect(
        searchKeycodes(query, "all", "legacy").map((k) => k.code),
      ).toContain("KC_VOLU"),
  );
  it("filters category and lighting dictionary", () => {
    expect(searchKeycodes("KC_ESC", "media", "legacy")).toEqual([]);
    expect(searchKeycodes("RGB_TOG", "lighting", "legacy")).toHaveLength(1);
    expect(searchKeycodes("RGB_TOG", "lighting", "v8")).toHaveLength(0);
    expect(searchKeycodes("UG_TOGG", "lighting", "v9")).toHaveLength(1);
  });
  it("every message and catalog entry has both languages", () => {
    for (const pair of Object.values(messages)) {
      expect(pair[0].length).toBeGreaterThan(0);
      expect(pair[1].length).toBeGreaterThan(0);
    }
    for (const key of keycodes) {
      expect(key.name.zh).toBeTruthy();
      expect(key.name.en).toBeTruthy();
    }
  });
});
describe.each(profiles)("expression encoder / %s", (profile) => {
  it("generates basic aliases and US ANSI shifted keys", () => {
    expect(buildExpression({ ...builder, keycode: "KC_ENTER" }, profile)).toBe(
      "KC_ENT",
    );
    expect(buildExpression({ ...builder, keycode: "KC_PLUS" }, profile)).toBe(
      "LSFT(KC_EQL)",
    );
    expect(encodeExpression("LSFT(KC_EQL)", profile)).toBe(0x22e);
  });
  it("generates Ctrl Shift Esc accepted by upstream VIA", () => {
    const code = buildExpression(
      { ...builder, mode: "shortcut", modifiers: ["LSFT", "LCTL"] },
      profile,
    );
    expect(code).toBe("LCTL(LSFT(KC_ESC))");
    expect(encodeExpression(code, profile)).toBe(0x329);
    expect(advancedStringToKeycode(code, dictionary(profile))).toBe(0x329);
  });
  it.each(["MO", "TG", "TO", "DF", "OSL", "TT"] as const)(
    "generates %s supported by VIA",
    (action) => {
      const code = buildExpression(
        { ...builder, mode: "layer", action, layer: 3 },
        profile,
      );
      expect(encodeExpression(code, profile)).toBe(
        advancedStringToKeycode(code, dictionary(profile)),
      );
    },
  );
  it("generates validated tap hold expressions accepted by VIA", () => {
    for (const code of [
      buildExpression(
        { ...builder, mode: "modtap", modifiers: ["RCTL", "RSFT"] },
        profile,
      ),
      buildExpression(
        { ...builder, mode: "layertap", layer: 15, keycode: "KC_SPC" },
        profile,
      ),
    ]) {
      expect(encodeExpression(code, profile)).toBe(
        advancedStringToKeycode(code, dictionary(profile)),
      );
    }
    expect(encodeExpression("MT(MOD_LCTL | MOD_LSFT, KC_ESC)", profile)).toBe(
      0x2329,
    );
    expect(encodeExpression("LT(15, KC_SPC)", profile)).toBe(0x4f2c);
  });
  it("normalizes nested aliases and modifier-tap shortcuts for VIA", () => {
    for (const raw of [
      "LCMD(KC_ENTER)",
      "LCS(KC_ESCAPE)",
      "LCTL_T(KC_SPACE)",
    ]) {
      const code = buildExpression({ ...builder, keycode: raw }, profile);
      expect(encodeExpression(code, profile)).toBe(
        advancedStringToKeycode(code, dictionary(profile)),
      );
    }
  });
  it("every generated catalog code passes the actual VIA parser", () => {
    for (const entry of keycodes.filter((k) => k.profiles.includes(profile))) {
      const code = buildExpression(
        { ...builder, keycode: entry.code },
        profile,
      );
      const upstream = Object.hasOwn(dictionary(profile), code)
        ? dictionary(profile)[code]
        : advancedStringToKeycode(code, dictionary(profile));
      expect(encodeExpression(code, profile), code).toBe(upstream);
    }
  });
  it("rejects silent truncation and mixed modifiers", () => {
    expectError(
      () =>
        buildExpression({ ...builder, mode: "layertap", layer: 16 }, profile),
      "layerTapRange",
    );
    expectError(
      () => buildExpression({ ...builder, mode: "layer", layer: 32 }, profile),
      "layerRange",
    );
    expectError(
      () => buildExpression({ ...builder, mode: "layer", layer: 1.5 }, profile),
      "invalidLayer",
    );
    expectError(
      () => buildExpression({ ...builder, mode: "layer", layer: NaN }, profile),
      "invalidLayer",
    );
    expectError(
      () =>
        buildExpression(
          {
            ...builder,
            mode: "modtap",
            modifiers: ["LCTL"],
            keycode: "KC_PLUS",
          },
          profile,
        ),
      "basicTapOnly",
    );
    expectError(
      () =>
        buildExpression(
          { ...builder, mode: "layertap", keycode: "LCTL(KC_C)" },
          profile,
        ),
      "basicTapOnly",
    );
    expectError(
      () =>
        buildExpression(
          { ...builder, mode: "shortcut", modifiers: ["LCTL", "RSFT"] },
          profile,
        ),
      "mixedModifiers",
    );
    expectError(
      () =>
        buildExpression(
          { ...builder, mode: "shortcut", modifiers: [] },
          profile,
        ),
      "chooseModifier",
    );
    expectError(
      () => encodeExpression("KC_A)garbage", profile),
      "unknownKeycode",
    );
    expectError(() => encodeExpression("MO(2)KC_A", profile), "unknownKeycode");
  });
  it("reads generator output back into controls", () => {
    for (const value of [
      {
        ...builder,
        mode: "shortcut" as const,
        modifiers: ["LCTL", "LSFT"] as Builder["modifiers"],
      },
      {
        ...builder,
        mode: "modtap" as const,
        modifiers: ["RCTL"] as Builder["modifiers"],
      },
      { ...builder, mode: "layertap" as const, layer: 2 },
      { ...builder, mode: "layer" as const, action: "TG" as const },
    ]) {
      const code = buildExpression(value, profile);
      expect(buildExpression(readBuilder(code), profile)).toBe(code);
    }
  });
});
