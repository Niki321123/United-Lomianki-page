/* ============================================================
   ŁOMIANKI UNITED — zapis wyników i statystyk z panelu admina
   Funkcja Vercel: POST /api/save
   Zmienne środowiskowe (Vercel → Settings → Environment Variables):
     ADMIN_PASSWORD  – hasło do panelu
     ADMIN_PASSWORD_2, ADMIN_PASSWORD_3… – opcjonalnie kolejne hasła pełnego admina
     NEWS_PASSWORD, NEWS_PASSWORD_2…      – hasła admina, który edytuje tylko aktualności
     GITHUB_TOKEN    – token GitHub z uprawnieniem "Contents: Read and write" do repo
     GITHUB_REPO     – opcjonalnie, domyślnie Niki321123/United-Lomianki-page
     GITHUB_BRANCH   – opcjonalnie, domyślnie main
   Zapis = commit pliku data/wyniki.json albo data/aktualnosci.json (i obrazków) do repo,
   po którym Vercel sam przebudowuje stronę.
   ============================================================ */
const crypto = require("crypto");

const REPO = process.env.GITHUB_REPO || "Niki321123/United-Lomianki-page";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TARGETS = { wyniki: "data/wyniki.json", aktualnosci: "data/aktualnosci.json" };
const IMAGE_DIRS = { rywale: "assets/img/rywale/", news: "assets/img/news/" };
// Kto może zapisywać który plik i do którego folderu wgrywać obrazki
const ROLES = {
  admin: { targets: ["wyniki", "aktualnosci"], dirs: ["rywale", "news"] },
  news:  { targets: ["aktualnosci"], dirs: ["news"] }
};
const MAX_IMAGE_BYTES = 1200 * 1024;

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

/* ---------- Aktualności ---------- */
const NEWS_IMG_RE = /^assets\/img\/news\/[a-z0-9-]{1,80}\.(png|jpg|webp)$/;

function cleanNews(d) {
  if (!d || !Array.isArray(d.news) || d.news.length > 300) throw new Error("Zła lista aktualności");
  const news = d.news.map((n, i) => {
    const err = (m) => { throw new Error(`Wpis ${i + 1}: ${m}`); };
    if (!n || typeof n !== "object") err("niepoprawne dane");
    if (!isStr(n.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(n.date)) err("zła data");
    if (!isStr(n.title, 120) || !n.title.trim()) err("brak tytułu");
    if (!isStr(n.excerpt || "", 300)) err("za długi skrót");
    if (!Array.isArray(n.body) || n.body.length > 30 || !n.body.every((p) => isStr(p, 3000))) err("zła treść");
    if (n.image && (!isStr(n.image, 120) || !NEWS_IMG_RE.test(n.image))) err("zła ścieżka okładki");
    const gallery = n.gallery || [];
    if (!Array.isArray(gallery) || gallery.length > 300 || !gallery.every((g) => isStr(g, 120) && NEWS_IMG_RE.test(g))) err("zła galeria");
    const out = { date: n.date, title: n.title.trim(), excerpt: (n.excerpt || "").trim(),
      body: n.body.map((p) => p.trim()).filter(Boolean) };
    if (n.image) out.image = n.image;
    if (gallery.length) out.gallery = gallery;
    return out;
  });
  return { news: news.sort((a, b) => b.date.localeCompare(a.date)) };
}

/* ---------- Obrazek (logo rywala albo zdjęcie do aktualności) ---------- */
function cleanImage(img) {
  if (!img) return null;
  const dir = IMAGE_DIRS[img.dir || "rywale"];
  if (!dir) throw new Error("Zły folder obrazka");
  if (!isStr(img.slug, 80) || !/^[a-z0-9-]+$/.test(img.slug)) throw new Error("Zła nazwa pliku obrazka");
  if (!["png", "jpg", "webp"].includes(img.ext)) throw new Error("Obrazek musi być PNG, JPG albo WEBP");
  if (!isStr(img.base64, Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8)) throw new Error("Obrazek jest za duży (max 1,2 MB)");
  const buf = Buffer.from(img.base64, "base64");
  const magic = { png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff], webp: [0x52, 0x49, 0x46, 0x46] }[img.ext];
  if (buf.length > MAX_IMAGE_BYTES || !magic.every((b, i) => buf[i] === b)) throw new Error("Plik obrazka jest uszkodzony albo ma zły format");
  return { path: `${dir}${img.slug}.${img.ext}`, base64: buf.toString("base64") };
}

/* ---------- Hasła (porównanie odporne na pomiar czasu) ---------- */
// Każda zmienna ADMIN_PASSWORD, ADMIN_PASSWORD_2, ADMIN_PASSWORD_3… to osobne hasło.
// ADMIN_PASSWORD… = pełny admin, NEWS_PASSWORD… = tylko aktualności
function adminPasswords() {
  return Object.keys(process.env)
    .filter((k) => /^(ADMIN|NEWS)_PASSWORD(_\d+)?$/.test(k) && process.env[k])
    .sort()
    .map((k) => {
      const role = k.startsWith("NEWS") ? "news" : "admin";
      const n = /_\d+$/.test(k) ? k.split("_").pop() : "1";
      return { role, label: role === "news" ? `aktualności ${n}` : `hasło ${n}`, value: process.env[k] };
    });
}

// Zwraca { role, label } pasującego hasła albo null
function matchPassword(given) {
  if (typeof given !== "string" || !given) return null;
  const a = crypto.createHash("sha256").update(given).digest();
  let found = null;
  for (const p of adminPasswords()) {          // sprawdzamy wszystkie, bez przerywania
    const b = crypto.createHash("sha256").update(p.value).digest();
    if (crypto.timingSafeEqual(a, b) && !found) found = { role: p.role, label: p.label };
  }
  return found;
}

/* ---------- GitHub (Git Data API): wiele plików w jednym commicie ---------- */
async function gh(method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "lomianki-united-admin",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(`GitHub: ${method} ${path.split("/")[1]} (${res.status})`); e.status = res.status; throw e; }
  return json;
}

// Wgrywa obrazek jako „blob” (bez commita) – commit robi dopiero zapis danych
const createBlob = async (base64) => (await gh("POST", "git/blobs", { content: base64, encoding: "base64" })).sha;

// entries: [{ path, sha }] (wgrane wcześniej bloby) albo [{ path, content }] (tekst)
async function commitFiles(entries, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await gh("GET", `git/ref/heads/${BRANCH}`);
    const head = ref.object.sha;
    const base = await gh("GET", `git/commits/${head}`);
    const tree = await gh("POST", "git/trees", {
      base_tree: base.tree.sha,
      tree: entries.map((e) => ({ path: e.path, mode: "100644", type: "blob", ...(e.sha ? { sha: e.sha } : { content: e.content }) }))
    });
    const commit = await gh("POST", "git/commits", { message, tree: tree.sha, parents: [head] });
    try {
      await gh("PATCH", `git/refs/heads/${BRANCH}`, { sha: commit.sha });
      return commit.sha;
    } catch (e) {
      if (e.status !== 422 || attempt) throw e;   // ktoś zapisał w międzyczasie – próbujemy jeszcze raz
    }
  }
}

// Ścieżka wgranego bloba musi leżeć w folderze, do którego dana rola ma dostęp
function cleanBlobs(blobs, dirs) {
  if (blobs === undefined) return [];
  if (!Array.isArray(blobs) || blobs.length > 300) throw new Error("Za dużo plików w jednym zapisie");
  return blobs.map((b) => {
    if (!b || !isStr(b.sha, 40) || !/^[0-9a-f]{40}$/.test(b.sha) || !isStr(b.path, 140)) throw new Error("Zły plik");
    const dir = Object.keys(IMAGE_DIRS).find((k) => b.path.startsWith(IMAGE_DIRS[k]));
    if (!dir || !dirs.includes(dir) || !/^assets\/img\/[a-z]+\/[a-z0-9-]{1,80}\.(png|jpg|webp)$/.test(b.path)) {
      const e = new Error("To hasło nie ma uprawnień do tego folderu."); e.status = 403; throw e;
    }
    return { path: b.path, sha: b.sha };
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Tylko POST" }); }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  if (!adminPasswords().length || !process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: "Panel nie jest skonfigurowany: brak ADMIN_PASSWORD lub GITHUB_TOKEN w Vercelu." });
  }
  const who = matchPassword(body.password);
  if (!who) {
    await new Promise((r) => setTimeout(r, 800));   // spowalnia zgadywanie hasła
    return res.status(401).json({ error: "Złe hasło" });
  }
  if (body.action === "check") return res.status(200).json({ ok: true, role: who.role });
  const allowed = ROLES[who.role];
  const deny = () => res.status(403).json({ error: "To hasło nie ma uprawnień do tej części strony." });

  try {
    // 1) Wgranie pojedynczego obrazka (np. kolejnego zdjęcia z galerii) – bez commita
    if (body.action === "upload") {
      const img = body.image;
      if (!img || !allowed.dirs.includes(img.dir)) return deny();
      const image = cleanImage(img);
      return res.status(200).json({ ok: true, path: image.path, sha: await createBlob(image.base64) });
    }

    // 2) Zapis danych + wszystkich wgranych obrazków jednym commitem
    const target = body.target || "wyniki";
    if (!TARGETS[target]) throw new Error("Nieznany plik do zapisu");
    const img = body.image || body.logo;
    if (!allowed.targets.includes(target) || (img && !allowed.dirs.includes(img.dir || "rywale"))) return deny();
    const data = target === "aktualnosci" ? cleanNews(body.data) : cleanData(body.data);
    const entries = cleanBlobs(body.blobs, allowed.dirs);
    const image = cleanImage(img);
    if (image) entries.push({ path: image.path, sha: await createBlob(image.base64) });
    entries.push({ path: TARGETS[target], content: JSON.stringify(data, null, 2) + "\n" });
    const what = { aktualnosci: "aktualności", wyniki: "wyniki i statystyki" }[target];
    const files = entries.length - 1;
    const commit = await commitFiles(entries, `Panel admina (${who.label}): ${what}${files ? ` (+${files} ${files === 1 ? "obrazek" : "obrazków"})` : ""}`);
    return res.status(200).json({ ok: true, commit, image: image ? image.path : null });
  } catch (e) {
    return res.status(e.status === 403 ? 403 : 400).json({ error: e.message });
  }
};

module.exports.cleanData = cleanData;
module.exports.cleanNews = cleanNews;
module.exports.cleanImage = cleanImage;
