/* ==========================================================================
   THREADLY — storage.js
   Shared LocalStorage utilities + small generic helpers.
   Loaded FIRST on every page (before data.js and app.js).
   --------------------------------------------------------------------------
   NOTE: LocalStorage is used here only as a browser demo store. It is NOT a
   secure production database and must never hold real payment credentials.
   ========================================================================== */
(function (window) {
  "use strict";

  /* ----------------------------------------------------------------------
     Keys — each feature keeps its own key so data never collides.
     ---------------------------------------------------------------------- */
  var KEYS = {
    cart: "threadly_cart",
    wishlist: "threadly_wishlist",
    orders: "threadly_orders",
    designs: "threadly_designs",
    prefs: "threadly_prefs",
    newsletter: "threadly_newsletter",
    messages: "threadly_messages",
  };

  /* ----------------------------------------------------------------------
     Low-level safe access. Every read validates JSON and falls back.
     ---------------------------------------------------------------------- */
  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
      // Corrupt JSON — reset the key so the app keeps working.
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
      return fallback;
    }
  }

  /**
   * Write a value to LocalStorage. Returns true on success.
   * Handles quota errors gracefully and reports them once.
   */
  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      var isQuota =
        err &&
        (err.name === "QuotaExceededError" ||
          err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
          err.code === 22);
      if (isQuota) {
        notifyQuota();
      } else {
        console.warn("Storage write failed for", key, err);
      }
      return false;
    }
  }

  var quotaWarned = false;
  function notifyQuota() {
    if (quotaWarned) return;
    quotaWarned = true;
    if (window.Toast && typeof window.Toast.show === "function") {
      window.Toast.show(
        "Storage is full",
        "Some changes could not be saved. Try clearing demo data from the footer.",
        "error"
      );
    } else {
      console.warn("LocalStorage quota exceeded.");
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }

  function isArray(v) {
    return Object.prototype.toString.call(v) === "[object Array]";
  }

  /* ----------------------------------------------------------------------
     Generic helpers used across the whole app.
     ---------------------------------------------------------------------- */
  var Utils = {
    /** Format a number as Indian Rupees, e.g. 1299 -> "₹1,299" */
    formatINR: function (value) {
      var n = Number(value);
      if (!isFinite(n)) n = 0;
      return (
        "\u20B9" +
        n.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })
      );
    },

    /** Round to 2 decimals to avoid floating point noise. */
    round2: function (n) {
      return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
    },

    /**
     * Escape a string for safe use inside innerHTML.
     * Prefer textContent, but this protects template strings too.
     */
    escapeHTML: function (str) {
      return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    /** Collision-resistant-enough unique id for demo data. */
    uid: function (prefix) {
      return (
        (prefix || "id") +
        "_" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
      );
    },

    /** Clamp a number between min and max (inclusive). */
    clamp: function (n, min, max) {
      n = Number(n);
      if (isNaN(n)) n = min;
      return Math.min(Math.max(n, min), max);
    },

    /** Debounce — delays fn until after wait ms of silence. */
    debounce: function (fn, wait) {
      var t;
      return function () {
        var ctx = this;
        var args = arguments;
        clearTimeout(t);
        t = setTimeout(function () {
          fn.apply(ctx, args);
        }, wait || 200);
      };
    },

    /** Format a timestamp as a readable date, e.g. "12 Oct 2026, 4:05 PM". */
    formatDate: function (ts) {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    /** Short date only, e.g. "12 Oct 2026". */
    formatDateShort: function (ts) {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
  };

  /* ----------------------------------------------------------------------
     Domain shortcuts — cart, wishlist, orders, designs, prefs.
     ---------------------------------------------------------------------- */
  var Store = {
    KEYS: KEYS,
    read: read,
    write: write,
    remove: remove,

    /* ---- Cart ---- */
    getCart: function () {
      var cart = read(KEYS.cart, []);
      return isArray(cart) ? cart : [];
    },
    setCart: function (cart) {
      return write(KEYS.cart, isArray(cart) ? cart : []);
    },
    cartCount: function () {
      return Store.getCart().reduce(function (sum, item) {
        var q = parseInt(item && item.qty, 10);
        return sum + (isFinite(q) && q > 0 ? q : 0);
      }, 0);
    },
    addToCart: function (item) {
      var cart = Store.getCart();
      // Merge identical configuration lines; custom designs always stay unique.
      if (item && item.type !== "custom") {
        var match = cart.find(function (line) {
          return (
            line.type !== "custom" &&
            line.productId === item.productId &&
            line.color === item.color &&
            line.size === item.size
          );
        });
        if (match) {
          match.qty = Utils.clamp((parseInt(match.qty, 10) || 1) + (parseInt(item.qty, 10) || 1), 1, 99);
          Store.setCart(cart);
          return match;
        }
      }
      item.lineId = item.lineId || Utils.uid("line");
      item.qty = Utils.clamp(parseInt(item.qty, 10) || 1, 1, 99);
      cart.push(item);
      Store.setCart(cart);
      return item;
    },
    removeCartLine: function (lineId) {
      var cart = Store.getCart().filter(function (l) {
        return l.lineId !== lineId;
      });
      Store.setCart(cart);
      return cart;
    },
    updateQty: function (lineId, qty) {
      var cart = Store.getCart();
      cart.forEach(function (l) {
        if (l.lineId === lineId) {
          l.qty = Utils.clamp(parseInt(qty, 10) || 1, 1, 99);
        }
      });
      Store.setCart(cart);
      return cart;
    },
    clearCart: function () {
      Store.setCart([]);
    },

    /* ---- Wishlist (array of product ids) ---- */
    getWishlist: function () {
      var list = read(KEYS.wishlist, []);
      return isArray(list) ? list.filter(function (x) { return typeof x === "string"; }) : [];
    },
    setWishlist: function (list) {
      return write(KEYS.wishlist, isArray(list) ? list : []);
    },
    isWishlisted: function (id) {
      return Store.getWishlist().indexOf(id) !== -1;
    },
    toggleWishlist: function (id) {
      var list = Store.getWishlist();
      var i = list.indexOf(id);
      if (i === -1) {
        list.push(id);
        Store.setWishlist(list);
        return true;
      }
      list.splice(i, 1);
      Store.setWishlist(list);
      return false;
    },

    /* ---- Orders ---- */
    getOrders: function () {
      var orders = read(KEYS.orders, []);
      return isArray(orders) ? orders : [];
    },
    setOrders: function (orders) {
      return write(KEYS.orders, isArray(orders) ? orders : []);
    },
    addOrder: function (order) {
      var orders = Store.getOrders();
      orders.unshift(order);
      Store.setOrders(orders);
      return order;
    },
    getOrder: function (orderId) {
      return Store.getOrders().find(function (o) {
        return o.id === orderId;
      });
    },
    updateOrder: function (orderId, patch) {
      var orders = Store.getOrders();
      var updated = null;
      orders = orders.map(function (o) {
        if (o.id === orderId) {
          updated = Object.assign({}, o, patch);
          return updated;
        }
        return o;
      });
      Store.setOrders(orders);
      return updated;
    },

    /* ---- Saved designs ---- */
    getDesigns: function () {
      var d = read(KEYS.designs, []);
      return isArray(d) ? d : [];
    },
    saveDesign: function (design) {
      var list = Store.getDesigns();
      list.unshift(design);
      list = list.slice(0, 20); // keep the store small
      Store.write(KEYS.designs, list);
      return design;
    },

    /* ---- Preferences (demo toggles: motion, last fit, discount) ---- */
    getPrefs: function () {
      var p = read(KEYS.prefs, {});
      return p && typeof p === "object" && !isArray(p) ? p : {};
    },
    setPref: function (key, value) {
      var p = Store.getPrefs();
      p[key] = value;
      Store.write(KEYS.prefs, p);
      return p;
    },
    getPref: function (key, fallback) {
      var p = Store.getPrefs();
      return Object.prototype.hasOwnProperty.call(p, key) ? p[key] : fallback;
    },

    /* ---- Contact messages (demo only) ---- */
    getMessages: function () {
      var m = read(KEYS.messages, []);
      return isArray(m) ? m : [];
    },
    addMessage: function (msg) {
      var list = Store.getMessages();
      list.unshift(msg);
      Store.write(KEYS.messages, list);
      return msg;
    },

    /* ---- Clear ALL demo data (used by the footer reset button) ---- */
    clearAll: function () {
      Object.keys(KEYS).forEach(function (k) {
        remove(KEYS[k]);
      });
    },
  };

  // Expose to the global scope for the plain <script> files.
  window.Store = Store;
  window.Utils = Utils;
})(window);
