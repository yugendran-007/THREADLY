/* ==========================================================================
   THREADLY — products.js
   Product catalog: search, category / colour / price filters, sorting,
   loading skeletons and an empty state.
   Depends on: storage.js, data.js, app.js
   ========================================================================== */
(function () {
  "use strict";

  var CATEGORY_SLUGS = {
    oversized: "Oversized T-Shirts",
    graphic: "Graphic T-Shirts",
    minimal: "Minimal T-Shirts",
    custom: "Custom Printed T-Shirts",
  };

  /* ---- Resolve DOM ---- */
  var grid, emptyState, resultCount, searchInput, sortSelect;
  var categoryWrap, colorWrap, minPrice, maxPrice, featuredOnly;
  var filterToggle, filtersPanel, clearFilters, emptyClear;

  /* ---- Filter state ---- */
  var state = {
    q: "",
    categories: [],
    colors: [],
    min: null,
    max: null,
    featuredOnly: false,
    sort: "featured",
  };

  /* ------------------------------------------------------------------ */
  function uniqueCategories() {
    return Object.keys(CATEGORY_SLUGS).map(function (slug) {
      return {
        slug: slug,
        name: CATEGORY_SLUGS[slug],
        count: window.PRODUCTS.filter(function (p) {
          return p.category === CATEGORY_SLUGS[slug];
        }).length,
      };
    });
  }

  function uniqueColors() {
    var seen = {};
    window.PRODUCTS.forEach(function (p) {
      p.colors.forEach(function (c) {
        seen[c] = (seen[c] || 0) + 1;
      });
    });
    return Object.keys(seen).map(function (c) {
      return { key: c, name: window.colorName(c), count: seen[c] };
    });
  }

  function buildFilters() {
    categoryWrap.innerHTML = uniqueCategories()
      .map(function (c) {
        return (
          '<label><input type="checkbox" value="' + c.slug + '" data-cat>' +
          "<span>" + window.Utils.escapeHTML(c.name) + '</span><span class="count">' + c.count + "</span></label>"
        );
      })
      .join("");

    colorWrap.innerHTML = uniqueColors()
      .map(function (c) {
        return (
          '<label><input type="checkbox" value="' + c.key + '" data-color>' +
          '<span style="display:inline-flex;align-items:center;gap:8px"><span class="swatch" style="background:' +
          (window.COLORS[c.key] || "#ccc") +
          '"></span>' + window.Utils.escapeHTML(c.name) + '</span><span class="count">' + c.count + "</span></label>"
        );
      })
      .join("");
  }

  /* ------------------------------------------------------------------ */
  function applyFilters() {
    var q = state.q.trim().toLowerCase();
    var list = window.PRODUCTS.filter(function (p) {
      if (q && p.name.toLowerCase().indexOf(q) === -1 && p.category.toLowerCase().indexOf(q) === -1) return false;
      if (state.categories.length) {
        var catName = p.category;
        var matched = state.categories.some(function (slug) {
          return CATEGORY_SLUGS[slug] === catName;
        });
        if (!matched) return false;
      }
      if (state.colors.length) {
        var hasColor = p.colors.some(function (c) {
          return state.colors.indexOf(c) !== -1;
        });
        if (!hasColor) return false;
      }
      if (state.min != null && p.price < state.min) return false;
      if (state.max != null && p.price > state.max) return false;
      if (state.featuredOnly && !p.featured) return false;
      return true;
    });

    switch (state.sort) {
      case "price-asc":
        list.sort(function (a, b) { return a.price - b.price; });
        break;
      case "price-desc":
        list.sort(function (a, b) { return b.price - a.price; });
        break;
      case "newest":
        list.sort(function (a, b) { return b.createdAt - a.createdAt; });
        break;
      case "name":
        list.sort(function (a, b) { return a.name.localeCompare(b.name); });
        break;
      default:
        list.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    }
    return list;
  }

  function render() {
    var list = applyFilters();
    window.App.renderProducts(grid, list);
    grid.setAttribute("aria-busy", "false");

    resultCount.innerHTML =
      "<b>" + list.length + "</b> " + (list.length === 1 ? "product" : "products");

    if (list.length === 0) {
      grid.classList.add("hidden");
      emptyState.classList.remove("hidden");
    } else {
      grid.classList.remove("hidden");
      emptyState.classList.add("hidden");
    }
  }

  function renderSkeleton() {
    var card =
      '<div class="product-card" aria-hidden="true">' +
      '<div class="product-media skeleton"></div>' +
      '<div class="product-body"><div class="skeleton" style="height:12px;width:40%"></div>' +
      '<div class="skeleton" style="height:16px;width:80%"></div>' +
      '<div class="skeleton" style="height:14px;width:30%"></div>' +
      '<div class="skeleton" style="height:38px;width:100%;border-radius:999px"></div></div></div>';
    grid.innerHTML = new Array(8).join(card) + card;
  }

  /* ------------------------------------------------------------------ */
  function readURL() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) {
      state.q = q;
      searchInput.value = q;
    }
    var cat = params.get("category");
    if (cat) {
      var slug = cat.toLowerCase();
      // Accept both slug ("oversized") and full name.
      var found = Object.keys(CATEGORY_SLUGS).find(function (s) {
        return s === slug || CATEGORY_SLUGS[s].toLowerCase() === slug;
      });
      if (found) {
        state.categories.push(found);
        var box = categoryWrap.querySelector('input[value="' + found + '"]');
        if (box) box.checked = true;
      }
    }
  }

  function readForm() {
    state.q = searchInput.value;
    state.sort = sortSelect.value;
    state.categories = Array.prototype.slice
      .call(categoryWrap.querySelectorAll("input[data-cat]:checked"))
      .map(function (i) { return i.value; });
    state.colors = Array.prototype.slice
      .call(colorWrap.querySelectorAll("input[data-color]:checked"))
      .map(function (i) { return i.value; });
    var mn = parseInt(minPrice.value, 10);
    var mx = parseInt(maxPrice.value, 10);
    state.min = isFinite(mn) && mn > 0 ? mn : null;
    state.max = isFinite(mx) && mx > 0 ? mx : null;
    state.featuredOnly = featuredOnly.checked;
  }

  function resetAll() {
    searchInput.value = "";
    sortSelect.value = "featured";
    minPrice.value = "";
    maxPrice.value = "";
    featuredOnly.checked = false;
    categoryWrap.querySelectorAll("input").forEach(function (i) { i.checked = false; });
    colorWrap.querySelectorAll("input").forEach(function (i) { i.checked = false; });
    state = { q: "", categories: [], colors: [], min: null, max: null, featuredOnly: false, sort: "featured" };
    render();
  }

  function init() {
    grid = document.getElementById("productGrid");
    emptyState = document.getElementById("emptyState");
    resultCount = document.getElementById("resultCount");
    searchInput = document.getElementById("searchInput");
    sortSelect = document.getElementById("sortSelect");
    categoryWrap = document.getElementById("categoryFilters");
    colorWrap = document.getElementById("colorFilters");
    minPrice = document.getElementById("minPrice");
    maxPrice = document.getElementById("maxPrice");
    featuredOnly = document.getElementById("featuredOnly");
    filterToggle = document.getElementById("filterToggle");
    filtersPanel = document.getElementById("filters");
    clearFilters = document.getElementById("clearFilters");
    emptyClear = document.getElementById("emptyClear");

    if (!grid) return; // Not on the catalog page.

    buildFilters();
    readURL();
    renderSkeleton();

    // Small delay so the loading skeleton is visible (demonstrates loading UX).
    setTimeout(function () {
      readForm();
      render();
    }, 420);

    searchInput.addEventListener("input", window.Utils.debounce(function () {
      readForm();
      render();
    }, 220));

    sortSelect.addEventListener("change", function () {
      readForm();
      render();
    });

    categoryWrap.addEventListener("change", function () { readForm(); render(); });
    colorWrap.addEventListener("change", function () { readForm(); render(); });
    featuredOnly.addEventListener("change", function () { readForm(); render(); });
    minPrice.addEventListener("input", window.Utils.debounce(function () { readForm(); render(); }, 350));
    maxPrice.addEventListener("input", window.Utils.debounce(function () { readForm(); render(); }, 350));

    clearFilters.addEventListener("click", resetAll);
    emptyClear.addEventListener("click", resetAll);

    filterToggle.addEventListener("click", function () {
      var open = filtersPanel.classList.toggle("is-open");
      filterToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
