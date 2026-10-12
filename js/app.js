/* ==========================================================================
   THREADLY — app.js
   Shared UI layer used by EVERY page:
   • inline icon set            • header + footer injection (single source)
   • mobile navigation          • toast notifications
   • modal / drawer system      • cart + wishlist badges
   • search overlay             • wishlist drawer
   • quick-view modal           • product card renderer
   • newsletter + reset-data helpers
   ========================================================================== */
(function (window, document) {
  "use strict";

  /* ======================================================================
     1. ICONS — inline SVG so the site works fully offline.
     ====================================================================== */
  var PATHS = {
    shirt: '<path d="M16 3l5 3-2 5-2-1v11H7V10L5 11 3 6l5-3a4 4 0 0 0 8 0z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash:
      '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
    star: '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9z"/>',
    truck:
      '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 21V9M7 13l5-5 5 5M4 4h16"/>',
    type: '<path d="M4 6V4h16v2M12 4v16M9 20h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>',
    lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    phone: '<path d="M4 4h5l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5V20a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.4-2.1-.8-1.4.2-2.9 1.8-2.9H17a4 4 0 0 0 4-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
    package: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/>',
    ruler: '<path d="M3 15L15 3l6 6L9 21z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    facebook: '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3H12V6.5A.5.5 0 0 1 12.5 6H15z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    twitter: '<path d="M4 4l7 8.5L4.5 20H7l5.2-6 4.8 6H20l-7.2-8.8L19.5 4H17l-4.8 5.6L7.5 4z"/>',
    youtube: '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10 9l5 3-5 3z"/>',
    pinterest: '<circle cx="12" cy="12" r="9"/><path d="M12 7c-2.2 0-3.8 1.5-3.8 3.4 0 1 .4 1.9 1.2 2.3M12 7c1.9 0 3.3 1.2 3.3 3.1 0 2.3-1.3 4-3.1 4-.7 0-1.3-.4-1.5-.9M11.3 12.4L10 20"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
    crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',
  };

  /** Return a full inline SVG for the given icon name. */
  function icon(name, size) {
    var body = PATHS[name] || PATHS.info;
    var s = size || 20;
    var filled = name === "star" || name === "facebook" || name === "twitter" || name === "pinterest";
    return (
      '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true" ' +
      (filled ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') +
      ">" + body + "</svg>"
    );
  }

  /* ======================================================================
     2. NAVIGATION CONFIG
     ====================================================================== */
  var NAV_LINKS = [
    { href: "index.html", label: "Home" },
    { href: "products.html", label: "Shop" },
    { href: "designer.html", label: "Design Your T-Shirt" },
    { href: "about.html", label: "About" },
    { href: "contact.html", label: "Contact" },
  ];

  function currentPage() {
    var parts = window.location.pathname.split("/");
    var file = parts[parts.length - 1];
    return file === "" ? "index.html" : file;
  }

  var safe = window.Utils.escapeHTML;

  /* ======================================================================
     3. HEADER
     ====================================================================== */
  function headerHTML() {
    var page = currentPage();
    var links = NAV_LINKS.map(function (l) {
      var active = l.href === page ? " is-active" : "";
      return '<a href="' + l.href + '" class="' + active.trim() + '">' + l.label + "</a>";
    }).join("");

    return (
      '<div class="announce">Free shipping over \u20B9999 \u00B7 Custom printing in 48 hours \u00B7 <strong>Demo store \u2014 no real payment is processed</strong></div>' +
      '<header class="site-header" id="site-header">' +
      '<div class="container nav">' +
      '<a class="brand" href="index.html" aria-label="THREADLY home">' +
      '<span class="brand__mark">' + icon("shirt", 20) + "</span>" +
      "<span>THREAD<b>LY</b></span></a>" +
      '<nav class="nav__links" aria-label="Primary">' + links + "</nav>" +
      '<div class="nav__actions">' +
      '<button class="icon-btn" type="button" data-open-search aria-label="Search products">' + icon("search") + "</button>" +
      '<button class="icon-btn" type="button" data-open-wishlist aria-label="Open wishlist">' +
      icon("heart") + '<span class="badge-count" id="wishlistBadge" data-empty="true">0</span></button>' +
      '<a class="icon-btn" href="cart.html" aria-label="Open shopping cart">' +
      icon("cart") + '<span class="badge-count" id="cartBadge" data-empty="true">0</span></a>' +
      '<button class="icon-btn nav__toggle" type="button" data-open-mobile aria-label="Open menu">' + icon("menu") + "</button>" +
      "</div></div></header>"
    );
  }

  function mobileNavHTML() {
    var page = currentPage();
    var links = NAV_LINKS.map(function (l) {
      var active = l.href === page ? ' class="is-active"' : "";
      return "<a href=\"" + l.href + "\"" + active + ">" + l.label + "</a>";
    }).join("");
    return (
      '<div class="mobile-nav" id="mobileNav" role="dialog" aria-modal="true" aria-label="Menu">' +
      '<div class="mobile-nav__head">' +
      '<span class="brand"><span class="brand__mark">' + icon("shirt", 20) + "</span><span>THREAD<b>LY</b></span></span>" +
      '<button class="icon-btn" type="button" data-close-mobile aria-label="Close menu">' + icon("close") + "</button></div>" +
      links +
      '<div class="mobile-nav__foot">' +
      '<a class="btn btn--primary" href="designer.html">' + icon("palette", 18) + " Start Designing</a>" +
      '<a class="btn btn--outline" href="orders.html">' + icon("package", 18) + " My Orders</a>" +
      "</div></div>"
    );
  }

  /* ======================================================================
     4. FOOTER
     ====================================================================== */
  function footerHTML() {
    var year = new Date().getFullYear();
    return (
      '<footer class="site-footer">' +
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-about">' +
      '<span class="brand"><span class="brand__mark">' + icon("shirt", 20) + "</span><span>THREAD<b>LY</b></span></span>" +
      "<p>Create, customise and order premium quality T-shirts printed with your own designs. Wear your ideas.</p>" +
      '<form class="newsletter-inline js-newsletter" novalidate>' +
      '<label for="footerEmail" class="sr-only">Email address</label>' +
      '<input id="footerEmail" type="email" name="email" placeholder="Your email address" required>' +
      '<button class="btn btn--accent" type="submit">Join</button>' +
      "</form></div>" +
      "<div><h4>Shop</h4>" +
      '<a href="products.html">All Products</a><a href="products.html?category=oversized">Oversized</a>' +
      '<a href="products.html?category=graphic">Graphic Tees</a><a href="products.html?category=minimal">Minimal</a>' +
      '<a href="products.html?category=custom">Custom Printed</a></div>' +
      "<div><h4>Company</h4>" +
      '<a href="about.html">About Us</a><a href="contact.html">Contact</a>' +
      '<a href="orders.html">Track Order</a><a href="contact.html#faq">FAQ</a>' +
      '<a href="#" data-legal="privacy">Privacy Policy</a><a href="#" data-legal="terms">Terms &amp; Conditions</a></div>' +
      "<div><h4>Connect</h4>" +
      '<a href="#" data-social="instagram">Instagram</a><a href="#" data-social="facebook">Facebook</a>' +
      '<a href="#" data-social="twitter">X / Twitter</a><a href="#" data-social="youtube">YouTube</a>' +
      '<a href="#" data-reset-data>Clear Demo Data</a></div>' +
      "</div>" +
      '<div class="footer-bottom">' +
      "<p>\u00A9 " + year + " THREADLY. College mini-project demo. All rights reserved.</p>" +
      '<div class="footer-social">' +
      social("instagram") + social("facebook") + social("twitter") + social("youtube") +
      "</div></div></div></footer>"
    );
  }

  function social(name) {
    var label = name.charAt(0).toUpperCase() + name.slice(1);
    return '<a href="#" data-social="' + name + '" aria-label="' + label + '">' + icon(name, 18) + "</a>";
  }

  /* ======================================================================
     5. TOASTS
     ====================================================================== */
  var toastWrap;
  function ensureToastWrap() {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "toast-wrap";
      toastWrap.setAttribute("aria-live", "polite");
      document.body.appendChild(toastWrap);
    }
    return toastWrap;
  }

  var Toast = {
    /**
     * @param {string} title
     * @param {string} [message]
     * @param {"success"|"error"|"info"} [type]
     */
    show: function (title, message, type) {
      type = type || "success";
      var wrap = ensureToastWrap();
      var el = document.createElement("div");
      el.className = "toast toast--" + type;
      el.setAttribute("role", "status");
      var ic = type === "success" ? "checkCircle" : type === "error" ? "alert" : "info";
      el.innerHTML =
        '<span class="toast__icon">' + icon(ic, 22) + "</span>" +
        '<div class="toast__body"><strong></strong><span></span></div>' +
        '<button class="toast__close" type="button" aria-label="Dismiss">' + icon("close", 16) + "</button>";
      el.querySelector("strong").textContent = title;
      el.querySelector(".toast__body span").textContent = message || "";
      if (!message) el.querySelector(".toast__body span").remove();
      wrap.appendChild(el);

      var dismiss = function () {
        el.classList.add("is-out");
        setTimeout(function () {
          el.remove();
        }, 250);
      };
      el.querySelector(".toast__close").addEventListener("click", dismiss);
      setTimeout(dismiss, 4200);
      return el;
    },
  };

  /* ======================================================================
     6. MODAL SYSTEM
     ====================================================================== */
  var modalOverlay, modalContent;

  function ensureModal() {
    if (modalOverlay) return;
    modalOverlay = document.createElement("div");
    modalOverlay.className = "overlay";
    modalOverlay.id = "modalOverlay";
    modalOverlay.innerHTML = '<div class="modal" role="dialog" aria-modal="true" tabindex="-1"></div>';
    modalContent = modalOverlay.querySelector(".modal");
    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener("mousedown", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  var lastFocused = null;

  function openModal(opts) {
    ensureModal();
    opts = opts || {};
    lastFocused = document.activeElement;
    modalContent.className = "modal" + (opts.className ? " " + opts.className : "");
    modalContent.innerHTML = opts.html || "";
    modalOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (typeof opts.onOpen === "function") opts.onOpen(modalContent);
    var focusTarget =
      modalContent.querySelector("[data-autofocus]") ||
      modalContent.querySelector("input, select, textarea, button");
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ======================================================================
     7. SIDE DRAWER (wishlist)
     ====================================================================== */
  var drawer;

  function ensureDrawer() {
    if (drawer) return;
    drawer = document.createElement("div");
    drawer.className = "drawer";
    drawer.id = "wishlistDrawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Wishlist");
    document.body.appendChild(drawer);

    // Backdrop reuses the modal overlay styling but separate element.
    var back = document.createElement("div");
    back.className = "overlay";
    back.id = "drawerBackdrop";
    back.addEventListener("mousedown", closeDrawer);
    document.body.appendChild(back);
    drawer._backdrop = back;
  }

  function openDrawer(html) {
    ensureDrawer();
    drawer.innerHTML = html;
    drawer._backdrop.classList.add("is-open");
    drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer._backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ======================================================================
     8. BADGES
     ====================================================================== */
  function updateBadges() {
    var cartBadge = document.getElementById("cartBadge");
    var wishBadge = document.getElementById("wishlistBadge");
    if (cartBadge) {
      var cc = window.Store.cartCount();
      cartBadge.textContent = cc > 99 ? "99+" : String(cc);
      cartBadge.setAttribute("data-empty", cc === 0 ? "true" : "false");
    }
    if (wishBadge) {
      var wc = window.Store.getWishlist().length;
      wishBadge.textContent = String(wc);
      wishBadge.setAttribute("data-empty", wc === 0 ? "true" : "false");
    }
    // Refresh any wishlist heart buttons currently on screen.
    document.querySelectorAll("[data-wishlist]").forEach(function (btn) {
      var on = window.Store.isWishlisted(btn.getAttribute("data-wishlist"));
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ======================================================================
     9. PRODUCT CARD RENDERER
     ====================================================================== */
  function swatchSpans(product) {
    return product.colors
      .map(function (c) {
        return '<span class="swatch" style="background:' + (window.COLORS[c] || "#ccc") + '" title="' + safe(window.colorName(c)) + '"></span>';
      })
      .join("");
  }

  function productCardHTML(product, opts) {
    opts = opts || {};
    var wished = window.Store.isWishlisted(product.id);
    var tagHTML = product.tag
      ? '<span class="tag ' + (product.tag === "New" ? "tag--new" : product.tag === "Sale" ? "tag--sale" : "") + '">' + safe(product.tag) + "</span>"
      : "";
    var priceHTML =
      '<span class="price-now">' + window.Utils.formatINR(product.price) + "</span>" +
      (product.oldPrice ? '<span class="price-was">' + window.Utils.formatINR(product.oldPrice) + "</span>" : "");

    return (
      '<article class="product-card" data-product-id="' + product.id + '">' +
      '<div class="product-media">' +
      tagHTML +
      '<a href="designer.html" aria-label="Customise ' + safe(product.name) + '">' +
      '<img src="' + product.image + '" alt="' + safe(product.name) + ' mockup" loading="lazy">' +
      "</a>" +
      '<div class="product-actions-top">' +
      '<button class="action-circle' + (wished ? " is-active" : "") + '" type="button" data-wishlist="' + product.id + '" aria-label="Add ' + safe(product.name) + ' to wishlist" aria-pressed="' + wished + '">' + icon("heart", 18) + "</button>" +
      '<button class="action-circle" type="button" data-quickview="' + product.id + '" aria-label="Quick view ' + safe(product.name) + '">' + icon("eye", 18) + "</button>" +
      "</div>" +
      '<div class="quickview-bar"><button class="btn btn--outline" type="button" data-quickview="' + product.id + '">' + icon("eye", 16) + " Quick View</button></div>" +
      "</div>" +
      '<div class="product-body">' +
      '<span class="product-cat">' + safe(product.category) + "</span>" +
      '<h3 class="product-name"><a href="designer.html">' + safe(product.name) + "</a></h3>" +
      '<div class="product-swatches">' + swatchSpans(product) + "</div>" +
      '<div class="product-price">' + priceHTML + "</div>" +
      '<div class="product-sizes">Sizes: ' + safe(product.sizes.join(" \u00B7 ")) + "</div>" +
      '<div class="product-cta">' +
      '<button class="btn btn--ghost" type="button" data-add-cart="' + product.id + '">Add to Cart</button>' +
      '<a class="btn btn--primary" href="designer.html">Customize</a>' +
      "</div></div></article>"
    );
  }

  /** Inject product cards into a container element. */
  function renderProducts(container, list) {
    if (!container) return;
    container.innerHTML = list.map(function (p) {
      return productCardHTML(p);
    }).join("");
    updateBadges();
  }

  /* ======================================================================
     10. QUICK VIEW
     ====================================================================== */
  function openQuickView(id) {
    var p = window.getProduct(id);
    if (!p) {
      Toast.show("Product unavailable", "That product could not be found.", "error");
      return;
    }
    var sizes = p.sizes
      .map(function (s, i) {
        return (
          '<input type="radio" name="qvSize" id="qvSize' + i + '" value="' + s + '"' + (i === 0 ? " checked" : "") + ">" +
          '<label for="qvSize' + i + '">' + s + "</label>"
        );
      })
      .join("");
    var colors = p.colors
      .map(function (c, i) {
        return (
          '<input type="radio" name="qvColor" id="qvColor' + i + '" value="' + c + '"' + (i === 0 ? " checked" : "") + ">" +
          '<label for="qvColor' + i + '" style="background:' + (window.COLORS[c] || "#ccc") + '" title="' + safe(window.colorName(c)) + '"></label>'
        );
      })
      .join("");

    openModal({
      className: "modal--quickview",
      html:
        '<button class="icon-btn modal__close" type="button" data-modal-close aria-label="Close">' + icon("close") + "</button>" +
        '<div class="quickview">' +
        '<div class="quickview__media"><img src="' + p.image + '" alt="' + safe(p.name) + '"></div>' +
        '<div class="quickview__info">' +
        '<span class="product-cat">' + safe(p.category) + "</span>" +
        "<h2>" + safe(p.name) + "</h2>" +
        '<div class="quickview__price">' + window.Utils.formatINR(p.price) +
        (p.oldPrice ? ' <span class="price-was" style="font-size:1rem">' + window.Utils.formatINR(p.oldPrice) + "</span>" : "") +
        "</div>" +
        '<p class="mb-0">' + safe(p.description) + "</p>" +
        '<div class="mt-5"><span class="control-label" style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Select size</span><div class="segment" id="qvSizes">' + sizes + "</div></div>" +
        '<div class="mt-4"><span class="control-label" style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Select colour</span><div class="swatch-picker" id="qvColors">' + colors + "</div></div>" +
        '<div class="flex gap-3 mt-5">' +
        '<button class="btn btn--accent btn--lg" type="button" data-qv-add="' + p.id + '">' + icon("cart", 18) + " Add to Cart</button>" +
        '<a class="btn btn--outline btn--lg" href="designer.html">' + icon("palette", 18) + " Customize</a>" +
        "</div></div></div>",
      onOpen: function (modal) {
        modal.querySelector("[data-autofocus]");
        var addBtn = modal.querySelector("[data-qv-add]");
        addBtn.addEventListener("click", function () {
          var size = modal.querySelector('input[name="qvSize"]:checked').value;
          var color = modal.querySelector('input[name="qvColor"]:checked').value;
          addProductToCart(p.id, size, color, 1);
          closeModal();
        });
      },
    });
  }

  /* ======================================================================
     11. ADD TO CART (standard product)
     ====================================================================== */
  function addProductToCart(productId, size, color, qty) {
    var p = window.getProduct(productId);
    if (!p) {
      Toast.show("Product unavailable", "This product is no longer available.", "error");
      return;
    }
    size = size || p.sizes[Math.min(2, p.sizes.length - 1)] || p.sizes[0];
    color = color || p.colors[0];
    if (p.colors.indexOf(color) === -1) color = p.colors[0];
    if (p.sizes.indexOf(size) === -1) size = p.sizes[0];

    window.Store.addToCart({
      type: "standard",
      productId: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      color: color,
      size: size,
      qty: qty || 1,
    });
    updateBadges();
    Toast.show("Added to cart", p.name + " (" + size + ") is in your bag.", "success");
  }

  /* ======================================================================
     11b. CART PRICING (shared by cart.html and checkout.html)
     Totals are always recomputed from trusted product data, never from the
     stored line price, so a tampered LocalStorage value cannot change prices.
     ====================================================================== */
  function trustedUnitPrice(item) {
    if (!item) return 0;
    if (item.type === "custom") {
      var base = window.Pricing.customBase[item.custom && item.custom.fit] || 599;
      var fee = item.custom && item.custom.hasArtwork ? window.Pricing.artworkFee : 0;
      return base + fee;
    }
    var p = window.getProduct(item.productId);
    return p ? p.price : Number(item.price) || 0;
  }

  function cartTotals(cart, couponCode) {
    cart = Array.isArray(cart) ? cart : window.Store.getCart();
    var subtotal = cart.reduce(function (sum, item) {
      var qty = Math.max(1, parseInt(item.qty, 10) || 1);
      return sum + trustedUnitPrice(item) * qty;
    }, 0);

    var coupon = couponCode ? window.Pricing.coupons[String(couponCode).toUpperCase()] : null;
    var discount = coupon ? window.Utils.round2((subtotal * coupon.value) / 100) : 0;
    var delivery =
      subtotal === 0
        ? 0
        : subtotal - discount >= window.Pricing.freeDeliveryAbove
        ? 0
        : window.Pricing.deliveryFee;
    var total = Math.max(0, window.Utils.round2(subtotal - discount + delivery));
    return {
      subtotal: window.Utils.round2(subtotal),
      discount: discount,
      delivery: delivery,
      total: total,
      coupon: coupon,
      couponCode: coupon ? String(couponCode).toUpperCase() : null,
      itemCount: cart.reduce(function (n, i) {
        return n + (parseInt(i.qty, 10) || 0);
      }, 0),
    };
  }

  /* ======================================================================
     12. WISHLIST DRAWER
     ====================================================================== */
  function openWishlist() {
    var ids = window.Store.getWishlist();
    var items = ids
      .map(function (id) {
        return window.getProduct(id);
      })
      .filter(Boolean);

    var body;
    if (!items.length) {
      body =
        '<div class="empty"><div class="empty__icon">' + icon("heart", 44) + "</div>" +
        "<h3>Your wishlist is empty</h3>" +
        "<p>Tap the heart on any product to save it for later.</p>" +
        '<a class="btn btn--accent" href="products.html">Browse Products</a></div>';
    } else {
      body =
        '<ul style="display:flex;flex-direction:column;gap:16px">' +
        items
          .map(function (p) {
            return (
              '<li class="mini-cart-item">' +
              '<img src="' + p.image + '" alt="' + safe(p.name) + '">' +
              '<div class="meta"><b>' + safe(p.name) + "</b><span>" + window.Utils.formatINR(p.price) + "</span></div>" +
              '<button class="icon-btn" type="button" data-wish-item-add="' + p.id + '" aria-label="Add ' + safe(p.name) + ' to cart">' + icon("cart", 18) + "</button>" +
              '<button class="icon-btn" type="button" data-wish-item-remove="' + p.id + '" aria-label="Remove ' + safe(p.name) + ' from wishlist">' + icon("trash", 18) + "</button>" +
              "</li>"
            );
          })
          .join("") +
        "</ul>";
    }

    openDrawer(
      '<div class="drawer__head"><h3>Wishlist</h3>' +
      '<button class="icon-btn" type="button" data-close-drawer aria-label="Close wishlist">' + icon("close") + "</button></div>" +
      '<div class="drawer__body">' + body + "</div>" +
      (items.length
        ? '<div class="drawer__foot"><a class="btn btn--primary btn--block" href="products.html">Continue Shopping</a></div>'
        : "")
    );
  }

  /* ======================================================================
     13. SEARCH OVERLAY
     ====================================================================== */
  function openSearch() {
    openModal({
      className: "search-modal",
      html:
        '<div class="search-field">' + icon("search", 20) +
        '<label for="globalSearch" class="sr-only">Search products</label>' +
        '<input id="globalSearch" type="search" placeholder="Search T-shirts, categories\u2026" data-autofocus autocomplete="off">' +
        '<button class="icon-btn" type="button" data-modal-close aria-label="Close search">' + icon("close") + "</button></div>" +
        '<div class="search-results" id="searchResults"></div>',
      onOpen: function (modal) {
        var input = modal.querySelector("#globalSearch");
        var results = modal.querySelector("#searchResults");
        var run = function () {
          var q = input.value.trim().toLowerCase();
          if (!q) {
            results.innerHTML = '<p class="muted small" style="padding:12px 16px">Start typing to search the collection.</p>';
            return;
          }
          var hits = window.PRODUCTS.filter(function (p) {
            return (
              p.name.toLowerCase().indexOf(q) !== -1 ||
              p.category.toLowerCase().indexOf(q) !== -1
            );
          }).slice(0, 6);
          if (!hits.length) {
            results.innerHTML = '<p class="muted small" style="padding:12px 16px">No products match \u201C<span id="qEcho"></span>\u201D.</p>';
            results.querySelector("#qEcho").textContent = q;
            return;
          }
          results.innerHTML = hits
            .map(function (p) {
              return (
                '<button class="search-result" type="button" style="width:100%;text-align:left;background:none;border:none" data-search-open="' + p.id + '">' +
                '<img src="' + p.image + '" alt="">' +
                "<span><h4>" + safe(p.name) + "</h4><span class=\"small\">" + safe(p.category) + " \u00B7 " + window.Utils.formatINR(p.price) + "</span></span>" +
                '<span style="margin-left:auto;color:var(--c-faint)">' + icon("chevronRight", 18) + "</span></button>"
              );
            })
            .join("") +
            '<a class="btn btn--ghost btn--block mt-3" href="products.html?q=' + encodeURIComponent(q) + '">View all results</a>';
        };
        input.addEventListener("input", run);
        run();
      },
    });
  }

  /* ======================================================================
     14. NEWSLETTER + RESET + LEGAL / SOCIAL (demo behaviour)
     ====================================================================== */
  function handleNewsletter(form) {
    var input = form.querySelector('input[type="email"]');
    if (!input) return;
    var value = input.value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    if (!ok) {
      Toast.show("Invalid email", "Please enter a valid email address.", "error");
      input.focus();
      return;
    }
    var list = window.Store.read(window.Store.KEYS.newsletter, []);
    if (!Array.isArray(list)) list = [];
    if (list.indexOf(value) === -1) list.push(value);
    window.Store.write(window.Store.KEYS.newsletter, list);
    form.reset();
    Toast.show("You're subscribed!", "Thanks \u2014 you'll be the first to know about new drops.", "success");
  }

  function confirmReset() {
    openModal({
      className: "modal--sm",
      html:
        '<div class="modal__body">' +
        "<h2>Clear demo data?</h2>" +
        "<p>This removes your cart, wishlist, saved designs and order history from this browser. It cannot be undone.</p>" +
        '<div class="flex gap-3" style="justify-content:flex-end">' +
        '<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>' +
        '<button class="btn btn--danger" type="button" id="confirmReset">Clear Everything</button>' +
        "</div></div>",
      onOpen: function (modal) {
        modal.querySelector("#confirmReset").addEventListener("click", function () {
          window.Store.clearAll();
          updateBadges();
          closeModal();
          Toast.show("Demo data cleared", "All local data has been reset.", "info");
          setTimeout(function () {
            window.location.reload();
          }, 700);
        });
      },
    });
  }

  /* ======================================================================
     15. GLOBAL EVENT DELEGATION
     ====================================================================== */
  function onClick(e) {
    var t = e.target.closest("[data-add-cart],[data-wishlist],[data-quickview],[data-open-search],[data-open-wishlist],[data-open-mobile],[data-close-mobile],[data-modal-close],[data-close-drawer],[data-reset-data],[data-wish-item-add],[data-wish-item-remove],[data-search-open],[data-legal],[data-social],[data-faq]");
    if (!t) return;

    if (t.hasAttribute("data-add-cart")) {
      addProductToCart(t.getAttribute("data-add-cart"));
      return;
    }
    if (t.hasAttribute("data-wishlist")) {
      var id = t.getAttribute("data-wishlist");
      var added = window.Store.toggleWishlist(id);
      updateBadges();
      var p = window.getProduct(id);
      Toast.show(added ? "Saved to wishlist" : "Removed from wishlist", p ? p.name : "", added ? "success" : "info");
      return;
    }
    if (t.hasAttribute("data-quickview")) {
      openQuickView(t.getAttribute("data-quickview"));
      return;
    }
    if (t.hasAttribute("data-search-open")) {
      closeModal();
      openQuickView(t.getAttribute("data-search-open"));
      return;
    }
    if (t.hasAttribute("data-open-search")) {
      openSearch();
      return;
    }
    if (t.hasAttribute("data-open-wishlist")) {
      openWishlist();
      return;
    }
    if (t.hasAttribute("data-open-mobile")) {
      var mnav = document.getElementById("mobileNav");
      if (mnav) {
        mnav.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }
      return;
    }
    if (t.hasAttribute("data-close-mobile")) {
      var mnav2 = document.getElementById("mobileNav");
      if (mnav2) mnav2.classList.remove("is-open");
      document.body.style.overflow = "";
      return;
    }
    if (t.hasAttribute("data-modal-close")) {
      closeModal();
      return;
    }
    if (t.hasAttribute("data-close-drawer")) {
      closeDrawer();
      return;
    }
    if (t.hasAttribute("data-reset-data")) {
      e.preventDefault();
      confirmReset();
      return;
    }
    if (t.hasAttribute("data-wish-item-add")) {
      addProductToCart(t.getAttribute("data-wish-item-add"));
      return;
    }
    if (t.hasAttribute("data-wish-item-remove")) {
      var rid = t.getAttribute("data-wish-item-remove");
      window.Store.toggleWishlist(rid);
      updateBadges();
      openWishlist(); // re-render
      return;
    }
    if (t.hasAttribute("data-legal") || t.hasAttribute("data-social")) {
      e.preventDefault();
      var kind = t.getAttribute("data-legal") || t.getAttribute("data-social");
      Toast.show(
        "Demonstration link",
        "This " + kind + " page is a placeholder in this frontend-only demo.",
        "info"
      );
      return;
    }
    if (t.hasAttribute("data-faq")) {
      var item = t.closest(".faq__item");
      var panel = item.querySelector(".faq__a");
      var open = item.classList.toggle("is-open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      return;
    }
  }

  function onSubmit(e) {
    var form = e.target;
    if (form.classList && form.classList.contains("js-newsletter")) {
      e.preventDefault();
      handleNewsletter(form);
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      closeModal();
      closeDrawer();
      var mnav = document.getElementById("mobileNav");
      if (mnav) mnav.classList.remove("is-open");
      document.body.style.overflow = "";
    }
  }

  /* ======================================================================
     16. BOOT
     ====================================================================== */
  function boot() {
    var headerSlot = document.getElementById("site-header");
    var footerSlot = document.getElementById("site-footer");
    if (headerSlot) headerSlot.outerHTML = headerHTML();
    if (footerSlot) footerSlot.outerHTML = footerHTML();
    // Mobile nav panel
    if (headerSlot || document.querySelector(".site-header")) {
      var holder = document.createElement("div");
      holder.innerHTML = mobileNavHTML();
      document.body.appendChild(holder.firstChild);
    }
    ensureToastWrap();
    updateBadges();

    var head = document.querySelector(".site-header");
    if (head) {
      var onScroll = function () {
        if (window.scrollY > 8) head.classList.add("is-stuck");
        else head.classList.remove("is-stuck");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("keydown", onKeydown);

    // ---- Home page dynamic sections (only run when their slots exist) ----
    var trending = document.getElementById("trendingGrid");
    if (trending) renderProducts(trending, window.trendingProducts(8));

    var heroImg = document.getElementById("heroImage");
    if (heroImg && window.ILLUSTRATIONS) heroImg.src = window.ILLUSTRATIONS.hero;
    var aboutImg = document.getElementById("aboutImage");
    if (aboutImg && window.ILLUSTRATIONS) aboutImg.src = window.ILLUSTRATIONS.about;

    var catGrid = document.getElementById("categoryGrid");
    if (catGrid) {
      catGrid.innerHTML = window.CATEGORIES.map(function (c) {
        return (
          '<a class="category-card" href="products.html?category=' + c.slug + '">' +
          '<img src="' + c.image + '" alt="' + safe(c.name) + '" loading="lazy">' +
          '<span class="category-card__overlay"><h3>' + safe(c.name) + "</h3>" +
          "<span>Explore the collection</span></span></a>"
        );
      }).join("");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* Public API used by page scripts. */
  window.App = {
    icon: icon,
    Toast: Toast,
    show: Toast.show,
    openModal: openModal,
    closeModal: closeModal,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    updateBadges: updateBadges,
    productCardHTML: productCardHTML,
    renderProducts: renderProducts,
    addProductToCart: addProductToCart,
    openQuickView: openQuickView,
    cartTotals: cartTotals,
    trustedUnitPrice: trustedUnitPrice,
  };
  window.CartCalc = { totals: cartTotals, unitPrice: trustedUnitPrice };
  window.Toast = Toast;
})(window, document);
