# Triathlon Rechner — Architektur

## 1. Dateistruktur

```
triathlon-rechner.html   — HTML-Gerüst (semantisches Markup)
triathlon-rechner.css    — sämtliche Styles (keine inline-style-Attribute)
triathlon-rechner.js     — gesamte App-Logik (IIFE, "use strict")
ARCHITECTURE.md          — diese Datei
PROMPT_TEMPLATE.md       — Prompt-Vorlage für zukünftige Änderungen
```

Jede Datei hat eine klar abgegrenzte Verantwortung. Es gibt **keine** vermischten Zuständigkeiten (kein CSS/JS inline im HTML).

---

## 2. HTML — Struktur

### 2.1 Top-Level

```html
<div class="app" role="main"> … </div>
```

- Maximale Breite: `480px` (CSS), zentriert via Flexbox auf `<body>`.
- Der Container hält die gesamte App.

### 2.2 Komponenten-Baum

```
.app
├── h1 + p (Kopfzeile)
├── .dist-grid (Distanz-Auswahl, 4 Buttons)
├── section.card (Schwimmen)
│   ├── .card-header (Titel + .dist-label-container > .dist-display + .dist-edit)
│   ├── .mode-toggle (Umschalter Zeit/Pace)
│   ├── .input-group[data-mode-group="time"]
│   │   └── .input-row > .field-group > input×3 (hh, mm, ss)
│   ├── .input-group[data-mode-group="pace"]
│   │   └── .input-row > .field-group > input×2 (mm, ss/100m)
│   └── .result#result-swim (Ausgabe Zeit + Pace)
├── section.card (T1)
├── section.card (Radfahren)
│   └── analog zu Schwimmen, aber mode-group="speed" (km/h)
├── section.card (T2)
├── section.card (Laufen)
│   └── analog zu Schwimmen, pace-Einheit /km
└── section.card#summary (Gesamtzeit-Tabelle)
    ├── #summary-rows (Einzelzeiten)
    └── .total-row#total-row (Summe)
```

### 2.3 Data-Attribute (Vertrag zwischen HTML und JS)

| Attribut | Werte | Zweck |
|---|---|---|
| `data-dist` | `sprint`, `olympic`, `middle`, `long` | Distanz-Auswahl |
| `data-sport` | `swim`, `bike`, `run`, `t1`, `t2` | Sportart / Transition |
| `data-part` | `h`, `m`, `s`, `pm`, `ps`, `v`, `dist` | Eingabetyp (Stunden, Minuten, Sekunden, Pace-Min, Pace-Sek, Geschwindigkeit, Distanz) |
| `data-mode` | `time`, `pace`, `speed` | Aktiver Eingabemodus einer Sportart |
| `data-mode-group` | `time`, `pace`, `speed` | Gruppenzugehörigkeit eines Input-Blocks (Sichtbarkeit via CSS-Klasse `.visible`) |

### 2.4 Regeln für Erweiterungen

- Neue Sportart → neues `<section class="card">` nach gleichem Muster, eigenes `data-sport`.
- Neue Distanz → Eintrag in `DISTANCES` + Button in `.dist-grid`.
- Neue Eingabeart → neues `data-part` + Lesefunktion in JS.
- Inline-style-Attribute nur für initial versteckte Elemente (z. B. `style="display:none"` auf `.dist-edit`).

---

## 3. CSS — Aufbau

### 3.1 Custom Properties (`:root`)

```css
--swim, --bike, --run, --t    /* Sport-Farben */
--bg, --card, --text, --muted /* Theme */
--bor, --rad, --sh             /* Border / Radius / Shadow */
```

- Werte können zentral angepasst werden (z. B. Dark‑Mode via Media-Query).
- Keine hardcodierten Farben außerhalb von `:root` (Ausnahme: `.dist-btn.active`).

### 3.2 Layout-Strategie

- **Mobile-First**: Basis-Styles für < 480px.
- Breakpoints:
  - `@media (max-width: 360px)` – sehr kleine Geräte (Schrift/Padding reduzieren).
  - `@media (min-width: 600px)` – `.app` auf 520px begrenzt.
- Kein Framework, reines Flexbox.

### 3.3 Sichtbarkeits-Steuerung

```css
.input-group { display: none; }
.input-group.visible { display: block; }
```

- Die Klasse `.visible` wird von JS gesetzt, nicht inline.

### 3.4 Kategorien im Stylesheet

Die Abschnitte sind durch Kommentare getrennt und sollten in dieser Reihenfolge erweitert werden:

1. Reset + Custom Properties
2. Body + App-Container
3. Header
4. .dist-grid / .dist-btn
5. .card / .card-header
6. .mode-toggle / .mode-btn
7. .input-row / .input-group
8. .result
9. #summary
10. .empty-state
11. Media Queries
12. Accessibility (`prefers-reduced-motion`, `focus-visible`)

---

## 4. JavaScript — Architektur

### 4.1 Einkapselung

```js
(function () {
  "use strict";
  // …
})();
```

- IIFE – keine globalen Variablen, keine Seiteneffekte.
- Alle Funktionen sind privat.

### 4.2 Datenmodell

```js
const DISTANCES = {
  sprint:  { swim: 0.75,  bike: 20,  run: 5,    label: "Sprint" },
  olympic: { swim: 1.5,   bike: 40,  run: 10,   label: "Olympisch" },
  middle:  { swim: 1.9,   bike: 90,  run: 21.1, label: "Mittel" },
  long:    { swim: 3.8,   bike: 180, run: 42.2, label: "Lang" },
};
```

- Einzelquelle der Wahrheit (Single Source of Truth).
- Schlüssel `data-dist` → Lookup in `DISTANCES`.
- Neue Distanz: Eintrag hier + `.dist-btn` in HTML.

### 4.3 Datenfluss

```
input/click → update()
                ├── selected distance → DISTANCES[key]
                ├── customDists überschreibt DISTANCES[key] (wenn gesetzt)
                ├── getActiveMode(sport) → "time" | "pace" | "speed"
                ├── getTime(sport) / getSwimPace() / … → Rohwert
                ├── calcSwim(dist) / calcBike / calcRun → Ergebnis
                ├── fmtTime / fmtPace / fmtPaceSwim / fmtSpeed → Anzeige
                └── DOM-Manipulation (Summary & Gesamt, .is-custom-Klassen)
```

- **Unidirektional**: Eingabe → `update()` → DOM schreiben.
- Minimaler State: `customDists` (Object `{ swim, bike, run }`) für manuell abweichende Distanzen.
- `update()` ist die einzige Stelle, die das DOM verändert.

### 4.4 Event-System

| Event | Quelle | Handler |
|---|---|---|---|
| `click` | `.dist-btn` | Klasse umschalten, `customDists` zurücksetzen, `update()` |
| `input` | `input[data-sport]` | `update()` |
| `click` | `.mode-btn[data-mode]` | Klasse umschalten, `.visible` togglen, `update()` |
| `click` | `.dist-display` | Eingabemodus aktivieren (Input einblenden, fokussieren) |
| `blur` / `keydown(Enter)` | `.dist-edit` | Wert in `customDists` speichern, `update()` |

- Initialer Aufruf `update()` nach Event-Registrierung (Startwert).

### 4.5 Modulare Erweiterbarkeit

Neue Sportart hinzufügen:
1. HTML: `<section class="card">` mit eigenem `data-sport`, passenden `data-part`-Inputs und `.result`.
2. CSS: ggf. neue Custom Property + Klasse (z. B. `--my-sport`, `.my-sport-c`).
3. JS:
   - `getXxxPace()` / `getXxxSpeed()` – Lesefunktion für die neue Eingabe.
   - `calcXxx(distKm)` – Berechnung nach Schema `calcSwim`/`calcBike`/`calcRun`.
   - Ergebnis in `update()` auslesen und in DOM schreiben.
   - `parts`-Array in `update()` erweitern.

Neuer Distanz-Typ:
1. HTML: Button in `.dist-grid`.
2. JS: Eintrag in `DISTANCES`.

### 4.6 Wichtige Namenskonventionen (JS)

| Muster | Beispiele |
|---|---|
| `get<Sportart><Eingabe>()` | `getSwimPace()`, `getBikeSpeed()`, `getRunPace()` |
| `calc<Sportart>(distKm)` | `calcSwim(distKm)`, `calcBike(distKm)`, `calcRun(distKm)` |
| `fmt<Format>(wert)` | `fmtTime(sec)`, `fmtPace(secPerKm)`, `fmtSpeed(kmh)` |
| `data-sport`-Werte | `swim`, `bike`, `run`, `t1`, `t2`, `dist` |
| `data-part`-Werte | `h`, `m`, `s`, `pm`, `ps`, `v`, `swim`, `bike`, `run` |

---

## 5. Manuelle Distanzen (Custom Distances)

### 5.1 Konzept

Distanzen sind durch Klick auf das Distanz-Label in jeder Sport-Card direkt editierbar. Weicht eine Distanz vom Standardwert der gewählten Distanzklasse ab, wird das gelb hervorgehoben.

### 5.2 State

```js
let customDists = { swim: null, bike: null, run: null };
```

- `null` bedeutet: Standardwert der aktuell gewählten Distanzklasse verwenden.
- Ein Zahlenwert überschreibt die Standarddistanz für diese Disziplin.

### 5.3 UI-Komponenten (je Disziplin)

```html
<span class="dist-label-container" data-part="swim">
  <span class="dist-display" id="dist-swim">0.75 km</span>
  <input class="dist-edit" type="number" data-sport="dist" data-part="swim" style="display:none">
</span>
```

- `.dist-display` — Anzeige des aktuellen Werts, Klick startet Editiermodus.
- `.dist-edit` — nummerisches Input-Feld, initial versteckt.

### 5.4 Verhalten

| Aktion | Effekt |
|---|---|
| Klick auf `.dist-display` | `.dist-edit` einblenden, fokussieren, aktuellen Wert vorausfüllen |
| Enter / Blur im `.dist-edit` | Wert in `customDists[part]` speichern, `update()` aufrufen |
| Escape im `.dist-edit` | `customDists[part] = null`, `update()` aufrufen (Standardwert wiederhergestellt) |
| Klick auf Standard-Distanz-Button (Sprint etc.) | `customDists` wird auf `{ swim: null, bike: null, run: null }` zurückgesetzt |
| `update()` mit aktivem `customDists` | `distName` zeigt "✏️ Manuell", Container erhält Klasse `.is-custom` (gelbes Label) |

### 5.5 Datenfluss

```
Klick auf .dist-display → Edit-Modus
  ├── Enter/Blur → customDists[part] = wert → update()
  └── Escape    → customDists[part] = null → update()

update():
  ├── swimDist = customDists.swim ?? base.swim
  ├── bikeDist = customDists.bike ?? base.bike
  ├── runDist  = customDists.run  ?? base.run
  ├── is-custom-Klasse setzen / entfernen
  └── calcSwim(swimDist), calcBike(bikeDist), calcRun(runDist)
```

### 5.6 CSS-Indikator

```css
.dist-label-container.is-custom .dist-display {
  background: #fff3cd;  /* gelb */
  color: #856404;
}
```

Die Klasse `.is-custom` wird von `update()` gesetzt, sobald für die entsprechende Disziplin ein manueller Wert in `customDists` hinterlegt ist.

---

## 6. Umgang mit Sonderzeichen

- Javascript verwendet Unicode-Escapes (`\u2014`, `\u{1F3CA}`) statt roher Emojis/UTF-8 in Strings, um Kodierungsprobleme zu vermeiden.
- HTML enthält rohe Emojis – das ist für UTF-8-Dokumente unproblematisch.
- CSS enthält keine Sonderzeichen außerhalb von Kommentaren.

---

## 7. Accessibility (Barrierefreiheit)

- `role="radiogroup"` + `role="radio"` + `aria-checked` für Distanz-Buttons.
- `role="tablist"` + `role="tab"` + `aria-selected` für Mode-Umschalter.
- `aria-label` auf Eingabefeldern.
- `autofocus` auf erstem Distanz-Button.
- `prefers-reduced-motion` respektiert Nutzer:innen, die Animationen vermeiden.
- `focus-visible` für Tastatur-Navigation.
