# @jehu/sveltia-media-focus-core

Generische Bildfokus-Logik für Astro-Websites mit Sveltia CMS: ein zentraler
Fokuspunkt pro Originalbild, gepflegt in der CMS-Mediathek, wirksam in allen
Verwendungen des Originals (Hero, Karten, Teaser, OG-Bilder).

Extrahiert aus `Jehu/astro-aesthetic-and-soul`; dort läuft die Referenz-
integration inkl. Sveltia-Quellpatch.

## Installation

```bash
pnpm add @jehu/sveltia-media-focus-core
```

Öffentlich auf [npmjs.org](https://www.npmjs.com/package/@jehu/sveltia-media-focus-core);
Imports wie gewohnt über die Modulpfade unten (Exports-Map `./* → ./src/*`).

## Module

| Pfad | Inhalt |
|---|---|
| `src/lib/media-focus.ts` | Manifest-Parser/Validator (`version: 1`, Duplicate-Key- und Pfadkollisionsprüfung), `getMediaFocus` |
| `src/lib/asset-path.ts` | Normalisierung und Auflösung von Originalbildpfaden (repo-relativ, kein `/_astro/`-Derivat) |
| `src/lib/focal-geometry.ts` | `computeObjectPosition` — Cover-Crop-Position aus Fokus, Original- und Rahmenmaßen |
| `src/lib/focal-crop-geometry.ts` | Hintergrund-Positionen (`background-size` inkl. `auto`), exakte Crop-Rechtecke (OG), Deko-Verschiebung |
| `src/lib/media-focus-assets.ts` | Astro-Adapter: `originalImage`/`bindEntryImages` (Originalpfad an `ImageMetadata` binden), `captureImageReferences` |
| `src/lib/media-focus-build.ts` | Build-Prüfung (Node): Manifest lesen, Originale auf Existenz zulässiger Bereiche prüfen |
| `src/lib/media-focus-markdown.ts` | Markdown/MDX-Einbindung (Sättri/HAST) |
| `src/lib/media-focus-website.ts` | Astro-Adapterbeispiel: `focusAttributes` (`data-original-image`, `data-focal-x/y`), `pageImageFocus` |
| `src/cms/focal-point.ts` | Sveltia-Picker-Widgets über `CMS.React` (Fokus setzen per Klick/Ziehen/Tastatur/X-Y, Ausschnittvorschauen) |
| `src/cms/focal-point.css` | Styles für Picker und Vorschauen |
| `src/scripts/focal.ts` | Browser-Laufzeit: `object-position`/`background-position` bei Load und Resize (ResizeObserver, `#media-focus-data`-JSON) |

## Datenvertrag

`media-focus.json` im Zielprojekt (z. B. `src/data/media-focus.json`):

```json
{
  "version": 1,
  "images": {
    "website/src/assets/uploads/foo.jpg": {
      "sourceSha": "40-stellige Git-Blob-SHA",
      "focal": { "x": 0.42, "y": 0.3 }
    }
  }
}
```

- `focal.x/y` endlich, 0–1 einschließlich Randwerte.
- `sourceSha`: SHA-1 über den Blob-Header `blob <Bytes>\0` + Dateibytes
  (Git-Blob-SHA, nicht SHA-1 der Datei); dient dem CMS-Konfliktabgleich.
- Fehlt ein Eintrag, gilt der Layout-Fallback (bisheriger zentrierter
  Ausschnitt), kein impliziter Mittelpunkt.
- Die Bilddatei selbst wird nie verändert (kein EXIF-/XMP-Schreiben).

## Integration (Kurzform)

1. Module ins Zielprojekt übernehmen (gleiche relative Struktur
   `src/lib`, `src/cms`, `src/scripts` hält die Imports intakt) oder per
   Paketeinbindung.
2. Manifest im Projekt anlegen und über `media-focus-build.ts` im Build
   prüfen lassen.
3. Bilder mit `focusAttributes()`/`backgroundFocusAttributes()` markieren;
   pro Seite nur die verwendeten Punkte als inertes JSON
   (`#media-focus-data`) ausliefern (siehe `pageImageFocus`).
4. `src/scripts/focal.ts` laden (Astro-Events `astro:page-load` /
   `astro:before-swap` sind bereits angebunden).
5. CMS: `focal-point.ts` nach dem gepinnten Sveltia-Bundle laden,
   `focal-point.css` einbinden, Widgets über `CMS.React` registrieren.

### Sveltia-Overlay (nicht Teil dieses Pakets)

Das Einhängen des Fokusdialogs in Sveltias **native** Mediathek erfordert
einen Quellpatch gegen die gepinnte Sveltia-Version (0.250.2). Patch,
Overlay (`focal-dialog.svelte`, `focus.js`, `focus-preview.js`) und
Build-/Verify-Skripte bleiben im Ursprungsrepo unter
`website/vendor/sveltia/` gepflegt und werden von dort in Zielprojekte
vendort. Langfristiges Ziel ist eine Upstream-Extension-API.

## Bekannte Kopplungen

- `MEDIA_FOCUS_MANIFEST_PATH = 'website/src/data/media-focus.json'` und die
  `website/`-Prefixe in `asset-path.ts`/`media-focus-build.ts` setzen das
  Monorepo-Layout des Ursprungsprojekts. Für andere Layouts beim Einbinden
  anpassen (Generalisierung ist Teil der mwe-astro-starter-Integration).
- CMS-Dialogtexte und Fehlermeldungen sind deutsch.

## Tests

```bash
pnpm install
pnpm test
```

`node --test` mit `--experimental-strip-types`; Testumfang identisch mit den
übernommenen Suites des Ursprungsrepos (Manifest, Pfade, Geometrie, Assets,
Build, Markdown).

## Lizenz

MIT — siehe [LICENSE](LICENSE).
