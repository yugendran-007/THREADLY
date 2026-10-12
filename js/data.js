/* ==========================================================================
   THREADLY — data.js
   Central product dataset + a tiny SVG mockup generator.
   Loaded AFTER storage.js and BEFORE app.js on every page, so every part of
   the site reads from ONE trusted source of product data.
   ========================================================================== */
(function (window) {
  "use strict";

  /* ----------------------------------------------------------------------
     Named colour palette (used by the catalog, designer and shop filters).
     ---------------------------------------------------------------------- */
  var COLORS = {
    white: "#ffffff",
    black: "#1a1a1e",
    red: "#e2403b",
    blue: "#2f6fed",
    green: "#2f9e63",
    yellow: "#f2c33d",
    pink: "#ef7bb0",
    purple: "#7c5cff",
    grey: "#b9bcc4",
    navy: "#23304f",
    olive: "#6f7d3f",
    maroon: "#7a2b34",
    sand: "#e6d8bd",
  };

  function colorName(hex) {
    var found = Object.keys(COLORS).find(function (k) {
      return COLORS[k].toLowerCase() === String(hex).toLowerCase();
    });
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : hex;
  }

  /* ----------------------------------------------------------------------
     SVG mockup generator.
     Everything is drawn locally — no external image service is required.
     ---------------------------------------------------------------------- */

  // Print graphics drawn on the chest. Each returns an SVG <g> centred at 0,0.
  var PRINTS = {
    wordmark:
      '<text x="0" y="6" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="2" fill="{c}">THREADLY</text>' +
      '<text x="0" y="30" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="12" font-weight="600" letter-spacing="6" fill="{c2}">EST 2026</text>',
    bolt:
      '<path d="M6 -52 L-28 4 L-4 4 L-12 52 L28 -6 L2 -6 Z" fill="{c}"/>',
    star:
      '<path d="M0 -46 L12 -14 L46 -14 L18 6 L29 40 L0 19 L-29 40 L-18 6 L-46 -14 L-12 -14 Z" fill="{c}"/>',
    burst:
      '<circle cx="0" cy="0" r="20" fill="{c}"/>' +
      '<g stroke="{c2}" stroke-width="5" stroke-linecap="round">' +
      '<line x1="0" y1="-30" x2="0" y2="-44"/><line x1="0" y1="30" x2="0" y2="44"/>' +
      '<line x1="-30" y1="0" x2="-44" y2="0"/><line x1="30" y1="0" x2="44" y2="0"/>' +
      '<line x1="-21" y1="-21" x2="-31" y2="-31"/><line x1="21" y1="21" x2="31" y2="31"/>' +
      '<line x1="-21" y1="21" x2="-31" y2="31"/><line x1="21" y1="-21" x2="31" y2="-31"/>' +
      "</g>",
    wave:
      '<path d="M-46 0 C -30 -26, -16 26, 0 0 S 30 -26, 46 0" fill="none" stroke="{c}" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M-46 20 C -30 -6, -16 46, 0 20 S 30 -6, 46 20" fill="none" stroke="{c2}" stroke-width="6" stroke-linecap="round" opacity="0.7"/>',
    dot:
      '<circle cx="0" cy="0" r="16" fill="{c}"/>' +
      '<circle cx="0" cy="0" r="30" fill="none" stroke="{c2}" stroke-width="3"/>',
    lines:
      '<g stroke="{c}" stroke-width="9" stroke-linecap="round">' +
      '<line x1="-38" y1="-16" x2="38" y2="-16"/><line x1="-38" y1="6" x2="14" y2="6"/><line x1="-38" y1="28" x2="26" y2="28"/>' +
      "</g>",
    pocket:
      '<rect x="-30" y="-34" width="60" height="66" rx="10" fill="none" stroke="{c}" stroke-width="5"/>' +
      '<circle cx="0" cy="-6" r="12" fill="{c}"/>',
    code:
      '<g stroke="{c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
      '<path d="M-16 -34 L-44 0 L-16 34"/><path d="M16 -34 L44 0 L16 34"/></g>',
    grid:
      '<g fill="{c}">' +
      '<circle cx="-30" cy="-30" r="7"/><circle cx="0" cy="-30" r="7"/><circle cx="30" cy="-30" r="7"/>' +
      '<circle cx="-30" cy="0" r="7"/><circle cx="0" cy="0" r="7"/><circle cx="30" cy="0" r="7"/>' +
      '<circle cx="-30" cy="30" r="7"/><circle cx="0" cy="30" r="7"/><circle cx="30" cy="30" r="7"/></g>',
    crest:
      '<path d="M0 -44 L38 -28 V8 C38 30 18 44 0 50 C-18 44 -38 30 -38 8 V-28 Z" fill="{c}" opacity="0.9"/>' +
      '<path d="M0 -30 L26 -19 V7 C26 22 12 32 0 37 C-12 32 -26 22 -26 7 V-19 Z" fill="{c2}"/>',
    mountain:
      '<path d="M-46 34 L-12 -20 L6 6 L18 -10 L46 34 Z" fill="{c}"/>' +
      '<circle cx="30" cy="-24" r="9" fill="{c2}"/>',
  };

  function printArt(kind, c1, c2) {
    var art = PRINTS[kind] || PRINTS.dot;
    return art.split("{c2}").join(c2).split("{c}").join(c1);
  }

  // A subtle darker overlay so the flat tee reads as fabric.
  function shade(color) {
    return (
      '<path d="M104,452 C104,462 112,470 122,470 L278,470 C288,470 296,462 296,452 L296,212 L370,186 L356,104 L304,72 C288,62 262,50 250,42 C240,48 224,54 200,54 C176,54 160,48 150,42 C138,50 112,62 96,72 L44,104 L30,186 L104,212 Z" fill="#000" opacity="0.06"/>' +
      '<path d="M296,212 L370,186 L356,104 L304,72 C288,62 262,50 250,42 L262,60 L300,90 L344,150 L296,212 Z" fill="#000" opacity="0.05"/>'
    );
  }

  function teeBody(color, fit) {
    var sleeve = fit === "oversized" ? 8 : 0;
    return (
      '<path d="M200,54 C176,54 160,48 150,42 C138,50 112,62 96,72 L' +
      (44 - sleeve) +
      ",104 L" +
      (30 - sleeve) +
      ",186 L104,212 L104,452 C104,462 112,470 122,470 L278,470 C288,470 296,462 296,452 L296,212 L" +
      (370 + sleeve) +
      ",186 L" +
      (356 + sleeve) +
      ",104 L304,72 C288,62 262,50 250,42 C240,48 224,54 200,54 Z" +
      '" fill="' +
      color +
      '"/>'
    );
  }

  function collar(color, fit) {
    var dark = "#00000022";
    if (fit === "polo") {
      return (
        '<path d="M150,42 C165,74 235,74 250,42 L262,52 C242,92 158,92 138,52 Z" fill="' +
        color +
        '"/>' +
        '<path d="M150,42 C165,74 235,74 250,42" fill="none" stroke="' + dark + '" stroke-width="4"/>' +
        '<line x1="200" y1="72" x2="200" y2="140" stroke="' + dark + '" stroke-width="4"/>' +
        '<circle cx="200" cy="98" r="5" fill="' + dark + '"/><circle cx="200" cy="124" r="5" fill="' + dark + '"/>'
      );
    }
    return (
      '<path d="M150,42 C165,74 235,74 250,42" fill="none" stroke="' +
      dark +
      '" stroke-width="7" stroke-linecap="round"/>'
    );
  }

  /**
   * Build the flat-lay t-shirt mockup as an SVG string.
   * @param {Object} o {color, print, printColor, printColor2, fit}
   */
  function teeSVG(o) {
    o = o || {};
    var color = o.color || COLORS.white;
    var fit = o.fit || "regular";
    var printColor = o.printColor || (color === COLORS.black || color === COLORS.navy ? "#ffffff" : "#1a1a1e");
    var printColor2 = o.printColor2 || "#ff5a1f";
    var bg = o.bg || "#f5f6f8";
    var print = o.print ? printArt(o.print, printColor, printColor2) : "";
    var isDark = /^#(0|1|2|3|4)/.test(String(color).toLowerCase()) || color === COLORS.navy || color === COLORS.maroon || color === COLORS.olive;

    // Keep the outline visible when the shirt itself is very dark.
    var outline = isDark
      ? '<path d="M200,54 C176,54 160,48 150,42 C138,50 112,62 96,72 L44,104 L30,186 L104,212 L104,452 C104,462 112,470 122,470 L278,470 C288,470 296,462 296,452 L296,212 L370,186 L356,104 L304,72 C288,62 262,50 250,42 C240,48 224,54 200,54 Z" fill="none" stroke="#ffffff33" stroke-width="3"/>'
      : '<path d="M200,54 C176,54 160,48 150,42 C138,50 112,62 96,72 L44,104 L30,186 L104,212 L104,452 C104,462 112,470 122,470 L278,470 C288,470 296,462 296,452 L296,212 L370,186 L356,104 L304,72 C288,62 262,50 250,42 C240,48 224,54 200,54 Z" fill="none" stroke="#00000018" stroke-width="3"/>';

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" role="img">' +
      '<rect width="400" height="520" fill="' + bg + '"/>' +
      '<ellipse cx="200" cy="486" rx="118" ry="16" fill="#0000000d"/>' +
      teeBody(color, fit) +
      shade(color) +
      outline +
      collar(color, fit) +
      '<g transform="translate(200 258)">' + print + "</g>" +
      "</svg>"
    );
  }

  /** Convert an SVG string into a data URL usable in <img src>. */
  function svgToDataURL(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ----------------------------------------------------------------------
     Editorial "person wearing a tee" illustration for the hero / about pages.
     ---------------------------------------------------------------------- */
  function personSVG(o) {
    o = o || {};
    var shirt = o.color || COLORS.white;
    var skin = o.skin || "#e8b48c";
    var hair = o.hair || "#2b2118";
    var bg1 = o.bg1 || "#ffe8dc";
    var bg2 = o.bg2 || "#fff7f2";
    var print = printArt(o.print || "wordmark", o.printColor || "#ff5a1f", "#1a1a1e");
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640" role="img">' +
      '<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + bg1 + '"/><stop offset="1" stop-color="' + bg2 + '"/></linearGradient></defs>' +
      '<rect width="500" height="640" fill="url(#pg)"/>' +
      '<circle cx="380" cy="120" r="150" fill="#ffffff" opacity="0.35"/>' +
      // Neck
      '<rect x="228" y="150" width="44" height="60" rx="20" fill="' + skin + '"/>' +
      // Head
      '<circle cx="250" cy="118" r="62" fill="' + skin + '"/>' +
      '<path d="M188,112 C188,66 312,66 312,112 C312,86 300,58 250,58 C200,58 188,86 188,112 Z" fill="' + hair + '"/>' +
      '<path d="M188,110 C186,140 194,150 200,152 C196,120 198,104 200,94 Z" fill="' + hair + '"/>' +
      '<path d="M312,110 C314,140 306,150 300,152 C304,120 302,104 300,94 Z" fill="' + hair + '"/>' +
      // Ears
      '<circle cx="188" cy="122" r="10" fill="' + skin + '"/><circle cx="312" cy="122" r="10" fill="' + skin + '"/>' +
      // Torso / tee
      '<path d="M150,236 C120,250 92,286 84,330 L118,352 L120,600 L380,600 L382,352 L416,330 C408,286 380,250 350,236 C320,222 300,214 250,214 C200,214 180,222 150,236 Z" fill="' + shirt + '"/>' +
      // Sleeves shading
      '<path d="M150,236 C120,250 92,286 84,330 L118,352 L138,340 L156,246 Z" fill="#00000010"/>' +
      '<path d="M350,236 C380,250 408,286 416,330 L382,352 L362,340 L344,246 Z" fill="#00000010"/>' +
      // Collar
      '<path d="M214,214 C230,248 270,248 286,214 L300,222 C280,268 220,268 200,222 Z" fill="' + shirt + '"/>' +
      '<path d="M214,214 C230,248 270,248 286,214" fill="none" stroke="#00000022" stroke-width="6"/>' +
      // Print on chest
      '<g transform="translate(250 360)">' + print + "</g>" +
      "</svg>"
    );
  }

  /* Friendly cartoon boy wearing a custom-printed tee (used for the hero).
     Drawn as inline SVG so it stays crisp, lightweight and fully offline. */
  function boySVG(o) {
    o = o || {};
    var skin = o.skin || "#f2c09a";
    var skinDark = o.skinDark || "#d99a6c";
    var hair = o.hair || "#2b2118";
    var shirt = o.shirt || "#f4f4f5";
    var shirtDark = o.shirtDark || "#e1e1e6";
    var bg1 = o.bg1 || "#04160c";
    var bg2 = o.bg2 || "#000000";
    var accent = o.accent || "#00e676";
    var print = printArt(o.print || "bolt", accent, "#04140a");
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 640" role="img">' +
      "<defs>" +
      '<linearGradient id="bbg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + bg1 + '"/><stop offset="1" stop-color="' + bg2 + '"/></linearGradient>' +
      '<radialGradient id="bglow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="' + accent + '" stop-opacity="0.34"/>' +
      '<stop offset="1" stop-color="' + accent + '" stop-opacity="0"/></radialGradient>' +
      "</defs>" +
      '<rect width="500" height="640" fill="url(#bbg)"/>' +
      '<circle cx="250" cy="330" r="232" fill="url(#bglow)"/>' +
      // sparkles
      '<circle cx="118" cy="150" r="4" fill="' + accent + '" opacity="0.85"/>' +
      '<circle cx="392" cy="206" r="6" fill="' + accent + '" opacity="0.5"/>' +
      '<circle cx="414" cy="432" r="4" fill="' + accent + '" opacity="0.7"/>' +
      '<circle cx="92" cy="470" r="5" fill="' + accent + '" opacity="0.45"/>' +
      // Neck
      '<rect x="228" y="248" width="44" height="68" rx="20" fill="' + skinDark + '"/>' +
      // Torso / tee
      '<path d="M146,330 C114,346 88,388 82,434 L120,456 L124,612 L376,612 L380,456 L418,434 C412,388 386,346 354,330 C322,314 292,306 250,306 C208,306 178,314 146,330 Z" fill="' + shirt + '"/>' +
      // Sleeve shading
      '<path d="M146,330 C114,346 88,388 82,434 L120,456 L138,444 L154,340 Z" fill="' + shirtDark + '"/>' +
      '<path d="M354,330 C386,346 412,388 418,434 L380,456 L362,444 L346,340 Z" fill="' + shirtDark + '"/>' +
      // Collar
      '<path d="M210,306 C228,344 272,344 290,306 L304,314 C282,364 218,364 196,314 Z" fill="' + shirtDark + '"/>' +
      '<path d="M210,306 C228,344 272,344 290,306" fill="none" stroke="#00000022" stroke-width="6"/>' +
      // Print on chest
      '<g transform="translate(250 430)">' + print + "</g>" +
      // Head
      '<circle cx="250" cy="185" r="74" fill="' + skin + '"/>' +
      // Ears
      '<circle cx="176" cy="192" r="13" fill="' + skin + '"/><circle cx="324" cy="192" r="13" fill="' + skin + '"/>' +
      // Hair
      '<path d="M176,188 C170,110 200,92 250,92 C300,92 330,110 324,188 C320,158 306,140 292,134 C296,152 292,162 284,168 C278,142 222,142 216,168 C208,162 204,152 208,134 C194,140 180,158 176,188 Z" fill="' + hair + '"/>' +
      '<path d="M214,120 C240,104 268,106 288,120 C272,110 232,110 214,120 Z" fill="#00000022"/>' +
      // Eyebrows
      '<path d="M204,158 Q222,148 240,157" fill="none" stroke="' + hair + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M260,157 Q278,148 296,158" fill="none" stroke="' + hair + '" stroke-width="6" stroke-linecap="round"/>' +
      // Eyes
      '<ellipse cx="222" cy="190" rx="15" ry="18" fill="#ffffff"/>' +
      '<ellipse cx="278" cy="190" rx="15" ry="18" fill="#ffffff"/>' +
      '<circle cx="224" cy="193" r="8" fill="#14151a"/><circle cx="280" cy="193" r="8" fill="#14151a"/>' +
      '<circle cx="221" cy="189" r="2.6" fill="#ffffff"/><circle cx="277" cy="189" r="2.6" fill="#ffffff"/>' +
      // Nose
      '<path d="M250,196 Q256,206 247,210" fill="none" stroke="' + skinDark + '" stroke-width="4" stroke-linecap="round"/>' +
      // Cheeks
      '<circle cx="204" cy="212" r="11" fill="#ff8fb0" opacity="0.5"/>' +
      '<circle cx="296" cy="212" r="11" fill="#ff8fb0" opacity="0.5"/>' +
      // Smile
      '<path d="M226,222 Q250,246 274,222" fill="none" stroke="#8a3b3b" stroke-width="6" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  /* ----------------------------------------------------------------------
     Product dataset — 12 realistic demonstration products.
     ---------------------------------------------------------------------- */
  var PRODUCTS = [
    {
      id: "ts-001",
      name: "Everyday Oversized Tee",
      category: "Oversized T-Shirts",
      price: 799,
      oldPrice: 999,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["white", "black", "grey"],
      graphic: "wordmark",
      printColor: "#ff5a1f",
      printColor2: "#1a1a1e",
      featured: true,
      tag: "Bestseller",
      createdAt: 12,
      description:
        "A relaxed, heavyweight oversized tee with dropped shoulders and a bold THREADLY chest print. Pre-shrunk cotton that keeps its shape wash after wash.",
    },
    {
      id: "ts-002",
      name: "Heavyweight Oversized Tee",
      category: "Oversized T-Shirts",
      price: 899,
      sizes: ["M", "L", "XL", "XXL"],
      colors: ["black", "sand", "olive"],
      graphic: "bolt",
      printColor: "#f2c33d",
      printColor2: "#ffffff",
      featured: true,
      tag: "New",
      createdAt: 30,
      description:
        "240 GSM combed cotton with a structured drape. A lightning bolt print adds edge to an otherwise minimal silhouette.",
    },
    {
      id: "ts-003",
      name: "Midnight Graphic Tee",
      category: "Graphic T-Shirts",
      price: 649,
      oldPrice: 799,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["black", "purple", "navy"],
      graphic: "star",
      printColor: "#7c5cff",
      printColor2: "#ffffff",
      featured: true,
      tag: "Sale",
      createdAt: 22,
      description:
        "A star-burst graphic on a soft midnight base. Bio-washed for an ultra-smooth hand feel from day one.",
    },
    {
      id: "ts-004",
      name: "Neon Burst Graphic Tee",
      category: "Graphic T-Shirts",
      price: 699,
      sizes: ["S", "M", "L", "XL"],
      colors: ["black", "yellow"],
      graphic: "burst",
      printColor: "#f2c33d",
      printColor2: "#ef7bb0",
      featured: true,
      createdAt: 26,
      description:
        "High-density neon ink that pops under lights. Designed for festival weekends and street styling.",
    },
    {
      id: "ts-005",
      name: "Tokyo Wave Graphic Tee",
      category: "Graphic T-Shirts",
      price: 749,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["white", "blue"],
      graphic: "wave",
      printColor: "#2f6fed",
      printColor2: "#e2403b",
      featured: false,
      createdAt: 18,
      description:
        "A flowing wave print inspired by classic woodblock art, translated into two-colour screen print.",
    },
    {
      id: "ts-006",
      name: "Essential Minimal Tee",
      category: "Minimal T-Shirts",
      price: 499,
      oldPrice: 599,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["white", "black", "grey"],
      graphic: "dot",
      printColor: "#ff5a1f",
      printColor2: "#1a1a1e",
      featured: true,
      createdAt: 15,
      description:
        "The wardrobe staple: a single concentric-dot motif, ribbed crew neck and a tailored regular fit.",
    },
    {
      id: "ts-007",
      name: "Clean Lines Minimal Tee",
      category: "Minimal T-Shirts",
      price: 549,
      sizes: ["S", "M", "L", "XL"],
      colors: ["white", "sand", "grey"],
      graphic: "lines",
      printColor: "#1a1a1e",
      printColor2: "#ff5a1f",
      featured: false,
      createdAt: 9,
      description:
        "Three tidy lines for the minimalist. Lightweight 180 GSM cotton, perfect for layering.",
    },
    {
      id: "ts-008",
      name: "Mono Pocket Minimal Tee",
      category: "Minimal T-Shirts",
      price: 599,
      sizes: ["S", "M", "L", "XL"],
      colors: ["black", "green"],
      graphic: "pocket",
      printColor: "#2f9e63",
      printColor2: "#ffffff",
      featured: false,
      createdAt: 7,
      description:
        "A printed pocket outline with a tonal dot. Clean, quiet and endlessly wearable.",
    },
    {
      id: "ts-009",
      name: "Custom Canvas Tee",
      category: "Custom Printed T-Shirts",
      price: 999,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["white", "black", "red", "blue"],
      graphic: "code",
      printColor: "#ff5a1f",
      printColor2: "#1a1a1e",
      featured: true,
      tag: "Customisable",
      createdAt: 28,
      description:
        "A blank canvas built for your ideas. Upload artwork, add text and we print it exactly as you design it.",
    },
    {
      id: "ts-010",
      name: "Design Lab Tee",
      category: "Custom Printed T-Shirts",
      price: 1099,
      sizes: ["M", "L", "XL", "XXL"],
      colors: ["white", "black", "green"],
      graphic: "grid",
      printColor: "#2f9e63",
      printColor2: "#ff5a1f",
      featured: true,
      tag: "Customisable",
      createdAt: 32,
      description:
        "Our premium 240 GSM custom base with a dot-grid guide print. Ideal for detailed artwork and logos.",
    },
    {
      id: "ts-011",
      name: "Campus Crew Oversized Tee",
      category: "Oversized T-Shirts",
      price: 849,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["maroon", "navy", "white"],
      graphic: "crest",
      printColor: "#e6d8bd",
      printColor2: "#7a2b34",
      featured: false,
      createdAt: 20,
      description:
        "A heritage crest print on a boxy oversized cut. Collegiate energy with a modern drape.",
    },
    {
      id: "ts-012",
      name: "Peak Graphic Tee",
      category: "Graphic T-Shirts",
      price: 679,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["green", "white", "black"],
      graphic: "mountain",
      printColor: "#23304f",
      printColor2: "#f2c33d",
      featured: false,
      createdAt: 24,
      description:
        "A mountain-and-sun print for the outdoors-inclined. Water-based inks that feel invisible on the fabric.",
    },
  ];

  /* Build image URLs once so every page uses identical images. */
  PRODUCTS.forEach(function (p) {
    p.image = svgToDataURL(
      teeSVG({
        color: COLORS[p.colors[0]],
        print: p.graphic,
        printColor: p.printColor,
        printColor2: p.printColor2,
      })
    );
  });

  /* A couple of ready-made illustration URLs for the marketing pages. */
  var ILLUSTRATIONS = {
    hero: svgToDataURL(
      boySVG({
        shirt: "#f4f4f5",
        print: "bolt",
        accent: "#00e676",
        bg1: "#04160c",
        bg2: "#000000",
      })
    ),
    about: svgToDataURL(
      personSVG({
        color: COLORS.white,
        print: "bolt",
        printColor: "#00e676",
        bg1: "#04160c",
        bg2: "#000000",
        skin: "#d99a6c",
        hair: "#1c1611",
      })
    ),
  };

  /* Category tiles (generated mockups in different colours). */
  var CATEGORIES = [
    { name: "Oversized T-Shirts", slug: "oversized", color: "sand", graphic: "crest", tint: "#e9e2d3" },
    { name: "Graphic T-Shirts", slug: "graphic", color: "black", graphic: "star", tint: "#dfe3ea" },
    { name: "Minimal T-Shirts", slug: "minimal", color: "white", graphic: "lines", tint: "#eceff3" },
    { name: "Custom Printed T-Shirts", slug: "custom", color: "blue", graphic: "code", tint: "#dde7fb" },
  ];
  CATEGORIES.forEach(function (c) {
    c.image = svgToDataURL(
      teeSVG({
        color: COLORS[c.color],
        fit: c.slug === "oversized" ? "oversized" : "regular",
        print: c.graphic,
        printColor: c.color === "black" ? COLORS.orange || "#ff5a1f" : "#ff5a1f",
        printColor2: "#ffffff",
        bg: c.tint,
      })
    );
  });

  /* ----------------------------------------------------------------------
     Lookup helpers + pricing rules (single source of truth).
     ---------------------------------------------------------------------- */
  var Pricing = {
    /** Base price for a freshly designed custom shirt, by fit. */
    customBase: { regular: 599, oversized: 799, polo: 949 },
    /** Extra charge when the design includes uploaded artwork. */
    artworkFee: 100,
    /** Delivery rule: free above threshold, otherwise a flat fee. */
    deliveryFee: 69,
    freeDeliveryAbove: 999,
    /** Sample demo discount codes. */
    coupons: {
      THREAD10: { type: "percent", value: 10, label: "10% off" },
      FIRST15: { type: "percent", value: 15, label: "15% off" },
    },
  };

  function getProduct(id) {
    return PRODUCTS.find(function (p) {
      return p.id === id;
    }) || null;
  }

  function featuredProducts(limit) {
    var f = PRODUCTS.filter(function (p) {
      return p.featured;
    });
    return typeof limit === "number" ? f.slice(0, limit) : f;
  }

  /** Products for the home "trending" strip: featured first, then newest. */
  function trendingProducts(limit) {
    var sorted = PRODUCTS.slice().sort(function (a, b) {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.createdAt - a.createdAt;
    });
    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  }

  window.COLORS = COLORS;
  window.colorName = colorName;
  window.PRODUCTS = PRODUCTS;
  window.CATEGORIES = CATEGORIES;
  window.ILLUSTRATIONS = ILLUSTRATIONS;
  window.Pricing = Pricing;
  window.getProduct = getProduct;
  window.featuredProducts = featuredProducts;
  window.trendingProducts = trendingProducts;
  window.SVG = {
    tee: teeSVG,
    person: personSVG,
    boy: boySVG,
    toDataURL: svgToDataURL,
    PRINTS: PRINTS,
  };
})(window);
