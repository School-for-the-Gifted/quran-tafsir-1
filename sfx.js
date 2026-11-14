/* ============================================================
   sfx.js — الأصوات والمؤثرات
   • مؤثرات مولَّدة داخل المتصفح (Web Audio) — بلا ملفات صوتية
   • موسيقى خلفية يرفعها المعلم من لوحة التحكم
   ============================================================ */
(function (g) {
  "use strict";
  var ctx = null, bg = null, bgOn = false, muted = false;

  function AC() {
    if (!ctx) {
      var C = g.AudioContext || g.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, t0, dur, type, gain, glideTo) {
    var c = AC(); if (!c) return;
    var o = c.createOscillator(), gn = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, c.currentTime + t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + t0 + dur);
    gn.gain.setValueAtTime(0, c.currentTime + t0);
    gn.gain.linearRampToValueAtTime(gain || 0.16, c.currentTime + t0 + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + t0 + dur);
    o.connect(gn); gn.connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  }

  /* نغمة صحيحة: صاعدة ثلاثية */
  function correct() {
    if (muted) return;
    tone(659.25, 0, 0.16, "sine", 0.13);
    tone(830.61, 0.09, 0.18, "sine", 0.13);
    tone(987.77, 0.19, 0.30, "sine", 0.12);
  }

  /* نغمة خطأ: هابطة ناعمة */
  function wrong() {
    if (muted) return;
    tone(311.13, 0, 0.18, "triangle", 0.13);
    tone(207.65, 0.13, 0.32, "triangle", 0.12);
  }

  /* نقرة خفيفة */
  function click() {
    if (muted) return;
    tone(1200, 0, 0.045, "square", 0.035);
  }

  /* فتح بوابة */
  function whoosh() {
    if (muted) return;
    tone(180, 0, 0.30, "sine", 0.10, 520);
  }

  /* فوز */
  function win() {
    if (muted) return;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(f, i * 0.11, 0.34, "sine", 0.12);
    });
  }

  /* ============ الموسيقى الخلفية ============ */
  function cfg() {
    try { return JSON.parse(localStorage.getItem("qpt_audio") || "{}"); } catch (e) { return {}; }
  }
  function setCfg(c) {
    try { localStorage.setItem("qpt_audio", JSON.stringify(c)); } catch (e) {}
  }

  function startBg(src, vol) {
    if (!src) return;
    stopBg();
    bg = new Audio(src);
    bg.loop = true;
    bg.volume = typeof vol === "number" ? vol : 0.28;
    bg.preload = "auto";
    var p = bg.play();
    if (p && p.catch) p.catch(function () { });
    bgOn = true;
  }
  function stopBg() {
    if (bg) { try { bg.pause(); } catch (e) {} bg = null; }
    bgOn = false;
  }
  function toggleBg() {
    if (bgOn) { stopBg(); return false; }
    var c = cfg();
    if (c.url) { startBg(c.url, c.vol); return true; }
    return false;
  }

  /* يُشغّل الخلفية عند أول تفاعل من المستخدم (سياسة المتصفح) */
  function armBg() {
    var c = cfg();
    if (!c.url || !c.enabled) return;
    var once = function () {
      startBg(c.url, c.vol);
      document.removeEventListener("pointerdown", once);
      document.removeEventListener("keydown", once);
    };
    document.addEventListener("pointerdown", once);
    document.addEventListener("keydown", once);
  }

  g.SFX = {
    correct: correct, wrong: wrong, click: click, whoosh: whoosh, win: win,
    startBg: startBg, stopBg: stopBg, toggleBg: toggleBg, armBg: armBg,
    isBgOn: function () { return bgOn; },
    mute: function (v) { muted = !!v; if (v) stopBg(); },
    unmute: function () { muted = false; },
    cfg: cfg, setCfg: setCfg,
    /* يفتح موسيقى خلفية معتمدة من المعلم تلقائيًا */
    auto: function () {
      var c = cfg();
      if (c.url && c.enabled) armBg();
    }
  };
})(window);
