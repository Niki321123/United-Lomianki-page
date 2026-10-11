/* ============================================================
   ŁOMIANKI UNITED — panel admina (admin.html)
   Edycja data/wyniki.json; zapis przez funkcję /api/save (hasło sprawdza serwer).
   ============================================================ */
(function () {
  "use strict";

  const club = window.CLUB || { squad: [] };
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* tryb prywatny */ } }
  };

  let password = "";
  let data = null;          // { record, fixtures, playerStats }
  let pendingLogo = null;   // { index, slug, base64 } – jedno nowe logo na zapis
  let dirty = false;

  /* ---------- Pomocnicze ---------- */
  const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
  const slugify = (s) => s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c])
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "rywal";
  const num = (v) => (v === "" || v === null || v === undefined ? null : Math.max(0, Math.min(99, parseInt(v, 10) || 0)));
  const markDirty = () => { dirty = true; setMsg("#save-msg", "Masz niezapisane zmiany.", "warn"); };
  function setMsg(sel, text, kind = "") { const el = $(sel); el.textContent = text; el.dataset.kind = kind; }

  async function api(body) {
    const res = await fetch("api/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, ...body })
    });
    let json = {};
    try { json = await res.json(); } catch (e) { /* brak JSON = brak funkcji */ }
    if (!res.ok) throw new Error(json.error || (res.status === 404 || res.status === 501
      ? "Funkcja zapisu działa dopiero na Vercelu (lokalnie nie ma /api/save)." : `Błąd serwera (${res.status})`));
    return json;
  }

  /* ---------- Logowanie ---------- */
  let role = "admin";   // "admin" = wszystko, "news" = tylko aktualności (decyduje serwer)

  async function login(pw) {
    password = pw;
    setMsg("#login-msg", "Sprawdzam…");
    try {
      const r = await api({ action: "check" });
      role = r.role || "admin";
      store.set("lu-admin", pw);
      $("#login-form").hidden = true;
      applyRole();
      await loadData();
      $("#editor").hidden = false;
    } catch (e) {
      setMsg("#login-msg", e.message, "error");
    }
  }
  $("#login-form").addEventListener("submit", (e) => { e.preventDefault(); login($("#password").value); });
  const saved = store.get("lu-admin");
  if (saved) login(saved);

  async function loadData() {
    if (window.AdminNews) await window.AdminNews.load();
    if (role !== "admin") return;          // admin aktualności nie potrzebuje reszty
    const res = await fetch("data/wyniki.json", { cache: "no-store" });
    data = await res.json();
    data.fixtures = data.fixtures || [];
    data.playerStats = data.playerStats || {};
    data.record = data.record || { w: 0, d: 0, l: 0 };
    $("#opponents").innerHTML = [...new Set(data.fixtures.map((f) => f.opponent))]
      .map((o) => `<option value="${esc(o)}"></option>`).join("");
    renderMatches(); renderStats(); renderRecord();
  }

  /* ---------- Zakładki (widoczne zależnie od roli) ---------- */
  function allTabs() { return [...document.querySelectorAll(".admin-tabs [role=tab]")]; }
  function selectTab(t) {
    allTabs().forEach((x) => {
      const on = x === t;
      x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !on;
    });
  }
  function applyRole() {
    const visible = allTabs().filter((t) => {
      const ok = t.dataset.roles.split(" ").includes(role);
      t.hidden = !ok;
      return ok;
    });
    selectTab(visible[0]);
    $("#admin-role").textContent = role === "admin" ? "Zalogowano jako: pełny admin" : "Zalogowano jako: admin aktualności";
  }
  allTabs().forEach((t) => t.addEventListener("click", () => selectTab(t)));

  /* ---------- Mecze ---------- */
  const knownLogos = () => {
    const m = new Map();
    data.fixtures.forEach((f) => { if (f.logo && !m.has(f.logo)) m.set(f.logo, f.opponent); });
    return m;
  };

  function matchRow(f, i) {
    const [d, t] = f.date.split("T");
    const logos = knownLogos();
    const logoOpts = [`<option value="">— brak (inicjały) —</option>`]
      .concat([...logos].map(([path, name]) => `<option value="${esc(path)}"${path === f.logo ? " selected" : ""}>${esc(name)}</option>`))
      .concat(`<option value="__upload">+ Wgraj nowe logo…</option>`).join("");
    const preview = pendingLogo && pendingLogo.index === i
      ? `data:image/png;base64,${pendingLogo.base64}` : (f.logo || "assets/img/herb.png");
    const s = f.score || ["", ""];
    const p = f.pens || ["", ""];
    const side = f.home === true ? "home" : f.home === false ? "away" : "";
    return `<li class="admin-match" data-i="${i}">
      <img class="admin-logo" src="${esc(preview)}" alt="">
      <div class="admin-grid">
        <label class="w-date">Data <input type="date" data-k="day" value="${esc(d)}" required></label>
        <label class="w-time">Godzina <input type="time" data-k="time" value="${esc(t || "")}"></label>
        <label class="w-opp">Rywal <input type="text" data-k="opponent" list="opponents" maxlength="80" value="${esc(f.opponent)}" required></label>
        <label class="w-logo">Logo rywala <select data-k="logo">${logoOpts}</select></label>
        <input type="file" data-k="file" accept="image/png,image/jpeg,image/webp" hidden>
        <fieldset class="w-score"><legend>Wynik (my : rywal)</legend>
          <input type="number" min="0" max="99" data-k="s0" value="${s[0]}" aria-label="Nasze gole"> :
          <input type="number" min="0" max="99" data-k="s1" value="${s[1]}" aria-label="Gole rywala">
        </fieldset>
        <fieldset class="w-score"><legend>Karne</legend>
          <input type="number" min="0" max="99" data-k="p0" value="${p[0]}" aria-label="Nasze karne"> :
          <input type="number" min="0" max="99" data-k="p1" value="${p[1]}" aria-label="Karne rywala">
        </fieldset>
        <label class="w-side">Gdzie <select data-k="side">
          <option value=""${side === "" ? " selected" : ""}>—</option>
          <option value="home"${side === "home" ? " selected" : ""}>Dom</option>
          <option value="away"${side === "away" ? " selected" : ""}>Wyjazd</option></select></label>
        <label class="w-comp">Rodzaj <input type="text" data-k="competition" list="competitions" maxlength="40" value="${esc(f.competition || "")}"></label>
        <label class="w-venue">Miejsce <input type="text" data-k="venue" maxlength="120" value="${esc(f.venue || "")}"></label>
      </div>
      <button class="admin-del" type="button" data-del="${i}" aria-label="Usuń mecz z ${esc(f.opponent)}">Usuń</button>
    </li>`;
  }

  function renderMatches() {
    // najnowsze na górze
    const order = data.fixtures.map((f, i) => i).sort((a, b) => data.fixtures[b].date.localeCompare(data.fixtures[a].date));
    $("#matches").innerHTML = order.map((i) => matchRow(data.fixtures[i], i)).join("");
  }

  function readRow(li) {
    const f = data.fixtures[+li.dataset.i];
    const v = (k) => $(`[data-k="${k}"]`, li).value;
    f.date = v("day") + (v("time") ? "T" + v("time") : "");
    f.opponent = v("opponent").trim();
    const s0 = num(v("s0")), s1 = num(v("s1"));
    f.score = s0 === null || s1 === null ? null : [s0, s1];
    const p0 = num(v("p0")), p1 = num(v("p1"));
    if (p0 === null || p1 === null) delete f.pens; else f.pens = [p0, p1];
    const side = v("side");
    if (side) f.home = side === "home"; else delete f.home;
    ["competition", "venue"].forEach((k) => { const x = v(k).trim(); if (x) f[k] = x; else delete f[k]; });
    const logo = v("logo");
    if (logo && logo !== "__upload") f.logo = logo;
    if (!logo) delete f.logo;
  }

  $("#matches").addEventListener("input", (e) => {
    const li = e.target.closest(".admin-match");
    if (!li || e.target.type === "file") return;
    readRow(li); markDirty();
  });

  $("#matches").addEventListener("change", async (e) => {
    const li = e.target.closest(".admin-match");
    if (!li) return;
    const i = +li.dataset.i;
    if (e.target.dataset.k === "logo") {
      if (e.target.value === "__upload") { $('[data-k="file"]', li).click(); return; }
      if (pendingLogo && pendingLogo.index === i) pendingLogo = null;
      readRow(li); $(".admin-logo", li).src = data.fixtures[i].logo || "assets/img/herb.png"; markDirty();
    }
    if (e.target.dataset.k === "file" && e.target.files[0]) {
      try {
        const base64 = await toLogoPng(e.target.files[0]);
        const f = data.fixtures[i];
        pendingLogo = { index: i, slug: slugify(f.opponent), base64 };
        f.logo = `assets/img/rywale/${pendingLogo.slug}.png`;
        $(".admin-logo", li).src = `data:image/png;base64,${base64}`;
        markDirty();
      } catch (err) { setMsg("#save-msg", err.message, "error"); }
    }
  });

  $("#matches").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    const i = +b.dataset.del;
    if (!confirm(`Usunąć mecz z ${data.fixtures[i].opponent}?`)) return;
    data.fixtures.splice(i, 1);
    if (pendingLogo) pendingLogo = pendingLogo.index === i ? null : { ...pendingLogo, index: pendingLogo.index - (pendingLogo.index > i) };
    renderMatches(); markDirty();
  });

  $("#add-match").addEventListener("click", () => {
    const today = new Date().toISOString().slice(0, 10);
    data.fixtures.push({ date: today, opponent: "Nowy rywal", score: null, competition: "Sparing" });
    renderMatches(); markDirty();
    const first = $("#matches .admin-match"); first.classList.add("is-new"); $('[data-k="opponent"]', first).select();
  });

  // Logo → kwadratowy PNG 256×256 (mały plik, przezroczyste tło zachowane)
  function toLogoPng(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Logo musi być PNG, JPG albo WEBP."));
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = c.height = 256;
        const k = Math.min(256 / img.width, 256 / img.height);
        const w = img.width * k, h = img.height * k;
        c.getContext("2d").drawImage(img, (256 - w) / 2, (256 - h) / 2, w, h);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = () => reject(new Error("Nie udało się wczytać obrazka."));
      img.src = URL.createObjectURL(file);
    });
  }

  /* ---------- Statystyki ---------- */
  const STAT_KEYS = ["goals", "assists", "mvp"];
  function renderStats() {
    const squad = [...club.squad].sort((a, b) => a.number - b.number);
    $("#stats-body").innerHTML = squad.map((p) => {
      const s = data.playerStats[p.number] || { goals: 0, assists: 0, mvp: 0 };
      return `<tr data-n="${p.number}"><td class="num">${p.number}</td><th scope="row">${esc(p.name)}</th>
        ${STAT_KEYS.map((k) => `<td><div class="stepper">
          <button type="button" data-step="-1" data-k="${k}" aria-label="${esc(p.name)}: mniej">−</button>
          <input type="number" min="0" max="9999" data-k="${k}" value="${s[k]}" aria-label="${esc(p.name)}: ${k}">
          <button type="button" data-step="1" data-k="${k}" aria-label="${esc(p.name)}: więcej">+</button></div></td>`).join("")}
      </tr>`;
    }).join("");
  }
  function setStat(tr, k, value) {
    const n = tr.dataset.n;
    const s = data.playerStats[n] || (data.playerStats[n] = { goals: 0, assists: 0, mvp: 0 });
    s[k] = Math.max(0, Math.min(9999, parseInt(value, 10) || 0));
    $(`input[data-k="${k}"]`, tr).value = s[k];
    markDirty();
  }
  $("#stats-body").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const tr = b.closest("tr");
    setStat(tr, b.dataset.k, +$(`input[data-k="${b.dataset.k}"]`, tr).value + +b.dataset.step);
  });
  $("#stats-body").addEventListener("change", (e) => {
    if (e.target.matches("input")) setStat(e.target.closest("tr"), e.target.dataset.k, e.target.value);
  });

  /* ---------- Bilans ---------- */
  function renderRecord() { ["w", "d", "l"].forEach((k) => { $("#rec-" + k).value = data.record[k]; }); }
  ["w", "d", "l"].forEach((k) => $("#rec-" + k).addEventListener("input", (e) => {
    data.record[k] = Math.max(0, parseInt(e.target.value, 10) || 0); markDirty();
  }));
  $("#rec-calc").addEventListener("click", () => {
    const r = { w: 0, d: 0, l: 0 };
    data.fixtures.filter((f) => f.score).forEach((f) => {
      let [a, b] = f.score;
      if (a === b && f.pens) [a, b] = f.pens;
      r[a > b ? "w" : a === b ? "d" : "l"]++;
    });
    data.record = r; renderRecord(); markDirty();
  });

  /* ---------- Zapis ---------- */
  async function saveResults() {
    const bad = data.fixtures.find((f) => !f.opponent || !/^\d{4}-\d{2}-\d{2}/.test(f.date));
    if (bad) throw new Error("Uzupełnij datę i nazwę rywala w każdym meczu.");
    // nazwa pliku logo z aktualnej nazwy rywala (mogła się zmienić po wgraniu)
    if (pendingLogo) {
      const f = data.fixtures[pendingLogo.index];
      pendingLogo.slug = slugify(f.opponent);
      f.logo = `assets/img/rywale/${pendingLogo.slug}.png`;
    }
    const logo = pendingLogo ? { dir: "rywale", slug: pendingLogo.slug, ext: "png", base64: pendingLogo.base64 } : null;
    await api({ target: "wyniki", data, image: logo });
    pendingLogo = null; dirty = false;
  }

  $("#save").addEventListener("click", async () => {
    const jobs = [];
    if (dirty) jobs.push(saveResults);
    if (window.AdminNews && window.AdminNews.isDirty()) jobs.push(window.AdminNews.save);
    if (!jobs.length) return setMsg("#save-msg", "Brak zmian do zapisania.");
    const btn = $("#save"); btn.disabled = true;
    setMsg("#save-msg", "Zapisuję…");
    try {
      for (const job of jobs) await job();
      setMsg("#save-msg", "Zapisano ✓ Strona zaktualizuje się za około minutę.", "ok");
    } catch (e) {
      setMsg("#save-msg", e.message, "error");
    } finally { btn.disabled = false; }
  });

  window.addEventListener("beforeunload", (e) => {
    if (dirty || (window.AdminNews && window.AdminNews.isDirty())) {
      e.preventDefault(); e.returnValue = "";
    }
  });

  // Wspólne narzędzia dla edytora aktualności (admin-news.js)
  window.Admin = { api, esc, slugify, setMsg, $ };
})();
