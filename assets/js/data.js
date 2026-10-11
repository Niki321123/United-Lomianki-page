/* ============================================================
   ŁOMIANKI UNITED — dane strony
   Tu edytujesz całą treść: mecze, kadrę, aktualności, sponsorów.
   Nie trzeba ruszać HTML ani CSS.

   Oznaczenia:
   [IG]      – informacja z profilu instagram.com/lomianki_united
   [UZUPEŁNIJ] – dane przykładowe, podmień na prawdziwe
   ============================================================ */

window.CLUB = {
  name: "Łomianki United",
  founded: 2025,                                   // [IG] rok z herbu
  tagline: "",                                     // opcjonalny tekst pod nazwą klubu (pusty = ukryty)
  league: "",                                      // [UZUPEŁNIJ] np. "Liga Łomianki – sezon 2026/27"
  season: "Sezon 2026/27",


  contact: {
    email: "",                                     // [UZUPEŁNIJ] np. "kontakt@…"
    phone: "",                                     // [UZUPEŁNIJ]
    instagram: "lomianki_united",                  // [IG]
    tiktok: "lomianki_united"                      // tiktok.com/@lomianki_united
  },

  venue: {
    name: "Łomianki United Stadion",
    address: "ul. Warszawska 73, 05-092 Łomianki",
    note: "Boisko przy Szkole Podstawowej nr 1 im. Marii Kownackiej.",
    mapUrl: "https://www.google.com/maps/place/Szko%C5%82a+Podstawowa+nr+1+im.+Marii+Kownackiej/@52.3371998,20.8948756,17z/data=!3m1!4b1!4m6!3m5!1s0x471eb78224ea1603:0x5c1f72efb5aef8b9!8m2!3d52.3371998!4d20.8948756!16s%2Fg%2F11h5l02ys2", // link „Pokaż na mapie”
    mapQuery: "Szkoła Podstawowa nr 1 im. Marii Kownackiej, Warszawska 73, Łomianki" // zapas, gdy brak mapUrl
  },

  /* ---------- WYNIKI, TERMINARZ, BILANS I STATYSTYKI ----------
     Są w pliku data/wyniki.json i edytuje się je w panelu admina (admin.html). */

  /* ---------- KADRA I MEDIA ----------
     Są w pliku data/kadra.json i edytuje się je w panelu admina (zakładka Kadra). */

  /* ---------- AKTUALNOŚCI ----------
     Są w pliku data/aktualnosci.json i edytuje się je w panelu admina (admin.html). */

  /* ---------- SPONSORZY ----------
     logo: opcjonalnie ścieżka do pliku, np. "assets/img/sponsorzy/pimar.png"
     url:  opcjonalnie strona sponsora                                  */
  sponsors: [
    { name: "Pimar okna bramy", tier: "Sponsor główny", logo: "", url: "" } // [IG]
  ]
};
