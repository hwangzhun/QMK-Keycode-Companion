import { Check, Clipboard, Code2, ArrowDown } from "lucide-react";
import { buildExpression, modifiers } from "../core/keycodes";
import type { Builder, BuilderMode, Profile } from "../core/types";
import { DataError } from "../core/types";
interface Props {
  builder: Builder;
  setBuilder: (b: Builder) => void;
  profile: Profile;
  setProfile: (p: Profile) => void;
  copiedCode: string;
  onCopy: (code: string) => void;
  t: (key: string) => string;
}
const modeLabels: Record<BuilderMode, string> = {
  basic: "basicMode",
  shortcut: "shortcutMode",
  layer: "layerMode",
  modtap: "modtapMode",
  layertap: "layertapMode",
};
const modNames: Record<string, string> = {
  CTL: "Ctrl",
  SFT: "Shift",
  ALT: "Alt",
  GUI: "Win / Cmd",
};
export function BuilderPanel({
  builder,
  setBuilder,
  profile,
  setProfile,
  copiedCode,
  onCopy,
  t,
}: Props) {
  let code = "",
    error = "";
  try {
    code = buildExpression(builder, profile);
  } catch (e) {
    error = t(e instanceof DataError ? e.key : "invalidExpression");
  }
  const patch = (values: Partial<Builder>) =>
    setBuilder({ ...builder, ...values });
  const advanced = !["basic", "shortcut"].includes(builder.mode);
  const needsKey = builder.mode !== "layer";
  const needsMods = builder.mode === "shortcut" || builder.mode === "modtap";
  const needsLayer = builder.mode === "layer" || builder.mode === "layertap";
  return (
    <section className="panel builder-panel" aria-label={t("builder")}>
      <div className="panel-heading">
        <span className="panel-number">02</span>
        <h2>{t("builder")}</h2>
        <Code2 size={17} />
      </div>
      <div className="builder-inner">
        <div className="mode-buttons" aria-label={t("builder")}>
          {(["basic", "shortcut"] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={builder.mode === mode}
              className={builder.mode === mode ? "active" : ""}
              onClick={() =>
                patch({
                  mode,
                  modifiers: mode === "basic" ? [] : builder.modifiers,
                })
              }
            >
              {t(modeLabels[mode])}
            </button>
          ))}
        </div>
        <details
          className="advanced-builder"
          open={advanced ? true : undefined}
        >
          <summary>{t("advanced")}</summary>
          <div className="advanced-inner">
            <label className="field-label" htmlFor="advanced-behavior">
              {t("advancedBehavior")}
            </label>
            <select
              id="advanced-behavior"
              value={advanced ? builder.mode : ""}
              onChange={(e) =>
                patch({ mode: (e.target.value || "basic") as BuilderMode })
              }
            >
              <option value="">{t("advancedDefault")}</option>
              {(["layer", "modtap", "layertap"] as const).map((mode) => (
                <option key={mode} value={mode}>
                  {t(modeLabels[mode])}
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="profile">
              {t("compatibility")}
            </label>
            <select
              id="profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value as Profile)}
            >
              {(["legacy", "v8", "v9"] as const).map((p) => (
                <option key={p} value={p}>
                  {t(p)}
                </option>
              ))}
            </select>
            <p className="field-hint">{t("profileHelp")}</p>
          </div>
        </details>
        {needsKey && (
          <div className="builder-field">
            <label className="field-label" htmlFor="base-key">
              {t(
                builder.mode === "modtap" || builder.mode === "layertap"
                  ? "tapKey"
                  : "baseKey",
              )}
            </label>
            <input
              id="base-key"
              spellCheck={false}
              value={builder.keycode}
              placeholder="KC_V"
              onChange={(e) => patch({ keycode: e.target.value })}
            />
            <p className="field-hint">{t("keycodeInputHint")}</p>
          </div>
        )}
        {needsMods && (
          <fieldset className="modifiers">
            <legend className="field-label">
              {t(builder.mode === "modtap" ? "holdModifiers" : "modifiers")}
            </legend>
            {(["L", "R"] as const).map((side) => (
              <div className="mod-row" key={side}>
                <span>{t(side === "L" ? "left" : "right")}</span>
                <div>
                  {modifiers
                    .filter((m) => m.startsWith(side))
                    .map((mod) => (
                      <button
                        key={mod}
                        className={`modifier-button ${builder.modifiers.includes(mod) ? "active" : ""}`}
                        aria-label={`${t(side === "L" ? "left" : "right")} ${modNames[mod.slice(1)]}`}
                        aria-pressed={builder.modifiers.includes(mod)}
                        onClick={() =>
                          patch({
                            modifiers: builder.modifiers.includes(mod)
                              ? builder.modifiers.filter((m) => m !== mod)
                              : [...builder.modifiers, mod],
                          })
                        }
                      >
                        {modNames[mod.slice(1)]}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </fieldset>
        )}
        {needsLayer && (
          <div className="layer-fields">
            {builder.mode === "layer" && (
              <div>
                <label className="field-label" htmlFor="layer-action">
                  {t("layerAction")}
                </label>
                <select
                  id="layer-action"
                  value={builder.action}
                  onChange={(e) =>
                    patch({ action: e.target.value as Builder["action"] })
                  }
                >
                  {(["MO", "TG", "TO", "DF", "OSL", "TT"] as const).map(
                    (action) => (
                      <option value={action} key={action}>
                        {action} · {t(action)}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
            <div>
              <label className="field-label" htmlFor="target-layer">
                {t("targetLayer")}
              </label>
              <input
                id="target-layer"
                type="number"
                min="0"
                max={builder.mode === "layertap" ? 15 : 31}
                value={Number.isNaN(builder.layer) ? "" : builder.layer}
                onChange={(e) =>
                  patch({
                    layer: e.target.value === "" ? NaN : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        )}
        <div className="behavior-note">
          <ArrowDown size={14} />
          <p>{t(`${builder.mode}Description`)}</p>
        </div>
        <div className={`code-output ${error ? "has-error" : ""}`}>
          <div className="output-label">
            <span>{t("output")}</span>
            <span className={`validation-light ${error ? "error" : ""}`} />
          </div>
          <textarea
            aria-label={t("output")}
            readOnly
            value={code || "—"}
            spellCheck={false}
            onFocus={(e) => e.target.select()}
          />
          <div className="output-status">
            {error ? (
              <span role="alert">{error}</span>
            ) : (
              <>
                <Check size={12} />
                {t("valid")}
              </>
            )}
          </div>
        </div>
        <button
          className="primary-button builder-copy"
          disabled={!!error || !code}
          onClick={() => onCopy(code)}
        >
          {copiedCode === code ? <Check size={16} /> : <Clipboard size={16} />}
          {t(copiedCode === code ? "copied" : "copy")}
        </button>
        <p className="paste-hint">{t("enterAny")}</p>
      </div>
      <div className="builder-bottom">
        <span className="info-dot">i</span>
        <p>
          {t("ansiNote")}
          <br />
          {t("featureNote")}
        </p>
      </div>
    </section>
  );
}
