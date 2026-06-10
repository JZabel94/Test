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
    const d = DISTANCES[key];
    if (!d) return;

    document.getElementById("dist-swim").textContent = d.swim + " km";
    document.getElementById("dist-bike").textContent = d.bike + " km";
    document.getElementById("dist-run").textContent  = d.run  + " km";
    distName.textContent = d.label;

    const swim = calcSwim(d.swim);
    const bike = calcBike(d.bike);
    const run  = calcRun(d.run);
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
      update();
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

  update();
})();
