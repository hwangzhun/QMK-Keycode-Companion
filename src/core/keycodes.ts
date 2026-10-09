import dictionaries from "../data/dictionaries.json";
import { canonical, shifted } from "../data/keycodes";
import { DataError } from "./types";
import type { Builder, Modifier, Profile } from "./types";
export const modifiers: Modifier[] = [
  "LCTL",
  "LSFT",
  "LALT",
  "LGUI",
  "RCTL",
  "RSFT",
  "RALT",
  "RGUI",
];
export const modifierBits: Record<Modifier, number> = {
  LCTL: 1,
  LSFT: 2,
  LALT: 4,
  LGUI: 8,
  RCTL: 17,
  RSFT: 18,
  RALT: 20,
  RGUI: 24,
};
export function dictionary(profile: Profile): Record<string, number> {
  return dictionaries[profile];
}
function normalizeLeaf(code: string): string {
  return formatExpression(code);
}
export function buildExpression(builder: Builder, profile: Profile): string {
  const key = normalizeLeaf(builder.keycode);
  const mods = modifiers.filter((m) => builder.modifiers.includes(m));
  let code = key;
  if (builder.mode === "shortcut") {
    if (!mods.length) throw new DataError("chooseModifier");
    code = mods.reduceRight((inner, mod) => `${mod}(${inner})`, key);
  } else if (builder.mode === "layer")
    code = `${builder.action}(${builder.layer})`;
  else if (builder.mode === "modtap") {
    if (!mods.length) throw new DataError("chooseModifier");
    code = `MT(${mods.map((m) => `MOD_${m}`).join(" | ")}, ${key})`;
  } else if (builder.mode === "layertap") code = `LT(${builder.layer}, ${key})`;
  encodeExpression(code, profile);
  return code;
}
const aliases: Record<string, string> = {
  C: "LCTL",
  S: "LSFT",
  A: "LALT",
  G: "LGUI",
  LCMD: "LGUI",
  LWIN: "LGUI",
  RCMD: "RGUI",
  RWIN: "RGUI",
  LOPT: "LALT",
  ROPT: "RALT",
  ALGR: "RALT",
};
const comboModifiers: Record<string, Modifier[]> = {
  LCS: ["LCTL", "LSFT"],
  LCA: ["LCTL", "LALT"],
  LCG: ["LCTL", "LGUI"],
  LSA: ["LSFT", "LALT"],
  LSG: ["LSFT", "LGUI"],
  LAG: ["LALT", "LGUI"],
  LCSG: ["LCTL", "LSFT", "LGUI"],
  LCAG: ["LCTL", "LALT", "LGUI"],
  LSAG: ["LSFT", "LALT", "LGUI"],
  RCS: ["RCTL", "RSFT"],
  RCA: ["RCTL", "RALT"],
  RCG: ["RCTL", "RGUI"],
  RSA: ["RSFT", "RALT"],
  RSG: ["RSFT", "RGUI"],
  RAG: ["RALT", "RGUI"],
  MEH: ["LCTL", "LSFT", "LALT"],
  HYPR: ["LCTL", "LSFT", "LALT", "LGUI"],
};
function encodeMods(mods: Modifier[]) {
  if (!mods.length) throw new DataError("chooseModifier");
  if (
    mods.some((m) => m.startsWith("L")) &&
    mods.some((m) => m.startsWith("R"))
  )
    throw new DataError("mixedModifiers");
  return mods.reduce((mask, m) => mask | modifierBits[m], 0);
}
function modArgument(arg: string): number {
  const parts = arg.split("|").map((s) => s.trim());
  const mods = parts.flatMap((p) =>
    p === "MOD_HYPR"
      ? comboModifiers.HYPR
      : p === "MOD_MEH"
        ? comboModifiers.MEH
        : [p.replace(/^MOD_/, "") as Modifier],
  );
  if (
    parts.some((p) => !p.startsWith("MOD_")) ||
    mods.some((m) => !modifiers.includes(m))
  )
    throw new DataError("invalidExpression");
  return encodeMods(mods);
}
function splitArgs(value: string): string[] {
  let depth = 0,
    start = 0;
  const parts: string[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    if (value[i] === ")") depth--;
    if (depth < 0) throw new DataError("invalidExpression");
    if (value[i] === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (depth !== 0) throw new DataError("invalidExpression");
  parts.push(value.slice(start).trim());
  return parts;
}
function integer(value: string, max: number): number {
  if (!/^\d+$/.test(value)) throw new DataError("invalidLayer");
  const num = Number(value);
  if (num > max)
    throw new DataError(max === 15 ? "layerTapRange" : "layerRange");
  return num;
}
const layerRanges: Record<string, string> = {
  MO: "MOMENTARY",
  TG: "TOGGLE_LAYER",
  TO: "TO",
  DF: "DEF_LAYER",
  OSL: "ONE_SHOT_LAYER",
  TT: "LAYER_TAP_TOGGLE",
  CUSTOM: "KB",
  MACRO: "MACRO",
};
/** Normalize aliases into the expression syntax accepted by VIA's Any parser. */
export function formatExpression(input: string, depth = 0): string {
  if (depth > 12 || input.length > 300)
    throw new DataError("invalidExpression");
  const code = canonical(input.trim());
  if (shifted[code]) return `LSFT(${shifted[code]})`;
  const match = code.match(/^([A-Z_]+)\((.*)\)$/);
  if (!match) return code;
  const fn = aliases[match[1]] ?? match[1],
    args = splitArgs(match[2]);
  if (comboModifiers[fn] && args.length === 1)
    return comboModifiers[fn].reduceRight(
      (inner, mod) => `${mod}(${inner})`,
      formatExpression(args[0], depth + 1),
    );
  if (fn.endsWith("_T") && args.length === 1) {
    const modFn = aliases[fn.slice(0, -2)] ?? fn.slice(0, -2);
    const mods =
      comboModifiers[modFn] ??
      (modifiers.includes(modFn as Modifier) ? [modFn as Modifier] : []);
    if (mods.length)
      return `MT(${mods.map((m) => `MOD_${m}`).join(" | ")}, ${formatExpression(args[0], depth + 1)})`;
  }
  const formatted = args.map((arg, i) => {
    if ((fn === "MT" && i === 0) || (fn === "LM" && i === 1) || fn === "OSM")
      return arg
        .split("|")
        .map((p) => p.trim())
        .join(" | ");
    return formatExpression(arg, depth + 1);
  });
  return `${fn}(${formatted.join(", ")})`;
}
export function encodeExpression(input: string, profile: Profile): number {
  if (input.length > 300) throw new DataError("invalidExpression");
  const dict = dictionary(profile);
  function parse(raw: string, depth = 0): number {
    if (depth > 12) throw new DataError("invalidExpression");
    const code = canonical(raw.trim());
    if (Object.hasOwn(dict, code) && !code.startsWith("_")) return dict[code];
    if (shifted[code]) return parse(`LSFT(${shifted[code]})`, depth + 1);
    const match = code.match(/^([A-Z_]+)\((.*)\)$/);
    if (!match) throw new DataError("unknownKeycode", code);
    let fn = aliases[match[1]] ?? match[1];
    const args = splitArgs(match[2]);
    if (layerRanges[fn] && args.length === 1) {
      const range = layerRanges[fn],
        base = dict[`_QK_${range}`],
        max = dict[`_QK_${range}_MAX`] - base;
      return base + integer(args[0], max);
    }
    if (fn === "LT" && args.length === 2) {
      const layer = integer(args[0], 15),
        kc = parse(args[1], depth + 1);
      if (kc > 255) throw new DataError("basicTapOnly");
      return dict._QK_LAYER_TAP | (layer << 8) | kc;
    }
    if (fn === "MT" && args.length === 2) {
      const mods = modArgument(args[0]),
        kc = parse(args[1], depth + 1);
      if (kc > 255) throw new DataError("basicTapOnly");
      return dict._QK_MOD_TAP | (mods << 8) | kc;
    }
    if (fn === "OSM" && args.length === 1)
      return dict._QK_ONE_SHOT_MOD | modArgument(args[0]);
    if (fn === "LM" && args.length === 2)
      return (
        dict._QK_LAYER_MOD | (integer(args[0], 15) << 5) | modArgument(args[1])
      );
    if (fn.endsWith("_T") && args.length === 1) {
      fn = aliases[fn.slice(0, -2)] ?? fn.slice(0, -2);
      const mods =
        comboModifiers[fn] ??
        (modifiers.includes(fn as Modifier) ? [fn as Modifier] : []);
      const kc = parse(args[0], depth + 1);
      if (kc > 255) throw new DataError("basicTapOnly");
      return dict._QK_MOD_TAP | (encodeMods(mods) << 8) | kc;
    }
    const mods =
      comboModifiers[fn] ??
      (modifiers.includes(fn as Modifier) ? [fn as Modifier] : []);
    if (mods.length && args.length === 1) {
      const kc = parse(args[0], depth + 1);
      if (kc > dict._QK_MODS_MAX || (kc > 255 && kc < dict._QK_MODS))
        throw new DataError("basicShortcutOnly");
      const mask = encodeMods(mods),
        inner = kc >> 8;
      if (inner && Boolean(inner & 16) !== Boolean(mask & 16))
        throw new DataError("mixedModifiers");
      return kc | (mask << 8);
    }
    throw new DataError("invalidExpression");
  }
  return parse(input);
}
export function expressionError(
  code: string,
  profile: Profile,
): DataError | undefined {
  try {
    encodeExpression(code, profile);
    return undefined;
  } catch (error) {
    return error instanceof DataError
      ? error
      : new DataError("invalidExpression");
  }
}
export function readBuilder(code: string): Builder {
  const initial: Builder = {
    mode: "basic",
    keycode: code,
    modifiers: [],
    layer: 1,
    action: "MO",
  };
  const layer = code.match(/^(MO|TG|TO|DF|OSL|TT)\((\d+)\)$/);
  if (layer)
    return {
      ...initial,
      mode: "layer",
      keycode: "KC_SPC",
      action: layer[1] as Builder["action"],
      layer: Number(layer[2]),
    };
  const lt = code.match(/^LT\(\s*(\d+)\s*,\s*([A-Z0-9_]+)\s*\)$/);
  if (lt)
    return {
      ...initial,
      mode: "layertap",
      layer: Number(lt[1]),
      keycode: lt[2],
    };
  const mt = code.match(/^MT\(([^,]+),\s*([A-Z0-9_]+)\s*\)$/);
  if (mt) {
    const mods = mt[1]
      .split("|")
      .map((p) => p.trim().replace(/^MOD_/, "") as Modifier);
    if (mods.every((m) => modifiers.includes(m)))
      return { ...initial, mode: "modtap", modifiers: mods, keycode: mt[2] };
  }
  let remaining = code;
  const mods: Modifier[] = [];
  let m: RegExpMatchArray | null;
  while (
    (m = remaining.match(
      /^(LCTL|LSFT|LALT|LGUI|RCTL|RSFT|RALT|RGUI|C|S|A|G)\((.*)\)$/,
    ))
  ) {
    mods.push((aliases[m[1]] ?? m[1]) as Modifier);
    remaining = m[2];
  }
  return mods.length
    ? { ...initial, mode: "shortcut", modifiers: mods, keycode: remaining }
    : initial;
}
