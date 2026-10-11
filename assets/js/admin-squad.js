/* ============================================================
   ŁOMIANKI UNITED — panel admina: zakładka „Kadra” (tylko pełny admin)
   Edycja data/kadra.json: zawodnicy (karta FIFA, zdjęcie, funkcja, Instagram) i media.
   Zdjęcie może mieć automatycznie wycięte tło (biblioteka @imgly/background-removal,
   działa w przeglądarce – zdjęcie nie jest nigdzie wysyłane poza naszą stronę).
   ============================================================ */
(function () {
  "use strict";

  const BG_LIB = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.6.0/+esm";
  const POS_LABELS = { GK: "Bramkarz", DEF: "Obrońca", MID: "Pomocnik", FWD: "Napastnik" };
  const FIELD_STATS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  const GK_STATS = ["DIV", "HAN", "KIC", "REF", "SPE", "POS"];

  let squad = [], media = [], dirty = false;
  const pending = new Map();   // obiekt zawodnika → { base64, ext } nowego zdjęcia
  const preview = {};          // ścieżka → podgląd z pamięci po zapisie

  const A = () => window.Admin;
  const $ = (sel, root = document) => root.querySelector(sel);
  const dataUrl = (img) => `data:image/${img.ext === "png" ? "png" : "jpeg"};base64,${img.base64}`;
  const markDirty = () => { dirty = true; A().setMsg("#save-msg", "Masz niezapisane zmiany.", "warn"); };

  async function load() {
    const d = await (await fetch("data/kadra.json", { cache: "no-store" })).json();
    squad = d.squad || []; media = d.media || [];
    render();
  }

  /* ---------- Widok ---------- */
  function playerRow(p, i) {
    const esc = A().esc;
    const c = p.card || { rating: "", pos: "", stats: ["", "", "", "", "", ""] };
    const labels = p.position === "GK" ? GK_STATS : FIELD_STATS;
    const pend = pending.get(p);
    const img = pend ? dataUrl(pend) : (preview[p.photo] || p.photo || "");
    return `<li class="admin-match admin-player" data-i="${i}">
      <div class="admin-cover">
        <button class="admin-photo admin-photo--card" type="button" data-photo title="Zmień zdjęcie">
          ${img ? `<img src="${esc(img)}" alt="">` : `<img class="is-empty" src="assets/img/herb.png" alt="">`}
          <span>${img ? "Zmień zdjęcie" : "Dodaj zdjęcie"}</span></button>
        <input type="file" data-file accept="image/png,image/jpeg,image/webp" hidden>
        <label class="admin-check"><input type="checkbox" data-nobg checked> Wytnij tło</label>
        ${img ? `<button class="admin-link" type="button" data-photo-remove>Usuń zdjęcie</button>` : ""}
      </div>
      <div class="admin-grid">
        <label class="w-opp">Ksywka / imię <input type="text" data-k="name" maxlength="40" value="${esc(p.name)}" required></label>
        <label class="w-date">Numer <input type="number" min="0" max="999" data-k="number" value="${esc(p.number)}"></label>
        <label class="w-time">Formacja <select data-k="position">${Object.entries(POS_LABELS).map(([k, v]) =>
          `<option value="${k}"${p.position === k ? " selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="w-date">Pozycja <input type="text" data-k="pos" maxlength="4" list="card-positions" value="${esc(c.pos)}" placeholder="np. ST"></label>
        <label class="w-date">Ocena <input type="number" min="1" max="99" data-k="rating" value="${esc(c.rating)}"></label>
        <fieldset class="w-full admin-stats6"><legend>Statystyki karty</legend>
          ${labels.map((l, k) => `<label>${l}<input type="number" min="1" max="99" data-stat="${k}" value="${esc(c.stats[k])}"></label>`).join("")}
        </fieldset>
        <label class="w-time">Funkcja <select data-k="role">
          ${["", "Zarząd", "Założyciel"].map((r) => `<option value="${r}"${(p.role || "") === r ? " selected" : ""}>${r || "—"}</option>`).join("")}</select></label>
        <label class="w-time admin-check"><input type="checkbox" data-k="captain"${p.captain ? " checked" : ""}> Kapitan</label>
        <label class="w-logo">Instagram (bez @) <input type="text" data-k="instagram" maxlength="30" value="${esc(p.instagram || "")}"></label>
      </div>
      <button class="admin-del" type="button" data-del aria-label="Usuń zawodnika ${esc(p.name)}">Usuń</button>
    </li>`;
  }

  function mediaRow(m, i) {
    const esc = A().esc;
    return `<li class="admin-ship" data-m="${i}">
      <label>Imię <input type="text" data-mk="name" maxlength="40" value="${esc(m.name)}"></label>
      <label>Funkcja <input type="text" data-mk="role" maxlength="30" value="${esc(m.role || "Media")}"></label>
      <label>Instagram <input type="text" data-mk="instagram" maxlength="30" value="${esc(m.instagram || "")}"></label>
      <button class="admin-del" type="button" data-mdel aria-label="Usuń ${esc(m.name)}">Usuń</button>
    </li>`;
  }

  function render() {
    const order = squad.map((p, i) => i).sort((a, b) => squad[a].number - squad[b].number);
    $("#squad-admin").innerHTML = order.map((i) => playerRow(squad[i], i)).join("");
    $("#media-admin").innerHTML = media.map(mediaRow).join("");
  }
  const rerender = (i) => { const li = $(`#squad-admin .admin-player[data-i="${i}"]`); if (li) li.outerHTML = playerRow(squad[i], i); };

  /* ---------- Edycja ---------- */
  function read(li) {
    const p = squad[+li.dataset.i];
    const v = (k) => $(`[data-k="${k}"]`, li);
    const posBefore = p.position;
    p.name = v("name").value.trim();
    p.number = Math.max(0, parseInt(v("number").value, 10) || 0);
    p.position = v("position").value;
    if (v("role").value) p.role = v("role").value; else delete p.role;
    if (v("captain").checked) p.captain = true; else delete p.captain;
    const ig = v("instagram").value.trim().replace(/^@/, "");
    if (ig) p.instagram = ig; else delete p.instagram;
    const rating = parseInt(v("rating").value, 10);
    const stats = [...li.querySelectorAll("[data-stat]")].map((x) => parseInt(x.value, 10));
    const pos = v("pos").value.trim().toUpperCase();
    if (rating || pos || stats.some((n) => n)) {
      p.card = { rating: rating || 0, pos: pos || p.position, stats: stats.map((n) => n || 0) };
    } else delete p.card;
    return posBefore !== p.position;       // zmiana formacji = inne podpisy statystyk
  }

  document.addEventListener("input", (e) => {
    const li = e.target.closest("#squad-admin .admin-player");
    if (li && (e.target.dataset.k || e.target.dataset.stat !== undefined)) {
      if (read(li)) rerender(+li.dataset.i);
      markDirty();
    }
    const mr = e.target.closest("#media-admin [data-m]");
    if (mr && e.target.dataset.mk) {
      const m = media[+mr.dataset.m];
      m[e.target.dataset.mk] = e.target.value.trim().replace(/^@/, "");
      if (!m.instagram) delete m.instagram;
      markDirty();
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#add-player")) {
      const maxNo = squad.reduce((n, p) => Math.max(n, p.number), 0);
      squad.push({ id: "", number: maxNo + 1, name: "Nowy zawodnik", position: "MID" });
      render(); markDirty();
      const li = $(`#squad-admin .admin-player[data-i="${squad.length - 1}"]`);
      li.classList.add("is-new"); li.scrollIntoView({ block: "center" }); $('[data-k="name"]', li).select();
      return;
    }
    if (e.target.closest("#add-media")) { media.push({ name: "Nowa osoba", role: "Media" }); render(); markDirty(); return; }
    const mdel = e.target.closest("[data-mdel]");
    if (mdel) { const i = +mdel.closest("[data-m]").dataset.m; if (confirm(`Usunąć „${media[i].name}”?`)) { media.splice(i, 1); render(); markDirty(); } return; }

    const li = e.target.closest("#squad-admin .admin-player");
    if (!li) return;
    const i = +li.dataset.i, p = squad[i];
    if (e.target.closest("[data-photo]")) $("[data-file]", li).click();
    if (e.target.closest("[data-photo-remove]")) { pending.delete(p); delete p.photo; rerender(i); markDirty(); }
    if (e.target.closest("[data-del]")) {
      if (!confirm(`Usunąć ${p.name} z kadry? Jego gole i asysty w meczach przestaną się liczyć w statystykach.`)) return;
      pending.delete(p); squad.splice(i, 1); render(); markDirty();
    }
  });

  document.addEventListener("change", async (e) => {
    if (!e.target.matches("#squad-admin [data-file]") || !e.target.files[0]) return;
    const li = e.target.closest(".admin-player");
    const p = squad[+li.dataset.i];
    const cut = $("[data-nobg]", li).checked;
    const { setMsg } = A();
    try {
      let blob = e.target.files[0];
      if (!/^image\/(png|jpeg|webp)$/.test(blob.type)) throw new Error("Zdjęcie musi być PNG, JPG albo WEBP.");
      if (cut) {
        setMsg("#save-msg", "Wycinam tło… (za pierwszym razem pobiera się model, może to potrwać ok. 30 s)");
        const lib = await import(BG_LIB);
        blob = await lib.removeBackground(blob, { model: "isnet_quint8", output: { format: "image/png" } });
      }
      const out = await toCardImage(blob, cut);
      pending.set(p, out);
      rerender(+li.dataset.i); markDirty();
    } catch (err) {
      setMsg("#save-msg", `Nie udało się przygotować zdjęcia: ${err.message}`, "error");
    }
  });

  // Wycięta sylwetka: przycięcie pustych brzegów i kadr „popiersie” (PNG).
  // Bez wycinania: kadr 4:5 od góry (JPEG).
  async function toCardImage(blob, transparent) {
    const img = await createImageBitmap(blob);
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (transparent) {
      const c = new OffscreenCanvas(img.width, img.height), x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      const px = x.getImageData(0, 0, img.width, img.height).data;
      let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
      for (let y = 0; y < img.height; y += 2) for (let xx = 0; xx < img.width; xx += 2) {
        if (px[(y * img.width + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 > x0 && y1 > y0) { sx = x0; sy = y0; sw = x1 - x0; sh = Math.min(y1 - y0, Math.round(sw * 1.15)); }
    } else {
      sh = Math.min(img.height, Math.round(img.width * 1.25)); sw = Math.round(sh / 1.25); sx = Math.round((img.width - sw) / 2);
    }
    const W = 480, H = Math.round(W * sh / sw);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    const type = transparent ? "image/png" : "image/jpeg";
    return { ext: transparent ? "png" : "jpg", base64: c.toDataURL(type, 0.86).split(",")[1] };
  }

  /* ---------- Zapis ---------- */
  async function save() {
    const { api, slugify, setMsg } = A();
    const ids = new Set(squad.filter((p) => p.id).map((p) => p.id));
    for (const p of squad) {
      if (!p.name) throw new Error("Każdy zawodnik musi mieć ksywkę albo imię.");
      if (p.card && !(p.card.rating >= 1 && p.card.stats.every((n) => n >= 1))) throw new Error(`${p.name}: uzupełnij ocenę i wszystkie 6 statystyk karty (1–99) albo wyczyść je wszystkie.`);
      if (!p.id) {                     // stały identyfikator nadawany przy pierwszym zapisie
        let id = slugify(p.name).slice(0, 36) || "zawodnik", n = 2;
        while (ids.has(id)) id = `${slugify(p.name).slice(0, 34)}-${n++}`;
        p.id = id; ids.add(id);
      }
    }
    const blobs = [];
    let done = 0;
    for (const [p, img] of pending) {
      setMsg("#save-msg", `Wysyłam zdjęcia ${++done}/${pending.size}…`);
      const slug = `${p.number}-${p.id}-${Date.now().toString(36)}`;
      const r = await api({ action: "upload", image: { dir: "kadra", slug, ext: img.ext, base64: img.base64 } });
      blobs.push({ path: r.path, sha: r.sha });
      p.photo = r.path;
      preview[r.path] = dataUrl(img);
    }
    setMsg("#save-msg", "Zapisuję kadrę…");
    await api({ target: "kadra", data: { squad, media }, blobs });
    pending.clear(); dirty = false;
    render();
    A().setSquad(squad);
  }

  window.AdminSquad = { load, save, isDirty: () => dirty };
})();
