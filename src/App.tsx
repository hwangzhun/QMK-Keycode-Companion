import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  Clipboard,
  Command,
  Globe2,
  Keyboard,
  Layers,
  Lightbulb,
  Mouse,
  Music2,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { translate } from "./i18n";
import type { Builder, Language, Profile } from "./core/types";
import { copyCode } from "./core/clipboard";
import {
  initialBuilder,
  searchActions,
  type SearchCategory,
  type SearchResult,
} from "./core/search";
import dictionaries from "./data/dictionaries.json";
import { BuilderPanel } from "./components/BuilderPanel";
import { Dialog } from "./components/Dialog";
const categoryIcons = {
  all: Command,
  shortcuts: Command,
  basic: Keyboard,
  symbols: Terminal,
  function: Layers,
  media: Music2,
  mouse: Mouse,
  lighting: Lightbulb,
  special: Sparkles,
};
function initialLanguage(): Language {
  try {
    const lang = localStorage.getItem("qmk-companion.language");
    if (lang === "zh" || lang === "en") return lang;
  } catch {
    /* Browser language remains available. */
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}
export default function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = (key: string) => translate(language, key);
  const [profile, setProfile] = useState<Profile>("legacy");
  const [builder, setBuilder] = useState<Builder>(() => ({
    ...initialBuilder,
    modifiers: [],
  }));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const { results, error } = useMemo(
    () => searchActions(query, category, profile),
    [query, category, profile],
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [notice, setNotice] = useState<{
    key: string;
    code?: string;
    error?: boolean;
  } | null>(null);
  const copyAttempt = useRef(0);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title =
      language === "zh"
        ? "QMK 键码助手 / Keycode Companion"
        : "QMK Keycode Companion / QMK 键码助手";
    try {
      localStorage.setItem("qmk-companion.language", language);
    } catch {
      /* Storage is optional. */
    }
  }, [language]);
  useEffect(() => {
    setCopiedCode("");
  }, [builder, profile]);
  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!copiedCode) return;
    const timer = setTimeout(() => setCopiedCode(""), 2400);
    return () => clearTimeout(timer);
  }, [copiedCode]);
  async function onCopy(code: string) {
    const attempt = ++copyAttempt.current;
    const success = await copyCode(code);
    if (attempt !== copyAttempt.current) return;
    setCopiedCode(success ? code : "");
    setNotice({
      key: success ? "copied" : "copyFailed",
      code,
      error: !success,
    });
  }
  function loadResult(result: SearchResult) {
    setBuilder({ ...result.builder, modifiers: [...result.builder.modifiers] });
    setNotice({ key: "loaded" });
  }
  const sourceLink = `https://github.com/the-via/app/tree/${dictionaries.commit}/src/utils/key-to-byte`;
  return (
    <div className="app-shell">
      <div className="enclosure-hardware" aria-hidden="true">
        {["tl", "tr", "bl", "br"].map((corner) => (
          <i key={corner} className={`enclosure-screw enclosure-${corner}`} />
        ))}
      </div>
      <header className="topbar">
        <div className="brand">
          <span className="brand-symbol">
            <Keyboard size={23} />
          </span>
          <div>
            <strong>
              QMK<span className="brand-divider">/</span>COMPANION
            </strong>
            <span className="brand-caption">{t("appName")}</span>
          </div>
        </div>
        <nav className="top-actions" aria-label={t("appName")}>
          <a
            className="docs-link"
            href="https://docs.qmk.fm/keycodes.html"
            target="_blank"
            rel="noreferrer"
          >
            QMK Docs <ArrowUpRight size={13} />
          </a>
          <button
            className="language-button"
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
            aria-label={language === "zh" ? "Switch to English" : "切换到中文"}
          >
            <Globe2 size={15} />
            <span className={language === "zh" ? "active" : ""}>中文</span>
            <span>/</span>
            <span className={language === "en" ? "active" : ""}>EN</span>
          </button>
          <button
            className="icon-button"
            aria-label={t("help")}
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp size={20} />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="pulse-dot" />
              {t("workstation")}
            </div>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroDesc")}</p>
          </div>
          <div className="workflow-strip">
            <span>01 · {language === "zh" ? "查找" : "FIND"}</span>
            <span>02 · {language === "zh" ? "复制" : "COPY"}</span>
            <span>03 · VIA / ANY</span>
          </div>
        </section>
        <div className="workspace">
          <section className="panel library-panel" aria-label={t("library")}>
            <div className="panel-heading">
              <span className="panel-number">01</span>
              <h2>{t("library")}</h2>
              <Search size={17} />
            </div>
            <div className="library-inner">
              <div className="search-field">
                <Search size={18} />
                <input
                  aria-label={t("search")}
                  placeholder={t("search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  spellCheck={false}
                />
                {query && (
                  <button
                    className="icon-button"
                    aria-label={t("clearSearch")}
                    onClick={() => setQuery("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <p className="field-hint">{t("searchHint")}</p>
              <div className="category-grid" aria-label={t("library")}>
                {(Object.keys(categoryIcons) as SearchCategory[]).map((cat) => {
                  const Icon = categoryIcons[cat];
                  return (
                    <button
                      key={cat}
                      className={`category-button ${category === cat ? "active" : ""}`}
                      aria-pressed={category === cat}
                      onClick={() => setCategory(cat)}
                    >
                      <Icon size={14} />
                      {t(cat)}
                    </button>
                  );
                })}
              </div>
              <div className="results-heading" aria-live="polite">
                <span>
                  {results.length} {t("results")}
                </span>
                <span className="tiny-led" />
              </div>
            </div>
            <div className="keycode-results">
              {results.map((entry) => (
                <article
                  className={`keycode-result ${builder.mode === entry.builder.mode && builder.keycode === entry.builder.keycode && builder.modifiers.join() === entry.builder.modifiers.join() ? "active" : ""}`}
                  key={entry.id}
                >
                  <div className="result-heading">
                    <strong>{entry.name[language]}</strong>
                    {entry.platform && (
                      <span className="platform-badge">
                        {t(entry.platform)}
                      </span>
                    )}
                  </div>
                  <div className="result-combination">{entry.combination}</div>
                  <input
                    className="result-code"
                    aria-label={`${t("output")} ${entry.combination}`}
                    readOnly
                    value={entry.code}
                    spellCheck={false}
                    onFocus={(e) => e.target.select()}
                  />
                  <div className="result-actions">
                    <button
                      className="secondary-button"
                      aria-label={`${t("loadBuilder")} ${entry.combination}`}
                      onClick={() => loadResult(entry)}
                    >
                      <SlidersHorizontal size={14} />
                      {t("loadBuilder")}
                    </button>
                    <button
                      className="primary-button"
                      aria-label={`${t("copy")} ${entry.combination}`}
                      onClick={() => onCopy(entry.code)}
                    >
                      {copiedCode === entry.code ? (
                        <Check size={14} />
                      ) : (
                        <Clipboard size={14} />
                      )}
                      {t(copiedCode === entry.code ? "copied" : "copy")}
                    </button>
                  </div>
                </article>
              ))}
              {!results.length && (
                <div className="empty-results">
                  <Search size={28} />
                  <h3>{t("noResults")}</h3>
                  {error ? (
                    <p role="alert">
                      {t(error.key)}
                      {error.detail && <code> {error.detail}</code>}
                    </p>
                  ) : (
                    <p>{t("noResultsHint")}</p>
                  )}
                </div>
              )}
            </div>
            <div className="library-bottom">
              <span className="info-dot">i</span>
              <p>{t("shortcutNote")}</p>
            </div>
          </section>
          <BuilderPanel
            builder={builder}
            setBuilder={setBuilder}
            profile={profile}
            setProfile={setProfile}
            copiedCode={copiedCode}
            onCopy={onCopy}
            t={t}
          />
        </div>
        {notice && (
          <div
            className={`notification ${notice.error ? "error" : ""}`}
            role={notice.error ? "alert" : "status"}
          >
            <span>{t(notice.key)}</span>
            {notice.error && notice.code && (
              <input
                aria-label={t("output")}
                value={notice.code}
                readOnly
                onFocus={(e) => e.target.select()}
              />
            )}
            <button
              className="icon-button"
              aria-label={t("close")}
              onClick={() => setNotice(null)}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </main>
      <footer>
        <span>
          <ShieldCheck size={13} />
          {t("localOnly")}
        </span>
        <a href={sourceLink} target="_blank" rel="noreferrer">
          {t("source")}
          <ArrowUpRight size={12} />
        </a>
        <span>{t("sourceNote")}</span>
      </footer>
      {helpOpen && (
        <Dialog
          title={t("guideTitle")}
          closeLabel={t("close")}
          onClose={() => setHelpOpen(false)}
        >
          <div className="guide-content">
            {[1, 2, 3].map((n) => (
              <div className="guide-step" key={n}>
                <span className="panel-number">0{n}</span>
                <div>
                  <h3>{t(`guide${n}Title`)}</h3>
                  <p>{t(`guide${n}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </Dialog>
      )}
    </div>
  );
}
