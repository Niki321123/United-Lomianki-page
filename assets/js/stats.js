/* ============================================================
   ŁOMIANKI UNITED — liczenie statystyk zawodników
   Gole, asysty i MVP = suma z meczów (fixtures[].players, fixtures[].mvp)
   + ręczne korekty z playerStats (klucz = id zawodnika).
   Używane przez stronę (main.js, details.js) i panel admina.
   ============================================================ */
(function () {
  "use strict";

  function compute(squad, fixtures, corrections) {
    const out = {};
    for (const p of squad || []) {
      const c = (corrections || {})[p.id] || {};
      out[p.id] = { goals: c.goals || 0, assists: c.assists || 0, mvp: c.mvp || 0, games: [] };
    }
    for (const f of fixtures || []) {
      if (!f.score) continue;
      const seen = new Set();
      for (const row of f.players || []) {
        const s = out[row.id];
        if (!s) continue;
        s.goals += row.g || 0;
        s.assists += row.a || 0;
        s.games.push({ fixture: f, g: row.g || 0, a: row.a || 0, mvp: f.mvp === row.id });
        seen.add(row.id);
      }
      if (f.mvp && out[f.mvp]) {
        out[f.mvp].mvp += 1;
        if (!seen.has(f.mvp)) out[f.mvp].games.push({ fixture: f, g: 0, a: 0, mvp: true });
      }
    }
    for (const s of Object.values(out)) s.games.sort((a, b) => b.fixture.date.localeCompare(a.fixture.date));
    return out;
  }

  // Bilans z terminarza (karne rozstrzygają remis)
  function record(fixtures) {
    const r = { w: 0, d: 0, l: 0 };
    for (const f of fixtures || []) {
      if (!f.score) continue;
      let [a, b] = f.score;
      if (a === b && f.pens) [a, b] = f.pens;
      r[a > b ? "w" : a === b ? "d" : "l"]++;
    }
    return r;
  }

  window.LUStats = { compute, record };
})();
