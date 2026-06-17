(function () {
  "use strict";

  const DISTANCES = {
    sprint:  { swim: 0.75,  bike: 20,  run: 5,    label: "Sprint" },
    olympic: { swim: 1.5,   bike: 40,  run: 10,   label: "Olympisch" },
    middle:  { swim: 1.9,   bike: 90,  run: 21.1, label: "Mittel" },
    long:    { swim: 3.8,   bike: 180, run: 42.2, label: "Lang" },
  };

  const distBtns   = document.querySelectorAll(".dist-btn");
  const inputs     = document.querySelectorAll("input[data-sport]");
  const modeBtns   = document.querySelectorAll(".mode-btn[data-mode]");
  const summaryEl  = document.getElementById("summary-rows");
  const totalRow   = document.getElementById("total-row");
  const totalTime  = document.getElementById("total-time");
  const distName   = document.getElementById("dist-name");

  let customDists = { swim: null, bike: null, run: null };

  function pad2(n) { return String(n).padStart(2, "0"); }

  function fmtTime(sec) {
    if (sec == null || !isFinite(sec) || sec < 0) return "\u2014";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0
      ? `${h}:${pad2(m)}:${pad2(s)} h`
      : `${m}:${pad2(s)} min`;
  }

  function fmtPace(secPerUnit) {
    if (secPerUnit == null || !isFinite(secPerUnit) || secPerUnit < 0) return "\u2014";
    const m = Math.floor(secPerUnit / 60);
    const s = Math.floor(secPerUnit % 60);
    return `${m}:${pad2(s)} min/km`;
  }

  function fmtPaceSwim(secPer100) {
    if (secPer100 == null || !isFinite(secPer100) || secPer100 < 0) return "\u2014";
    const m = Math.floor(secPer100 / 60);
    const s = Math.floor(secPer100 % 60);
    return `${m}:${pad2(s)} /100\u202fm`;
  }

  function fmtSpeed(kmh) {
    if (kmh == null || !isFinite(kmh) || kmh < 0) return "\u2014";
    return `${kmh.toFixed(1)} km/h`;
  }

  function getNumVal(el) {
    const v = parseFloat(el.value);
    return (!isNaN(v) && v >= 0) ? v : null;
  }

  function getTime(sport) {
    const h = document.querySelector(`input[data-sport="${sport}"][data-part="h"]`);
    const m = document.querySelector(`input[data-sport="${sport}"][data-part="m"]`);
    const s = document.querySelector(`input[data-sport="${sport}"][data-part="s"]`);
    const hh = getNumVal(h);
    const mm = getNumVal(m);
    const ss = getNumVal(s);
    if (hh === null && mm === null && ss === null) return null;
    return ((hh || 0) * 3600) + ((mm || 0) * 60) + (ss || 0);
  }

  function getSwimPace() {
    const pm = document.querySelector('input[data-sport="swim"][data-part="pm"]');
    const ps = document.querySelector('input[data-sport="swim"][data-part="ps"]');
    const m = getNumVal(pm);
    const s = getNumVal(ps);
    if (m === null && s === null) return null;
    return ((m || 0) * 60) + (s || 0);
  }

  function getRunPace() {
    const pm = document.querySelector('input[data-sport="run"][data-part="pm"]');
    const ps = document.querySelector('input[data-sport="run"][data-part="ps"]');
    const m = getNumVal(pm);
    const s = getNumVal(ps);
    if (m === null && s === null) return null;
    return ((m || 0) * 60) + (s || 0);
  }

  function getBikeSpeed() {
    const v = document.querySelector('input[data-sport="bike"][data-part="v"]');
    return getNumVal(v);
  }

  function getT(t) {
    return getTime(t);
  }

  function getActiveMode(sport) {
    const btn = document.querySelector(`.mode-btn[data-mode][data-sport="${sport}"].active`);
    return btn ? btn.dataset.mode : "time";
  }

  function calcSwim(distKm) {
    const distM = distKm * 1000;
    const mode = getActiveMode("swim");
    const timeSec = getTime("swim");
    const paceSec = getSwimPace();

    if (mode === "time" && timeSec !== null) {
      const pace = timeSec / (distM / 100);
      return { time: timeSec, pace, speed: distKm / (timeSec / 3600) };
    }
    if (mode === "pace" && paceSec !== null) {
      const t = paceSec * (distM / 100);
      return { time: t, pace: paceSec, speed: distKm / (t / 3600) };
    }
    return { time: null, pace: null, speed: null };
  }

  function calcBike(distKm) {
    const mode = getActiveMode("bike");
    const timeSec = getTime("bike");
    const speed = getBikeSpeed();

    if (mode === "time" && timeSec !== null) {
      const s = distKm / (timeSec / 3600);
      return { time: timeSec, speed: s };
    }
    if (mode === "speed" && speed !== null && speed > 0) {
      const t = (distKm / speed) * 3600;
      return { time: t, speed };
    }
    return { time: null, speed: null };
  }

  function calcRun(distKm) {
    const mode = getActiveMode("run");
    const timeSec = getTime("run");
    const paceSec = getRunPace();

    if (mode === "time" && timeSec !== null) {
      const p = timeSec / distKm;
      return { time: timeSec, pace: p, speed: distKm / (timeSec / 3600) };
    }
    if (mode === "pace" && paceSec !== null) {
      const t = paceSec * distKm;
      return { time: t, pace: paceSec, speed: distKm / (t / 3600) };
    }
    return { time: null, pace: null, speed: null };
  }

  function update() {
    const sel = document.querySelector(".dist-btn.active");
    if (!sel) return;
    const key = sel.dataset.dist;
    const base = DISTANCES[key];
    if (!base) return;

    const swimDist = customDists.swim !== null ? customDists.swim : base.swim;
    const bikeDist = customDists.bike !== null ? customDists.bike : base.bike;
    const runDist  = customDists.run  !== null ? customDists.run  : base.run;
    const hasCustom = customDists.swim !== null || customDists.bike !== null || customDists.run !== null;

    document.getElementById("dist-swim").textContent = swimDist + " km";
    document.getElementById("dist-bike").textContent = bikeDist + " km";
    document.getElementById("dist-run").textContent  = runDist  + " km";
    distName.textContent = hasCustom ? "\u270f\ufe0f Manuell" : base.label;

    document.querySelectorAll(".dist-label-container").forEach(c => {
      customDists[c.dataset.part] !== null
        ? c.classList.add("is-custom")
        : c.classList.remove("is-custom");
    });

    const swim = calcSwim(swimDist);
    const bike = calcBike(bikeDist);
    const run  = calcRun(runDist);
    const t1   = getT("t1");
    const t2   = getT("t2");

    const rSwim = document.getElementById("result-swim");
    const sv = rSwim.querySelectorAll(".value");
    sv[0].textContent = fmtTime(swim.time);
    sv[1].textContent = fmtPaceSwim(swim.pace);

    const rBike = document.getElementById("result-bike");
    const bv = rBike.querySelectorAll(".value");
    bv[0].textContent = fmtTime(bike.time);
    bv[1].textContent = fmtSpeed(bike.speed);

    const rRun = document.getElementById("result-run");
    const rv = rRun.querySelectorAll(".value");
    rv[0].textContent = fmtTime(run.time);
    rv[1].textContent = fmtPace(run.pace);

    document.querySelector("#result-t1 .value").textContent = fmtTime(t1);
    document.querySelector("#result-t2 .value").textContent = fmtTime(t2);

    const parts = [
      { label: "\u{1F3CA} Schwimmen", time: swim.time, cls: "swim-c" },
      { label: "\u{1F504} T1",        time: t1,        cls: "" },
      { label: "\u{1F6B4} Radfahren", time: bike.time, cls: "bike-c" },
      { label: "\u{1F504} T2",        time: t2,        cls: "" },
      { label: "\u{1F3C3} Laufen",    time: run.time,  cls: "run-c" },
    ];

    let anyTime = false;
    for (const p of parts) {
      if (p.time !== null && isFinite(p.time)) anyTime = true;
    }

    if (!anyTime) {
      summaryEl.innerHTML = `<div class="empty-state">Werte eingeben f\u00fcr die Berechnung</div>`;
      totalRow.style.display = "none";
      return;
    }

    summaryEl.innerHTML = parts.map(p => {
      const t = p.time;
      if (t == null || !isFinite(t)) return "";
      return `<div class="summary-row">
        <span class="s-label">${p.label}</span>
        <span class="s-time ${p.cls}">${fmtTime(t)}</span>
      </div>`;
    }).join("");

    const totalSec = parts.reduce((acc, p) => {
      if (p.time != null && isFinite(p.time)) return acc + p.time;
      return acc;
    }, 0);

    if (isFinite(totalSec) && totalSec > 0) {
      totalRow.style.display = "flex";
      totalTime.textContent = fmtTime(totalSec);
    } else {
      totalRow.style.display = "none";
    }
  }

  distBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      distBtns.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      this.classList.add("active");
      this.setAttribute("aria-checked", "true");

      if (this.dataset.dist === "prognose") {
        setPrognoseMode(true);
      } else {
        setPrognoseMode(false);
        customDists = { swim: null, bike: null, run: null };
        update();
      }
    });
  });

  inputs.forEach(inp => {
    inp.addEventListener("input", update);
  });

  modeBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      const sport = this.dataset.sport;
      const container = this.closest(".card");
      const siblings = container.querySelectorAll(".mode-btn[data-mode]");
      siblings.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      this.classList.add("active");
      this.setAttribute("aria-selected", "true");

      const mode = this.dataset.mode;
      container.querySelectorAll("[data-mode-group]").forEach(g => {
        g.classList.toggle("visible", g.dataset.modeGroup === mode);
      });

      update();
    });
  });

  document.querySelectorAll(".dist-label-container").forEach(initEdit);

  function initEdit(container) {
    const part = container.dataset.part;
    const display = container.querySelector(".dist-display");
    const input = container.querySelector(".dist-edit");

    display.addEventListener("click", function () {
      if (input.style.display !== "none") return;
      const sel = document.querySelector(".dist-btn.active");
      const base = sel ? DISTANCES[sel.dataset.dist] : null;
      const standardVal = base ? base[part] : 0;
      input.value = customDists[part] !== null ? customDists[part] : standardVal;
      display.style.display = "none";
      input.style.display = "";
      input.focus();
      input.select();
    });

    function commit() {
      const val = getNumVal(input);
      customDists[part] = val;
      display.style.display = "";
      input.style.display = "none";
      update();
    }

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { commit(); }
    });
  }

  /* ─── PROGNOSE ─── */
  const PROG_DISTS = {
    swim: [0.4, 0.8, 1.5, 1.9, 3.8],
    bike: [10, 20, 40, 90, 180],
    run:  [5, 10, 21.1, 42.2]
  };

  const TRI_DISTS = {
    sprint:  { swim: 0.75, bike: 20,  run: 5,    label: "Sprint" },
    olympic: { swim: 1.5,  bike: 40,  run: 10,   label: "Olympisch" },
    middle:  { swim: 1.9,  bike: 90,  run: 21.1, label: "Mittel" },
    long:    { swim: 3.8,  bike: 180, run: 42.2, label: "Lang" }
  };

  const progInputs = document.querySelectorAll("[data-prog]");
  const progView   = document.getElementById("prognose-view");
  const normalCards = document.querySelectorAll("section.card:not(#prognose-settings):not(#prognose-results)");

  function getProgVal(sport, part) {
    const el = document.querySelector(`[data-prog="${sport}"][data-part="${part}"]`);
    if (!el) return null;
    const v = parseFloat(el.value);
    return (!isNaN(v) && v >= 0) ? v : null;
  }

  function getProgPace(sport) {
    const pm = getProgVal(sport, "pm");
    const ps = getProgVal(sport, "ps");
    if (pm === null && ps === null) return null;
    return (pm || 0) * 60 + (ps || 0);
  }

  function riegel(refDist, refTime, tgtDist, exp) {
    return refTime * Math.pow(tgtDist / refDist, exp || 1.06);
  }

  function predictSwim(distKm) {
    const css = getProgPace("swim");
    if (!css || css <= 0) return null;
    const d1 = 360 / css;
    const t = riegel(d1, 3600, distKm, 1.06);
    return { time: t, pace: t / (distKm * 10) };
  }

  function predictRun(distKm) {
    const tp = getProgPace("run");
    if (!tp || tp <= 0) return null;
    const d1 = 3600 / tp;
    const t  = riegel(d1, 3600, distKm, 1.06);
    return { time: t, pace: t / distKm };
  }

  function predictBike(distKm) {
    const ftp    = getProgVal("bike", "ftp");
    const weight = getProgVal("body", "weight") || 70;
    if (!ftp || ftp <= 0) return null;

    const totalMass = weight + 10;
    const Wp  = 20000;
    const rho = 1.2, cda = 0.30, crr = 0.004, g = 9.81;
    const a = 0.5 * rho * cda;
    const bCo = crr * totalMass * g;

    function avgPwr(t) {
      if (t <= 0) return ftp;
      if (t <= 3600) return Math.min(Wp / t + ftp, ftp * 1.5);
      return ftp * Math.pow(3600 / t, 0.07);
    }

    function speedFromPwr(p) {
      let v = Math.pow(p / a, 1/3);
      for (let i = 0; i < 30; i++) {
        const f  = a * v * v * v + bCo * v - p;
        const df = 3 * a * v * v + bCo;
        v -= f / df;
        if (Math.abs(f) < 0.001) break;
      }
      return v * 3.6;
    }

    let timeSec = (distKm / 35) * 3600;
    for (let iter = 0; iter < 20; iter++) {
      const p = avgPwr(timeSec);
      const v = speedFromPwr(p);
      if (v <= 0) return null;
      const newTime = (distKm / v) * 3600;
      if (Math.abs(newTime - timeSec) < 0.5) break;
      timeSec = Math.max(newTime, 60);
    }

    const finalPwr = avgPwr(timeSec);
    return { time: timeSec, speed: speedFromPwr(finalPwr), power: finalPwr };
  }

  /* ─── TRIATHLON-PROGNOSE (mit Ermüdung) ─── */
  function predictSwimTri(distKm) {
    return predictSwim(distKm);
  }

  function predictBikeTri(distKm, swimTimeSec) {
    const base = predictBike(distKm);
    if (!base) return null;
    const f = 1 + (swimTimeSec || 0) / 3600 * 0.008;
    return { time: base.time * f, speed: base.speed / f, power: Math.round(base.power / f) };
  }

  function predictRunTri(distKm, priorTimeSec) {
    const base = predictRun(distKm);
    if (!base) return null;
    const f = 1 + (priorTimeSec || 0) / 3600 * 0.035;
    return { time: base.time * f, pace: base.pace * f, speed: base.speed / f };
  }

  function fmtPaceRun(sec) {
    if (sec == null || !isFinite(sec) || sec < 0) return "\u2014";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m > 0 ? `${m}:${pad2(s)} min/km` : `${s} s/km`;
  }

  function fmtPaceSwimProg(sec) {
    if (sec == null || !isFinite(sec) || sec < 0) return "\u2014";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${pad2(s)} /100m`;
  }

  function fmtPower(w) {
    if (w == null || !isFinite(w)) return "\u2014";
    return `${Math.round(w)} W`;
  }

  function renderPrognose() {
    const tSwim = document.querySelector("#prog-swim-table tbody");
    const tBike = document.querySelector("#prog-bike-table tbody");
    const tRun  = document.querySelector("#prog-run-table tbody");
    const tTri  = document.querySelector("#prog-tri-table tbody");

    tSwim.innerHTML = PROG_DISTS.swim.map(d => {
      const r = predictSwim(d);
      return `<tr>
        <td>${d} km</td>
        <td>${r ? fmtTime(r.time) : "\u2014"}</td>
        <td>${r ? fmtPaceSwimProg(r.pace) : "\u2014"}</td>
        <td><button class="fuel-btn" data-ctx="prog-swim-${d}" ${r ? "" : "disabled"} title="Ern\u00e4hrungsstrategie">\u{1F34C}</button></td>
      </tr>`;
    }).join("");

    tBike.innerHTML = PROG_DISTS.bike.map(d => {
      const r = predictBike(d);
      return `<tr>
        <td>${d} km</td>
        <td>${r ? fmtTime(r.time) : "\u2014"}</td>
        <td>${r ? fmtSpeed(r.speed) : "\u2014"}</td>
        <td>${r ? fmtPower(r.power) : "\u2014"}</td>
        <td><button class="fuel-btn" data-ctx="prog-bike-${d}" ${r ? "" : "disabled"} title="Ern\u00e4hrungsstrategie">\u{1F34C}</button></td>
      </tr>`;
    }).join("");

    tRun.innerHTML = PROG_DISTS.run.map(d => {
      const r = predictRun(d);
      return `<tr>
        <td>${d} km</td>
        <td>${r ? fmtTime(r.time) : "\u2014"}</td>
        <td>${r ? fmtPaceRun(r.pace) : "\u2014"}</td>
        <td><button class="fuel-btn" data-ctx="prog-run-${d}" ${r ? "" : "disabled"} title="Ern\u00e4hrungsstrategie">\u{1F34C}</button></td>
      </tr>`;
    }).join("");

    tTri.innerHTML = Object.entries(TRI_DISTS).map(([key, d]) => {
      const s = predictSwimTri(d.swim);
      const b = predictBikeTri(d.bike, s ? s.time : 0);
      const r = predictRunTri(d.run, (s ? s.time : 0) + (b ? b.time : 0));
      const t = [s, b, r].reduce((a, x) => a + (x ? x.time : 0), 0);
      const any = s || b || r;
      return `<tr>
        <td>${d.label}</td>
        <td>${s ? fmtTime(s.time) : "\u2014"}</td>
        <td>${b ? fmtTime(b.time) : "\u2014"}</td>
        <td>${r ? fmtTime(r.time) : "\u2014"}</td>
        <td>${any && t > 0 ? fmtTime(t) : "\u2014"}</td>
        <td><button class="fuel-btn" data-ctx="prog-tri-${key}" ${any ? "" : "disabled"} title="Ern\u00e4hrungsstrategie">\u{1F34C}</button></td>
      </tr>`;
    }).join("");
  }

  function setPrognoseMode(on) {
    if (on) {
      normalCards.forEach(el => el.style.display = "none");
      progView.style.display = "block";
      renderPrognose();
    } else {
      normalCards.forEach(el => el.style.display = "");
      progView.style.display = "none";
    }
  }

  progInputs.forEach(inp => inp.addEventListener("input", renderPrognose));

  /* ─── FUELING ENGINE ─── */
  function fmtDurationH(hours) {
    if (hours == null || !isFinite(hours)) return "";
    const totalMin = Math.round(hours * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `(${h}:${pad2(m)} h)` : `(${m} min)`;
  }

  function getFuelingRate(sport, durationH, isTri) {
    const triFactor = isTri ? (sport === "bike" ? 1.2 : 0.7) : 1.0;
    let low = 0, high = 0;

    if (sport === "bike") {
      if (durationH < 0.5)      { low = 0;   high = 0; }
      else if (durationH < 1)   { low = 0.3; high = 0.5; }
      else if (durationH < 2)   { low = 0.9; high = 1.1; }
      else if (durationH < 3)   { low = 1.2; high = 1.4; }
      else if (durationH < 4)   { low = 1.4; high = 1.6; }
      else                      { low = 1.6; high = 1.8; }
    } else {
      if (durationH < 0.5)      { low = 0;   high = 0; }
      else if (durationH < 1)   { low = 0.15; high = 0.3; }
      else if (durationH < 2)   { low = 0.5; high = 0.7; }
      else if (durationH < 3)   { low = 0.7; high = 0.9; }
      else                      { low = 0.9; high = 1.0; }
    }

    low  = +(low * triFactor).toFixed(2);
    high = +(high * triFactor).toFixed(2);
    return { low, high };
  }

  function calcFuelingSegment(sport, durationH, weightKg, isTri) {
    if (sport === "swim") {
      return { sport, durationH, note: "Keine Nahrungsaufnahme w\u00e4hrend des Schwimmens",
        perHourMin: 0, perHourMax: 0, totalMin: 0, totalMax: 0 };
    }
    const rate = getFuelingRate(sport, durationH, isTri);
    const perHourMin = Math.round(rate.low * weightKg);
    const perHourMax = Math.round(rate.high * weightKg);
    return { sport, durationH,
      perHourMin, perHourMax,
      totalMin: Math.round(perHourMin * durationH),
      totalMax: Math.round(perHourMax * durationH),
      perHourMinKg: rate.low, perHourMaxKg: rate.high };
  }

  function getExamples(sport) {
    return sport === "bike"
      ? "Energie-Gel, Riegel, Banane, Iso-Getr\u00e4nk, Gummib\u00e4rchen"
      : "Energie-Gel, Iso-Getr\u00e4nk, Gummib\u00e4rchen (leicht verdaulich)";
  }

  function showFuelingModal(data) {
    document.getElementById("fueling-title").textContent = data.title;
    const body = document.getElementById("fueling-body");
    let html = `<p class="fueling-weight">K\u00f6rpergewicht: <strong>${data.weight} kg</strong></p>`;

    html += `<div class="fueling-section">
      <h4>\u23F0 Vor dem Rennen (3\u20134 Stunden vorher)</h4>
      <p class="fueling-rec"><strong>${data.preRace} g</strong> Kohlenhydrate (2 g/kg)</p>
      <p class="fueling-examples">Haferflocken, Banane, Reiswaffeln, helles Brot, Nudeln</p>
    </div>`;

    for (const seg of data.segments) {
      const icons = { swim: "\u{1F3CA}", bike: "\u{1F6B4}", run: "\u{1F3C3}" };
      const labels = { swim: "Schwimmen", bike: "Radfahren", run: "Laufen" };
      html += `<div class="fueling-section${seg.sport !== "swim" ? " fueling-" + seg.sport : ""}">
        <h4>${icons[seg.sport] || ""} ${labels[seg.sport] || seg.sport} ${fmtDurationH(seg.durationH)}</h4>`;
      if (seg.sport === "swim") {
        html += `<p class="fueling-note">Keine Nahrungsaufnahme w\u00e4hrend des Schwimmens</p>`;
      } else {
        html += `<div class="fueling-row">
          <span class="fueling-label">Gesamt</span>
          <span class="fueling-val">${seg.totalMin}\u2013${seg.totalMax} g Kohlenhydrate</span>
        </div>
        <div class="fueling-row">
          <span class="fueling-label">Pro Stunde</span>
          <span class="fueling-val">${seg.perHourMin}\u2013${seg.perHourMax} g/h</span>
        </div>
        <p class="fueling-examples">${getExamples(seg.sport)}</p>`;
      }
      html += `</div>`;
    }

    html += `<div class="fueling-section">
      <h4>\u2705 Nach dem Rennen (innerhalb 30 Minuten)</h4>
      <p class="fueling-rec"><strong>${data.postRace} g</strong> Kohlenhydrate (1.2 g/kg) + Protein</p>
      <p class="fueling-examples">Proteinshake, Schokoladenmilch, Recovery-Riegel, Banane</p>
    </div>`;

    body.innerHTML = html;
    document.getElementById("fueling-modal").style.display = "flex";
  }

  function closeFuelingModal() {
    document.getElementById("fueling-modal").style.display = "none";
  }

  function showFuelingFor(ctx) {
    const weight = getProgVal("body", "weight") || 70;
    let segments = [], title = "";

    if (ctx === "normal") {
      const key = document.querySelector(".dist-btn.active").dataset.dist;
      const base = DISTANCES[key];
      if (!base) return;
      const swimDist = customDists.swim !== null ? customDists.swim : base.swim;
      const bikeDist = customDists.bike !== null ? customDists.bike : base.bike;
      const runDist  = customDists.run  !== null ? customDists.run  : base.run;
      const swim = calcSwim(swimDist);
      const bike = calcBike(bikeDist);
      const run  = calcRun(runDist);
      title = `Triathlon \u2013 ${base.label}`;
      if (swim.time) segments.push(calcFuelingSegment("swim", swim.time / 3600, weight, true));
      if (bike.time) segments.push(calcFuelingSegment("bike", bike.time / 3600, weight, true));
      if (run.time)  segments.push(calcFuelingSegment("run",  run.time  / 3600, weight, true));

    } else if (ctx.startsWith("normal-")) {
      const sport = ctx.split("-")[1];
      const key = document.querySelector(".dist-btn.active").dataset.dist;
      const base = DISTANCES[key];
      if (!base) return;
      const dist = customDists[sport] !== null ? customDists[sport] : base[sport];
      let result;
      if (sport === "swim") result = calcSwim(dist);
      else if (sport === "bike") result = calcBike(dist);
      else if (sport === "run")  result = calcRun(dist);
      if (!result || !result.time) return;
      const labels = { swim: "Schwimmen", bike: "Radfahren", run: "Laufen" };
      title = `${labels[sport]} \u2013 ${dist} km (${base.label})`;
      segments.push(calcFuelingSegment(sport, result.time / 3600, weight, true));

    } else if (ctx.startsWith("prog-")) {
      const parts = ctx.split("-");
      if (parts[1] === "tri") {
        const triKey = parts[2];
        const tri = TRI_DISTS[triKey];
        if (!tri) return;
        title = `Triathlon \u2013 ${tri.label}`;
        const s = predictSwimTri(tri.swim);
        const b = predictBikeTri(tri.bike, s ? s.time : 0);
        const r = predictRunTri(tri.run, (s ? s.time : 0) + (b ? b.time : 0));
        if (s) segments.push(calcFuelingSegment("swim", s.time / 3600, weight, true));
        if (b) segments.push(calcFuelingSegment("bike", b.time / 3600, weight, true));
        if (r) segments.push(calcFuelingSegment("run",  r.time  / 3600, weight, true));
      } else {
        const sport = parts[1];
        const dist  = parseFloat(parts[2]);
        const labels = { swim: "Schwimmen", bike: "Radfahren", run: "Laufen" };
        title = `${labels[sport] || sport} \u2013 ${dist} km`;
        let result;
        if (sport === "swim") result = predictSwim(dist);
        else if (sport === "bike") result = predictBike(dist);
        else if (sport === "run")  result = predictRun(dist);
        if (!result) return;
        segments.push(calcFuelingSegment(sport, result.time / 3600, weight, false));
      }
    }

    if (segments.length === 0) return;
    const totalH = segments.reduce((s, seg) => s + seg.durationH, 0);
    showFuelingModal({
      title: "\u{1F34C} Ern\u00e4hrungsstrategie \u2013 " + title,
      weight,
      preRace: Math.round(weight * 2),
      segments,
      postRace: Math.round(weight * 1.2)
    });
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".fuel-btn");
    if (btn && btn.dataset.ctx && !btn.disabled) {
      showFuelingFor(btn.dataset.ctx);
    }
    if (e.target.closest(".modal-close") || e.target.classList.contains("modal-backdrop")) {
      closeFuelingModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeFuelingModal();
  });

  update();
})();
