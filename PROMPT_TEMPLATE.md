# Prompt-Vorlage für Änderungen am Triathlon Rechner

Dieses Dokument dient als Vorlage für Prompts an KI-Assistenten, die Änderungen an der App vornehmen sollen. Es stellt sicher, dass die bestehende Architektur respektiert wird und nur die gewünschten Anpassungen erfolgen.

---

## Pflichten bei jeder Änderung

1. **Lies `ARCHITECTURE.md`** – die Datei beschreibt den vollständigen Aufbau (Dateistruktur, Datenmodell, Event-System, Namenskonventionen). Alle Änderungen müssen sich in dieses Schema einfügen.

2. **Ändere nur das, was explizit genannt wird.**  
   - Keine Refactorings, Umbenennungen oder Umstrukturierungen.
   - Keine Hinzufügung von Features, die nicht angefordert wurden.
   - Keine Änderung des Designs (Farben, Abstände, Typografie), es sei denn, es ist Teil des Auftrags.
   - Keine Änderung bestehender `data-*`-Attribute oder HTML-Strukturen ohne Notwendigkeit.

3. **Halte die Datei-Grenzen ein.**  
   - `triathlon-rechner.html` – nur HTML-Markup, keine `<style>`- oder `<script>`-Blöcke.
   - `triathlon-rechner.css` – nur Styles, keine HTML oder JS.
   - `triathlon-rechner.js` – nur JavaScript, keine Style-Definitionen.

4. **Verwende keine inline-style-Attribute.**  
   - Alle visuellen Anpassungen gehören in `triathlon-rechner.css`, gesteuert über Klassen/Selektoren.
   - Einzige Ausnahme: `style="display:none"` auf `#total-row` (initial versteckt, von JS umgeschaltet).

5. **Aktualisiere `ARCHITECTURE.md` bei relevanten Änderungen.**  
   - Wenn neue Komponenten, Datenattribute, Distanzen, Berechnungsfunktionen oder CSS-Kategorien hinzukommen, dokumentiere diese in `ARCHITECTURE.md`.
   - Wenn vorhandene Strukturen geändert werden (z. B. neues `data-part`-Muster), aktualisiere die Tabellen und Beschreibungen.

6. **Teste die Änderung durch manuelle Prüfung oder Konsolen-Test.**  
   - Nach der Änderung muss die App ohne JS-Fehler laufen.
   - Die bestehenden Funktionen (Distanz-Auswahl, Mode-Umschaltung, Live-Berechnung, Summary) müssen weiterarbeiten.

---

## Prompt-Schablone

```
Ändere den Triathlon Rechner wie folgt:

<gewünschte Änderung 1>
<gewünschte Änderung 2>
…

Wichtig:
- Lies vor der Umsetzung ARCHITECTURE.md.
- Ändere nur die genannten Punkte, keine anderen Anpassungen.
- Halte die Trennung von HTML / CSS / JS ein.
- Verwende keine inline-style-Attribute.
- Aktualisiere ARCHITECTURE.md, falls die Änderung strukturelle Relevanz hat.
- Prüfe nach der Änderung auf JS-Fehler und stelle sicher, dass die App fehlerfrei läuft.
```

---

## Beispiele für präzise Änderungs-Wünsche

| ✅ Gut | ❌ Ungenau |
|---|---|
| "Füge eine neue Distanz 'Super-Sprint' mit 0,4 km Schwimmen, 10 km Rad, 2,5 km Laufen hinzu." | "Füge mehr Distanzen hinzu." |
| "Ergänze für das Radfahren zusätzlich eine Watt-Eingabe (data-part='w'), aus der die Geschwindigkeit geschätzt wird." | "Baue das Radfahren um." |
| "Füge unter der Gesamtzeit eine Spalte 'Pace gesamt' (min/km) hinzu." | "Zeig mehr Infos in der Summary an." |
| "Benenne im CSS die Farbe --swim von #1e88e5 in #0d47a1 um." | "Das Blau vom Schwimmen gefällt mir nicht." |

---

## Nach einer Änderung

- Entferne `console.log`- oder Debugging-Ausgaben.
- Stelle sicher, dass die Änderung keine neuen Abhängigkeiten (Frameworks, CDNs, Polyfills) mit sich bringt – die App ist dependency-frei und soll es bleiben.
- Falls die Änderung das PDF-Export-Verhalten oder Drucken betrifft: `@media print`-Regeln in CSS ergänzen, kein separater Print-Modus.
