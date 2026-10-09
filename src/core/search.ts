import { codeLookup, keycodes, searchKeycodes } from "../data/keycodes";
import { shortcutPresets } from "../data/shortcuts";
import {
  buildExpression,
  formatExpression,
  modifiers,
  readBuilder,
} from "./keycodes";
import {
  DataError,
  type BiText,
  type Builder,
  type Category,
  type Modifier,
  type Profile,
} from "./types";

export type SearchCategory = Category | "all" | "shortcuts";
export interface SearchResult {
  id: string;
  name: BiText;
  combination: string;
  code: string;
  builder: Builder;
  category: Category | "shortcuts";
  platform?: "windowsLinux" | "macOS";
}
export const initialBuilder: Builder = {
  mode: "basic",
  keycode: "KC_V",
  modifiers: [],
  layer: 1,
  action: "MO",
};
const modifierNames: Record<Modifier, string> = {
  LCTL: "Ctrl",
  LSFT: "Shift",
  LALT: "Alt",
  LGUI: "Win / Cmd",
  RCTL: "RCtrl",
  RSFT: "RShift",
  RALT: "RAlt",
  RGUI: "RWin / RCmd",
};
const textModifiers: Record<string, Modifier> = {
  ctrl: "LCTL",
  control: "LCTL",
  lctrl: "LCTL",
  lcontrol: "LCTL",
  leftctrl: "LCTL",
  lctl: "LCTL",
  shift: "LSFT",
  lshift: "LSFT",
  leftshift: "LSFT",
  lsft: "LSFT",
  alt: "LALT",
  option: "LALT",
  lalt: "LALT",
  leftalt: "LALT",
  win: "LGUI",
  windows: "LGUI",
  cmd: "LGUI",
  command: "LGUI",
  gui: "LGUI",
  lgui: "LGUI",
  lwin: "LGUI",
  lcmd: "LGUI",
  rctrl: "RCTL",
  rcontrol: "RCTL",
  rightctrl: "RCTL",
  rctl: "RCTL",
  rshift: "RSFT",
  rightshift: "RSFT",
  rsft: "RSFT",
  ralt: "RALT",
  rightalt: "RALT",
  altgr: "RALT",
  roption: "RALT",
  rwin: "RGUI",
  rcmd: "RGUI",
  rgui: "RGUI",
  rightwin: "RGUI",
  rightcmd: "RGUI",
};
function baseCode(value: string): string | undefined {
  const upper = value.toUpperCase();
  const known = codeLookup.get(upper);
  if (known) return known.code;
  if (/^[A-Z0-9]$/.test(upper) || /^F\d{1,2}$/.test(upper))
    return `KC_${upper}`;
  const common: Record<string, string> = {
    "-": "KC_MINS",
    "=": "KC_EQL",
    space: "KC_SPC",
    escape: "KC_ESC",
    delete: "KC_DEL",
    backspace: "KC_BSPC",
    right: "KC_RGHT",
    left: "KC_LEFT",
    up: "KC_UP",
    down: "KC_DOWN",
  };
  return (
    common[value.toLowerCase()] ??
    keycodes.find((k) => k.label.toLowerCase() === value.toLowerCase())?.code
  );
}
/** Parse one modifier chord, never a sequence of key presses. */
export function parseShortcut(query: string): Builder | null {
  if (!query.includes("+") || query.trim() === "+") return null;
  if (query.length > 300) throw new DataError("invalidShortcut");
  const parts = query
    .trim()
    .split("+")
    .map((part) => part.trim());
  // The final two separators denote the literal plus key: Ctrl++.
  if (parts.length >= 3 && parts.at(-1) === "" && parts.at(-2) === "")
    parts.splice(-2, 2, "+");
  const key = parts.pop();
  const mods = parts.map(
    (part) => textModifiers[part.toLowerCase().replace(/[\s_-]/g, "")],
  );
  if (!key || !parts.length || mods.some((mod) => !mod))
    throw new DataError("invalidShortcut");
  const keycode = baseCode(key);
  if (!keycode) throw new DataError("unknownKeycode", key);
  return {
    ...initialBuilder,
    mode: "shortcut",
    keycode,
    modifiers: [...new Set(mods)],
  };
}
export function describeCombination(
  builder: Builder,
  guiName?: string,
): string {
  const key = codeLookup.get(builder.keycode)?.label ?? builder.keycode;
  if (builder.mode !== "shortcut") return key;
  return [
    ...modifiers
      .filter((m) => builder.modifiers.includes(m))
      .map((m) => (guiName && m === "LGUI" ? guiName : modifierNames[m])),
    key,
  ].join("+");
}
function shortcutResults(profile: Profile): SearchResult[] {
  return shortcutPresets.map((preset) => ({
    ...preset,
    category: "shortcuts",
    combination: describeCombination(
      preset.builder,
      preset.platform === "macOS" ? "Cmd" : "Win",
    ),
    code: buildExpression(preset.builder, profile),
  }));
}
export function searchActions(
  query: string,
  category: SearchCategory,
  profile: Profile,
): { results: SearchResult[]; error?: DataError } {
  const trimmed = query.trim();
  const presets = shortcutResults(profile);
  try {
    const chord = parseShortcut(trimmed);
    const expression =
      !chord && /^[a-z_]+\s*\(/i.test(trimmed)
        ? readBuilder(formatExpression(trimmed))
        : null;
    if (chord || expression) {
      const builder = chord ?? expression!;
      const code = buildExpression(builder, profile);
      const kind = builder.mode === "shortcut" ? "shortcuts" : "special";
      const usePreset = !chord || !/win|windows|gui/i.test(trimmed);
      const result: SearchResult = (usePreset
        ? presets.find((p) => p.code === code)
        : undefined) ?? {
        id: `expression-${code}`,
        name: { zh: "自定义组合", en: "Custom combination" },
        combination: chord
          ? describeCombination(
              builder,
              /cmd|command/i.test(trimmed)
                ? "Cmd"
                : /win/i.test(trimmed)
                  ? "Win"
                  : undefined,
            )
          : code,
        code,
        builder,
        category: kind,
      };
      return {
        results: category === "all" || category === kind ? [result] : [],
      };
    }
  } catch (error) {
    return {
      results: [],
      error:
        error instanceof DataError ? error : new DataError("invalidExpression"),
    };
  }
  const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const shortcuts =
    category === "all" || category === "shortcuts"
      ? presets.filter((p) =>
          terms.every((term) =>
            `${p.name.zh} ${p.name.en} ${p.combination} ${p.code}`
              .toLowerCase()
              .includes(term),
          ),
        )
      : [];
  const basics: SearchResult[] =
    category === "shortcuts"
      ? []
      : searchKeycodes(query, category, profile).map((entry) => {
          const builder = {
            ...initialBuilder,
            keycode: entry.code,
            modifiers: [],
          };
          return {
            id: entry.code,
            name: entry.name,
            combination: entry.label,
            code: buildExpression(builder, profile),
            builder,
            category: entry.category,
          };
        });
  const exactCode = codeLookup.get(trimmed.toUpperCase())?.code;
  const results = [...shortcuts, ...basics];
  if (exactCode)
    results.sort(
      (a, b) => Number(b.id === exactCode) - Number(a.id === exactCode),
    );
  return { results };
}
