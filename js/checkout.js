/* ==========================================================================
   THREADLY — checkout.js
   Client-side validated checkout form. On success it creates an order,
   stores it in LocalStorage as "Order Placed", clears the cart and sends
   the customer to the order tracking page.
   No real payment is processed — this is a front-end demonstration.
   ========================================================================== */
(function () {
  "use strict";

  var form, miniCartEl, subtotalEl, discountEl, deliveryEl, totalEl, placeBtn, saveInfo;
  var esc = window.Utils.escapeHTML;
  var fmt = window.Utils.formatINR;

  /* ---- Validation rules (each returns true when the value is valid) ---- */
  var RULES = {
    fullName: function (v) {
      return /^[A-Za-z][A-Za-z .'-]{2,}$/.test(v.trim());
    },
    mobile: function (v) {
      return /^[6-9]\d{9}$/.test(v.trim());
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    },
    address: function (v) {
      return v.trim().length >= 10;
    },
    city: function (v) {
      return v.trim().length >= 2;
    },
    state: function (v) {
      return v.trim().length >= 2;
    },
    pincode: function (v) {
      return /^\d{6}$/.test(v.trim());
    },
  };

  function fieldWrapper(name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function validateField(name) {
    var input = form.elements[name];
    var wrap = fieldWrapper(name);
    if (!input || !wrap) return true;
    var ok = RULES[name] ? RULES[name](input.value) : true;
    wrap.classList.toggle("has-error", !ok);
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  function validateAll() {
    var firstBad = null;
    Object.keys(RULES).forEach(function (name) {
      var ok = validateField(name);
      if (!ok && !firstBad) firstBad = form.elements[name];
    });
    return firstBad;
  }

  /* ------------------------------------------------------------------ */
  function renderSummary() {
    var cart = window.Store.getCart();
    var coupon = window.Store.getPref("coupon", null);
    var t = window.CartCalc.totals(cart, coupon);

    if (cart.length === 0) {
      miniCartEl.innerHTML = '<p class="muted small">Your bag is empty.</p>';
      placeBtn.disabled = true;
      placeBtn.classList.add("is-disabled");
      subtotalEl.textContent = fmt(0);
      discountEl.textContent = "−" + fmt(0);
      deliveryEl.textContent = fmt(0);
      totalEl.textContent = fmt(0);
      return;
    }

    miniCartEl.innerHTML = cart
      .map(function (item) {
        var unit = window.CartCalc.unitPrice(item);
        var variant = item.type === "custom"
          ? (item.custom.shirtColorName || "") + " · Size " + item.custom.size
          : window.colorName(item.color) + " · Size " + item.size;
        return (
          '<div class="mini-cart-item">' +
          (item.image ? '<img src="' + item.image + '" alt="' + esc(item.name) + '">' : "") +
          '<div class="meta"><b>' + esc(item.name) + "</b><span>" + esc(variant) + " · Qty " + (parseInt(item.qty, 10) || 1) + "</span></div>" +
          '<span class="price">' + fmt(unit * (parseInt(item.qty, 10) || 1)) + "</span>" +
          "</div>"
        );
      })
      .join("");

    subtotalEl.textContent = fmt(t.subtotal);
    discountEl.textContent = "−" + fmt(t.discount);
    deliveryEl.textContent = t.delivery === 0 ? "FREE" : fmt(t.delivery);
    totalEl.textContent = fmt(t.total);
    placeBtn.disabled = false;
    placeBtn.classList.remove("is-disabled");
  }

  /* ------------------------------------------------------------------ */
  function orderId() {
    var stamp = Date.now().toString(36).toUpperCase().slice(-5);
    var rand = Math.random().toString(36).toUpperCase().slice(2, 4);
    return "THR-" + stamp + rand;
  }

  function placeOrder(e) {
    e.preventDefault();

    if (window.Store.getCart().length === 0) {
      window.Toast.show("Your bag is empty", "Add something before checking out.", "error");
      return;
    }

    var firstBad = validateAll();
    if (firstBad) {
      firstBad.focus();
      window.Toast.show("Please check the form", "Some fields need your attention.", "error");
      return;
    }

    var payment = form.querySelector('input[name="payment"]:checked').value;
    var cart = window.Store.getCart();
    var coupon = window.Store.getPref("coupon", null);
    var t = window.CartCalc.totals(cart, coupon);

    var customer = {
      name: form.elements.fullName.value.trim(),
      email: form.elements.email.value.trim(),
      mobile: form.elements.mobile.value.trim(),
      address: form.elements.address.value.trim(),
      city: form.elements.city.value.trim(),
      state: form.elements.state.value.trim(),
      pincode: form.elements.pincode.value.trim(),
    };

    // Snapshot line items with trusted unit prices.
    var items = cart.map(function (item) {
      return {
        type: item.type,
        productId: item.productId,
        name: item.name,
        unitPrice: window.CartCalc.unitPrice(item),
        qty: Math.max(1, parseInt(item.qty, 10) || 1),
        color: item.type === "custom" ? item.custom.shirtColor : item.color,
        colorName: item.type === "custom" ? item.custom.shirtColorName : window.colorName(item.color),
        size: item.type === "custom" ? item.custom.size : item.size,
        image: item.image || "",
        custom: item.type === "custom"
          ? {
              fitLabel: item.custom.fitLabel,
              text: item.custom.text,
              hasArtwork: item.custom.hasArtwork,
              preview: item.custom.preview,
            }
          : null,
      };
    });

    var now = Date.now();
    var order = {
      id: orderId(),
      createdAt: now,
      statusIndex: 0,
      status: "Order Placed",
      timeline: [{ status: "Order Placed", at: now }],
      customer: customer,
      items: items,
      payment: payment,
      couponCode: t.couponCode,
      totals: {
        subtotal: t.subtotal,
        discount: t.discount,
        delivery: t.delivery,
        total: t.total,
      },
    };

    window.Store.addOrder(order);

    // Optionally remember the customer for next time (demo convenience).
    if (saveInfo && saveInfo.checked) {
      window.Store.setPref("customer", customer);
    }

    // Clear cart + coupon, then go to tracking.
    window.Store.clearCart();
    window.Store.setPref("coupon", null);
    window.App.updateBadges();

    // Brief loading feedback on the button, then redirect.
    placeBtn.classList.add("is-disabled");
    placeBtn.innerHTML = '<span class="spinner"></span> Placing order…';
    window.Toast.show("Order placed!", "Order " + order.id + " has been created.", "success");
    setTimeout(function () {
      window.location.href = "orders.html?new=" + encodeURIComponent(order.id);
    }, 900);
  }

  /* ------------------------------------------------------------------ */
  function prefill() {
    var saved = window.Store.getPref("customer", null);
    if (!saved) return;
    Object.keys(saved).forEach(function (k) {
      if (form.elements[k]) form.elements[k].value = saved[k];
    });
    if (saveInfo) saveInfo.checked = true;
  }

  function init() {
    form = document.getElementById("checkoutForm");
    if (!form) return;

    miniCartEl = document.getElementById("miniCart");
    subtotalEl = document.getElementById("sumSubtotal");
    discountEl = document.getElementById("sumDiscount");
    deliveryEl = document.getElementById("sumDelivery");
    totalEl = document.getElementById("sumTotal");
    placeBtn = document.getElementById("placeOrderBtn");
    saveInfo = document.getElementById("saveInfo");

    // Live validation: validate a field once it has been touched, then on change.
    Object.keys(RULES).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener("blur", function () {
        if (input.value.trim() !== "") validateField(name);
      });
      input.addEventListener("input", function () {
        if (fieldWrapper(name).classList.contains("has-error")) validateField(name);
      });
    });

    // Only digits for numeric-ish fields.
    ["mobile", "pincode"].forEach(function (n) {
      var input = form.elements[n];
      if (input) {
        input.addEventListener("input", function () {
          input.value = input.value.replace(/[^\d]/g, "").slice(0, n === "mobile" ? 10 : 6);
        });
      }
    });

    form.addEventListener("submit", placeOrder);
    prefill();
    renderSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
