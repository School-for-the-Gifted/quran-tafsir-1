/* ============================================================
   gate.js — بوابة حماية المحتوى
   تمنع فتح الدرس/اللعبة/الاختبار قبل اعتماد المعلم.
   الاستخدام:
     <script src="gate.js" data-no="6" data-part="slides"></script>
     <script src="gate.js" data-unit="3" data-part="game"></script>
   ============================================================ */
(function () {
  "use strict";
  var me = document.currentScript;
  if (!me) return;
  var no = me.getAttribute("data-no");
  var unit = me.getAttribute("data-unit");
  var part = me.getAttribute("data-part") || "slides";

  var CFG = {
    url: "https://evggbiwxlmxydoqqkmyh.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Z2diaXd4bG14eWRvcXFrbXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0Njk1NjYsImV4cCI6MjExMDA0NTU2Nn0.U1hZp-ffuLHf7okveSeiwUAvCS4a3P7GXALYnOmCiB0"
  };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getJson(k) { try { return JSON.parse(get(k) || "null"); } catch (e) { return null; } }

  function isTeacher() {
    var t = get("qpt_token");
    if (!t) return false;
    try {
      var b = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      var j = JSON.parse(decodeURIComponent(escape(atob(b + "===".slice((b.length + 3) % 4)))));
      if (j.role !== "authenticated") return false;
      if (j.exp && Date.now() / 1000 > j.exp - 30) return false;
      return true;
    } catch (e) { return false; }
  }

  function deny(msg, sub) {
    var box =
      '<div style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;' +
      "justify-content:center;padding:20px;background:linear-gradient(160deg,#041a14,#0b3a2c);" +
      'font-family:\'Noto Naskh Arabic\',Tahoma,sans-serif;direction:rtl;text-align:center">' +
      '<div style="background:#fbf8f0;border:1px solid #c9a227;border-radius:20px;padding:32px 26px;' +
      'max-width:420px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,.5)">' +
      '<div style="width:56px;height:56px;border-radius:16px;margin:0 auto 14px;display:flex;' +
      'align-items:center;justify-content:center;background:rgba(201,162,39,.14);' +
      'border:1px solid rgba(201,162,39,.5)">' +
      '<svg viewBox="0 0 24 24" style="width:26px;height:26px;fill:none;stroke:#8a6f16;stroke-width:1.7;' +
      'stroke-linecap:round;stroke-linejoin:round"><rect x="4" y="10" width="16" height="10" rx="2"/>' +
      '<path d="M8 10V7a4 4 0 018 0v3"/></svg></div>' +
      '<h2 style="font-size:20px;color:#0e4636;margin:0 0 6px;font-weight:700">' + msg + "</h2>" +
      '<p style="font-size:13.5px;color:#6b7d74;line-height:1.85;margin:0 0 18px">' + sub + "</p>" +
      '<a href="بوابة-الطالب.html" style="display:inline-block;padding:11px 24px;border-radius:11px;' +
      'background:linear-gradient(180deg,#17795c,#0b3d2e);color:#fff;text-decoration:none;' +
      'font-size:14px;font-weight:700">رجوع إلى بوابة الطالب</a>' +
      '<div style="margin-top:14px;font-size:12px;color:#9a8b5c">' +
      '<a href="index.html" style="color:#7b6b3a;text-decoration:none">الرئيسية</a></div>' +
      "</div></div>";
    var done = false;
    function paint() {
      if (done) return;
      done = true;
      document.documentElement.innerHTML =
        "<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
        "<title>الدرس مغلق</title></head><body style='margin:0'>" + box + "</body>";
    }
    if (document.body) paint();
    else document.addEventListener("DOMContentLoaded", paint);
  }

  function okLesson(rows) {
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].no) === String(no)) {
        var r = rows[i];
        if (!r.approved) return false;
        var p = r.parts || {};
        return p[part] !== false;
      }
    }
    return false;
  }
  function okUnit(rows) {
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].unit) === String(unit)) {
        return rows[i][part] === true;
      }
    }
    return false;
  }

  function fetchRows(path, cacheKey, test) {
    // 1) النسخة المخزنة (سريعة، بلا شبكة)
    var cached = getJson(cacheKey);
    var decide = function (rows) {
      if (!rows || !rows.length) return null;
      return test(rows);
    };
    var quick = decide(cached);
    // 2) تحديث من الشبكة ثم الفحص
    return fetch(CFG.url + path, {
      headers: { apikey: CFG.key, Authorization: "Bearer " + CFG.key }
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (rows && rows.length) set(cacheKey, JSON.stringify(rows));
      var v = decide(rows);
      if (v === null) v = quick === true;
      return v === true;
    }).catch(function () {
      var v = decide(cached);
      return v === true;
    });
  }

  if (isTeacher()) return; // المعلم يرى كل شيء

  var p = no
    ? fetchRows("/rest/v1/lessons?select=no,unit,approved,parts&no=eq." + encodeURIComponent(no),
                "qpt_lessons_cache", okLesson)
    : fetchRows("/rest/v1/units?select=unit,name,game,exam&unit=eq." + encodeURIComponent(unit),
                "qpt_units_cache", okUnit);

  p.then(function (allowed) {
    if (allowed) return;
    if (no) deny("لم يعتمد المعلم هذا الدرس بعد", "يمكنك متابعة بقية الدروس المعتمدة، أو مراجعة معلمك لفتحه.");
    else if (part === "game") deny("اللعبة غير متاحة حاليًا", "لم يفتح المعلم لعبة هذه الوحدة بعد.");
    else deny("الاختبار غير متاح حاليًا", "لم يفتح المعلم اختبار هذه الوحدة بعد.");
  });
})();
