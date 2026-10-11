/* ============================================================
   ŁOMIANKI UNITED — wspólny nagłówek, menu i stopka dla wszystkich podstron.
   Nowa podstrona = nowy wpis w PAGES.
   ============================================================ */
(function () {
  "use strict";

  const PAGES = [
    { href: "aktualnosci.html", label: "Aktualności" },
    { href: "terminarz.html", label: "Terminarz" },
    { href: "kadra.html", label: "Kadra" },
    { href: "statystyki.html", label: "Statystyki" },
    { href: "sponsorzy.html", label: "Sponsorzy" },
    { href: "sklep.html", label: "Sklep", hidden: !(window.CLUB && window.CLUB.shop) }
  ].filter((p) => !p.hidden);
  const current = location.pathname.split("/").pop() || "index.html";

  // Ikony social media – używane też w main.js (window.ICONS)
  const ICONS = window.ICONS = {
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    tt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.3 1.6 3.8 3.9 4v3.1c-1.4.1-2.7-.3-3.9-1v6.1c0 4.6-4.9 6.9-8.3 4.6C5.8 18.3 6 13.9 9.2 12.6c.9-.4 1.9-.5 2.9-.3v3.3c-.5-.2-1-.2-1.5-.1-1.5.4-1.9 2.3-.7 3.2 1.4 1 3.5.1 3.5-1.9V3h3.2z"/></svg>'
  };
  const contact = (window.CLUB && window.CLUB.contact) || {};

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <div class="container header-inner">
        <a class="brand" href="index.html" aria-label="Łomianki United – strona główna">
          <img src="assets/img/herb.png" alt="" width="40" height="42">
          <span class="brand-name">Łomianki <strong>United</strong></span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span class="nav-toggle-bar" aria-hidden="true"></span>
          <span class="visually-hidden">Menu</span>
        </button>
        <nav id="site-nav" class="site-nav" aria-label="Główna nawigacja">
          <ul>${PAGES.map((p) =>
            `<li><a href="${p.href}"${p.href === current ? ' aria-current="page"' : ""}>${p.label}</a></li>`).join("")}
          </ul>
        </nav>
      </div>`;

    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector("#site-nav");
    const setOpen = (open) => { toggle.setAttribute("aria-expanded", open); nav.classList.toggle("is-open", open); };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <div class="container footer-inner">
        <img src="assets/img/herb.png" alt="" width="32" height="34">
        <p>© ${new Date().getFullYear()} Łomianki United</p>
        <ul class="footer-socials" aria-label="Media społecznościowe">
          ${contact.instagram ? `<li><a class="social" href="https://www.instagram.com/${encodeURIComponent(contact.instagram)}/" target="_blank" rel="noopener" aria-label="Instagram @${contact.instagram}" title="Instagram">${ICONS.ig}</a></li>` : ""}
          ${contact.tiktok ? `<li><a class="social" href="https://www.tiktok.com/@${encodeURIComponent(contact.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok @${contact.tiktok}" title="TikTok">${ICONS.tt}</a></li>` : ""}
        </ul>
        <a class="footer-top" href="#top">Do góry ↑</a>
      </div>`;
  }
})();
