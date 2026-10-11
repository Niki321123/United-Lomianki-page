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

  /* ---------- KADRA ----------
     position: "GK" bramkarz, "DEF" obrońca, "MID" pomocnik, "FWD" napastnik
     role:     opcjonalnie funkcja w klubie, np. "Zarząd", "Założyciel"
               (osoby z rolą pokazują się też w sekcji „Zarząd”)
     captain:  true – opaska kapitana
     photo:    zdjęcie na kartę, np. "assets/img/kadra/7-kamil.png"
     card:     karta FIFA: rating (ocena), pos (pozycja na karcie, np. "ST";
               boczne LB/RB = wahadłowy, LM/RM/LW/RW = skrzydłowy),
               stats – 6 liczb: PAC SHO PAS DRI DEF PHY
               (bramkarz: DIV HAN KIC REF SPE POS)
               Statystyki z października 2026. */
  squad: [
    // Bramkarze
    { number: 1,  name: "Śledziu",            position: "GK",  role: "Zarząd", instagram: "nmikolaj_", photo: "assets/img/kadra/1-sledziu.png", card: { rating: 86, pos: "GK", stats: [86, 78, 70, 89, 80, 86] } },
    { number: 25, name: "Tyszka",             position: "GK", card: { rating: 87, pos: "GK", stats: [89, 80, 75, 83, 76, 85] } },
    // Obrońcy
    { number: 4,  name: "Jeremi",             position: "DEF", instagram: "kozisynek", photo: "assets/img/kadra/4-jeremi.png", card: { rating: 86, pos: "LB", stats: [85, 73, 78, 87, 84, 78] } },
    { number: 5,  name: "Komorniczak",        position: "DEF", instagram: "komorniczakk", photo: "assets/img/kadra/5-komorniczak.png", card: { rating: 86, pos: "CB", stats: [86, 80, 76, 75, 85, 90] } },
    { number: 8,  name: "Malisz",             position: "DEF", instagram: "maliczesky_", card: { rating: 90, pos: "CB", stats: [80, 79, 91, 81, 89, 84] } },
    { number: 13, name: "Józef",              position: "DEF", instagram: "prettyflackojoseph", photo: "assets/img/kadra/13-jozef.jpg", card: { rating: 84, pos: "CB", stats: [72, 69, 71, 64, 83, 88] } },
    { number: 18, name: "Sęku",               position: "DEF", instagram: "mikolaj1921", photo: "assets/img/kadra/18-seku.jpg", card: { rating: 88, pos: "CB", stats: [86, 82, 85, 87, 83, 85] } },
    { number: 66, name: "Bachul",             position: "DEF", role: "Zarząd", instagram: "j.bachulski", photo: "assets/img/kadra/66-bachul.jpg", card: { rating: 82, pos: "RB", stats: [80, 69, 74, 70, 81, 93] } },
    // Pomocnicy
    { number: 3,  name: "Socha",              position: "MID", instagram: "socha.sa", card: { rating: 94, pos: "CDM", stats: [81, 90, 88, 87, 90, 85] } },
    { number: 6,  name: "Graba",              position: "MID", role: "Zarząd", instagram: "m__grabowski", photo: "assets/img/kadra/6-graba.jpg", card: { rating: 83, pos: "LM", stats: [50, 82, 83, 84, 74, 69] } },
    { number: 11, name: "Wojtula",            position: "MID", instagram: "w0jtulaa__", photo: "assets/img/kadra/11-wojtula.jpg", card: { rating: 86, pos: "RM", stats: [90, 84, 80, 89, 64, 70] } },
    { number: 14, name: "Bartas",             position: "MID", role: "Założyciel", instagram: "b.pokwicki", photo: "assets/img/kadra/14-bartas.png", card: { rating: 88, pos: "CM", stats: [63, 80, 93, 90, 61, 95] } },
    { number: 17, name: "Radek",              position: "MID", card: { rating: 85, pos: "CM", stats: [80, 83, 84, 83, 83, 86] } },
    { number: 21, name: "Tycza",              position: "MID", photo: "assets/img/kadra/21-tycza.png", card: { rating: 94, pos: "CM", stats: [88, 88, 88, 95, 90, 78] } },
    { number: 67, name: "Pyczek",             position: "MID", instagram: "alexpyczekk", photo: "assets/img/kadra/67-pyczek.jpg", card: { rating: 94, pos: "CAM", stats: [93, 94, 89, 92, 86, 96] } },
    // Napastnicy
    { number: 7,  name: "Kamil",              position: "FWD", instagram: "its.kamilek", card: { rating: 89, pos: "ST", stats: [80, 87, 89, 92, 88, 81] } },
    { number: 9,  name: "Antek Kar",          position: "FWD", instagram: "antek2626", photo: "assets/img/kadra/9-antek-kar.jpg", card: { rating: 84, pos: "ST", stats: [83, 89, 65, 75, 72, 98] } },
    { number: 10, name: "Tymon",              position: "FWD", role: "Zarząd", instagram: "kowalczyk.tymon", card: { rating: 87, pos: "ST", stats: [90, 85, 80, 89, 56, 70] } },
    { number: 99, name: "Obłuski",            position: "FWD", captain: true, instagram: "whoisjasiu", photo: "assets/img/kadra/99-obluski.jpg", card: { rating: 93, pos: "ST", stats: [95, 93, 89, 96, 50, 83] } }
  ],

  /* ---------- MEDIA (osoby spoza kadry) ---------- */
  media: [
    { name: "Ida",     role: "Media", instagram: "wlasnieidzieida" },
    { name: "Natasza", role: "Media", instagram: "natasza_klodawska" }
  ],

  /* ---------- AKTUALNOŚCI ----------
     Są w pliku data/aktualnosci.json i edytuje się je w panelu admina (admin.html). */

  /* ---------- SPONSORZY ----------
     logo: opcjonalnie ścieżka do pliku, np. "assets/img/sponsorzy/pimar.png"
     url:  opcjonalnie strona sponsora                                  */
  sponsors: [
    { name: "Pimar okna bramy", tier: "Sponsor główny", logo: "", url: "" } // [IG]
  ]
};
