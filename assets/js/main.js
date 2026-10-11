/* ============================================================
   ŁOMIANKI UNITED — renderowanie treści
   Stałe treści: assets/js/data.js. Wyniki i statystyki: data/wyniki.json,
   aktualności: data/aktualnosci.json
   (edytowane w panelu admin.html). Nie edytuj tego pliku, żeby zmienić treść.
   ============================================================ */
(function () {
  "use strict";

  const club = window.CLUB;
  if (!club) return;

  // Wyniki, statystyki i aktualności doczytujemy z JSON-ów (zawsze świeża wersja)
  const EMPTY = { record: { w: 0, d: 0, l: 0 }, fixtures: [], playerStats: {}, news: [], squad: [], media: [] };
  const getJson = (url) => fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  Promise.all([getJson("data/wyniki.json"), getJson("data/aktualnosci.json"), getJson("data/kadra.json")])
    .then(([results, news, squad]) => { Object.assign(club, EMPTY, results || {}, news || {}, squad || {}); run(); });

  function run() {
    // Gole, asysty i MVP liczone z meczów + ręczne korekty (stats.js)
    const totals = window.LUStats ? window.LUStats.compute(club.squad, club.fixtures, club.playerStats) : {};
    if (window.LUDetails) window.LUDetails.setContext({ club, stats: totals });
    const openPlayerById = (id) => window.LUDetails && window.LUDetails.openPlayer(club.squad.find((p) => p.id === id));

    const $ = (sel) => document.querySelector(sel);
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
    const CREST = "assets/img/herb.png";
    const POSITIONS = { GK: "Bramkarze", DEF: "Obrońcy", MID: "Pomocnicy", FWD: "Napastnicy" };
    const POSITION_ONE = { GK: "Bramkarz", DEF: "Obrońca", MID: "Pomocnik", FWD: "Napastnik" };

    const fmtDay = new Intl.DateTimeFormat("pl-PL", { day: "numeric" });
    const fmtMonth = new Intl.DateTimeFormat("pl-PL", { month: "short" });
    const fmtLong = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" });
    const fmtTime = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });
    const fmtDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });

    const igUrl = (handle) => `https://www.instagram.com/${encodeURIComponent(handle)}/`;
    const igLink = (handle, name) => handle
      ? `<a class="ig-link" href="${igUrl(handle)}" target="_blank" rel="noopener" aria-label="Instagram: ${esc(name)} (@${esc(handle)})" title="@${esc(handle)}">${window.ICONS ? window.ICONS.ig : "IG"}</a>`
      : "";
    const initials = (name) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    /* ---------- Proste powiązania tekstu ---------- */
    document.querySelectorAll("[data-bind]").forEach((el) => {
      const value = el.dataset.bind.split(".").reduce((o, k) => (o ? o[k] : ""), club);
      if (value) el.textContent = value; else el.hidden = true;
    });
    if ($("#hero-eyebrow")) $("#hero-eyebrow").textContent = club.league || `Klub piłkarski · Łomianki · od ${club.founded}`;

    /* ---------- Bilans ---------- */
    const { w, d, l } = club.record;
    if ($("#record")) $("#record").innerHTML = [
      ["Mecze", w + d + l], ["Wygrane", w], ["Remisy", d], ["Porażki", l]
    ].map(([label, n]) => `<div><dt>${label}</dt><dd>${n}</dd></div>`).join("");

    /* ---------- Mecze ---------- */
    const matches = club.fixtures
      .map((m, idx) => ({ ...m, idx, when: new Date(m.date.length > 10 ? m.date : m.date + "T12:00") }))
      .sort((a, b) => a.when - b.when);
    const now = new Date();
    const upcoming = matches.filter((m) => !m.score && m.when >= now);
    const results = matches.filter((m) => m.score).reverse();
    const hasTime = (m) => m.date.length > 10;

    // Remis po regulaminowym czasie rozstrzygają karne (pens: [nasze, rywala])
    const outcome = (m) => {
      const [us, them] = m.score;
      if (us === them && m.pens) return m.pens[0] > m.pens[1] ? "w" : "l";
      return us > them ? "w" : us === them ? "d" : "l";
    };
    const OUTCOME_LABEL = { w: "W", d: "R", l: "P" };
    const OUTCOME_TITLE = { w: "Wygrana", d: "Remis", l: "Porażka" };

    const rivalBadge = (m, cls) => m.logo
      ? `<img class="${cls}" src="${esc(m.logo)}" alt="" loading="lazy" width="48" height="48">`
      : `<span class="${cls} ${cls}--initials" aria-hidden="true">${esc(initials(m.opponent))}</span>`;

    function renderNextMatch() {
      const card = $("#next-match");
      const m = upcoming[0];
      if (!m) {
        card.innerHTML = `<p class="eyebrow">Najbliższy mecz</p>
          <p class="match-empty">Terminarz kolejnych spotkań wkrótce. Śledź nas na Instagramie.</p>`;
        return;
      }
      const us = `<div><div class="team-badge"><img src="${CREST}" alt=""></div><div class="team-name">${esc(club.name)}</div></div>`;
      const them = `<div><div class="team-badge">${rivalBadge(m, "team-logo")}</div><div class="team-name">${esc(m.opponent)}</div></div>`;
      const side = m.home === undefined ? "" : m.home ? " · u siebie" : " · na wyjeździe";
      card.innerHTML = `
        <p class="eyebrow">Najbliższy mecz${side}</p>
        <div class="match-teams">${m.home === false ? them + '<span class="match-vs">vs</span>' + us : us + '<span class="match-vs">vs</span>' + them}</div>
        <p class="match-meta"><strong>${esc(fmtLong.format(m.when))}${hasTime(m) ? ", " + fmtTime.format(m.when) : ""}</strong>${esc(m.venue || "")}</p>
        <dl class="countdown" aria-label="Do meczu pozostało">
          <div><dd data-cd="d">–</dd><dt>dni</dt></div>
          <div><dd data-cd="h">–</dd><dt>godz.</dt></div>
          <div><dd data-cd="m">–</dd><dt>min</dt></div>
        </dl>`;
      const tick = () => {
        const diff = Math.max(0, m.when - new Date());
        const mins = Math.floor(diff / 60000);
        card.querySelector('[data-cd="d"]').textContent = Math.floor(mins / 1440);
        card.querySelector('[data-cd="h"]').textContent = Math.floor((mins % 1440) / 60);
        card.querySelector('[data-cd="m"]').textContent = mins % 60;
      };
      tick();
      setInterval(tick, 30000);
    }

    function fixtureRow(m) {
      const rival = `<span class="rival">${rivalBadge(m, "rival-logo")}${esc(m.opponent)}</span>`;
      const us = `<span class="rival us"><img class="rival-logo rival-logo--crest" src="${CREST}" alt="" width="32" height="34">${esc(club.name)}</span>`;
      const teams = m.home === false
        ? `${rival} <span class="dash">–</span> ${us}`
        : `${us} <span class="dash">–</span> ${rival}`;
      let right;
      if (m.score) {
        const o = outcome(m);
        const [us, them] = m.score;
        const shown = m.home === false ? `${them}:${us}` : `${us}:${them}`;
        const pens = m.pens ? `<span class="fixture-pens">k. ${m.home === false ? m.pens[1] + ":" + m.pens[0] : m.pens.join(":")}</span>` : "";
        right = `<div class="fixture-score"><span>${shown}${pens}</span><span class="result-badge ${o}" title="${OUTCOME_TITLE[o]}">${OUTCOME_LABEL[o]}</span></div>`;
      } else {
        right = `<div class="fixture-time">${hasTime(m) ? fmtTime.format(m.when) : ""}</div>`;
      }
      const tags = [];
      if (m.competition) tags.push(`<span class="fixture-side">${esc(m.competition)}</span>`);
      if (m.home !== undefined) tags.push(`<span class="fixture-side">${m.home ? "Dom" : "Wyjazd"}</span>`);
      const year = m.when.getFullYear() !== now.getFullYear() ? ` ${m.when.getFullYear()}` : "";
      return `<li class="fixture">
        <button type="button" class="fixture-open" data-match="${m.idx}" aria-label="Szczegóły meczu z ${esc(m.opponent)}"></button>
        <div class="fixture-date"><span class="fixture-day">${fmtDay.format(m.when)}</span><span class="fixture-month">${fmtMonth.format(m.when)}${year}</span></div>
        <div><div class="fixture-teams">${teams}</div>
          ${tags.length || m.venue ? `<div class="fixture-info">${tags.join("")}${esc(m.venue || "")}</div>` : ""}</div>
        ${right}
      </li>`;
    }

    function renderFixtures(filter) {
      const list = filter === "results" ? results : upcoming;
      $("#fixtures-list").innerHTML = list.length
        ? list.map(fixtureRow).join("")
        : `<li class="fixtures-empty">${filter === "results" ? "Brak rozegranych meczów." : "Nowe terminy wkrótce – śledź nas na Instagramie."}</li>`;
    }

    function renderForm() {
      const last = results.slice(0, 5);
      if (!last.length) { $("#form-strip").hidden = true; return; }
      $("#form-strip").innerHTML = "Forma (ostatnie mecze): " + last.map((m) => {
        const o = outcome(m);
        return `<span class="result-badge ${o}" title="${OUTCOME_TITLE[o]} ${m.score.join(":")} z ${esc(m.opponent)}">${OUTCOME_LABEL[o]}</span>`;
      }).join("");
    }

    function initTabs() {
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      const select = (tab) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", on);
          t.tabIndex = on ? 0 : -1;
        });
        $("#panel-fixtures").setAttribute("aria-labelledby", tab.id);
        renderFixtures(tab.dataset.filter);
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(tab));
        tab.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
          next.focus();
          select(next);
        });
      });
      select(upcoming.length ? tabs[0] : tabs[1]);
    }

    /* ---------- Kadra i zarząd ---------- */
    const CAMERA_ICON = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

    function personCard({ number, icon, name, meta, role, instagram, photo, captain }) {
      const ig = igLink(instagram, name);
      return `<li class="player">
        ${photo ? `<img class="player-photo" src="${esc(photo)}" alt="" loading="lazy" width="52" height="52">` : ""}
        <span class="player-number">${icon || esc(number)}</span>
        <div><div class="player-name">${esc(name)}</div>
          <div class="player-meta">${esc(meta)}${role ? ` <span class="role-tag">${esc(role)}</span>` : ""}${ig}</div></div>
        ${captain ? '<span class="captain" title="Kapitan" aria-label="Kapitan">C</span>' : ""}
      </li>`;
    }

    /* Karta zawodnika w stylu FIFA */
    const STAT_LABELS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const GK_LABELS = ["DIV", "HAN", "KIC", "REF", "SPE", "POS"];

    // Pozycje boczne opisujemy funkcją zamiast ogólnej formacji
    const SIDE_ROLE = { LB: "Wahadłowy", RB: "Wahadłowy", LWB: "Wahadłowy", RWB: "Wahadłowy",
                        LM: "Skrzydłowy", RM: "Skrzydłowy", LW: "Skrzydłowy", RW: "Skrzydłowy" };

    function futCard(p) {
      const c = p.card || {};
      const pos = String(c.pos || p.position).toUpperCase();
      const label = SIDE_ROLE[pos] || POSITION_ONE[p.position];
      const labels = p.position === "GK" ? GK_LABELS : STAT_LABELS;
      const stats = labels.map((l, i) =>
        `<div><dt>${l}</dt><dd>${c.stats ? esc(c.stats[i]) : "–"}</dd></div>`).join("");
      const photo = p.photo
        ? `<img class="fut-photo${/\.png$/i.test(p.photo) ? " fut-photo--cutout" : ""}" src="${esc(p.photo)}" alt="" loading="lazy">`
        : `<img class="fut-photo fut-photo--empty" src="${CREST}" alt="" loading="lazy">`;
      const ig = igLink(p.instagram, p.name);
      return `<li class="fut-item">
        <article class="fut-card">
          <button type="button" class="fut-open" data-player="${esc(p.id)}" aria-label="Profil: ${esc(p.name)}, ${label} (${esc(pos)}), numer ${esc(p.number)}"></button>
          <div class="fut-top">
            <span class="fut-rating">${c.rating ? esc(c.rating) : "–"}</span>
            <span class="fut-pos">${esc(pos)}</span>
            ${p.captain ? '<span class="fut-captain" title="Kapitan">C</span>' : ""}
          </div>
          ${photo}
          <h4 class="fut-name">${esc(p.name)}</h4>
          <dl class="fut-stats">${stats}</dl>
          <div class="fut-foot">
            <span class="fut-flag" title="Polska"></span>
            <img src="${CREST}" alt="" width="20" height="21">
            <span class="fut-number">#${esc(p.number)}</span>
          </div>
        </article>
        <p class="fut-meta">${label} · ${esc(pos)}${p.role ? ` <span class="role-tag">${esc(p.role)}</span>` : ""}${ig}</p>
      </li>`;
    }

    function renderSquad() {
      $("#squad").innerHTML = Object.keys(POSITIONS).map((pos) => {
        const players = club.squad.filter((p) => p.position === pos).sort((a, b) => a.number - b.number);
        if (!players.length) return "";
        return `<div class="squad-group"><h3>${POSITIONS[pos]}</h3><ul class="fut-grid">${
          players.map(futCard).join("")
        }</ul></div>`;
      }).join("");

      // Zarząd: zawodnicy z rolą; założyciel na początku
      const board = club.squad.filter((p) => p.role)
        .sort((a, b) => (b.role === "Założyciel") - (a.role === "Założyciel") || a.number - b.number);
      $("#board-title").hidden = !board.length;
      $("#board-list").innerHTML = board.map((p) =>
        personCard({ number: p.number, name: p.name, photo: p.photo, instagram: p.instagram, meta: p.role })
      ).join("");

      const media = club.media || [];
      $("#media-title").hidden = !media.length;
      $("#media-list").innerHTML = media.map((m) =>
        personCard({ icon: CAMERA_ICON, name: m.name, photo: m.photo, instagram: m.instagram, meta: m.role })
      ).join("");
    }

    /* ---------- Statystyki ---------- */
    const STAT_COLS = { goals: "Gole", assists: "Asysty", mvp: "MVP" };

    function renderStats() {
      const table = $("#stats-table");
      if (!table) return;
      const rows = club.squad.map((p) => ({ ...p, ...(totals[p.id] || { goals: 0, assists: 0, mvp: 0 }) }));

      // Liderzy: najlepszy w każdej kategorii (przy samych zerach – brak lidera)
      $("#leaders").innerHTML = Object.entries(STAT_COLS).map(([key, label]) => {
        const best = Math.max(...rows.map((r) => r[key]));
        const top = best > 0 ? rows.filter((r) => r[key] === best) : [];
        const who = top.length ? top.map((r) => esc(r.name)).join(", ") : "Jeszcze nikt";
        const title = { goals: "Król strzelców", assists: "Najwięcej asyst", mvp: "Najwięcej MVP" }[key];
        return `<div class="leader"><p class="leader-title">${title}</p>
          <p class="leader-value">${best}</p><p class="leader-name">${who}</p></div>`;
      }).join("");

      let sortKey = "goals";
      const draw = () => {
        const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey] || b.goals - a.goals || a.number - b.number);
        table.tBodies[0].innerHTML = sorted.map((r) => `<tr>
          <td class="num">${esc(r.number)}</td>
          <th scope="row"><button type="button" class="stats-player" data-player="${esc(r.id)}"><img src="${esc(r.photo || CREST)}" alt="" loading="lazy" width="32" height="32">${esc(r.name)}</button></th>
          <td class="pos">${esc(String((r.card && r.card.pos) || r.position).toUpperCase())}</td>
          ${Object.keys(STAT_COLS).map((k) => `<td class="${k === sortKey ? "is-sorted" : ""}">${r[k]}</td>`).join("")}
        </tr>`).join("");
        table.querySelectorAll("thead th").forEach((th) => {
          const b = th.querySelector("[data-sort]");
          if (b) th.setAttribute("aria-sort", b.dataset.sort === sortKey ? "descending" : "none");
        });
      };
      table.querySelectorAll("[data-sort]").forEach((b) =>
        b.addEventListener("click", () => { sortKey = b.dataset.sort; draw(); }));
      draw();
    }

    /* ---------- Aktualności ---------- */
    function renderNews() {
      const items = [...club.news].sort((a, b) => b.date.localeCompare(a.date));
      if (!items.length) {
        $("#news-list").innerHTML = `<p class="news-empty">Wkrótce pojawią się tu pierwsze wpisy. Na bieżąco jesteśmy na Instagramie i TikToku.</p>`;
        return;
      }
      const coverOf = (n) => n.image || (n.gallery && n.gallery[0]) || "";
      $("#news-list").innerHTML = items.map((n, i) => `
        <article class="news-card reveal">
          <div class="news-media${coverOf(n) ? "" : " news-media--placeholder"}">
            <img src="${esc(coverOf(n) || CREST)}" alt="" loading="lazy">
            ${n.gallery && n.gallery.length ? `<span class="news-count" aria-label="${n.gallery.length} zdjęć w galerii">▣ ${n.gallery.length}</span>` : ""}
          </div>
          <div class="news-body">
            <p class="news-date"><time datetime="${esc(n.date)}">${fmtDate.format(new Date(n.date))}</time></p>
            <h3>${esc(n.title)}</h3>
            <p>${esc(n.excerpt)}</p>
            <button class="news-more" type="button" data-news="${i}">Czytaj dalej →</button>
          </div>
        </article>`).join("");

      const dialog = $("#news-dialog");
      $("#news-list").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-news]");
        if (!btn) return;
        const n = items[btn.dataset.news];
        $("#news-dialog-date").textContent = fmtDate.format(new Date(n.date));
        $("#news-dialog-title").textContent = n.title;
        const photos = n.gallery || [];
        $("#news-dialog-body").innerHTML =
          (n.image ? `<img class="news-dialog-cover" src="${esc(n.image)}" alt="">` : "") +
          n.body.map((p) => `<p>${esc(p)}</p>`).join("") +
          (photos.length ? `<h3 class="news-gallery-title">Galeria (${photos.length})</h3><ul class="news-gallery">${
            photos.map((src, k) => `<li><button type="button" data-photo="${k}" aria-label="Powiększ zdjęcie ${k + 1} z ${photos.length}">
              <img src="${esc(src)}" alt="" loading="lazy"></button></li>`).join("")}</ul>` : "");
        dialog.currentPhotos = photos;
        dialog.showModal();
      });
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) return dialog.close();
        const ph = e.target.closest("[data-photo]");
        if (ph) openViewer(dialog.currentPhotos, +ph.dataset.photo);
      });

      // Przeglądarka zdjęć: strzałki, klawiatura, przesunięcie palcem
      const viewer = $("#photo-viewer");
      let list = [], at = 0, touchX = null;
      const show = () => {
        $("#photo-viewer-img").src = list[at];
        $("#photo-viewer-count").textContent = `${at + 1} / ${list.length}`;
      };
      const step = (d) => { at = (at + d + list.length) % list.length; show(); };
      function openViewer(photos, k) { list = photos; at = k; show(); viewer.showModal(); }
      $("#photo-prev").addEventListener("click", () => step(-1));
      $("#photo-next").addEventListener("click", () => step(1));
      viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
      viewer.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      });
      viewer.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
      viewer.addEventListener("touchend", (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        touchX = null;
      });
    }

    /* ---------- Sponsorzy ---------- */
    function renderSponsors() {
      $("#sponsor-list").innerHTML = club.sponsors.map((s) => {
        const inner = `${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy">` : `<span class="sponsor-name">${esc(s.name)}</span>`}
          ${s.tier ? `<span class="sponsor-tier">${esc(s.tier)}</span>` : ""}`;
        return `<li>${s.url
          ? `<a class="sponsor" href="${esc(s.url)}" target="_blank" rel="noopener">${inner}</a>`
          : `<div class="sponsor">${inner}</div>`}</li>`;
      }).join("");
    }

    /* ---------- Przycisk „Zostań sponsorem” ---------- */
    function renderSponsorLink() {
      const c = club.contact;
      const mail = $("#sponsor-mail");
      if (!mail) return;
      if (c.email) mail.href = `mailto:${c.email}?subject=${encodeURIComponent("Sponsoring – " + club.name)}`;
      else if (c.instagram) { mail.href = igUrl(c.instagram); mail.target = "_blank"; mail.rel = "noopener"; }
    }


    function initReveal() {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
      }, { threshold: .15 });
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    }

    // Kliknięcie meczu / zawodnika otwiera okienko ze szczegółami
    document.addEventListener("click", (e) => {
      const m = e.target.closest("[data-match]");
      if (m && window.LUDetails) return window.LUDetails.openMatch(club.fixtures[+m.dataset.match]);
      const p = e.target.closest("[data-player]");
      if (p) openPlayerById(p.dataset.player);
    });

    // Każda podstrona ma tylko swoje sekcje – renderujemy to, co jest na stronie
    if ($("#next-match")) renderNextMatch();
    if ($("#fixtures-list")) { initTabs(); renderForm(); }
    if ($("#squad")) renderSquad();
    renderStats();
    if ($("#news-list")) renderNews();
    if ($("#sponsor-list")) renderSponsors();
    renderSponsorLink();
    initReveal();
  }
})();
