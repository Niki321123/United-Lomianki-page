/* ============================================================
   ŁOMIANKI UNITED — panel admina: zakładka „Aktualności”
   Edycja data/aktualnosci.json. Dostępna dla pełnego admina i admina aktualności.
   Każdy wpis: okładka (zdjęcie na kafelku) + galeria z dowolną liczbą zdjęć.
   Nowe zdjęcia trzymamy w pamięci (pola z „_”), a przy zapisie wysyłamy po jednym
   i zapisujemy wszystko jednym commitem.
   ============================================================ */
(function () {
  "use strict";

  let news = [];
  let dirty = false;
  const preview = {};   // ścieżka → podgląd z pamięci (plik jest na serwerze dopiero po przebudowie)

  const A = () => window.Admin;
  const $ = (sel, root = document) => root.querySelector(sel);
  const markDirty = () => { dirty = true; A().setMsg("#save-msg", "Masz niezapisane zmiany.", "warn"); };
  const jpg = (b64) => `data:image/jpeg;base64,${b64}`;

  async function load() {
    const r = await fetch("data/aktualnosci.json", { cache: "no-store" });
    news = ((await r.json()).news) || [];
    render();
  }

  /* ---------- Widok ---------- */
  function galleryItems(n) {
    // zapisane zdjęcia (ścieżki) + nowe, jeszcze niewysłane (base64)
    return (n.gallery || []).map((src, k) => ({ src: preview[src] || src, kind: "saved", k }))
      .concat((n._gallery || []).map((b64, k) => ({ src: jpg(b64), kind: "new", k })));
  }

  function row(n, i) {
    const esc = A().esc;
    const cover = n._cover ? jpg(n._cover) : (preview[n.image] || n.image || "");
    const items = galleryItems(n);
    return `<li class="admin-match admin-news" data-i="${i}">
      <div class="admin-cover">
        <button class="admin-photo admin-photo--wide" type="button" data-cover title="Okładka wpisu">
          ${cover ? `<img src="${esc(cover)}" alt="">` : `<img class="is-empty" src="assets/img/herb.png" alt="">`}
          <span>${cover ? "Zmień okładkę" : "Dodaj okładkę"}</span></button>
        <input type="file" data-cover-file accept="image/png,image/jpeg,image/webp" hidden>
        ${cover ? `<button class="admin-link" type="button" data-cover-remove>Usuń okładkę</button>` : ""}
      </div>
      <div class="admin-grid">
        <label class="w-date">Data <input type="date" data-k="date" value="${esc(n.date)}" required></label>
        <label class="w-wide">Tytuł <input type="text" data-k="title" maxlength="120" value="${esc(n.title)}" required></label>
        <label class="w-full">Krótki opis (na kafelku) <input type="text" data-k="excerpt" maxlength="300" value="${esc(n.excerpt || "")}"></label>
        <label class="w-full">Treść (akapity oddziel pustą linią)
          <textarea data-k="body" rows="5" maxlength="20000">${esc((n.body || []).join("\n\n"))}</textarea></label>
        <div class="w-full admin-gallery">
          <p class="admin-gallery-title">Galeria <span>(${items.length} ${items.length === 1 ? "zdjęcie" : "zdjęć"})</span></p>
          <ul class="admin-thumbs">
            ${items.map((it) => `<li><img src="${esc(it.src)}" alt="" loading="lazy">
              <button type="button" data-g-remove="${it.kind}:${it.k}" aria-label="Usuń zdjęcie z galerii">×</button></li>`).join("")}
            <li><button class="admin-thumb-add" type="button" data-g-add>+ Dodaj zdjęcia</button></li>
          </ul>
          <input type="file" data-g-file accept="image/png,image/jpeg,image/webp" multiple hidden>
        </div>
      </div>
      <button class="admin-del" type="button" data-del aria-label="Usuń wpis ${esc(n.title)}">Usuń</button>
    </li>`;
  }

  function render() {
    // najnowsze na górze; przy tej samej dacie świeżo dodany wpis pierwszy
    const order = news.map((n, i) => i).sort((a, b) => news[b].date.localeCompare(news[a].date) || b - a);
    $("#news-admin").innerHTML = order.length ? order.map((i) => row(news[i], i)).join("")
      : `<li class="admin-hint">Brak wpisów. Kliknij „+ Dodaj wpis”.</li>`;
  }
  const rerender = (i) => {
    const li = $(`#news-admin .admin-news[data-i="${i}"]`);
    if (li) li.outerHTML = row(news[i], i);
  };

  /* ---------- Edycja ---------- */
  document.addEventListener("input", (e) => {
    const li = e.target.closest("#news-admin .admin-news");
    if (!li || !e.target.dataset.k) return;
    const n = news[+li.dataset.i];
    const v = (k) => $(`[data-k="${k}"]`, li).value;
    n.date = v("date"); n.title = v("title").trim(); n.excerpt = v("excerpt").trim();
    n.body = v("body").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    markDirty();
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#add-news")) {
      news.push({ date: new Date().toISOString().slice(0, 10), title: "Nowy wpis", excerpt: "", body: [] });
      render(); markDirty();
      const added = $(`#news-admin .admin-news[data-i="${news.length - 1}"]`);
      added.classList.add("is-new"); $('[data-k="title"]', added).select();
      return;
    }
    const li = e.target.closest("#news-admin .admin-news");
    if (!li) return;
    const i = +li.dataset.i, n = news[i];
    if (e.target.closest("[data-cover]")) $("[data-cover-file]", li).click();
    if (e.target.closest("[data-g-add]")) $("[data-g-file]", li).click();
    if (e.target.closest("[data-cover-remove]")) { delete n._cover; delete n.image; rerender(i); markDirty(); }
    const rm = e.target.closest("[data-g-remove]");
    if (rm) {
      const [kind, k] = rm.dataset.gRemove.split(":");
      (kind === "saved" ? n.gallery : n._gallery).splice(+k, 1);
      rerender(i); markDirty();
    }
    if (e.target.closest("[data-del]")) {
      if (!confirm(`Usunąć wpis „${n.title}”?`)) return;
      news.splice(i, 1); render(); markDirty();
    }
  });

  document.addEventListener("change", async (e) => {
    const li = e.target.closest("#news-admin .admin-news");
    if (!li || !e.target.files || !e.target.files.length) return;
    const i = +li.dataset.i, n = news[i];
    try {
      if (e.target.matches("[data-cover-file]")) {
        n._cover = await toJpeg(e.target.files[0], { w: 1200, h: 675 });
      } else if (e.target.matches("[data-g-file]")) {
        A().setMsg("#save-msg", "Przygotowuję zdjęcia…");
        n._gallery = n._gallery || [];
        for (const f of e.target.files) n._gallery.push(await toJpeg(f, { max: 1600 }));
      } else return;
      rerender(i); markDirty();
    } catch (err) { A().setMsg("#save-msg", err.message, "error"); }
  });

  /* Zdjęcie → JPEG. { w, h } = kadr do stałego rozmiaru (okładka 16:9),
     { max } = zmniejszenie dłuższego boku bez kadrowania (galeria). */
  function toJpeg(file, opt) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error(`„${file.name}” – zdjęcie musi być PNG, JPG albo WEBP.`));
      const img = new Image();
      img.onload = () => {
        let W, H, dx = 0, dy = 0, dw, dh;
        if (opt.max) {
          const k = Math.min(1, opt.max / Math.max(img.width, img.height));
          W = dw = Math.round(img.width * k); H = dh = Math.round(img.height * k);
        } else {
          W = opt.w; H = opt.h;
          const k = Math.max(W / img.width, H / img.height);
          dw = img.width * k; dh = img.height * k; dx = (W - dw) / 2; dy = (H - dh) / 2;
        }
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#141414"; ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, dx, dy, dw, dh);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL("image/jpeg", 0.82).split(",")[1]);
      };
      img.onerror = () => reject(new Error(`Nie udało się wczytać „${file.name}”.`));
      img.src = URL.createObjectURL(file);
    });
  }

  /* ---------- Zapis ---------- */
  async function save() {
    const { api, slugify, setMsg } = A();
    for (const [i, n] of news.entries()) {
      if (!n.title || !/^\d{4}-\d{2}-\d{2}$/.test(n.date)) throw new Error(`Wpis ${i + 1}: uzupełnij datę i tytuł.`);
    }
    const total = news.reduce((s, n) => s + (n._cover ? 1 : 0) + (n._gallery || []).length, 0);
    const blobs = [];
    let done = 0;
    const stamp = Date.now().toString(36);
    const upload = async (n, base64, suffix) => {
      setMsg("#save-msg", `Wysyłam zdjęcia ${++done}/${total}…`);
      const slug = `${n.date}-${slugify(n.title).slice(0, 40)}-${stamp}-${suffix}`;
      const r = await api({ action: "upload", image: { dir: "news", slug, ext: "jpg", base64 } });
      blobs.push({ path: r.path, sha: r.sha });
      preview[r.path] = jpg(base64);
      return r.path;
    };
    // Wysyłamy na kopii – jeśli coś się nie uda, nic w edytorze się nie zgubi
    const out = [];
    for (const n of news) {
      const copy = { date: n.date, title: n.title, excerpt: n.excerpt || "", body: n.body || [] };
      if (n._cover) copy.image = await upload(n, n._cover, "okladka");
      else if (n.image) copy.image = n.image;
      const gallery = [...(n.gallery || [])];
      for (const [k, b64] of (n._gallery || []).entries()) gallery.push(await upload(n, b64, `${gallery.length + 1}-${k}`));
      if (gallery.length) copy.gallery = gallery;
      out.push(copy);
    }
    setMsg("#save-msg", "Zapisuję wpisy…");
    await api({ target: "aktualnosci", data: { news: out }, blobs });
    news = out; dirty = false;
    render();
  }

  window.AdminNews = { load, save, isDirty: () => dirty };
})();
