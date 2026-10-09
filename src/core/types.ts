export type Language = "zh" | "en";
export type Profile = "legacy" | "v8" | "v9";
export type Category =
  "basic" | "symbols" | "function" | "media" | "mouse" | "lighting" | "special";
export type BiText = { zh: string; en: string };
export interface Keycode {
  code: string;
  label: string;
  name: BiText;
  aliases: string[];
  category: Category;
  profiles: Profile[];
  keywords?: string;
}
export type BuilderMode =
  "basic" | "shortcut" | "layer" | "modtap" | "layertap";
export type Modifier =
  "LCTL" | "LSFT" | "LALT" | "LGUI" | "RCTL" | "RSFT" | "RALT" | "RGUI";
export type LayerAction = "MO" | "TG" | "TO" | "DF" | "OSL" | "TT";
export interface Builder {
  mode: BuilderMode;
  keycode: string;
  modifiers: Modifier[];
  layer: number;
  action: LayerAction;
}
export class DataError extends Error {
  constructor(
    readonly key: string,
    readonly detail = "",
  ) {
    super(key);
  }
}
