/* ==========================================================================
   THREADLY — designer.js
   Interactive T-shirt design studio.
   • Canvas renders the shirt mockup + artwork + custom text.
   • Pointer-based dragging and corner resizing.
   • Undo / redo history, PNG export and add-to-cart integration.
   Depends on: storage.js, data.js, app.js
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Constants
     ---------------------------------------------------------------------- */
  var CANVAS_W = 400;
  var CANVAS_H = 520;

  // The area of the shirt where printing is allowed (chest region).
  var PA = { x: 118, y: 168, w: 164, h: 196 };

  var SHIRT_COLORS = [
    { name: "White", hex: "#ffffff" },
    { name: "Black", hex: "#1a1a1e" },
    { name: "Red", hex: "#e2403b" },
    { name: "Blue", hex: "#2f6fed" },
    { name: "Green", hex: "#2f9e63" },
    { name: "Yellow", hex: "#f2c33d" },
    { name: "Pink", hex: "#ef7bb0" },
    { name: "Purple", hex: "#7c5cff" },
  ];
  var SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  var FIT_LABELS = { regular: "Regular Fit", oversized: "Oversized Fit", polo: "Polo T-Shirt" };
  var MAX_FILE_BYTES = 5 * 1024 * 1024;
  var ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  /* ----------------------------------------------------------------------
     State
     ---------------------------------------------------------------------- */
  var design = {
    fit: "regular",
    shirtColor: SHIRT_COLORS[0].hex,
    size: "M",
    qty: 1,
    text: {
      value: "YOUR TEXT",
      font: "Poppins",
      size: 34,
      color: "#111111",
      bold: true,
      italic: false,
      align: "center",
      x: 200,
      y: 250,
      show: true,
    },
    art: {
      src: null,
      name: "",
      x: 160,
      y: 150,
      w: 80,
      h: 80,
      show: false,
    },
  };

  var selected = null; // "text" | "art" | null
  var artImage = null; // decoded Image for the uploaded artwork
  var teeImage = null; // decoded Image for the shirt mockup
  var teeReady = false;

  // Interaction flags
  var drag = null; // {kind, dx, dy}
  var resize = null; // {kind, start...}

  // History (undo / redo)
  var history = [];
  var hIndex = -1;

  /* ----------------------------------------------------------------------
     DOM references
     ---------------------------------------------------------------------- */
  var canvas, ctx, stage;
  var el = {};

  var icon = window.App.icon;
  var Toast = window.App.Toast;
  var fmt = window.Utils.formatINR;
  var clamp = window.Utils.clamp;

  /* ----------------------------------------------------------------------
     Serialisation helpers for undo / redo
     ---------------------------------------------------------------------- */
  function snapshot() {
    return JSON.stringify({
      fit: design.fit,
      shirtColor: design.shirtColor,
      size: design.size,
      qty: design.qty,
      text: design.text,
      art: design.art,
    });
  }

  function restore(json) {
    var s = JSON.parse(json);
    design.fit = s.fit;
    design.shirtColor = s.shirtColor;
    design.size = s.size;
    design.qty = s.qty;
    design.text = s.text;
    design.art = s.art;
    if (design.art.src) {
      var im = new Image();
      im.onload = render;
      im.src = design.art.src;
      artImage = im;
    } else {
      artImage = null;
    }
    selected = null;
    buildTee();
    syncControls();
    render();
  }

  /** Push the current state onto the undo stack. */
  function commit() {
    history = history.slice(0, hIndex + 1);
    history.push(snapshot());
    if (history.length > 30) history.shift();
    hIndex = history.length - 1;
    updateHistoryButtons();
  }

  function undo() {
    if (hIndex <= 0) return;
    hIndex--;
    restore(history[hIndex]);
    updateHistoryButtons();
    Toast.show("Undo", "Reverted the last change.", "info");
  }

  function redo() {
    if (hIndex >= history.length - 1) return;
    hIndex++;
    restore(history[hIndex]);
    updateHistoryButtons();
    Toast.show("Redo", "Re-applied the change.", "info");
  }

  function updateHistoryButtons() {
    if (el.undoBtn) el.undoBtn.disabled = hIndex <= 0;
    if (el.redoBtn) el.redoBtn.disabled = hIndex >= history.length - 1;
    if (el.undoBtn) el.undoBtn.style.opacity = hIndex <= 0 ? ".45" : "1";
    if (el.redoBtn) el.redoBtn.style.opacity = hIndex >= history.length - 1 ? ".45" : "1";
  }

  /* ----------------------------------------------------------------------
     Shirt mockup image
     ---------------------------------------------------------------------- */
  function buildTee() {
    teeReady = false;
    var url = window.SVG.toDataURL(
      window.SVG.tee({ color: design.shirtColor, fit: design.fit, bg: "#ffffff" })
    );
    var im = new Image();
    im.onload = function () {
      teeImage = im;
      teeReady = true;
      render();
    };
    im.onerror = function () {
      teeReady = false;
    };
    im.src = url;
  }

  /* ----------------------------------------------------------------------
     Text measurement (with simple word wrapping inside the printable area)
     ---------------------------------------------------------------------- */
  function fontString(size) {
    var t = design.text;
    return (t.italic ? "italic " : "") + (t.bold ? "700 " : "400 ") + size + "px \"" + t.font + "\", sans-serif";
  }

  function measureText() {
    var t = design.text;
    if (!t.show || !t.value) return null;
    ctx.font = fontString(t.size);
    var maxWidth = PA.w;
    var words = String(t.value).split(/\s+/);
    var lines = [];
    var current = "";
    words.forEach(function (w) {
      var test = current ? current + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);

    var lineHeight = t.size * 1.16;
    var width = 0;
    lines.forEach(function (l) {
      width = Math.max(width, ctx.measureText(l).width);
    });
    var height = lines.length * lineHeight;
    return { lines: lines, lineHeight: lineHeight, width: width, height: height };
  }

  function textBox() {
    var m = measureText();
    if (!m) return null;
    var t = design.text;
    var left;
    if (t.align === "left") left = t.x;
    else if (t.align === "right") left = t.x - m.width;
    else left = t.x - m.width / 2;
    return {
      x: left,
      y: t.y - m.height / 2,
      w: m.width,
      h: m.height,
      m: m,
    };
  }

  function artBox() {
    return { x: design.art.x, y: design.art.y, w: design.art.w, h: design.art.h };
  }

  /* ----------------------------------------------------------------------
     Main render
     ---------------------------------------------------------------------- */
  function render(opts) {
    opts = opts || {};
    var showGuides = opts.guides !== false;
    var showSel = opts.selection !== false;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (teeImage && teeReady) {
      ctx.drawImage(teeImage, 0, 0, CANVAS_W, CANVAS_H);
    }

    // Printable area boundary
    if (showGuides) {
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,90,31,0.55)";
      ctx.strokeRect(PA.x + 0.5, PA.y + 0.5, PA.w - 1, PA.h - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,90,31,0.85)";
      ctx.font = "600 10px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("PRINT AREA", PA.x + 1, PA.y - 6);
      ctx.restore();
    }

    // Artwork
    if (design.art.show && artImage) {
      ctx.drawImage(artImage, design.art.x, design.art.y, design.art.w, design.art.h);
    }

    // Text
    var box = textBox();
    if (box) {
      var t = design.text;
      ctx.save();
      ctx.fillStyle = t.color;
      ctx.textBaseline = "alphabetic";
      ctx.font = fontString(t.size);
      var anchorX = t.align === "left" ? t.x : t.align === "right" ? t.x : t.x;
      ctx.textAlign = t.align === "left" ? "left" : t.align === "right" ? "right" : "center";
      var firstBaseline = box.y + box.m.lineHeight * 0.8;
      box.m.lines.forEach(function (line, i) {
        ctx.fillText(line, anchorX, firstBaseline + i * box.m.lineHeight);
      });
      ctx.restore();
    }

    // Selection UI
    if (showSel && selected) {
      var sb = selected === "text" ? textBox() : artBox();
      if (sb) drawSelection(sb);
    }
  }

  function drawSelection(b) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2563eb";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    ctx.setLineDash([]);
    // Corner resize handle (bottom-right)
    var hx = b.x + b.w + 4;
    var hy = b.y + b.h + 4;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(hx - 5, hy - 5, 10, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /* ----------------------------------------------------------------------
     Geometry helpers
     ---------------------------------------------------------------------- */
  function toCanvasPoint(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function pointInBox(p, b) {
    return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  }

  function nearHandle(p, b) {
    var hx = b.x + b.w + 4;
    var hy = b.y + b.h + 4;
    return Math.abs(p.x - hx) <= 12 && Math.abs(p.y - hy) <= 12;
  }

  function clampTextBox(centerX, centerY) {
    var m = measureText();
    if (!m) return { x: centerX, y: centerY };
    var t = design.text;
    var halfH = m.height / 2;
    var cx, cy;
    // Horizontal bounds depend on the alignment anchor.
    if (t.align === "left") {
      cx = clamp(centerX, PA.x, PA.x + PA.w - m.width);
    } else if (t.align === "right") {
      cx = clamp(centerX, PA.x + m.width, PA.x + PA.w);
    } else {
      var halfW = m.width / 2;
      cx = clamp(centerX, PA.x + halfW, PA.x + PA.w - halfW);
    }
    cy = clamp(centerY, PA.y + halfH, PA.y + PA.h - halfH);
    return { x: cx, y: cy };
  }

  function clampArtBox(x, y, w, h) {
    var nx = clamp(x, PA.x, PA.x + PA.w - w);
    var ny = clamp(y, PA.y, PA.y + PA.h - h);
    return { x: nx, y: ny };
  }

  /* ----------------------------------------------------------------------
     Pointer interaction
     ---------------------------------------------------------------------- */
  function onPointerDown(e) {
    var p = toCanvasPoint(e);

    // Resize first
    if (selected) {
      var b = selected === "text" ? textBox() : artBox();
      if (b && nearHandle(p, b)) {
        beginResize(e, p, b);
        return;
      }
    }

    // Hit test text (drawn on top)
    var tb = textBox();
    if (tb && pointInBox(p, tb)) {
      selected = "text";
      drag = { kind: "text", dx: p.x - design.text.x, dy: p.y - design.text.y, moved: false };
      canvas.classList.add("is-dragging");
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      render();
      return;
    }

    // Hit test artwork
    if (design.art.show && artImage) {
      var ab = artBox();
      if (pointInBox(p, ab)) {
        selected = "art";
        drag = { kind: "art", dx: p.x - design.art.x, dy: p.y - design.art.y, moved: false };
        canvas.classList.add("is-dragging");
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        render();
        return;
      }
    }

    // Clicked empty space -> deselect
    selected = null;
    render();
  }

  function beginResize(e, p, b) {
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(e.pointerId);
    if (selected === "text") {
      var cx = design.text.x;
      var cy = design.text.y;
      var dist = Math.max(4, Math.hypot(p.x - cx, p.y - cy));
      resize = { kind: "text", startDist: dist, startSize: design.text.size, moved: false };
    } else {
      var corner = { x: design.art.x + design.art.w, y: design.art.y + design.art.h };
      var d = Math.max(4, Math.hypot(p.x - corner.x, p.y - corner.y));
      resize = { kind: "art", startDist: d, startW: design.art.w, startH: design.art.h, moved: false };
    }
  }

  function onPointerMove(e) {
    var p = toCanvasPoint(e);

    if (drag) {
      drag.moved = true;
      if (drag.kind === "text") {
        var c = clampTextBox(p.x - drag.dx, p.y - drag.dy);
        design.text.x = c.x;
        design.text.y = c.y;
      } else {
        var pos = clampArtBox(p.x - drag.dx, p.y - drag.dy, design.art.w, design.art.h);
        design.art.x = pos.x;
        design.art.y = pos.y;
      }
      render();
      return;
    }

    if (resize) {
      resize.moved = true;
      if (resize.kind === "text") {
        var cx = design.text.x;
        var cy = design.text.y;
        var dist = Math.max(4, Math.hypot(p.x - cx, p.y - cy));
        var newSize = clamp(Math.round(resize.startSize * (dist / resize.startDist)), 14, 80);
        design.text.size = newSize;
        var rc = clampTextBox(design.text.x, design.text.y);
        design.text.x = rc.x;
        design.text.y = rc.y;
        if (el.fontSize) el.fontSize.value = newSize;
        if (el.fontSizeOut) el.fontSizeOut.textContent = newSize;
      } else {
        var corner = { x: design.art.x + design.art.w, y: design.art.y + design.art.h };
        var d2 = Math.max(4, Math.hypot(p.x - corner.x, p.y - corner.y));
        var ratio = d2 / resize.startDist;
        var aspect = resize.startW / resize.startH;
        var newW = clamp(Math.round(resize.startW * ratio), 24, PA.w);
        var newH = Math.round(newW / aspect);
        if (newH > PA.h) {
          newH = PA.h;
          newW = Math.round(newH * aspect);
        }
        design.art.w = newW;
        design.art.h = newH;
        if (el.artScale) el.artScale.value = newW;
        if (el.artScaleOut) el.artScaleOut.textContent = newW + "px";
      }
      render();
      return;
    }

    // Hover cursor feedback
    var hovering = false;
    if (selected) {
      var b = selected === "text" ? textBox() : artBox();
      if (b && nearHandle(p, b)) hovering = true;
    }
    canvas.style.cursor = hovering ? "nwse-resize" : selected ? "grab" : "default";
  }

  function onPointerUp(e) {
    var changed = (drag && drag.moved) || (resize && resize.moved);
    drag = null;
    resize = null;
    canvas.classList.remove("is-dragging");
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
    if (changed) commit();
  }

  /* ----------------------------------------------------------------------
     Keyboard nudge / delete
     ---------------------------------------------------------------------- */
  function onKeyDown(e) {
    if (!selected) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (selected === "art") {
        clearArtwork(false);
        Toast.show("Artwork removed", "", "info");
      } else {
        design.text.show = false;
        if (el.showText) el.showText.checked = false;
        render();
      }
      selected = null;
      commit();
      return;
    }

    var step = e.shiftKey ? 10 : 2;
    var moved = false;
    if (e.key === "ArrowUp") { moveSelection(0, -step); moved = true; }
    else if (e.key === "ArrowDown") { moveSelection(0, step); moved = true; }
    else if (e.key === "ArrowLeft") { moveSelection(-step, 0); moved = true; }
    else if (e.key === "ArrowRight") { moveSelection(step, 0); moved = true; }
    if (moved) {
      e.preventDefault();
      render();
      // Commit is debounced so arrow-spamming creates one history entry.
      clearTimeout(onKeyDown._t);
      onKeyDown._t = setTimeout(commit, 400);
    }
  }

  function moveSelection(dx, dy) {
    if (selected === "text") {
      var c = clampTextBox(design.text.x + dx, design.text.y + dy);
      design.text.x = c.x;
      design.text.y = c.y;
    } else if (selected === "art") {
      var pos = clampArtBox(design.art.x + dx, design.art.y + dy, design.art.w, design.art.h);
      design.art.x = pos.x;
      design.art.y = pos.y;
    }
  }

  /* ----------------------------------------------------------------------
     Controls wiring
     ---------------------------------------------------------------------- */
  function buildColorPicker() {
    el.shirtColors.innerHTML = SHIRT_COLORS.map(function (c, i) {
      return (
        '<input type="radio" name="shirtColor" id="sc' + i + '" value="' + c.hex + '"' +
        (i === 0 ? " checked" : "") + ">" +
        '<label for="sc' + i + '" style="background:' + c.hex + '" title="' + c.name + '"></label>'
      );
    }).join("");
    el.shirtColors.addEventListener("change", function (e) {
      if (e.target.name !== "shirtColor") return;
      design.shirtColor = e.target.value;
      buildTee();
      render();
      updateSummary();
      commit();
    });
  }

  function buildSizes() {
    el.sizeOptions.innerHTML = SIZES.map(function (s, i) {
      var checked = s === design.size ? " checked" : "";
      return '<input type="radio" name="size" id="sz' + i + '" value="' + s + '"' + checked + ">" +
        '<label for="sz' + i + '">' + s + "</label>";
    }).join("");
    el.sizeOptions.addEventListener("change", function (e) {
      if (e.target.name !== "size") return;
      design.size = e.target.value;
      updateSummary();
      commit();
    });
  }

  function bindFit() {
    document.querySelectorAll('input[name="fit"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        design.fit = radio.value;
        buildTee();
        render();
        updateSummary();
        commit();
      });
    });
  }

  function bindTextControls() {
    el.customText.addEventListener("input", function () {
      design.text.value = el.customText.value;
      render();
    });
    el.customText.addEventListener("change", function () {
      design.text.value = el.customText.value;
      render();
      commit();
    });

    el.fontFamily.addEventListener("change", function () {
      design.text.font = el.fontFamily.value;
      render();
      commit();
    });

    el.fontSize.addEventListener("input", function () {
      design.text.size = parseInt(el.fontSize.value, 10);
      el.fontSizeOut.textContent = design.text.size;
      render();
    });
    el.fontSize.addEventListener("change", function () {
      design.text.size = parseInt(el.fontSize.value, 10);
      render();
      commit();
    });

    el.textColor.addEventListener("input", function () {
      design.text.color = el.textColor.value;
      render();
    });
    el.textColor.addEventListener("change", function () {
      design.text.color = el.textColor.value;
      render();
      commit();
    });

    el.btnBold.addEventListener("click", function () {
      design.text.bold = !design.text.bold;
      el.btnBold.classList.toggle("is-active", design.text.bold);
      el.btnBold.setAttribute("aria-pressed", design.text.bold ? "true" : "false");
      render();
      commit();
    });
    el.btnItalic.addEventListener("click", function () {
      design.text.italic = !design.text.italic;
      el.btnItalic.classList.toggle("is-active", design.text.italic);
      el.btnItalic.setAttribute("aria-pressed", design.text.italic ? "true" : "false");
      render();
      commit();
    });

    el.alignTools.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-align]");
      if (!btn) return;
      design.text.align = btn.getAttribute("data-align");
      el.alignTools.querySelectorAll(".tool-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      // Re-clamp so the aligned text stays inside the print area.
      var c = clampTextBox(design.text.x, design.text.y);
      design.text.x = c.x;
      design.text.y = c.y;
      render();
      commit();
    });

    el.showText.addEventListener("change", function () {
      design.text.show = el.showText.checked;
      if (!design.text.show && selected === "text") selected = null;
      render();
      commit();
    });
  }

  function bindUpload() {
    el.dropzone.addEventListener("click", function () { el.artInput.click(); });
    el.dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.artInput.click(); }
    });
    el.dropzone.addEventListener("dragover", function (e) {
      e.preventDefault();
      el.dropzone.classList.add("is-drag");
    });
    el.dropzone.addEventListener("dragleave", function () {
      el.dropzone.classList.remove("is-drag");
    });
    el.dropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      el.dropzone.classList.remove("is-drag");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    el.artInput.addEventListener("change", function () {
      if (el.artInput.files && el.artInput.files[0]) handleFile(el.artInput.files[0]);
      el.artInput.value = "";
    });

    el.removeArt.addEventListener("click", function () { clearArtwork(true); });
    el.removeArt2.addEventListener("click", function () { clearArtwork(true); });

    el.artScale.addEventListener("input", function () {
      var w = parseInt(el.artScale.value, 10);
      el.artScaleOut.textContent = w + "px";
      if (design.art.src && artImage) {
        var aspect = artImage.naturalWidth / artImage.naturalHeight || 1;
        design.art.w = w;
        design.art.h = Math.round(w / aspect);
        var pos = clampArtBox(design.art.x, design.art.y, design.art.w, design.art.h);
        design.art.x = pos.x;
        design.art.y = pos.y;
        render();
      }
    });
    el.artScale.addEventListener("change", function () {
      if (design.art.src) commit();
    });
  }

  function handleFile(file) {
    if (ALLOWED_TYPES.indexOf(file.type) === -1) {
      Toast.show("Unsupported file", "Please upload a PNG, JPG, JPEG or WebP image.", "error");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      Toast.show("File too large", "Images must be 5 MB or smaller.", "error");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var aspect = img.naturalWidth / img.naturalHeight || 1;
        var w = Math.min(140, Math.max(60, Math.round(img.naturalWidth * 0.6)));
        var h = Math.round(w / aspect);
        if (h > PA.h) { h = PA.h; w = Math.round(h * aspect); }
        design.art = {
          src: reader.result,
          name: file.name,
          x: PA.x + (PA.w - w) / 2,
          y: PA.y + 40,
          w: w,
          h: h,
          show: true,
        };
        artImage = img;
        selected = "art";
        el.artPreview.classList.remove("hidden");
        el.artThumb.src = reader.result;
        el.artName.textContent = file.name;
        el.artSize.textContent = (file.size / 1024).toFixed(0) + " KB";
        el.artScale.value = w;
        el.artScaleOut.textContent = w + "px";
        render();
        updateSummary();
        commit();
        Toast.show("Artwork added", file.name + " is now on your shirt.", "success");
      };
      img.onerror = function () {
        Toast.show("Could not read image", "The file appears to be corrupted.", "error");
      };
      img.src = reader.result;
    };
    reader.onerror = function () {
      Toast.show("Upload failed", "Something went wrong reading that file.", "error");
    };
    reader.readAsDataURL(file);
  }

  function clearArtwork(commitAfter) {
    design.art = { src: null, name: "", x: 160, y: 150, w: 80, h: 80, show: false };
    artImage = null;
    el.artPreview.classList.add("hidden");
    el.artThumb.removeAttribute("src");
    if (selected === "art") selected = null;
    render();
    updateSummary();
    if (commitAfter !== false) {
      commit();
      Toast.show("Artwork removed", "The uploaded image was removed from the design.", "info");
    }
  }

  function bindActions() {
    el.resetDesign.addEventListener("click", function () {
      window.App.openModal({
        className: "modal--sm",
        html:
          '<div class="modal__body"><h2>Reset your design?</h2>' +
          "<p>This clears your text position, artwork and colour choices and starts a fresh shirt.</p>" +
          '<div class="flex gap-3" style="justify-content:flex-end">' +
          '<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn--danger" type="button" id="doReset">Reset</button></div></div>',
        onOpen: function (modal) {
          modal.querySelector("#doReset").addEventListener("click", function () {
            window.App.closeModal();
            resetDesign();
          });
        },
      });
    });

    el.downloadPreview.addEventListener("click", downloadPNG);
    el.addCustomToCart.addEventListener("click", addToCart);

    el.undoBtn.addEventListener("click", undo);
    el.redoBtn.addEventListener("click", redo);

    // Zoom
    var zoom = 1;
    var applyZoom = function () {
      canvas.style.maxHeight = Math.round(560 * zoom) + "px";
      canvas.style.width = zoom === 1 ? "auto" : Math.round(400 * zoom) + "px";
    };
    el.zoomIn.addEventListener("click", function () {
      zoom = Math.min(1.8, zoom + 0.15);
      applyZoom();
    });
    el.zoomOut.addEventListener("click", function () {
      zoom = Math.max(0.55, zoom - 0.15);
      applyZoom();
    });
    el.zoomFit.addEventListener("click", function () {
      zoom = 1;
      canvas.style.maxHeight = "";
      canvas.style.width = "";
    });

    el.fullPreview.addEventListener("click", function () {
      var url = exportDataURL();
      window.App.openModal({
        className: "modal--sm",
        html:
          '<button class="icon-btn modal__close" type="button" data-modal-close aria-label="Close">' + icon("close") + "</button>" +
          '<div class="modal__body" style="text-align:center">' +
          '<h2 class="h3">Your design</h2>' +
          '<img src="' + url + '" alt="Full preview of your custom T-shirt design" style="max-width:100%;border-radius:16px;border:1px solid var(--c-line);margin-top:12px">' +
          '<div class="flex gap-3 mt-5" style="justify-content:center">' +
          '<button class="btn btn--outline" type="button" data-modal-close>Close</button>' +
          '<button class="btn btn--accent" type="button" id="fpDownload">Download PNG</button></div></div>',
        onOpen: function (modal) {
          modal.querySelector("#fpDownload").addEventListener("click", downloadPNG);
        },
      });
    });

    // Qty stepper
    el.qtyMinus.addEventListener("click", function () { setQty(design.qty - 1); });
    el.qtyPlus.addEventListener("click", function () { setQty(design.qty + 1); });
    el.qtyInput.addEventListener("change", function () { setQty(parseInt(el.qtyInput.value, 10)); });

    // Tabs
    document.querySelectorAll(".studio-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".studio-tab").forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll(".panel-section").forEach(function (p) {
          p.classList.remove("is-active");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        document.getElementById("tab-" + tab.getAttribute("data-tab")).classList.add("is-active");
      });
    });
  }

  function setQty(v) {
    design.qty = clamp(parseInt(v, 10) || 1, 1, 99);
    el.qtyInput.value = design.qty;
    updateSummary();
  }

  /* ----------------------------------------------------------------------
     Export / download
     ---------------------------------------------------------------------- */
  function exportDataURL() {
    var prevSel = selected;
    selected = null;
    render({ guides: false, selection: false });
    var url = canvas.toDataURL("image/png");
    // Restore the on-screen preview
    selected = prevSel;
    render();
    return url;
  }

  function downloadPNG() {
    try {
      var url = exportDataURL();
      var a = document.createElement("a");
      a.href = url;
      a.download = "threadly-design-" + design.fit + "-" + design.size + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      Toast.show("Preview downloaded", "Your design PNG has been saved.", "success");
    } catch (err) {
      Toast.show("Download failed", "Your browser blocked the download.", "error");
    }
  }

  /* ----------------------------------------------------------------------
     Add to cart
     ---------------------------------------------------------------------- */
  function currentPrice() {
    var base = window.Pricing.customBase[design.fit] || 599;
    var fee = design.art.src ? window.Pricing.artworkFee : 0;
    return base + fee;
  }

  function addToCart() {
    if (!design.text.show && !design.art.src) {
      Toast.show("Your shirt is blank", "Add some text or artwork before adding it to the cart.", "error");
      return;
    }
    var preview = exportDataURL();
    var fitLabel = FIT_LABELS[design.fit];
    var colorObj = SHIRT_COLORS.find(function (c) { return c.hex === design.shirtColor; }) || SHIRT_COLORS[0];
    var item = {
      type: "custom",
      productId: "custom-" + design.fit,
      name: "Custom " + fitLabel + " T-Shirt",
      price: currentPrice(),
      image: preview,
      color: design.shirtColor,
      colorName: colorObj.name,
      size: design.size,
      qty: design.qty,
      custom: {
        fit: design.fit,
        fitLabel: fitLabel,
        shirtColor: design.shirtColor,
        shirtColorName: colorObj.name,
        size: design.size,
        text: design.text.show
          ? {
              value: design.text.value,
              font: design.text.font,
              size: design.text.size,
              color: design.text.color,
              bold: design.text.bold,
              italic: design.text.italic,
              align: design.text.align,
            }
          : null,
        hasArtwork: !!design.art.src,
        artwork: design.art.src || null,
        preview: preview,
        unitPrice: currentPrice(),
      },
    };

    window.Store.addToCart(item);
    window.Store.saveDesign({
      id: window.Utils.uid("design"),
      createdAt: Date.now(),
      fit: design.fit,
      shirtColor: design.shirtColor,
      size: design.size,
      text: item.custom.text,
      hasArtwork: !!design.art.src,
    });
    window.App.updateBadges();
    Toast.show(
      "Added to cart",
      fitLabel + " \u00B7 " + colorObj.name + " \u00B7 Size " + design.size + " \u00B7 " + fmt(item.price),
      "success"
    );
  }

  /* ----------------------------------------------------------------------
     Summary chips
     ---------------------------------------------------------------------- */
  function updateSummary() {
    var colorObj = SHIRT_COLORS.find(function (c) { return c.hex === design.shirtColor; }) || SHIRT_COLORS[0];
    var chips = [
      FIT_LABELS[design.fit],
      colorObj.name,
      "Size " + design.size,
      fmt(currentPrice()) + " each",
    ];
    if (design.text.show) chips.push("Text: " + (design.text.value || "—"));
    if (design.art.src) chips.push("Artwork: " + (design.art.name || "uploaded"));
    el.designSummary.innerHTML = chips
      .map(function (c) {
        return '<span class="pill">' + window.Utils.escapeHTML(c) + "</span>";
      })
      .join("");
  }

  /* ----------------------------------------------------------------------
     Restore controls after undo/redo
     ---------------------------------------------------------------------- */
  function syncControls() {
    // Fit
    var fitRadio = document.querySelector('input[name="fit"][value="' + design.fit + '"]');
    if (fitRadio) fitRadio.checked = true;

    // Colour
    var colorRadio = el.shirtColors.querySelector('input[value="' + design.shirtColor + '"]');
    if (colorRadio) colorRadio.checked = true;

    // Size
    var sizeRadio = el.sizeOptions.querySelector('input[value="' + design.size + '"]');
    if (sizeRadio) sizeRadio.checked = true;

    // Text
    el.customText.value = design.text.value;
    el.fontFamily.value = design.text.font;
    el.fontSize.value = design.text.size;
    el.fontSizeOut.textContent = design.text.size;
    el.textColor.value = design.text.color;
    el.showText.checked = design.text.show;
    el.btnBold.classList.toggle("is-active", design.text.bold);
    el.btnBold.setAttribute("aria-pressed", design.text.bold ? "true" : "false");
    el.btnItalic.classList.toggle("is-active", design.text.italic);
    el.btnItalic.setAttribute("aria-pressed", design.text.italic ? "true" : "false");
    el.alignTools.querySelectorAll(".tool-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-align") === design.text.align);
    });

    // Artwork
    if (design.art.src) {
      el.artPreview.classList.remove("hidden");
      el.artThumb.src = design.art.src;
      el.artName.textContent = design.art.name || "artwork";
      el.artScale.value = design.art.w;
      el.artScaleOut.textContent = design.art.w + "px";
    } else {
      el.artPreview.classList.add("hidden");
    }

    el.qtyInput.value = design.qty;
    updateSummary();
  }

  function resetDesign() {
    design = {
      fit: "regular",
      shirtColor: SHIRT_COLORS[0].hex,
      size: "M",
      qty: 1,
      text: {
        value: "YOUR TEXT",
        font: "Poppins",
        size: 34,
        color: "#111111",
        bold: true,
        italic: false,
        align: "center",
        x: 200,
        y: 250,
        show: true,
      },
      art: { src: null, name: "", x: 160, y: 150, w: 80, h: 80, show: false },
    };
    artImage = null;
    selected = null;
    el.artPreview.classList.add("hidden");
    buildTee();
    syncControls();
    render();
    commit();
    Toast.show("Design reset", "Your canvas is fresh and ready.", "info");
  }

  /* ----------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function init() {
    canvas = document.getElementById("designCanvas");
    if (!canvas) return;
    stage = document.getElementById("canvasStage");
    ctx = canvas.getContext("2d");

    el.shirtColors = document.getElementById("shirtColors");
    el.sizeOptions = document.getElementById("sizeOptions");
    el.customText = document.getElementById("customText");
    el.fontFamily = document.getElementById("fontFamily");
    el.fontSize = document.getElementById("fontSize");
    el.fontSizeOut = document.getElementById("fontSizeOut");
    el.textColor = document.getElementById("textColor");
    el.btnBold = document.getElementById("btnBold");
    el.btnItalic = document.getElementById("btnItalic");
    el.alignTools = document.getElementById("alignTools");
    el.showText = document.getElementById("showText");
    el.dropzone = document.getElementById("dropzone");
    el.artInput = document.getElementById("artInput");
    el.artPreview = document.getElementById("artPreview");
    el.artThumb = document.getElementById("artThumb");
    el.artName = document.getElementById("artName");
    el.artSize = document.getElementById("artSize");
    el.removeArt = document.getElementById("removeArt");
    el.removeArt2 = document.getElementById("removeArt2");
    el.artScale = document.getElementById("artScale");
    el.artScaleOut = document.getElementById("artScaleOut");
    el.designSummary = document.getElementById("designSummary");
    el.resetDesign = document.getElementById("resetDesign");
    el.downloadPreview = document.getElementById("downloadPreview");
    el.addCustomToCart = document.getElementById("addCustomToCart");
    el.undoBtn = document.getElementById("undoBtn");
    el.redoBtn = document.getElementById("redoBtn");
    el.zoomIn = document.getElementById("zoomIn");
    el.zoomOut = document.getElementById("zoomOut");
    el.zoomFit = document.getElementById("zoomFit");
    el.fullPreview = document.getElementById("fullPreview");
    el.qtyInput = document.getElementById("qtyInput");
    el.qtyMinus = document.getElementById("qtyMinus");
    el.qtyPlus = document.getElementById("qtyPlus");

    buildColorPicker();
    buildSizes();
    bindFit();
    bindTextControls();
    bindUpload();
    bindActions();

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    buildTee();
    updateSummary();
    render();
    commit();
    updateHistoryButtons();

    // Re-render once webfonts have loaded so wrapping is accurate.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { render(); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
