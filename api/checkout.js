/* ============================================================
   ŁOMIANKI UNITED — płatność w sklepie (Stripe Checkout)
   Funkcja Vercel: POST /api/checkout  { items: [{ id, size, qty }], shipping }
   Zmienna środowiskowa: STRIPE_SECRET_KEY (sk_test_… do testów, sk_live_… na produkcji)
   Ceny i dostępność bierzemy WYŁĄCZNIE z data/sklep.json na serwerze –
   to, co przyśle przeglądarka, służy tylko do wskazania produktu i rozmiaru.
   Zamówienia z adresami i telefonami widać w panelu Stripe (Płatności).
   ============================================================ */
const fs = require("fs");
const path = require("path");

const MAX_LINES = 30;
const MAX_QTY = 20;

function loadShop() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "sklep.json"), "utf8"));
}

// Zamienia zagnieżdżony obiekt na format formularza, którego oczekuje API Stripe
function toForm(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object") toForm(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.join("&");
}

function buildLines(shop, items) {
  if (!Array.isArray(items) || !items.length || items.length > MAX_LINES) throw new Error("Koszyk jest pusty albo za duży.");
  return items.map((it) => {
    const p = shop.products.find((x) => x.id === it.id);
    if (!p || !p.active || !Number.isInteger(p.price) || p.price <= 0) throw new Error("Jeden z produktów jest niedostępny.");
    const qty = it.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new Error("Zła ilość produktu.");
    const sizes = p.sizes || [];
    if (sizes.length && !sizes.includes(it.size)) throw new Error(`Wybierz rozmiar: ${p.name}.`);
    return {
      price_data: {
        currency: "pln",
        unit_amount: p.price,
        product_data: { name: sizes.length ? `${p.name} – ${it.size}` : p.name }
      },
      quantity: qty
    };
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Tylko POST" }); }
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Sklep nie jest jeszcze skonfigurowany (brak klucza Stripe)." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const shop = loadShop();
    const line_items = buildLines(shop, body.items);
    const origin = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;

    const shipping_options = (shop.shipping || []).slice(0, 5).map((s) => ({
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: s.name,
        fixed_amount: { amount: s.price, currency: "pln" }
      }
    }));

    const params = {
      mode: "payment",
      locale: "pl",
      success_url: `${origin}/sklep.html?zamowienie=ok`,
      cancel_url: `${origin}/sklep.html?zamowienie=anulowane`,
      line_items,
      shipping_address_collection: { allowed_countries: ["PL"] },
      phone_number_collection: { enabled: "true" },
      ...(shipping_options.length ? { shipping_options } : {})
    };

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: toForm(params)
    });
    const session = await r.json();
    if (!r.ok) {
      console.error("Stripe:", session.error && session.error.message);
      return res.status(502).json({ error: "Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę." });
    }
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

module.exports.buildLines = buildLines;
module.exports.toForm = toForm;
