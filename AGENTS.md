# AGENTS.md

Verbindliche Regeln für alle Coding-Agenten in diesem Repository.

## Purpose

`@jehu/media-focus-core` hält die generische Bildfokus-Logik der
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
