# AGENTS.md

Verbindliche Regeln für alle Coding-Agenten in diesem Repository.

## Purpose

`@michelyweb/sveltia-media-focus-core` hält die generische Bildfokus-Logik der
aesthetic-&-soul-Website: zentrales Fokus-Manifest, Originalpfad-Auflösung,
Cover-Crop-Geometrie, der Sveltia-CMS-Picker (React über `CMS.React`) sowie
die Browser-Laufzeit für responsive Ausschnitte. Das Paket wird in neue
Astro-Projekte getragen; erste Integration: `Jehu/mwe-astro-starter`.

Ursprung und Referenzimplementierung: `Jehu/astro-aesthetic-and-soul`
(`website/src/lib/media-focus*.ts`, `website/src/cms/focal-point.ts`,
`website/src/scripts/focal.ts`). Der Sveltia-Quellpatch für den nativen
Mediathekdialog ist bewusst **nicht** hier, sondern bleibt im Ursprungsrepo
unter `website/vendor/sveltia/` gepflegt (siehe README → „Sveltia-Overlay“).

## Ownership

- Logik- und Testdateien sind unverändert aus dem Ursprungsrepo übernommen;
  fachliche Änderungen an Geometrie, Manifest oder Pfadauflösung gehören
  dorthin zurückportiert oder hier entwickelt und dort gegengeprüft.
- Die Beispieldaten `src/data/media-focus.json` bleiben leer
  (`{"version":1,"images":{}}`); echte Manifeste gehören ins Zielprojekt.

## Local Contracts

- Keine Dateisystem- oder Browserzugriffe in `src/lib/media-focus.ts`,
  `asset-path.ts`, `focal-geometry.ts`, `focal-crop-geometry.ts` — der Kern
  bleibt rein und testbar. Dateizugriff nur in `media-focus-build.ts`
  (Node), Browserzugriff nur in `src/scripts/focal.ts` und `src/cms/`.
- Manifestformat ist `{"version":1,"images":{<Originalpfad>:{sourceSha,focal:{x,y}}}}`;
  `sourceSha` ist die 40-stellige Git-Blob-SHA, `focal` liegt in [0,1].
  Schlüssel sind Pfade ab Repositorywurzel.
- Bekannte Monorepo-Kopplung (bewusst erhalten, Generalisierung ist Teil der
  Starter-Integration): `MEDIA_FOCUS_MANIFEST_PATH` und die `website/`-Prefixe
  in `asset-path.ts`/`media-focus-build.ts` gehen vom Ursprungs-Layout
  `website/src|public` aus.
- `src/lib/media-focus-website.ts` importiert `../data/media-focus.json?raw`
  (Astro/Vite-Loader) und ist als Adapterbeispiel zu lesen, nicht direkt
  lauffähig unter `node --test`.

## Work Guidance

- Commits auf Englisch, knapp und beschreibend.
- Vor jedem Commit: `pnpm test` fehlerfrei.

## Verification

```bash
pnpm install
pnpm test
```

## Child DOX Index

(keine Kinder)

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:46cd31e7 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
