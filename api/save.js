/* ============================================================
   ŁOMIANKI UNITED — zapis wyników i statystyk z panelu admina
   Funkcja Vercel: POST /api/save
   Zmienne środowiskowe (Vercel → Settings → Environment Variables):
     ADMIN_PASSWORD  – hasło do panelu
     GITHUB_TOKEN    – token GitHub z uprawnieniem "Contents: Read and write" do repo
     GITHUB_REPO     – opcjonalnie, domyślnie Niki321123/United-Lomianki-page
     GITHUB_BRANCH   – opcjonalnie, domyślnie main
   Zapis = commit pliku data/wyniki.json (i ewentualnie logo rywala) do repo,
   po którym Vercel sam przebudowuje stronę.
   ============================================================ */
const crypto = require("crypto");

const REPO = process.env.GITHUB_REPO || "Niki321123/United-Lomianki-page";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const DATA_PATH = "data/wyniki.json";
const LOGO_DIR = "assets/img/rywale/";
const MAX_LOGO_BYTES = 600 * 1024;

/* ---------- Walidacja danych ---------- */
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isStr = (v, max) => typeof v === "string" && v.length <= max;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const LOGO_RE = /^assets\/img\/rywale\/[a-z0-9-]{1,60}\.(png|jpg|webp)$/;

function cleanFixture(f, i) {
  const err = (m) => { throw new Error(`Mecz ${i + 1}: ${m}`); };
  if (!f || typeof f !== "object") err("niepoprawne dane");
  if (!isStr(f.date, 16) || !DATE_RE.test(f.date)) err("zła data");
  if (!isStr(f.opponent, 80) || !f.opponent.trim()) err("brak nazwy rywala");
  const out = { date: f.date, opponent: f.opponent.trim() };
  if (f.logo) { if (!isStr(f.logo, 120) || !LOGO_RE.test(f.logo)) err("zła ścieżka logo"); out.logo = f.logo; }
  if (f.score === null || f.score === undefined) out.score = null;
  else if (Array.isArray(f.score) && f.score.length === 2 && f.score.every((n) => isInt(n, 0, 99))) out.score = f.score;
  else err("zły wynik");
  if (f.pens !== undefined && f.pens !== null) {
    if (!(Array.isArray(f.pens) && f.pens.length === 2 && f.pens.every((n) => isInt(n, 0, 99)))) err("złe karne");
    out.pens = f.pens;
  }
  if (f.home !== undefined && f.home !== null) { if (typeof f.home !== "boolean") err("zły dom/wyjazd"); out.home = f.home; }
  if (f.venue) { if (!isStr(f.venue, 120)) err("za długie miejsce"); out.venue = f.venue.trim(); }
  if (f.competition) { if (!isStr(f.competition, 40)) err("za długi rodzaj meczu"); out.competition = f.competition.trim(); }
  return out;
}

function cleanData(d) {
  if (!d || typeof d !== "object") throw new Error("Brak danych");
  const r = d.record || {};
  if (!["w", "d", "l"].every((k) => isInt(r[k], 0, 9999))) throw new Error("Zły bilans");
  if (!Array.isArray(d.fixtures) || d.fixtures.length > 1000) throw new Error("Zła lista meczów");
  const stats = {};
  for (const [num, s] of Object.entries(d.playerStats || {})) {
    if (!/^\d{1,3}$/.test(num) || !s || typeof s !== "object") throw new Error("Złe statystyki");
    if (!["goals", "assists", "mvp"].every((k) => isInt(s[k], 0, 9999))) throw new Error(`Złe statystyki zawodnika nr ${num}`);
    stats[num] = { goals: s.goals, assists: s.assists, mvp: s.mvp };
  }
  return {
    record: { w: r.w, d: r.d, l: r.l },
    fixtures: d.fixtures.map(cleanFixture).sort((a, b) => a.date.localeCompare(b.date)),
    playerStats: stats
  };
}

function cleanLogo(logo) {
  if (!logo) return null;
  if (!isStr(logo.slug, 60) || !/^[a-z0-9-]+$/.test(logo.slug)) throw new Error("Zła nazwa pliku logo");
  if (!["png", "jpg", "webp"].includes(logo.ext)) throw new Error("Logo musi być PNG, JPG albo WEBP");
  if (!isStr(logo.base64, Math.ceil(MAX_LOGO_BYTES * 4 / 3) + 8)) throw new Error("Logo jest za duże (max 600 KB)");
  const buf = Buffer.from(logo.base64, "base64");
  const magic = { png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff], webp: [0x52, 0x49, 0x46, 0x46] }[logo.ext];
  if (buf.length > MAX_LOGO_BYTES || !magic.every((b, i) => buf[i] === b)) throw new Error("Plik logo jest uszkodzony albo ma zły format");
  return { path: `${LOGO_DIR}${logo.slug}.${logo.ext}`, base64: buf.toString("base64") };
}

/* ---------- Hasło (porównanie odporne na pomiar czasu) ---------- */
function passwordOk(given) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || typeof given !== "string") return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------- GitHub: zapis pliku jednym commitem ---------- */
async function putFile(path, base64, message) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "lomianki-united-admin"
  };
  const cur = await fetch(`${url}?ref=${BRANCH}`, { headers });
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  if (!cur.ok && cur.status !== 404) throw new Error(`GitHub: nie można odczytać ${path} (${cur.status})`);
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: base64, branch: BRANCH, ...(sha ? { sha } : {}) })
  });
  if (!res.ok) throw new Error(`GitHub: zapis ${path} nie powiódł się (${res.status})`);
  return (await res.json()).commit.sha;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Tylko POST" }); }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: "Panel nie jest skonfigurowany: brak ADMIN_PASSWORD lub GITHUB_TOKEN w Vercelu." });
  }
  if (!passwordOk(body.password)) {
    await new Promise((r) => setTimeout(r, 800));   // spowalnia zgadywanie hasła
    return res.status(401).json({ error: "Złe hasło" });
  }
  if (body.action === "check") return res.status(200).json({ ok: true });

  try {
    const data = cleanData(body.data);
    const logo = cleanLogo(body.logo);
    if (logo) await putFile(logo.path, logo.base64, `Panel admina: logo ${logo.path.split("/").pop()}`);
    const json = JSON.stringify(data, null, 2) + "\n";
    const commit = await putFile(DATA_PATH, Buffer.from(json, "utf8").toString("base64"), "Panel admina: aktualizacja wyników i statystyk");
    return res.status(200).json({ ok: true, commit, logo: logo ? logo.path : null });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

module.exports.cleanData = cleanData;
module.exports.cleanLogo = cleanLogo;
