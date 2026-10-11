/* ============================================================
   ŁOMIANKI UNITED — okienka ze szczegółami: mecz i profil zawodnika
   Wywoływane z main.js: LUDetails.openMatch(mecz), LUDetails.openPlayer(zawodnik)
   ============================================================ */
(function () {
  "use strict";

  const CREST = "assets/img/herb.png";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const fmtLong = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtShort = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric" });
  const fmtTime = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const POSITION_ONE = { GK: "Bramkarz", DEF: "Obrońca", MID: "Pomocnik", FWD: "Napastnik" };
  const SIDE_ROLE = { LB: "Wahadłowy", RB: "Wahadłowy", LWB: "Wahadłowy", RWB: "Wahadłowy",
                      LM: "Skrzydłowy", RM: "Skrzydłowy", LW: "Skrzydłowy", RW: "Skrzydłowy" };
  const dateOf = (f) => new Date(f.date.length > 10 ? f.date : f.date + "T12:00");

  let ctx = { club: null, stats: {} };

  // Jedno wspólne okienko, tworzone przy pierwszym użyciu
  function dialog() {
    let d = document.getElementById("detail-dialog");
    if (d) return d;
    d = document.createElement("dialog");
    d.id = "detail-dialog";
    d.className = "detail-dialog";
    d.setAttribute("aria-labelledby", "detail-title");
    d.innerHTML = `<form method="dialog"><button class="dialog-close" aria-label="Zamknij">×</button></form><div id="detail-body"></div>`;
    document.body.appendChild(d);
    d.addEventListener("click", (e) => {
      if (e.target === d) return d.close();
      const pl = e.target.closest("[data-open-player]");
      if (pl) openPlayer(byId(pl.dataset.openPlayer));
      const m = e.target.closest("[data-open-match]");
      if (m) openMatch(ctx.club.fixtures[+m.dataset.openMatch]);
    });
    return d;
  }
  const byId = (id) => (ctx.club.squad || []).find((p) => p.id === id);
  const show = (html) => { const d = dialog(); document.getElementById("detail-body").innerHTML = html; if (!d.open) d.showModal(); d.scrollTop = 0; };
  const playerLink = (id, text) => byId(id)
    ? `<button type="button" class="detail-link" data-open-player="${esc(id)}">${text}</button>` : text;

  /* ---------- Mecz ---------- */
  function openMatch(f) {
    if (!f) return;
    const club = ctx.club, when = dateOf(f);
    const us = `<div class="detail-team"><img src="${CREST}" alt=""><span>${esc(club.name)}</span></div>`;
    const them = `<div class="detail-team">${f.logo ? `<img src="${esc(f.logo)}" alt="">` : `<span class="detail-initials">${esc(f.opponent.slice(0, 2).toUpperCase())}</span>`}<span>${esc(f.opponent)}</span></div>`;
    let score = `<span class="detail-vs">vs</span>`;
    if (f.score) {
      const [a, b] = f.home === false ? [f.score[1], f.score[0]] : f.score;
      const pens = f.pens ? `<small>karne ${f.home === false ? f.pens[1] + ":" + f.pens[0] : f.pens.join(":")}</small>` : "";
      score = `<span class="detail-score">${a}:${b}${pens}</span>`;
    }
    const rows = (f.players || []).filter((r) => r.g || r.a);
    const scorers = rows.filter((r) => r.g).sort((x, y) => y.g - x.g);
    const assists = rows.filter((r) => r.a).sort((x, y) => y.a - x.a);
    const nameOf = (id) => (byId(id) ? byId(id).name : "Zawodnik spoza kadry");
    const list = (arr, key, icon) => arr.length
      ? `<ul class="detail-list">${arr.map((r) => `<li>${playerLink(r.id, esc(nameOf(r.id)))} <span>${icon}${r[key] > 1 ? " ×" + r[key] : ""}</span></li>`).join("")}</ul>`
      : `<p class="detail-muted">Brak danych</p>`;
    const meta = [
      `${fmtLong.format(when)}${f.date.length > 10 ? ", " + fmtTime.format(when) : ""}`,
      f.competition, f.home === undefined ? "" : f.home ? "u siebie" : "na wyjeździe", f.venue
    ].filter(Boolean).map(esc).join(" · ");
    show(`
      <p class="eyebrow">${f.score ? "Wynik meczu" : "Nadchodzący mecz"}</p>
      <h2 id="detail-title" class="visually-hidden">${esc(club.name)} – ${esc(f.opponent)}</h2>
      <div class="detail-match">${f.home === false ? them + score + us : us + score + them}</div>
      <p class="detail-meta">${meta}</p>
      ${f.score ? `
      <div class="detail-cols">
        <section><h3>Strzelcy</h3>${list(scorers, "g", "⚽")}</section>
        <section><h3>Asysty</h3>${list(assists, "a", "👟")}</section>
      </div>
      <section class="detail-mvp"><h3>MVP meczu</h3>${f.mvp ? `<p>⭐ ${playerLink(f.mvp, esc(nameOf(f.mvp)))}</p>` : `<p class="detail-muted">Nie wybrano</p>`}</section>` : ""}`);
  }

  /* ---------- Profil zawodnika ---------- */
  function openPlayer(p) {
    if (!p) return;
    const s = ctx.stats[p.id] || { goals: 0, assists: 0, mvp: 0, games: [] };
    const c = p.card || {};
    const pos = String(c.pos || p.position).toUpperCase();
    const label = SIDE_ROLE[pos] || POSITION_ONE[p.position];
    const labels = p.position === "GK" ? ["DIV", "HAN", "KIC", "REF", "SPE", "POS"] : ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const games = s.games.slice(0, 12).map((g) => {
      const f = g.fixture, i = ctx.club.fixtures.indexOf(f);
      const bits = [g.g ? `⚽ ${g.g}` : "", g.a ? `👟 ${g.a}` : "", g.mvp ? "⭐ MVP" : ""].filter(Boolean).join("  ");
      return `<li><button type="button" class="detail-game" data-open-match="${i}">
        <span>${fmtShort.format(dateOf(f))}</span><strong>${esc(f.opponent)}</strong>
        <em>${f.score ? f.score.join(":") : ""}</em><span class="detail-game-stats">${bits}</span></button></li>`;
    }).join("");
    show(`
      <div class="detail-player">
        <div class="detail-photo">
          <img src="${esc(p.photo || CREST)}" alt="" class="${p.photo ? "" : "is-crest"}">
          <span class="detail-number">#${esc(p.number)}</span>
        </div>
        <div>
          <p class="eyebrow">${esc(label)} · ${esc(pos)}${p.captain ? " · Kapitan" : ""}${p.role ? " · " + esc(p.role) : ""}</p>
          <h2 id="detail-title" class="detail-name">${esc(p.name)}</h2>
          ${c.rating ? `<p class="detail-rating"><strong>${esc(c.rating)}</strong> ocena</p>
          <dl class="detail-attrs">${labels.map((l, i) => `<div><dt>${l}</dt><dd>${c.stats ? esc(c.stats[i]) : "–"}</dd></div>`).join("")}</dl>` : ""}
          ${p.instagram ? `<a class="detail-ig" href="https://www.instagram.com/${encodeURIComponent(p.instagram)}/" target="_blank" rel="noopener">${window.ICONS ? window.ICONS.ig : ""} @${esc(p.instagram)}</a>` : ""}
        </div>
      </div>
      <dl class="detail-totals">
        <div><dt>Gole</dt><dd>${s.goals}</dd></div>
        <div><dt>Asysty</dt><dd>${s.assists}</dd></div>
        <div><dt>MVP</dt><dd>${s.mvp}</dd></div>
      </dl>
      <h3>Mecze z udziałem w bramkach</h3>
      ${games ? `<ul class="detail-games">${games}</ul>` : `<p class="detail-muted">Jeszcze brak wpisanych goli, asyst i MVP.</p>`}`);
  }

  window.LUDetails = { setContext: (c) => { ctx = c; }, openMatch, openPlayer };
})();
