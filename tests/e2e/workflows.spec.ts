import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
const search = (page: Page) =>
  page.getByRole("textbox", { name: "搜索键码或快捷键…", exact: true });
const output = (page: Page) => page.locator(".code-output textarea");
async function load(page: Page, query: string) {
  await search(page).fill(query);
  await page
    .locator(".result-actions")
    .getByRole("button", { name: /载入生成器/ })
    .first()
    .click();
}
async function clipboardStub(page: Page, fail = false) {
  await page.addInitScript((shouldFail) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (code: string) => {
          if (shouldFail) throw new Error("Clipboard denied");
          (window as unknown as { copied: string }).copied = code;
        },
      },
    });
  }, fail);
  await page.reload();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("search and copy Ctrl+V directly without choosing a keyboard", async ({
  page,
}) => {
  await clipboardStub(page);
  await search(page).fill("ctrl + v");
  await expect(page.locator(".keycode-result")).toHaveCount(1);
  await expect(page.locator(".result-code")).toHaveValue("LCTL(KC_V)");
  await page
    .getByRole("button", { name: "复制代码 Ctrl+V", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("已复制代码");
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toBe("LCTL(KC_V)");
  await expect(page.locator('.keyboard-svg, input[type="file"]')).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: /方案与文件|应用到键位|导出/ }),
  ).toHaveCount(0);
});
test("named paste includes both platforms and loads the complete shortcut", async ({
  page,
}) => {
  await search(page).fill("粘贴");
  await expect(page.locator(".keycode-result")).toHaveCount(2);
  await expect(page.locator(".platform-badge")).toHaveText([
    "Windows / Linux",
    "macOS",
  ]);
  await page
    .getByRole("button", { name: "载入生成器 Cmd+V", exact: true })
    .click();
  await expect(output(page)).toHaveValue("LGUI(KC_V)");
  await expect(
    page.getByRole("button", { name: "左侧 Win / Cmd", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "左侧 Ctrl", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await load(page, "Ctrl+Shift+Esc");
  await expect(output(page)).toHaveValue("LCTL(LSFT(KC_ESC))");
});
test("basic search resets modifiers and bilingual searches preserve the draft", async ({
  page,
}) => {
  await load(page, "Ctrl+V");
  for (const query of ["音量增加", "Volume Up", "KC_AUDIO_VOL_UP", "KC_VOLU"]) {
    await search(page).fill(query);
    await expect(page.locator(".result-code")).toHaveValue("KC_VOLU");
  }
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(output(page)).toHaveValue("LCTL(KC_V)");
  await expect(
    page.getByRole("textbox", { name: "Search keycodes or shortcuts…" }),
  ).toHaveValue("KC_VOLU");
  await page
    .locator(".result-actions")
    .getByRole("button", { name: /Load in builder/ })
    .click();
  await expect(output(page)).toHaveValue("KC_VOLU");
  await expect(
    page.getByRole("button", { name: "Single key", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Shortcut", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Left Ctrl", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".builder-copy")).toBeDisabled();
});
test("invalid chords and missing functions have no copyable results", async ({
  page,
}) => {
  for (const query of ["Ctrl+Bogus", "Ctrl+", "Ctrl+RShift+V"]) {
    await search(page).fill(query);
    await expect(page.locator(".keycode-result")).toHaveCount(0);
    await expect(page.locator(".empty-results [role=alert]")).toBeVisible();
  }
  await search(page).fill("nothing-matches-this");
  await expect(page.locator(".keycode-result")).toHaveCount(0);
  await page.getByRole("button", { name: "清除搜索", exact: true }).click();
  await page
    .getByRole("button", { name: "快捷键", exact: true })
    .first()
    .click();
  await expect(page.locator(".keycode-result")).toHaveCount(16);
});
test("advanced single-key actions validate ranges, tap restrictions and profiles", async ({
  page,
}) => {
  await expect(page.locator(".advanced-builder")).not.toHaveAttribute("open");
  await page.locator("summary").click();
  await page.getByLabel("高级单键行为").selectOption("layer");
  await page.getByLabel("目标层").fill("3");
  await expect(output(page)).toHaveValue("MO(3)");
  await page.getByLabel("目标层").fill("32");
  await expect(page.locator(".builder-copy")).toBeDisabled();
  await page.getByLabel("高级单键行为").selectOption("layertap");
  await page.getByLabel("点击键码").fill("KC_SPC");
  await page.getByLabel("目标层").fill("15");
  await expect(output(page)).toHaveValue("LT(15, KC_SPC)");
  await page.getByLabel("目标层").fill("16");
  await expect(page.getByRole("alert")).toContainText("0–15");
  await page.getByLabel("高级单键行为").selectOption("modtap");
  await page.getByRole("button", { name: "左侧 Ctrl", exact: true }).click();
  await expect(output(page)).toHaveValue("MT(MOD_LCTL, KC_SPC)");
  await page.getByLabel("点击键码").fill("KC_PLUS");
  await expect(page.locator(".builder-copy")).toBeDisabled();
  await page.getByRole("button", { name: "单键", exact: true }).click();
  await page.getByLabel("基础键码").fill("RGB_TOG");
  await expect(output(page)).toHaveValue("RGB_TOG");
  await page.locator("summary").click();
  await page.getByLabel("键码兼容版本").selectOption("v8");
  await expect(page.locator(".builder-copy")).toBeDisabled();
  await search(page).fill("RGB_TOG");
  await expect(page.locator(".keycode-result")).toHaveCount(0);
  await page.getByLabel("基础键码").fill("UG_TOGG");
  await expect(output(page)).toHaveValue("UG_TOGG");
  await page.getByLabel("键码兼容版本").selectOption("v9");
  await expect(output(page)).toHaveValue("UG_TOGG");
});
test("custom builder and mixed modifiers block invalid copying", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "快捷键", exact: true })
    .last()
    .click();
  await page.getByLabel("基础键码").fill("KC_ESC");
  await page.getByRole("button", { name: "左侧 Ctrl", exact: true }).click();
  await page.getByRole("button", { name: "左侧 Shift", exact: true }).click();
  await expect(output(page)).toHaveValue("LCTL(LSFT(KC_ESC))");
  await page.getByRole("button", { name: "右侧 Alt", exact: true }).click();
  await expect(page.locator(".builder-copy")).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("左右修饰键");
});
test("clipboard failure keeps result and builder expressions selectable", async ({
  page,
}) => {
  await clipboardStub(page, true);
  await search(page).fill("Ctrl+V");
  await page
    .getByRole("button", { name: "复制代码 Ctrl+V", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("手动复制");
  const fallback = page.locator(".notification input");
  await expect(fallback).toHaveValue("LCTL(KC_V)");
  await fallback.focus();
  expect(
    await fallback.evaluate(
      (input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!,
    ),
  ).toBe(10);
  await load(page, "Ctrl+V");
  await page.locator(".builder-copy").click();
  await expect(page.getByRole("alert")).toContainText("手动复制");
  await output(page).focus();
  expect(
    await output(page).evaluate(
      (input: HTMLTextAreaElement) => input.selectionEnd - input.selectionStart,
    ),
  ).toBe(10);
});
test("real browser clipboard receives only the generated expression", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await load(page, "Ctrl+V");
  await page.locator(".builder-copy").click();
  await expect(page.getByRole("status")).toContainText("已复制代码");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "LCTL(KC_V)",
  );
});
test("old project is never read or overwritten", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("qmk-companion.project.v1", "{corrupted-old-project");
    const read = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === "qmk-companion.project.v1")
        throw Error("Old project must not be read");
      return read.call(this, key);
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await load(page, "Ctrl+V");
  await expect(output(page)).toHaveValue("LCTL(KC_V)");
  expect(
    await page.evaluate(() => localStorage["qmk-companion.project.v1"]),
  ).toBe("{corrupted-old-project");
  expect(errors).toEqual([]);
});
test("blocked local storage leaves search, generation and copying available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw Error("blocked");
      },
    });
  });
  await clipboardStub(page);
  await load(page, "Ctrl+V");
  await page.locator(".builder-copy").click();
  await expect(page.getByRole("status")).toContainText("已复制代码");
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(output(page)).toHaveValue("LCTL(KC_V)");
});
test("keyboard navigation, guide focus, responsive layout and bilingual screenshots", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await search(page).fill("Ctrl+V");
  await search(page).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "清除搜索" })).toBeFocused();
  await page
    .getByRole("button", { name: "载入生成器 Ctrl+V", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(output(page)).toHaveValue("LCTL(KC_V)");
  const help = page.getByRole("button", { name: "使用指南", exact: true });
  await help.click();
  await expect(page.getByRole("dialog")).toContainText("Any");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "关闭", exact: true }).last(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(help).toBeFocused();
  await expect(page.locator(".notification")).toHaveCount(0);
  await page.locator(".hero h1").click();
  for (const lang of ["zh", "en"] as const) {
    if (lang === "en")
      await page.getByRole("button", { name: "Switch to English" }).click();
    const width = await page.evaluate(() => ({
      inner: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.inner);
    const library = await page.locator(".library-panel").boundingBox();
    const builder = await page.locator(".builder-panel").boundingBox();
    if (testInfo.project.name === "mobile")
      expect(builder!.y).toBeGreaterThan(library!.y + library!.height);
    else expect(builder!.y).toBe(library!.y);
    await page.screenshot({
      path: path.join(
        process.cwd(),
        "test-results",
        `preview-${testInfo.project.name}-${lang}.png`,
      ),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
