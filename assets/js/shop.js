/* ============================================================
   ŁOMIANKI UNITED — sklep (sklep.html)
   Produkty z data/sklep.json (edytowane w panelu admina).
   Koszyk trzymamy w przeglądarce klienta; płatność przez /api/checkout (Stripe).
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const money = (grosze) => (grosze / 100).toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
  const CART_KEY = "lu-koszyk";
  const load = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };
  const persist = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* tryb prywatny */ } };

  let products = [];
  let cart = load();   // [{ id, size, qty }]

  /* ---------- Komunikat po powrocie ze Stripe ---------- */
  const status = new URLSearchParams(location.search).get("zamowienie");
  if (status) {
    const n = $("#shop-notice");
    n.hidden = false;
    if (status === "ok") {
      n.dataset.kind = "ok";
      n.textContent = "Dziękujemy! Zamówienie zostało opłacone. Potwierdzenie przyjdzie na Twój e-mail.";
      cart = []; persist();
    } else {
      n.textContent = "Płatność została przerwana – koszyk czeka na Ciebie.";
    }
    history.replaceState(null, "", location.pathname);
  }

  /* ---------- Produkty ---------- */
  fetch("data/sklep.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => { products = d.products || []; renderProducts(); renderCart(); })
    .catch(() => { $("#products").innerHTML = `<p class="shop-empty">Nie udało się wczytać sklepu. Odśwież stronę.</p>`; });

  function productCard(p) {
    const available = p.active && Number.isInteger(p.price) && p.price > 0;
    const sizes = (p.sizes || []).length
      ? `<label class="product-size">Rozmiar
          <select data-size>${p.sizes.map((s) => `<option>${esc(s)}</option>`).join("")}</select></label>` : "";
    return `<article class="product${available ? "" : " is-soon"}" data-id="${esc(p.id)}">
      <div class="product-media">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
                  : `<img class="product-placeholder" src="assets/img/herb.png" alt="">`}
        ${available ? "" : `<span class="product-badge">Wkrótce</span>`}
      </div>
      <div class="product-body">
        <h2 class="product-name">${esc(p.name)}</h2>
        ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ""}
        <p class="product-price">${available ? money(p.price) : "Wkrótce w sprzedaży"}</p>
        ${available ? `<div class="product-buy">${sizes}
          <button class="btn btn-primary" type="button" data-add>Dodaj do koszyka</button></div>` : ""}
      </div>
    </article>`;
  }

  function renderProducts() {
    $("#products").innerHTML = products.length
      ? products.map(productCard).join("")
      : `<p class="shop-empty">Produkty pojawią się wkrótce.</p>`;
  }

  $("#products").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const card = btn.closest(".product");
    const size = $("[data-size]", card) ? $("[data-size]", card).value : "";
    const line = cart.find((l) => l.id === card.dataset.id && l.size === size);
    if (line) line.qty = Math.min(20, line.qty + 1); else cart.push({ id: card.dataset.id, size, qty: 1 });
    persist(); renderCart();
    btn.textContent = "Dodano ✓";
    setTimeout(() => { btn.textContent = "Dodaj do koszyka"; }, 1200);
  });

  /* ---------- Koszyk ---------- */
  const productOf = (l) => products.find((p) => p.id === l.id && p.active && p.price > 0);

  function renderCart() {
    cart = cart.filter(productOf);              // usuń produkty, które zniknęły ze sklepu
    persist();
    const count = cart.reduce((n, l) => n + l.qty, 0);
    $("#cart-count").textContent = count;
    $("#cart-lines").innerHTML = cart.length ? cart.map((l, i) => {
      const p = productOf(l);
      return `<li class="cart-line" data-i="${i}">
        <img src="${esc(p.image || "assets/img/herb.png")}" alt="">
        <div><p class="cart-name">${esc(p.name)}${l.size ? ` – ${esc(l.size)}` : ""}</p>
          <p class="cart-price">${money(p.price)}</p></div>
        <div class="cart-qty">
          <button type="button" data-q="-1" aria-label="Mniej">−</button>
          <span aria-live="polite">${l.qty}</span>
          <button type="button" data-q="1" aria-label="Więcej">+</button>
        </div>
      </li>`;
    }).join("") : `<li class="cart-empty">Koszyk jest pusty.</li>`;
    const total = cart.reduce((sum, l) => sum + productOf(l).price * l.qty, 0);
    $("#cart-total").textContent = money(total);
    $("#checkout").disabled = !cart.length;
  }

  $("#cart-lines").addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    const l = cart[+b.closest(".cart-line").dataset.i];
    l.qty = Math.max(0, Math.min(20, l.qty + +b.dataset.q));
    if (!l.qty) cart.splice(cart.indexOf(l), 1);
    persist(); renderCart();
  });

  const dialog = $("#cart");
  $("#cart-open").addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  /* ---------- Płatność ---------- */
  $("#checkout").addEventListener("click", async () => {
    const btn = $("#checkout"), msg = $("#cart-msg");
    btn.disabled = true; msg.textContent = "Przekierowuję do płatności…"; msg.dataset.kind = "";
    try {
      const r = await fetch("api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart })
      });
      let d = {};
      try { d = await r.json(); } catch (e) { /* brak funkcji lokalnie */ }
      if (!r.ok || !d.url) throw new Error(d.error || "Płatności działają tylko na opublikowanej stronie.");
      location.href = d.url;
    } catch (e) {
      msg.textContent = e.message; msg.dataset.kind = "error"; btn.disabled = false;
    }
  });
})();
