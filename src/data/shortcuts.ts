import type { BiText, Builder } from "../core/types";

export interface ShortcutPreset {
  id: string;
  name: BiText;
  platform: "windowsLinux" | "macOS";
  builder: Builder;
}
const actions = [
  ["copy", "复制", "Copy", "C"],
  ["paste", "粘贴", "Paste", "V"],
  ["cut", "剪切", "Cut", "X"],
  ["undo", "撤销", "Undo", "Z"],
  ["redo", "重做", "Redo", "Y"],
  ["selectAll", "全选", "Select all", "A"],
  ["save", "保存", "Save", "S"],
  ["find", "查找", "Find", "F"],
] as const;
export const shortcutPresets: ShortcutPreset[] = actions.flatMap(
  ([id, zh, en, key]) =>
    (["windowsLinux", "macOS"] as const).map((platform) => ({
      id: `${id}-${platform}`,
      name: { zh, en },
      platform,
      builder: {
        mode: "shortcut" as const,
        keycode: `KC_${id === "redo" && platform === "macOS" ? "Z" : key}`,
        modifiers:
          platform === "macOS"
            ? id === "redo"
              ? ["LSFT", "LGUI"]
              : ["LGUI"]
            : ["LCTL"],
        layer: 1,
        action: "MO" as const,
      },
    })),
);
