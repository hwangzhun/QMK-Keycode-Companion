# Third-party notices

This project is distributed under GPL-3.0. See LICENSE.

- `src/data/dictionaries.json`: pinned numeric keycode dictionaries from the-via/app (GPL-3.0), commit `935106a990af39bdd1ade881c02366eac486240d`, retrieved 2026-10-09. Legacy is VIA protocol 12. Version 8 and version 9 both use the protocol 13 dictionary in this upstream snapshot; they are deliberately identical, not inferred from a backup. https://github.com/the-via/app/tree/935106a990af39bdd1ade881c02366eac486240d/src/utils/key-to-byte
- `tests/reference/via-advanced-keys.ts`: VIA expression parser (formatting only, no behavior changes) from that same commit, GPL-3.0, used only as an independent test oracle. https://github.com/the-via/app/blob/935106a990af39bdd1ade881c02366eac486240d/src/utils/advanced-keys.ts
- Space Grotesk and JetBrains Mono: SIL Open Font License 1.1; bundled through Fontsource. https://fontsource.org/fonts/space-grotesk and https://fontsource.org/fonts/jetbrains-mono
- Lucide icons: ISC. https://lucide.dev/license

QMK documentation supplies the behavioral reference; this project is an independent tool, not an official QMK, VIA, or Vial product.
