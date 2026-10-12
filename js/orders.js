/* ==========================================================================
   THREADLY — orders.js
   Order history + progress tracker. Statuses are simulated locally and can
   be advanced with a demo button. Real courier tracking needs a backend.
   Depends on: storage.js, data.js, app.js
   ========================================================================== */
(function () {
  "use strict";

  var STATUSES = ["Order Placed", "Confirmed", "Printing", "Packed", "Shipped", "Delivered"];
  var esc = window.Utils.escapeHTML;
  var fmt = window.Utils.formatINR;
  var icon = window.App.icon;

  var listEl, emptyEl, bannerEl;

  /* ------------------------------------------------------------------ */
  function statusPill(order) {
    if (order.status === "Cancelled") return '<span class="pill pill--danger">Cancelled</span>';
    var cls = order.statusIndex >= STATUSES.length - 1 ? "pill--success" : "pill--accent";
    return '<span class="pill ' + cls + '">' + esc(order.status) + "</span>";
  }

  function trackerHTML(order) {
    var idx = order.status === "Cancelled" ? Math.max(0, order.statusIndex) : order.statusIndex;
    var steps = STATUSES.map(function (label, i) {
      var state = i < idx ? "is-done" : i === idx ? "is-current" : "";
      var inner = i < idx ? icon("check", 14) : '<span style="font-size:.72rem;font-weight:700">' + (i + 1) + "</span>";
      return (
        '<div class="tracker__step ' + state + '">' +
        '<span class="tracker__dot">' + inner + "</span>" +
        '<span class="tracker__label">' + esc(label) + "</span></div>"
      );
    }).join("");
    var pct = (Math.min(idx, STATUSES.length - 1) / (STATUSES.length - 1)) * 83.2;
    return (
      '<div class="tracker ' + (order.status === "Cancelled" ? "order-cancelled" : "") + '">' +
      '<span class="tracker__fill" style="width:' + pct + '%"></span>' +
      steps +
      "</div>"
    );
  }

  function thumbsHTML(order) {
    return (
      '<div class="order-thumbs">' +
      order.items
        .slice(0, 5)
        .map(function (it) {
          return it.image
            ? '<img src="' + it.image + '" alt="' + esc(it.name) + '" title="' + esc(it.name) + '">'
            : "";
        })
        .join("") +
      "</div>"
    );
  }

  function orderCardHTML(order) {
    var itemCount = order.items.reduce(function (n, i) {
      return n + (parseInt(i.qty, 10) || 1);
    }, 0);

    return (
      '<article class="order-card" data-order-id="' + esc(order.id) + '">' +
      '<div class="order-card__head">' +
      '<span class="oid">' + esc(order.id) + "</span>" +
      '<span class="odate">Placed ' + window.Utils.formatDate(order.createdAt) + "</span>" +
      '<span class="spacer"></span>' +
      statusPill(order) +
      "</div>" +
      '<div class="order-card__body">' +
      trackerHTML(order) +
      thumbsHTML(order) +
      '<div class="flex gap-3 wrap items-center" style="margin-bottom:16px">' +
      "<span class=\"small muted\">" + itemCount + " item" + (itemCount === 1 ? "" : "s") + " · " + esc(order.items.map(function (i) { return i.name; }).slice(0, 2).join(", ") + (order.items.length > 2 ? "…" : "")) + "</span>" +
      "</div>" +
      '<div class="order-total-line"><span>Order total (' + (order.payment === "online" ? "Demo online payment" : "Cash on Delivery") + ")</span><b>" + fmt(order.totals.total) + "</b></div>" +
      '<div class="flex gap-3 wrap mt-4">' +
      '<button class="btn btn--outline btn--sm" type="button" data-act="details">View Details</button>' +
      (order.status === "Cancelled" || order.statusIndex >= STATUSES.length - 1
        ? ""
        : '<button class="btn btn--primary btn--sm" type="button" data-act="advance">Advance Status (demo)</button>') +
      (order.status === "Cancelled" || order.statusIndex >= STATUSES.length - 1
        ? ""
        : '<button class="btn btn--danger btn--sm" type="button" data-act="cancel">Cancel Order</button>') +
      "</div></div></article>"
    );
  }

  /* ------------------------------------------------------------------ */
  function render() {
    var orders = window.Store.getOrders();
    var has = orders.length > 0;
    emptyEl.classList.toggle("hidden", has);
    listEl.innerHTML = has ? orders.map(orderCardHTML).join("") : "";
  }

  function showNewBanner() {
    var params = new URLSearchParams(window.location.search);
    var newId = params.get("new");
    if (!newId) return;
    var order = window.Store.getOrder(newId);
    if (!order) return;
    bannerEl.classList.remove("hidden");
    bannerEl.innerHTML =
      '<div class="checkout-section" style="border-color:var(--c-success);background:var(--c-success-soft);display:flex;gap:14px;align-items:flex-start;margin-bottom:24px">' +
      '<span style="color:var(--c-success);flex-shrink:0">' + icon("checkCircle", 28) + "</span>" +
      '<div><h3 style="margin:0 0 4px">Thank you, ' + esc(order.customer.name.split(" ")[0]) + "!</h3>" +
      '<p style="margin:0;color:var(--c-text)">Your order <b>' + esc(order.id) + "</b> was placed successfully. A confirmation would normally be emailed to " + esc(order.customer.email) + ".</p>" +
      "<p class='small' style='margin:6px 0 0;color:var(--c-muted)'>Payment status: " + (order.payment === "online" ? "Paid (demo)" : "Cash on Delivery") + " · Total " + fmt(order.totals.total) + "</p></div>" +
      '<button class="icon-btn" type="button" id="closeBanner" aria-label="Dismiss" style="margin-left:auto">' + icon("close") + "</button></div>";
    var close = document.getElementById("closeBanner");
    if (close) {
      close.addEventListener("click", function () {
        bannerEl.classList.add("hidden");
      });
    }
  }

  /* ------------------------------------------------------------------ */
  function advanceStatus(id) {
    var order = window.Store.getOrder(id);
    if (!order) return;
    if (order.status === "Cancelled") return;
    var next = order.statusIndex + 1;
    if (next >= STATUSES.length) {
      window.Toast.show("Already delivered", "This order has completed its journey.", "info");
      return;
    }
    var timeline = (order.timeline || []).concat([{ status: STATUSES[next], at: Date.now() }]);
    window.Store.updateOrder(id, {
      statusIndex: next,
      status: STATUSES[next],
      timeline: timeline,
    });
    render();
    window.Toast.show("Status updated", order.id + " → " + STATUSES[next] + " (demo)", "success");
  }

  function cancelOrder(id) {
    var order = window.Store.getOrder(id);
    if (!order) return;
    window.App.openModal({
      className: "modal--sm",
      html:
        '<div class="modal__body"><h2>Cancel this order?</h2>' +
        "<p>Order <b>" + esc(order.id) + "</b> will be marked as cancelled. This is a demo action.</p>" +
        '<div class="flex gap-3" style="justify-content:flex-end">' +
        '<button class="btn btn--ghost" type="button" data-modal-close>Keep Order</button>' +
        '<button class="btn btn--danger" type="button" id="confirmCancel">Cancel Order</button></div></div>',
      onOpen: function (modal) {
        modal.querySelector("#confirmCancel").addEventListener("click", function () {
          var timeline = (order.timeline || []).concat([{ status: "Cancelled", at: Date.now() }]);
          window.Store.updateOrder(id, { status: "Cancelled", timeline: timeline });
          window.App.closeModal();
          render();
          window.Toast.show("Order cancelled", order.id + " has been cancelled.", "info");
        });
      },
    });
  }

  function viewDetails(id) {
    var order = window.Store.getOrder(id);
    if (!order) return;

    var itemsHTML = order.items
      .map(function (it) {
        var extra = it.custom
          ? "<br><span class='small muted'>Custom: " + esc((it.custom.text && it.custom.text.value) || it.custom.fitLabel) + (it.custom.hasArtwork ? " · with artwork" : "") + "</span>"
          : "";
        return (
          '<div class="mini-cart-item" style="align-items:flex-start">' +
          (it.image ? '<img src="' + it.image + '" alt="' + esc(it.name) + '">' : "") +
          '<div class="meta"><b>' + esc(it.name) + "</b><span>" + esc(it.colorName || "") + " · Size " + esc(it.size) + " · Qty " + (parseInt(it.qty, 10) || 1) + "</span>" + extra + "</div>" +
          '<span class="price">' + fmt(it.unitPrice * (parseInt(it.qty, 10) || 1)) + "</span></div>"
        );
      })
      .join("");

    var timelineHTML = (order.timeline || [])
      .map(function (t) {
        return "<p style='margin:0 0 6px'><b>" + esc(t.status) + "</b> <span class='small muted'>· " + window.Utils.formatDate(t.at) + "</span></p>";
      })
      .join("");

    var c = order.customer;
    window.App.openModal({
      html:
        '<button class="icon-btn modal__close" type="button" data-modal-close aria-label="Close">' + icon("close") + "</button>" +
        '<div class="modal__body">' +
        '<span class="product-cat">Order details</span>' +
        "<h2>" + esc(order.id) + "</h2>" +
        "<p class='small muted'>Placed " + window.Utils.formatDate(order.createdAt) + " · " + esc(order.status) + "</p>" +
        "<h4 style='margin-top:18px'>Items</h4>" +
        '<div style="display:flex;flex-direction:column;gap:12px">' + itemsHTML + "</div>" +
        '<div class="divider"></div>' +
        '<div class="order-detail-grid">' +
        "<div><h4>Delivery address</h4><p>" + esc(c.name) + "</p><p>" + esc(c.address) + "</p><p>" + esc(c.city) + ", " + esc(c.state) + " — " + esc(c.pincode) + "</p><p>" + esc(c.mobile) + "</p><p>" + esc(c.email) + "</p></div>" +
        "<div><h4>Timeline</h4>" + timelineHTML + "</div>" +
        "</div>" +
        '<div class="divider"></div>' +
        '<div class="summary-row"><span>Subtotal</span><span>' + fmt(order.totals.subtotal) + "</span></div>" +
        (order.totals.discount > 0 ? '<div class="summary-row summary-row--discount"><span>Discount' + (order.couponCode ? " (" + esc(order.couponCode) + ")" : "") + "</span><span>−" + fmt(order.totals.discount) + "</span></div>" : "") +
        '<div class="summary-row"><span>Delivery</span><span>' + (order.totals.delivery === 0 ? "FREE" : fmt(order.totals.delivery)) + "</span></div>" +
        '<div class="summary-total"><span>Total</span><b>' + fmt(order.totals.total) + "</b></div>" +
        "</div>",
    });
  }

  /* ------------------------------------------------------------------ */
  function addSampleOrder() {
    var picks = window.PRODUCTS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 2);
    var items = picks.map(function (p) {
      return {
        type: "standard",
        productId: p.id,
        name: p.name,
        unitPrice: p.price,
        qty: 1,
        color: p.colors[0],
        colorName: window.colorName(p.colors[0]),
        size: "M",
        image: p.image,
        custom: null,
      };
    });
    var subtotal = items.reduce(function (s, i) { return s + i.unitPrice * i.qty; }, 0);
    var delivery = subtotal >= window.Pricing.freeDeliveryAbove ? 0 : window.Pricing.deliveryFee;
    var idx = 2;
    var now = Date.now();
    var order = {
      id: "THR-" + Date.now().toString(36).toUpperCase().slice(-5) + "SR",
      createdAt: now - 86400000,
      statusIndex: idx,
      status: STATUSES[idx],
      timeline: STATUSES.slice(0, idx + 1).map(function (s, i) {
        return { status: s, at: now - 86400000 + i * 7200000 };
      }),
      customer: { name: "Demo Customer", email: "demo@threadly.test", mobile: "9876543210", address: "12, MG Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
      items: items,
      payment: "cod",
      couponCode: null,
      totals: { subtotal: subtotal, discount: 0, delivery: delivery, total: subtotal + delivery },
    };
    window.Store.addOrder(order);
    render();
    window.Toast.show("Sample order added", "A demonstration order was created.", "info");
  }

  /* ------------------------------------------------------------------ */
  function onClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var card = e.target.closest("[data-order-id]");
    if (!card) return;
    var id = card.getAttribute("data-order-id");
    var act = btn.getAttribute("data-act");
    if (act === "advance") advanceStatus(id);
    else if (act === "cancel") cancelOrder(id);
    else if (act === "details") viewDetails(id);
  }

  function init() {
    listEl = document.getElementById("ordersList");
    if (!listEl) return;
    emptyEl = document.getElementById("ordersEmpty");
    bannerEl = document.getElementById("newOrderBanner");

    listEl.addEventListener("click", onClick);
    document.getElementById("addSampleOrder").addEventListener("click", addSampleOrder);

    showNewBanner();
    render();

    // Recompute nothing on resize: tracker widths use percentages, so they
    // scale automatically with the container. Good for responsive layouts.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
