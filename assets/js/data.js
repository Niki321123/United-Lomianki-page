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

  // Bilans wszystkich meczów (W-R-P) [IG: „bilans 17-2-7”]
  record: { w: 17, d: 2, l: 7 },

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

  /* ---------- TERMINARZ I WYNIKI ----------
     Wyniki z grafik na instagram.com/lomianki_united
     date:        "RRRR-MM-DD" albo "RRRR-MM-DDTGG:MM", gdy znamy godzinę
     opponent:    nazwa rywala;  logo: plik z assets/img/rywale/
     score:       [nasze gole, gole rywala] albo null, jeśli mecz się nie odbył
     pens:        opcjonalnie rzuty karne [nasze, rywala]
     home:        opcjonalnie true (u siebie) / false (wyjazd)
     venue, competition: opcjonalnie miejsce i rodzaj meczu (Sparing, Liga WLO…) */
  fixtures: [
    { date: "2025-04-13", opponent: "DKS Żubr", logo: "assets/img/rywale/dks-zubr.png", score: [19, 13] },
    { date: "2025-04-26T13:00", opponent: "FC Pizdeczki", logo: "assets/img/rywale/fc-pizdeczki.png", score: [9, 6], home: false, venue: "Dziekanów Bajkowy", competition: "Sparing" },
    { date: "2025-05-10", opponent: "KS Kacownia Łomianki", logo: "assets/img/rywale/kacownia-lomianki.png", score: [13, 7] },
    { date: "2025-05-17T15:00", opponent: "Deportivo Bielany", logo: "assets/img/rywale/deportivo-bielany.png", score: [12, 8], home: false, venue: "ul. Nocznickiego 7", competition: "Sparing" },
    { date: "2025-05-24", opponent: "FC Samba", logo: "assets/img/rywale/fc-samba.png", score: [6, 9] },
    { date: "2025-06-22T19:00", opponent: "Jamajka FC", logo: "assets/img/rywale/jamajka-fc.png", score: [13, 13], home: false, venue: "ul. Lindego 20", competition: "Sparing" },
    { date: "2025-06-27", opponent: "Auroria Warszawa", logo: "assets/img/rywale/auroria-warszawa.png", score: [9, 19] },
    { date: "2025-07-26", opponent: "FC Pizdeczki", logo: "assets/img/rywale/fc-pizdeczki.png", score: [13, 12] },
    { date: "2025-09-06T13:00", opponent: "FC Pizdeczki", logo: "assets/img/rywale/fc-pizdeczki.png", score: [27, 10], home: true, venue: "Łomianki – boisko szkolne" },
    { date: "2025-09-13T16:00", opponent: "RB Huwdu", logo: "assets/img/rywale/rb-huwdu.png", score: [9, 9], pens: [4, 2], home: false, venue: "ul. Conrada 6", competition: "Sparing" },
    { date: "2025-10-12T14:00", opponent: "KKS Malinki", logo: "assets/img/rywale/kks-malinki.png", score: [16, 6], home: true, venue: "Łomianki – boisko szkolne", competition: "Sparing" },
    { date: "2025-10-25", opponent: "Deportivo Bielany", logo: "assets/img/rywale/deportivo-bielany.png", score: [21, 14] },
    { date: "2025-11-11T13:00", opponent: "Centuria Mokotów", logo: "assets/img/rywale/centuria-mokotow.png", score: [24, 8], home: false, venue: "ul. Filarecka 2", competition: "Sparing" },
    { date: "2025-11-30", opponent: "Sparta Żoliborz", logo: "assets/img/rywale/sparta-zoliborz.png", score: [21, 10] },
    { date: "2025-12-14", opponent: "Dynamo Żoliborz", logo: "assets/img/rywale/dynamo-zoliborz.png", score: [13, 13], pens: [5, 4] },
    { date: "2025-12-22", opponent: "FC Bigjoint", logo: "assets/img/rywale/fc-bigjoint.png", score: [13, 9] },
    { date: "2025-12-25", opponent: "Sparta Żoliborz", logo: "assets/img/rywale/sparta-zoliborz.png", score: [21, 10] },
    { date: "2026-01-02", opponent: "FC Charakterni", logo: "assets/img/rywale/fc-charakterni.png", score: [12, 10] },
    { date: "2026-01-26T14:00", opponent: "DKS Drewno", logo: "assets/img/rywale/dks-drewno.png", score: [20, 14], home: false, venue: "ul. Strumykowa 21", competition: "Sparing" },
    { date: "2026-03-08T13:00", opponent: "Kajak FC", logo: "assets/img/rywale/kajak-fc.png", score: [15, 9], home: true, venue: "Łomianki – boisko szkolne", competition: "Liga WLO" },
    { date: "2026-03-16", opponent: "Baryga FC", logo: "assets/img/rywale/baryga-fc.png", score: [4, 8], competition: "Liga WLO" },
    { date: "2026-04-19", opponent: "KKS Malinki", logo: "assets/img/rywale/kks-malinki.png", score: [9, 8], competition: "Towarzyski" },
    { date: "2026-05-31", opponent: "FC Chomicz", logo: "assets/img/rywale/fc-chomicz.png", score: [16, 18] },
    { date: "2026-09-01T14:00", opponent: "Sicarios Bielsko-Biała", logo: "assets/img/rywale/sicarios.png", score: [4, 2], venue: "ul. Wiślana", competition: "Sparing" }
  ],

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

  /* ---------- STATYSTYKI (od października 2026) ----------
     Klucz = numer zawodnika. Po każdym meczu dopisz gole, asysty i MVP. */
  playerStats: {
     1: { goals: 0, assists: 0, mvp: 0 }, // Śledziu
    25: { goals: 0, assists: 0, mvp: 0 }, // Tyszka
     4: { goals: 0, assists: 0, mvp: 0 }, // Jeremi
     5: { goals: 0, assists: 0, mvp: 0 }, // Komorniczak
     8: { goals: 0, assists: 0, mvp: 0 }, // Malisz
    13: { goals: 0, assists: 0, mvp: 0 }, // Józef
    18: { goals: 0, assists: 0, mvp: 0 }, // Sęku
    66: { goals: 0, assists: 0, mvp: 0 }, // Bachul
     3: { goals: 0, assists: 0, mvp: 0 }, // Socha
     6: { goals: 0, assists: 0, mvp: 0 }, // Graba
    11: { goals: 0, assists: 0, mvp: 0 }, // Wojtula
    14: { goals: 0, assists: 0, mvp: 0 }, // Bartas
    17: { goals: 0, assists: 0, mvp: 0 }, // Radek
    21: { goals: 0, assists: 0, mvp: 0 }, // Tycza
    67: { goals: 0, assists: 0, mvp: 0 }, // Pyczek
     7: { goals: 0, assists: 0, mvp: 0 }, // Kamil
     9: { goals: 0, assists: 0, mvp: 0 }, // Antek Kar
    10: { goals: 0, assists: 0, mvp: 0 }, // Tymon
    99: { goals: 0, assists: 0, mvp: 0 }  // Obłuski
  },

  /* ---------- MEDIA (osoby spoza kadry) ---------- */
  media: [
    { name: "Ida",     role: "Media", instagram: "wlasnieidzieida" },
    { name: "Natasza", role: "Media", instagram: "natasza_klodawska" }
  ],

  /* ---------- AKTUALNOŚCI (najnowsze na górze) ----------
     body: akapity jako tablica tekstów
     image: opcjonalnie, np. "assets/img/news/mecz.jpg"                 */
  news: [
    {
      date: "2026-10-11",
      title: "Ruszyła oficjalna strona klubu",
      excerpt: "Terminarz, wyniki, kadra i statystyki – od dziś wszystko o Łomianki United w jednym miejscu.",
      body: [
        "Od dziś Łomianki United ma własną stronę internetową. Znajdziesz tu terminarz i wyniki meczów, kadrę zespołu oraz informacje o tym, gdzie i kiedy gramy.",
        "Na bieżąco relacje, zdjęcia i kulisy publikujemy też na Instagramie – zaobserwuj @lomianki_united."
      ]
    },
    {
      date: "2026-10-05",
      title: "Bilans 17-2-7 i apetyt na więcej",
      excerpt: "Siedemnaście zwycięstw, dwa remisy, siedem porażek. Podsumowujemy dotychczasową drogę drużyny.",
      body: [
        "Od założenia klubu w 2025 roku rozegraliśmy 26 spotkań: 17 wygranych, 2 remisy i 7 porażek.",
        "Dziękujemy wszystkim, którzy przychodzą na mecze i wspierają nas w sieci. Kolejne spotkania już w terminarzu."
      ]
    },
    {
      date: "2026-09-20",
      title: "Pimar okna bramy z nami",
      excerpt: "Firma Pimar okna bramy jest sponsorem Łomianki United. Dziękujemy za wsparcie lokalnej piłki!",
      body: [
        "Firma Pimar okna bramy wspiera Łomianki United jako sponsor klubu.",
        "Dzięki partnerom możemy grać, rozwijać drużynę i reprezentować Łomianki. Jeśli też chcesz dołączyć do grona sponsorów – napisz do nas."
      ]
    }
  ],

  /* ---------- SPONSORZY ----------
     logo: opcjonalnie ścieżka do pliku, np. "assets/img/sponsorzy/pimar.png"
     url:  opcjonalnie strona sponsora                                  */
  sponsors: [
    { name: "Pimar okna bramy", tier: "Sponsor główny", logo: "", url: "" } // [IG]
  ]
};
