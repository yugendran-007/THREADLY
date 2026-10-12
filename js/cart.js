/* ==========================================================================
   THREADLY — cart.js
   Shopping bag: line items, quantity control, removal, discount codes and
   live totals. Cart is persisted in LocalStorage.
   Depends on: storage.js, data.js, app.js
   ========================================================================== */
(function () {
  "use strict";

  var listEl, emptyEl, actionsEl, discountFormEl, appliedEl, discountTextEl;
  var couponHint, couponInput, subtotalEl, discountEl, deliveryEl, totalEl;
  var checkoutBtn, clearBtn, deliveryNote;

  var fmt = window.Utils.formatINR;
  var esc = window.Utils.escapeHTML;

  /* ------------------------------------------------------------------ */
  function currentCoupon() {
    return window.Store.getPref("coupon", null);
  }
  function setCoupon(code) {
    window.Store.setPref("coupon", code);
  }

  function metaChips(item) {
    var chips = [];
    var colorHex, colorLabel, size;
    if (item.type === "custom") {
      colorHex = item.custom.shirtColor;
      colorLabel = item.custom.shirtColorName || window.colorName(colorHex);
      size = item.custom.size || item.size;
    } else {
      colorHex = window.COLORS[item.color] || "#ccc";
      colorLabel = window.colorName(item.color);
      size = item.size;
    }
    chips.push(
      '<span class="pill"><span class="swatch" style="background:' + colorHex + ';box-shadow:none"></span>' + esc(colorLabel) + "</span>"
    );
    chips.push('<span class="pill">Size ' + esc(size) + "</span>");
    if (item.type === "custom") {
      chips.push('<span class="pill pill--accent">Custom design</span>');
      if (item.custom && item.custom.text && item.custom.text.value) {
        chips.push('<span class="pill">“' + esc(item.custom.text.value) + '”</span>');
      }
      if (item.custom && item.custom.hasArtwork) {
        chips.push('<span class="pill">Artwork</span>');
      }
    }
    return chips.join("");
  }

  function itemHTML(item) {
    var unit = window.CartCalc.unitPrice(item);
    var missing = item.type !== "custom" && !window.getProduct(item.productId);
    var img = item.image || "";
    var name = missing ? item.name + " (unavailable)" : item.name;
    return (
      '<article class="cart-item" data-line="' + esc(item.lineId) + '">' +
      '<div class="cart-item__media">' +
      (img ? '<img src="' + img + '" alt="' + esc(item.name) + '">' : "") +
      "</div>" +
      '<div class="cart-item__info">' +
      "<h3>" + esc(name) + "</h3>" +
      '<div class="cart-item__meta">' + metaChips(item) + "</div>" +
      '<div class="cart-item__price">' + fmt(unit) + ' <span class="small muted">each</span></div>' +
      (missing ? '<p class="small" style="color:var(--c-danger);margin:6px 0 0">This product is no longer available.</p>' : "") +
      "</div>" +
      '<div class="cart-item__controls">' +
      '<div class="qty-stepper">' +
      '<button type="button" data-act="dec" aria-label="Decrease quantity of ' + esc(item.name) + '">&minus;</button>' +
      '<input type="number" min="1" max="99" value="' + (parseInt(item.qty, 10) || 1) + '" data-act="set" aria-label="Quantity of ' + esc(item.name) + '">' +
      '<button type="button" data-act="inc" aria-label="Increase quantity of ' + esc(item.name) + '">+</button>' +
      "</div>" +
      '<div class="text-right">' +
      '<div class="cart-item__price">' + fmt(unit * (parseInt(item.qty, 10) || 1)) + "</div>" +
      '<button class="link-remove" type="button" data-act="remove">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>' +
      "Remove</button>" +
      "</div></div></article>"
    );
  }

  /* ------------------------------------------------------------------ */
  function render() {
    var cart = window.Store.getCart();
    var hasItems = cart.length > 0;

    emptyEl.classList.toggle("hidden", hasItems);
    actionsEl.classList.toggle("hidden", !hasItems);
    document.getElementById("cartLayout").style.display = hasItems ? "" : "grid";

    if (hasItems) {
      listEl.innerHTML = cart.map(itemHTML).join("");
    } else {
      listEl.innerHTML = "";
    }

    var coupon = currentCoupon();
    var t = window.CartCalc.totals(cart, coupon);

    subtotalEl.textContent = fmt(t.subtotal);
    discountEl.textContent = "−" + fmt(t.discount);
    deliveryEl.textContent = t.delivery === 0 ? (t.subtotal > 0 ? "FREE" : fmt(0)) : fmt(t.delivery);
    totalEl.textContent = fmt(t.total);

    // Coupon UI
    if (t.coupon) {
      discountFormEl.classList.add("hidden");
      appliedEl.classList.remove("hidden");
      couponHint.classList.add("hidden");
      discountTextEl.textContent = t.couponCode + " applied · " + t.coupon.label;
    } else {
      discountFormEl.classList.remove("hidden");
      appliedEl.classList.add("hidden");
      couponHint.classList.remove("hidden");
    }

    // Free-delivery nudge
    if (t.subtotal > 0 && t.delivery > 0) {
      var remaining = window.Pricing.freeDeliveryAbove - t.subtotal;
      deliveryNote.textContent = "Add " + fmt(remaining) + " more to unlock free delivery.";
    } else if (t.subtotal > 0) {
      deliveryNote.textContent = "You've unlocked free delivery!";
    } else {
      deliveryNote.textContent = "";
    }

    checkoutBtn.disabled = !hasItems;
    checkoutBtn.classList.toggle("is-disabled", !hasItems);

    window.App.updateBadges();
  }

  /* ------------------------------------------------------------------ */
  function applyCoupon() {
    var code = couponInput.value.trim().toUpperCase();
    if (!code) {
      window.Toast.show("Enter a code", "Please type a discount code first.", "error");
      return;
    }
    if (!window.Pricing.coupons[code]) {
      window.Toast.show("Invalid code", "“" + code + "” is not a valid discount code.", "error");
      return;
    }
    setCoupon(code);
    couponInput.value = "";
    render();
    window.Toast.show("Code applied", code + " · " + window.Pricing.coupons[code].label, "success");
  }

  function removeCoupon() {
    setCoupon(null);
    render();
    window.Toast.show("Code removed", "Your discount was removed.", "info");
  }

  /* ------------------------------------------------------------------ */
  function onListClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var row = e.target.closest("[data-line]");
    if (!row) return;
    var lineId = row.getAttribute("data-line");
    var cart = window.Store.getCart();
    var item = cart.find(function (l) { return l.lineId === lineId; });
    if (!item) return;
    var act = btn.getAttribute("data-act");

    if (act === "inc") {
      window.Store.updateQty(lineId, (parseInt(item.qty, 10) || 1) + 1);
      render();
    } else if (act === "dec") {
      window.Store.updateQty(lineId, (parseInt(item.qty, 10) || 1) - 1);
      render();
    } else if (act === "remove") {
      window.Store.removeCartLine(lineId);
      render();
      window.Toast.show("Item removed", item.name + " was removed from your bag.", "info");
    }
  }

  function onListChange(e) {
    var input = e.target.closest('input[data-act="set"]');
    if (!input) return;
    var row = e.target.closest("[data-line]");
    var lineId = row.getAttribute("data-line");
    window.Store.updateQty(lineId, input.value);
    render();
  }

  function clearCart() {
    window.App.openModal({
      className: "modal--sm",
      html:
        '<div class="modal__body"><h2>Clear your bag?</h2>' +
        "<p>All items will be removed. This cannot be undone.</p>" +
        '<div class="flex gap-3" style="justify-content:flex-end">' +
        '<button class="btn btn--ghost" type="button" data-modal-close>Keep Items</button>' +
        '<button class="btn btn--danger" type="button" id="confirmClear">Clear Bag</button></div></div>',
      onOpen: function (modal) {
        modal.querySelector("#confirmClear").addEventListener("click", function () {
          window.Store.clearCart();
          window.App.closeModal();
          render();
          window.Toast.show("Bag cleared", "Your shopping bag is now empty.", "info");
        });
      },
    });
  }

  /* ------------------------------------------------------------------ */
  function init() {
    listEl = document.getElementById("cartList");
    if (!listEl) return;

    emptyEl = document.getElementById("cartEmpty");
    actionsEl = document.getElementById("cartActions");
    discountFormEl = document.getElementById("discountForm");
    appliedEl = document.getElementById("discountApplied");
    discountTextEl = document.getElementById("discountText");
    couponHint = document.getElementById("couponHint");
    couponInput = document.getElementById("couponInput");
    subtotalEl = document.getElementById("sumSubtotal");
    discountEl = document.getElementById("sumDiscount");
    deliveryEl = document.getElementById("sumDelivery");
    totalEl = document.getElementById("sumTotal");
    checkoutBtn = document.getElementById("checkoutBtn");
    clearBtn = document.getElementById("clearCart");
    deliveryNote = document.getElementById("deliveryNote");

    listEl.addEventListener("click", onListClick);
    listEl.addEventListener("change", onListChange);
    document.getElementById("applyCoupon").addEventListener("click", applyCoupon);
    document.getElementById("removeCoupon").addEventListener("click", removeCoupon);
    couponInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") applyCoupon();
    });
    clearBtn.addEventListener("click", clearCart);
    checkoutBtn.addEventListener("click", function () {
      if (window.Store.getCart().length === 0) return;
      window.location.href = "checkout.html";
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
