/* ============================================================
   cert.js — مُولِّد شهادة احترافي (Canvas 2480×1754 @300dpi)
   يعتمد على صورة الخلفية img-cert_bg.png والخط amiri.woff2
   ============================================================ */
(function (g) {
  "use strict";

  var BG = null, FONT = null, ready = false;

  var AMIRI = "QPCert";   /* اسم الخط بعد تحميله */

  /* ---- تحميل الموارد مرة واحدة ---- */
  function load() {
    if (ready) return Promise.resolve(true);
    var p1, p2;
    p1 = new Promise(function (res) {
      var im = new Image();
      im.onload = function () { BG = im; res(true); };
      im.onerror = function () { BG = null; res(false); };
      im.src = "img-cert_bg.png";
    });
    p2 = new Promise(function (res) {
      if (!g.FontFace || !document.fonts) { res(false); return; }
      var f = new g.FontFace(AMIRI, "url(amiri.woff2)", { display: "swap" });
      f.load().then(function (face) {
        document.fonts.add(face); FONT = AMIRI; res(true);
      }).catch(function () { FONT = "Amiri, serif"; res(false); });
    });
    return Promise.all([p1, p2]).then(function () { ready = true; return true; });
  }

  function font(size, bold) {
    return (bold ? "700 " : "400 ") + size + "px '" + (FONT || "Amiri") + "', Amiri, 'Noto Naskh Arabic', serif";
  }

  /* نص مقلوب الاتجاه بكلمة واحدة محاذاة يمين */
  function rt(x, text, px, py, color, size, bold, align) {
    x.save();
    x.font = font(size, bold);
    x.fillStyle = color;
    x.textAlign = align || "right";
    x.textBaseline = "alphabetic";
    x.direction = "rtl";
    x.fillText(text, px, py);
    x.restore();
  }

  function ctext(x, text, px, py, color, size, bold) {
    x.save();
    x.font = font(size, bold);
    x.fillStyle = color;
    x.textAlign = "center";
    x.direction = "rtl";
    x.fillText(text, px, py);
    x.restore();
  }

  function spacedLine(x, cx, y, w, color, lw) {
    x.save();
    x.strokeStyle = color; x.lineWidth = lw || 3;
    x.beginPath(); x.moveTo(cx - w / 2, y); x.lineTo(cx + w / 2, y); x.stroke();
    x.restore();
  }

  /* زخرفة معينية صغيرة */
  function diamond(x, cx, cy, r, color) {
    x.save(); x.fillStyle = color;
    x.beginPath();
    x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy);
    x.closePath(); x.fill(); x.restore();
  }

  /* ============================================================
     draw(canvas, data)
     data = {name, klass, section, school, unitName, unitNo, score, total,
             pct, pass, kind, secs, date, code, teacher, certNo, qrCanvas}
     ============================================================ */
  function draw(cv, D) {
    var W = 2480, H = 1754;
    cv.width = W; cv.height = H;
    var x = cv.getContext("2d");
    var GOLD = "#b08a30", GOLD_L = "#d6b86e", EM = "#0c3a2e", INK = "#152b23",
        MUTED = "#5b6d64", PAPER = "#fdfaf3";

    x.clearRect(0, 0, W, H);
    if (BG) x.drawImage(BG, 0, 0, W, H);
    else { x.fillStyle = PAPER; x.fillRect(0, 0, W, H); }

    /* ===== الاسم (الأبرز) ===== */
    ctext(x, "شهادة", W / 2, 372, EM, 92, true);
    ctext(x, D.pass ? "اجتياز" : "مشاركة", W / 2, 470, GOLD, 50, false);
    spacedLine(x, W / 2, 512, 300, "rgba(176,138,48,.75)", 3);

    ctext(x, "تُمنح هذه الشهادة إلى", W / 2, 588, MUTED, 38);

    var nm = (D.name || "—").trim();
    var nsz = nm.length > 26 ? 86 : nm.length > 18 ? 104 : 124;
    ctext(x, nm, W / 2, 736, EM, nsz, true);
    spacedLine(x, W / 2, 790, 980, "rgba(12,58,46,.35)", 4);
    diamond(x, W / 2, 790, 11, GOLD);

    /* ===== السطر التعريفي ===== */
    ctext(x, (D.klass || "أول ثانوي") + "  ·  الشعبة " + ar(D.section || "—") +
        (D.school ? "  ·  " + D.school : ""), W / 2, 858, MUTED, 40);

    ctext(x, "لإتمامه " + (D.kind === "exam" ? "اختبار وحدة" : "لعبة وحدة") +
        " «" + (D.unitName || "") + "»  —  الوحدة " + ar(D.unitNo), W / 2, 936, INK, 44);

    /* ===== لوحة الدرجة ===== */
    var bx = 210, by = 1002, bw = 760, bh = 210;
    x.save();
    x.shadowColor = "rgba(12,58,46,.16)"; x.shadowBlur = 28; x.shadowOffsetY = 8;
    x.fillStyle = "rgba(12,58,46,.055)";
    roundRect(x, bx, by, bw, bh, 18); x.fill();
    x.restore();
    x.save(); x.strokeStyle = "rgba(176,138,48,.55)"; x.lineWidth = 2;
    roundRect(x, bx, by, bw, bh, 18); x.stroke(); x.restore();

    ctext(x, "الدرجة", bx + bw / 2, by + 58, MUTED, 32);
    ctext(x, ar(D.score) + " من " + ar(D.total), bx + bw / 2, by + 132, EM, 62, true);
    ctext(x, ar(D.pct) + "%", bx + bw / 2, by + 186, GOLD, 40, false);

    /* ===== لوحة التقدير ===== */
    var px2 = W - 210 - bw;
    x.save();
    x.shadowColor = "rgba(12,58,46,.16)"; x.shadowBlur = 28; x.shadowOffsetY = 8;
    x.fillStyle = "rgba(12,58,46,.055)";
    roundRect(x, px2, by, bw, bh, 18); x.fill();
    x.restore();
    x.save(); x.strokeStyle = "rgba(176,138,48,.55)"; x.lineWidth = 2;
    roundRect(x, px2, by, bw, bh, 18); x.stroke(); x.restore();

    var word = D.pct >= 95 ? "ممتاز مرتفع" : D.pct >= 90 ? "ممتاز" : D.pct >= 80 ? "جيد جدًا"
      : D.pct >= 70 ? "جيد" : D.pct >= 60 ? "مقبول" : "يحتاج مراجعة";
    ctext(x, "التقدير", px2 + bw / 2, by + 58, MUTED, 32);
    ctext(x, word, px2 + bw / 2, by + 132, EM, 54, true);
    ctext(x, "الزمن " + fmtSecs(D.secs), px2 + bw / 2, by + 186, GOLD, 34, false);

    /* ===== شارة في المنتصف ===== */
    var cx = W / 2, cy = by + bh / 2;
    x.save();
    x.beginPath(); x.arc(cx, cy, 104, 0, Math.PI * 2);
    x.fillStyle = D.pass ? "rgba(18,92,68,.10)" : "rgba(150,60,60,.08)"; x.fill();
    x.strokeStyle = D.pass ? "#17795c" : "#a8323c"; x.lineWidth = 5; x.stroke();
    x.beginPath(); x.arc(cx, cy, 90, 0, Math.PI * 2);
    x.strokeStyle = "rgba(176,138,48,.65)"; x.lineWidth = 2; x.stroke();
    x.restore();
    ctext(x, D.pass ? "اجتياز" : "مشاركة", cx, cy + 16, D.pass ? "#17795c" : "#a8323c", 42, true);

    /* ===== التواقيع ===== */
    var sy = 1362;
    x.save(); x.strokeStyle = "rgba(12,58,46,.35)"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(300, sy); x.lineTo(700, sy); x.stroke();
    x.beginPath(); x.moveTo(W - 700, sy); x.lineTo(W - 300, sy); x.stroke();
    x.restore();
    ctext(x, "معلم المادة", 500, sy + 52, INK, 34, true);
    ctext(x, D.teacher || "................", 500, sy + 96, MUTED, 30);

    ctext(x, "مدير المدرسة", W - 500, sy + 52, INK, 34, true);
    ctext(x, "................", W - 500, sy + 96, MUTED, 30);

    /* ===== الشريط السفلي ===== */
    x.save();
    x.strokeStyle = "rgba(176,138,48,.5)"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(150, 1500); x.lineTo(W - 150, 1500); x.stroke();
    x.restore();

    ctext(x, "رقم الشهادة: " + (D.certNo || "—") + "     ·     تاريخ الإصدار: " + (D.date || "—"),
      W / 2, 1552, MUTED, 30);

    ctext(x, "القرآن الكريم وتفسيره ١  ·  إعداد المعلم: " + (D.teacher || "عمر العيسى") +
      "  ·  الدراسات الإسلامية", W / 2, 1604, GOLD, 30, false);

    /* ===== رمز QR ===== */
    if (D.qrCanvas) {
      var qx = W - 380, qy = 1290, qs = 200;
      x.save();
      x.fillStyle = "#fff";
      roundRect(x, qx - 14, qy - 14, qs + 28, qs + 28, 12); x.fill();
      x.strokeStyle = "rgba(176,138,48,.6)"; x.lineWidth = 2;
      roundRect(x, qx - 14, qy - 14, qs + 28, qs + 28, 12); x.stroke();
      x.drawImage(D.qrCanvas, qx, qy, qs, qs);
      x.restore();
      ctext(x, "امسح للتحقّق", qx + qs / 2, qy + qs + 52, MUTED, 26);
    }
    return cv;
  }

  function roundRect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }

  function ar(seq) {
    return String(seq).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; });
  }

  function fmtSecs(s) {
    s = Math.max(0, s | 0);
    var m = Math.floor(s / 60), r = s % 60;
    return ar(m) + " د " + ar((r < 10 ? "0" : "") + r) + " ث";
  }

  g.QCert = { load: load, draw: draw, ready: function () { return ready; } };
})(window);
