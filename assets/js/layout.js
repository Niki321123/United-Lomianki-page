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
    { href: "kontakt.html", label: "Kontakt" }
  ];
  const current = location.pathname.split("/").pop() || "index.html";

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
        <a href="#top">Do góry ↑</a>
      </div>`;
  }
})();
