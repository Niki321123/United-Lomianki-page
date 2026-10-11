/* ============================================================
   ŁOMIANKI UNITED — panel admina: zakładka „Sklep”
   Edycja data/sklep.json (produkty i dostawy). Ceny w złotych w formularzu,
   w pliku zapisywane w groszach.
   ============================================================ */
(function () {
  "use strict";

  let shop = null;           // { shipping, products }
  let pendingImage = null;   // { index, base64 } – jedno nowe zdjęcie produktu na zapis
  let dirty = false;

  const A = () => window.Admin;
  const $ = (sel, root = document) => root.querySelector(sel);
  const toZl = (gr) => (Number.isInteger(gr) ? (gr / 100).toFixed(2) : "");
  const toGr = (zl) => {
    const v = String(zl).replace(",", ".").trim();
    if (v === "") return null;
    const n = Math.round(parseFloat(v) * 100);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const markDirty = () => { dirty = true; A().setMsg("#save-msg", "Masz niezapisane zmiany.", "warn"); };

  async function load() {
    const r = await fetch("data/sklep.json", { cache: "no-store" });
    shop = await r.json();
    shop.shipping = shop.shipping || [];
    shop.products = shop.products || [];
    render();
  }

  /* ---------- Widok ---------- */
  function productRow(p, i) {
    const esc = A().esc;
    const img = pendingImage && pendingImage.index === i ? `data:image/jpeg;base64,${pendingImage.base64}` : (p.image || "assets/img/herb.png");
    return `<li class="admin-match admin-product" data-i="${i}">
      <button class="admin-photo" type="button" data-photo title="Zmień zdjęcie">
        <img src="${esc(img)}" alt=""><span>Zdjęcie</span></button>
      <input type="file" data-file accept="image/png,image/jpeg,image/webp" hidden>
      <div class="admin-grid">
        <label class="w-opp">Nazwa <input type="text" data-k="name" maxlength="80" value="${esc(p.name)}" required></label>
        <label class="w-date">Cena (zł) <input type="text" inputmode="decimal" data-k="price" value="${toZl(p.price)}" placeholder="np. 89,99"></label>
        <label class="w-time">Status <select data-k="active">
          <option value="0"${p.active ? "" : " selected"}>Wkrótce</option>
          <option value="1"${p.active ? " selected" : ""}>W sprzedaży</option></select></label>
        <label class="w-logo">Rozmiary (po przecinku) <input type="text" data-k="sizes" value="${esc((p.sizes || []).join(", "))}" placeholder="S, M, L, XL – puste = bez rozmiaru"></label>
        <label class="w-full">Opis <input type="text" data-k="description" maxlength="500" value="${esc(p.description || "")}"></label>
      </div>
      <button class="admin-del" type="button" data-del aria-label="Usuń produkt ${esc(p.name)}">Usuń</button>
    </li>`;
  }

  function shippingRow(s, i) {
    const esc = A().esc;
    return `<li class="admin-ship" data-i="${i}">
      <label>Nazwa <input type="text" data-k="name" maxlength="60" value="${esc(s.name)}"></label>
      <label>Cena (zł) <input type="text" inputmode="decimal" data-k="price" value="${toZl(s.price)}"></label>
      <button class="admin-del" type="button" data-del aria-label="Usuń dostawę ${esc(s.name)}">Usuń</button>
    </li>`;
  }

  function render() {
    $("#products-admin").innerHTML = shop.products.map(productRow).join("");
    $("#shipping-admin").innerHTML = shop.shipping.map(shippingRow).join("");
  }

  /* ---------- Edycja produktów ---------- */
  function readProduct(li) {
    const p = shop.products[+li.dataset.i];
    const v = (k) => $(`[data-k="${k}"]`, li).value;
    p.name = v("name").trim();
    p.price = toGr(v("price"));
    p.active = v("active") === "1";
    p.sizes = v("sizes").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);
    p.description = v("description").trim();
  }

  document.addEventListener("input", (e) => {
    const li = e.target.closest("#products-admin .admin-product");
    if (li && e.target.dataset.k) { readProduct(li); markDirty(); }
    const sh = e.target.closest("#shipping-admin .admin-ship");
    if (sh && e.target.dataset.k) {
      const s = shop.shipping[+sh.dataset.i];
      s.name = $('[data-k="name"]', sh).value.trim();
      s.price = toGr($('[data-k="price"]', sh).value) ?? 0;
      markDirty();
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#add-product")) {
      shop.products.push({ id: "", name: "Nowy produkt", price: null, description: "", sizes: ["S", "M", "L", "XL"], image: "", active: false });
      render(); markDirty();
      $(`#products-admin .admin-product:last-child [data-k="name"]`).select();
    }
    if (e.target.closest("#add-shipping")) {
      if (shop.shipping.length >= 5) return A().setMsg("#save-msg", "Maksymalnie 5 sposobów dostawy.", "error");
      shop.shipping.push({ name: "Nowa dostawa", price: 0 }); render(); markDirty();
    }
    const photo = e.target.closest("#products-admin [data-photo]");
    if (photo) $("[data-file]", photo.closest(".admin-product")).click();
    const del = e.target.closest("#products-admin [data-del], #shipping-admin [data-del]");
    if (del) {
      const li = del.closest("li"), i = +li.dataset.i;
      const isProduct = li.classList.contains("admin-product");
      const name = isProduct ? shop.products[i].name : shop.shipping[i].name;
      if (!confirm(`Usunąć „${name}”?`)) return;
      if (isProduct) {
        shop.products.splice(i, 1);
        if (pendingImage) pendingImage = pendingImage.index === i ? null : { ...pendingImage, index: pendingImage.index - (pendingImage.index > i) };
      } else shop.shipping.splice(i, 1);
      render(); markDirty();
    }
  });

  document.addEventListener("change", async (e) => {
    if (!e.target.matches("#products-admin [data-file]") || !e.target.files[0]) return;
    const li = e.target.closest(".admin-product");
    try {
      const base64 = await toProductJpeg(e.target.files[0]);
      pendingImage = { index: +li.dataset.i, base64 };
      $(".admin-photo img", li).src = `data:image/jpeg;base64,${base64}`;
      markDirty();
    } catch (err) { A().setMsg("#save-msg", err.message, "error"); }
  });

  // Zdjęcie produktu → kwadratowy JPEG 1000×1000 (wykadrowany środek)
  function toProductJpeg(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Zdjęcie musi być PNG, JPG albo WEBP."));
      const img = new Image();
      img.onload = () => {
        const size = 1000, c = document.createElement("canvas"); c.width = c.height = size;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#141414"; ctx.fillRect(0, 0, size, size);
        const k = Math.max(size / img.width, size / img.height);
        const w = img.width * k, h = img.height * k;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL("image/jpeg", 0.86).split(",")[1]);
      };
      img.onerror = () => reject(new Error("Nie udało się wczytać zdjęcia."));
      img.src = URL.createObjectURL(file);
    });
  }

  /* ---------- Zapis ---------- */
  async function save() {
    const { slugify, api } = A();
    const used = new Set();
    for (const [i, p] of shop.products.entries()) {
      if (!p.name) throw new Error(`Produkt ${i + 1}: brak nazwy.`);
      if (p.active && !(p.price > 0)) throw new Error(`„${p.name}”: produkt w sprzedaży musi mieć cenę.`);
      // identyfikator z nazwy (stały po pierwszym zapisie, żeby nie psuć koszyków klientów)
      if (!p.id) p.id = slugify(p.name);
      let id = p.id, n = 2;
      while (used.has(id)) id = `${p.id}-${n++}`;
      p.id = id; used.add(id);
    }
    let image = null;
    if (pendingImage) {
      const p = shop.products[pendingImage.index];
      const slug = `${p.id}-${Date.now().toString(36)}`;   // nowa nazwa = brak starej wersji w pamięci przeglądarek
      p.image = `assets/img/sklep/${slug}.jpg`;
      image = { dir: "sklep", slug, ext: "jpg", base64: pendingImage.base64 };
    }
    await api({ target: "sklep", data: shop, image });
    pendingImage = null; dirty = false;
  }

  window.AdminShop = { load, save, isDirty: () => dirty };
})();
