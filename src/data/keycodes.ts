import type { Category, Keycode, Profile } from "../core/types";
import dictionaries from "./dictionaries.json";
const all: Profile[] = ["legacy", "v8", "v9"];
const keys: Keycode[] = [];
function add(
  code: string,
  label: string,
  zh: string,
  en: string,
  category: Category = "basic",
  aliases: string[] = [],
  keywords = "",
) {
  const profiles = all.filter((p) => Object.hasOwn(dictionaries[p], code));
  keys.push({
    code,
    label,
    name: { zh, en },
    category,
    aliases,
    keywords,
    profiles,
  });
}
for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  add(`KC_${letter}`, letter, `字母 ${letter}`, `Letter ${letter}`, "basic");
for (const digit of "1234567890")
  add(`KC_${digit}`, digit, `数字 ${digit}`, `Number ${digit}`);
const basic: [string, string, string, string, string[]?][] = [
  ["KC_ESC", "Esc", "退出", "Escape", ["KC_ESCAPE"]],
  ["KC_ENT", "Enter", "回车", "Enter", ["KC_ENTER"]],
  ["KC_BSPC", "⌫", "退格", "Backspace", ["KC_BACKSPACE", "KC_BSPACE"]],
  ["KC_TAB", "Tab", "制表", "Tab"],
  ["KC_SPC", "Space", "空格", "Space", ["KC_SPACE"]],
  ["KC_CAPS", "Caps", "大写锁定", "Caps Lock", ["KC_CAPS_LOCK"]],
  [
    "KC_LCTL",
    "Ctrl",
    "左 Control",
    "Left Control",
    ["KC_LEFT_CTRL", "KC_LCTRL"],
  ],
  [
    "KC_RCTL",
    "Ctrl",
    "右 Control",
    "Right Control",
    ["KC_RIGHT_CTRL", "KC_RCTRL"],
  ],
  [
    "KC_LSFT",
    "Shift",
    "左 Shift",
    "Left Shift",
    ["KC_LEFT_SHIFT", "KC_LSHIFT"],
  ],
  [
    "KC_RSFT",
    "Shift",
    "右 Shift",
    "Right Shift",
    ["KC_RIGHT_SHIFT", "KC_RSHIFT"],
  ],
  [
    "KC_LALT",
    "Alt",
    "左 Alt / Option",
    "Left Alt / Option",
    ["KC_LEFT_ALT", "KC_LOPT"],
  ],
  [
    "KC_RALT",
    "Alt",
    "右 Alt / AltGr",
    "Right Alt / AltGr",
    ["KC_RIGHT_ALT", "KC_ROPT"],
  ],
  [
    "KC_LGUI",
    "Win",
    "左 Win / Command",
    "Left Win / Command",
    ["KC_LEFT_GUI", "KC_LWIN", "KC_LCMD"],
  ],
  [
    "KC_RGUI",
    "Win",
    "右 Win / Command",
    "Right Win / Command",
    ["KC_RIGHT_GUI", "KC_RWIN", "KC_RCMD"],
  ],
  ["KC_APP", "Menu", "应用菜单", "Application Menu", ["KC_APPLICATION"]],
  ["KC_LEFT", "←", "方向左", "Left Arrow"],
  ["KC_DOWN", "↓", "方向下", "Down Arrow"],
  ["KC_UP", "↑", "方向上", "Up Arrow"],
  ["KC_RGHT", "→", "方向右", "Right Arrow", ["KC_RIGHT"]],
];
for (const [code, label, zh, en, aliases] of basic)
  add(code, label, zh, en, "basic", aliases);
const symbols: [string, string, string, string, string[]?][] = [
  ["KC_GRV", "`", "反引号", "Grave", ["KC_GRAVE"]],
  ["KC_MINS", "−", "减号", "Minus", ["KC_MINUS"]],
  ["KC_EQL", "=", "等号", "Equal", ["KC_EQUAL"]],
  ["KC_LBRC", "[", "左方括号", "Left Bracket", ["KC_LEFT_BRACKET"]],
  ["KC_RBRC", "]", "右方括号", "Right Bracket", ["KC_RIGHT_BRACKET"]],
  ["KC_BSLS", "\\", "反斜杠", "Backslash", ["KC_BACKSLASH"]],
  ["KC_SCLN", ";", "分号", "Semicolon", ["KC_SEMICOLON"]],
  ["KC_QUOT", "'", "单引号", "Quote", ["KC_QUOTE"]],
  ["KC_COMM", ",", "逗号", "Comma", ["KC_COMMA"]],
  ["KC_DOT", ".", "句点", "Period", ["KC_PERIOD"]],
  ["KC_SLSH", "/", "斜杠", "Slash", ["KC_SLASH"]],
  ["KC_NUHS", "#", "ISO 井号", "ISO Hash", ["KC_NONUS_HASH"]],
  ["KC_NUBS", "\\", "ISO 反斜杠", "ISO Backslash", ["KC_NONUS_BACKSLASH"]],
];
for (const [code, label, zh, en, aliases] of symbols)
  add(code, label, zh, en, "symbols", aliases);
export const shifted: Record<string, string> = {
  KC_TILD: "KC_GRV",
  KC_EXLM: "KC_1",
  KC_AT: "KC_2",
  KC_HASH: "KC_3",
  KC_DLR: "KC_4",
  KC_PERC: "KC_5",
  KC_CIRC: "KC_6",
  KC_AMPR: "KC_7",
  KC_ASTR: "KC_8",
  KC_LPRN: "KC_9",
  KC_RPRN: "KC_0",
  KC_UNDS: "KC_MINS",
  KC_PLUS: "KC_EQL",
  KC_LCBR: "KC_LBRC",
  KC_RCBR: "KC_RBRC",
  KC_PIPE: "KC_BSLS",
  KC_COLN: "KC_SCLN",
  KC_DQUO: "KC_QUOT",
  KC_LABK: "KC_COMM",
  KC_RABK: "KC_DOT",
  KC_QUES: "KC_SLSH",
};
const shiftedNames = [
  ["~", "波浪号", "Tilde"],
  ["!", "感叹号", "Exclamation"],
  ["@", "艾特符号", "At"],
  ["#", "井号", "Hash"],
  ["$", "美元符号", "Dollar"],
  ["%", "百分号", "Percent"],
  ["^", "脱字符", "Caret"],
  ["&", "与号", "Ampersand"],
  ["*", "星号", "Asterisk"],
  ["(", "左圆括号", "Left Parenthesis"],
  [")", "右圆括号", "Right Parenthesis"],
  ["_", "下划线", "Underscore"],
  ["+", "加号", "Plus"],
  ["{", "左花括号", "Left Brace"],
  ["}", "右花括号", "Right Brace"],
  ["|", "竖线", "Pipe"],
  [":", "冒号", "Colon"],
  ['"', "双引号", "Double Quote"],
  ["<", "小于号", "Less Than"],
  [">", "大于号", "Greater Than"],
  ["?", "问号", "Question Mark"],
];
Object.keys(shifted).forEach((code, i) =>
  keys.push({
    code,
    label: shiftedNames[i][0],
    name: { zh: shiftedNames[i][1], en: shiftedNames[i][2] },
    aliases: [],
    category: "symbols",
    profiles: all,
  }),
);
for (let i = 1; i <= 24; i++)
  add(`KC_F${i}`, `F${i}`, `功能键 F${i}`, `Function F${i}`, "function");
for (const [code, label, zh, en, aliases] of [
  ["KC_DEL", "Del", "向前删除", "Delete", ["KC_DELETE"]],
  ["KC_INS", "Ins", "插入", "Insert", ["KC_INSERT"]],
  ["KC_HOME", "Home", "行首", "Home", []],
  ["KC_END", "End", "行尾", "End", []],
  ["KC_PGUP", "PgUp", "上一页", "Page Up", ["KC_PAGE_UP"]],
  ["KC_PGDN", "PgDn", "下一页", "Page Down", ["KC_PAGE_DOWN"]],
  ["KC_PSCR", "PrtSc", "截屏", "Print Screen", ["KC_PRINT_SCREEN"]],
  ["KC_SLCK", "ScrLk", "滚动锁定", "Scroll Lock", ["KC_SCROLL_LOCK"]],
  ["KC_PAUS", "Pause", "暂停", "Pause", ["KC_PAUSE"]],
  ["KC_NLCK", "Num", "数字锁定", "Num Lock", ["KC_NUM_LOCK"]],
] as [string, string, string, string, string[]][])
  add(code, label, zh, en, "function", aliases);
for (let i = 0; i <= 9; i++)
  add(`KC_P${i}`, `Num ${i}`, `小键盘 ${i}`, `Numpad ${i}`, "function", [
    `KC_KP_${i}`,
  ]);
for (const [code, label, zh, en] of [
  ["KC_PENT", "N.Ent", "小键盘回车", "Numpad Enter"],
  ["KC_PSLS", "N./", "小键盘除号", "Numpad Divide"],
  ["KC_PAST", "N.*", "小键盘乘号", "Numpad Multiply"],
  ["KC_PMNS", "N.−", "小键盘减号", "Numpad Minus"],
  ["KC_PPLS", "N.+", "小键盘加号", "Numpad Plus"],
  ["KC_PDOT", "N..", "小键盘句点", "Numpad Decimal"],
])
  add(code, label, zh, en, "function");
for (const [code, label, zh, en, aliases] of [
  ["KC_VOLU", "Vol +", "音量增加", "Volume Up", ["KC_AUDIO_VOL_UP"]],
  ["KC_VOLD", "Vol −", "音量减少", "Volume Down", ["KC_AUDIO_VOL_DOWN"]],
  ["KC_MUTE", "Mute", "静音", "Mute Audio", ["KC_AUDIO_MUTE"]],
  ["KC_MPLY", "Play", "播放 / 暂停", "Play / Pause", ["KC_MEDIA_PLAY_PAUSE"]],
  ["KC_MNXT", "Next", "下一曲", "Next Track", ["KC_MEDIA_NEXT_TRACK"]],
  ["KC_MPRV", "Prev", "上一曲", "Previous Track", ["KC_MEDIA_PREV_TRACK"]],
  ["KC_MSTP", "Stop", "停止播放", "Stop Media", ["KC_MEDIA_STOP"]],
  ["KC_MFFD", "Fwd", "快进", "Fast Forward", []],
  ["KC_MRWD", "Rew", "快退", "Rewind", []],
  ["KC_EJCT", "Eject", "弹出媒体", "Eject", []],
  ["KC_MSEL", "Media", "媒体选择", "Media Select", []],
  ["KC_BRIU", "Bright +", "屏幕亮度增加", "Screen Brightness Up", []],
  ["KC_BRID", "Bright −", "屏幕亮度减少", "Screen Brightness Down", []],
  ["KC_CALC", "Calc", "计算器", "Calculator", []],
  ["KC_MAIL", "Mail", "邮件", "Mail", []],
  ["KC_WWW_BACK", "Back", "浏览器后退", "Browser Back", []],
  ["KC_WWW_FORWARD", "Forward", "浏览器前进", "Browser Forward", []],
  ["KC_WWW_REFRESH", "Refresh", "浏览器刷新", "Browser Refresh", []],
  ["KC_SLEP", "Sleep", "睡眠", "Sleep", []],
  ["KC_WAKE", "Wake", "唤醒", "Wake", []],
  ["KC_PWR", "Power", "电源", "Power", []],
] as [string, string, string, string, string[]][])
  add(code, label, zh, en, "media", aliases, "声音 音乐 sound music");
for (const [code, label, zh, en, aliases] of [
  ["KC_MS_UP", "M.↑", "鼠标向上", "Mouse Up", ["MS_UP"]],
  ["KC_MS_DOWN", "M.↓", "鼠标向下", "Mouse Down", ["MS_DOWN"]],
  ["KC_MS_LEFT", "M.←", "鼠标向左", "Mouse Left", ["MS_LEFT"]],
  ["KC_MS_RIGHT", "M.→", "鼠标向右", "Mouse Right", ["MS_RGHT"]],
  ["KC_MS_BTN1", "M.1", "鼠标左键", "Mouse Button 1", ["MS_BTN1"]],
  ["KC_MS_BTN2", "M.2", "鼠标右键", "Mouse Button 2", ["MS_BTN2"]],
  ["KC_MS_BTN3", "M.3", "鼠标中键", "Mouse Button 3", ["MS_BTN3"]],
  ["KC_MS_BTN4", "M.4", "鼠标侧键 4", "Mouse Button 4", ["MS_BTN4"]],
  ["KC_MS_BTN5", "M.5", "鼠标侧键 5", "Mouse Button 5", ["MS_BTN5"]],
  ["KC_MS_WH_UP", "W.↑", "滚轮向上", "Wheel Up", ["MS_WHLU"]],
  ["KC_MS_WH_DOWN", "W.↓", "滚轮向下", "Wheel Down", ["MS_WHLD"]],
  ["KC_MS_WH_LEFT", "W.←", "滚轮向左", "Wheel Left", ["MS_WHLL"]],
  ["KC_MS_WH_RIGHT", "W.→", "滚轮向右", "Wheel Right", ["MS_WHLR"]],
  [
    "KC_MS_ACCEL0",
    "Accel 0",
    "鼠标加速 0",
    "Mouse Acceleration 0",
    ["MS_ACL0"],
  ],
  [
    "KC_MS_ACCEL1",
    "Accel 1",
    "鼠标加速 1",
    "Mouse Acceleration 1",
    ["MS_ACL1"],
  ],
  [
    "KC_MS_ACCEL2",
    "Accel 2",
    "鼠标加速 2",
    "Mouse Acceleration 2",
    ["MS_ACL2"],
  ],
] as [string, string, string, string, string[]][])
  add(code, label, zh, en, "mouse", aliases);
const lightingActions = [
  ["TOG", "TOGG", "Toggle", "开关", "Toggle"],
  ["MOD", "NEXT", "Mode +", "下一灯效", "Next Effect"],
  ["RMOD", "PREV", "Mode −", "上一灯效", "Previous Effect"],
  ["HUI", "HUEU", "Hue +", "色相增加", "Hue Up"],
  ["HUD", "HUED", "Hue −", "色相减少", "Hue Down"],
  ["SAI", "SATU", "Sat +", "饱和度增加", "Saturation Up"],
  ["SAD", "SATD", "Sat −", "饱和度减少", "Saturation Down"],
  ["VAI", "VALU", "Light +", "亮度增加", "Brightness Up"],
  ["VAD", "VALD", "Light −", "亮度减少", "Brightness Down"],
  ["SPI", "SPDU", "Speed +", "速度增加", "Speed Up"],
  ["SPD", "SPDD", "Speed −", "速度减少", "Speed Down"],
];
for (const [old, modern, label, zh, en] of lightingActions) {
  add(`RGB_${old}`, `RGB ${label}`, `RGB 灯光${zh}`, `RGB ${en}`, "lighting");
  add(
    `UG_${modern}`,
    `UG ${label}`,
    `底灯${zh}`,
    `Underglow ${en}`,
    "lighting",
  );
  add(
    `RM_${modern}`,
    `RM ${label}`,
    `RGB 矩阵${zh}`,
    `RGB Matrix ${en}`,
    "lighting",
  );
}
for (const [code, label, zh, en] of [
  ["BL_ON", "BL On", "背光开启", "Backlight On"],
  ["BL_OFF", "BL Off", "背光关闭", "Backlight Off"],
  ["BL_TOGG", "BL Toggle", "背光开关", "Backlight Toggle"],
  ["BL_INC", "BL +", "背光亮度增加", "Backlight Up"],
  ["BL_DEC", "BL −", "背光亮度减少", "Backlight Down"],
  ["BL_STEP", "BL Next", "背光循环", "Backlight Cycle"],
  ["BL_BRTG", "BL Breathe", "背光呼吸", "Backlight Breathing"],
])
  add(code, label, zh, en, "lighting");
for (const [code, label, zh, en, aliases] of [
  [
    "KC_TRNS",
    "▽",
    "透明 / 继承下层",
    "Transparent / Fall Through",
    ["KC_TRANSPARENT", "_______"],
  ],
  ["KC_NO", "∅", "无操作 / 禁用", "No Operation / Disabled", ["XXXXXXX"]],
  [
    "RESET",
    "Boot",
    "进入引导加载器",
    "Enter Bootloader",
    ["QK_BOOT", "QK_BOOTLOADER"],
  ],
  [
    "DEBUG",
    "Debug",
    "调试开关",
    "Debug Toggle",
    ["DB_TOGG", "QK_DEBUG_TOGGLE"],
  ],
  ["QK_CLEAR_EEPROM", "EEPROM", "清除 EEPROM", "Clear EEPROM", ["EE_CLR"]],
  ["KC_GESC", "G.Esc", "Grave Escape", "Grave Escape", ["QK_GRAVE_ESCAPE"]],
  ["MAGIC_TOGGLE_NKRO", "NKRO", "全键无冲开关", "Toggle NKRO", ["NK_TOGG"]],
  [
    "DYN_REC_START1",
    "Rec 1",
    "开始动态宏录制 1",
    "Record Dynamic Macro 1",
    ["DM_REC1"],
  ],
  [
    "DYN_REC_START2",
    "Rec 2",
    "开始动态宏录制 2",
    "Record Dynamic Macro 2",
    ["DM_REC2"],
  ],
  [
    "DYN_REC_STOP",
    "Rec Stop",
    "停止动态宏录制",
    "Stop Dynamic Macro Recording",
    ["DM_RSTP"],
  ],
  [
    "DYN_MACRO_PLAY1",
    "Macro 1",
    "播放动态宏 1",
    "Play Dynamic Macro 1",
    ["DM_PLY1"],
  ],
  [
    "DYN_MACRO_PLAY2",
    "Macro 2",
    "播放动态宏 2",
    "Play Dynamic Macro 2",
    ["DM_PLY2"],
  ],
] as [string, string, string, string, string[]][])
  add(code, label, zh, en, "special", aliases);
export const keycodes = keys.filter((k) => k.profiles.length > 0);
export const codeLookup = new Map(
  keycodes.flatMap((k) => [k.code, ...k.aliases].map((a) => [a, k] as const)),
);
export function canonical(code: string): string {
  return codeLookup.get(code.toUpperCase())?.code ?? code.toUpperCase();
}
export function searchKeycodes(
  query: string,
  category: Category | "all",
  profile: Profile,
): Keycode[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return keycodes
    .filter(
      (k) =>
        k.profiles.includes(profile) &&
        (category === "all" || k.category === category) &&
        terms.every((term) =>
          [
            k.code,
            k.label,
            k.name.zh,
            k.name.en,
            ...k.aliases,
            k.keywords ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(term),
        ),
    )
    .sort(
      (a, b) =>
        Number(b.code.toLowerCase() === query.toLowerCase()) -
        Number(a.code.toLowerCase() === query.toLowerCase()),
    );
}
