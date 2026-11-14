/* ============================================================
   platform.js — طبقة الربط بين المنصة و Supabase
   منصة القرآن الكريم وتفسيره ١ — إعداد المعلم عمر العيسى
   ============================================================ */
(function (global) {
  "use strict";

  var CFG = {
    url: "https://evggbiwxlmxydoqqkmyh.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Z2diaXd4bG14eWRvcXFrbXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0Njk1NjYsImV4cCI6MjExMDA0NTU2Nn0.U1hZp-ffuLHf7okveSeiwUAvCS4a3P7GXALYnOmCiB0"
  };

  var LS = {
    token: "qpt_token",
    student: "qpt_student",
    school: "qpt_school",
    class: "qpt_class",
    section: "qpt_section"
  };

  var CLASSES = ["أول ثانوي"];
  var SECTIONS = ["101", "102", "103"];

  /* ---------------- التخزين المحلي ---------------- */
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) { localStorage.removeItem(k); return null; }
      localStorage.setItem(k, v);
    } catch (e) {}
    return v;
  }
  function lsJson(k, v) {
    try {
      if (v === undefined) {
        var s = localStorage.getItem(k);
        return s ? JSON.parse(s) : null;
      }
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
    return v;
  }

  function jwtRole() {
    var t = ls(LS.token);
    if (!t) return null;
    var p = t.split(".");
    if (p.length < 2) return null;
    try {
      var b = p[1].replace(/-/g, "+").replace(/_/g, "/");
      var j = JSON.parse(decodeURIComponent(escape(atob(b + "===".slice((b.length + 3) % 4)))));
      if (j.exp && Date.now() / 1000 > j.exp - 30) return null;
      return j.role || null;
    } catch (e) { return null; }
  }
  function isTeacher() { return jwtRole() === "authenticated"; }

  /* ---------------- HTTP ---------------- */
  function rest(path, opt) {
    opt = opt || {};
    var h = {
      "apikey": CFG.key,
      "Content-Type": "application/json"
    };
    if (opt.prefer) h["Prefer"] = opt.prefer;
    var tok = ls(LS.token);
    if (tok && opt.auth !== false) h["Authorization"] = "Bearer " + tok;
    else if (opt.auth === false) h["Authorization"] = "Bearer " + CFG.key;

    return fetch(CFG.url + path, {
      method: opt.method || "GET",
      headers: h,
      body: opt.body ? JSON.stringify(opt.body) : undefined
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = null;
        try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
        if (!r.ok) {
          var msg = (d && (d.message || d.error_description || d.error || d.hint)) || ("HTTP " + r.status);
          throw new Error(msg);
        }
        return d;
      });
    });
  }

  /* ---------------- المصادقة ---------------- */
  function login(email, password) {
    return rest("/auth/v1/token?grant_type=password", {
      method: "POST", auth: false,
      body: { email: email, password: password }
    }).then(function (d) {
      ls(LS.token, d.access_token);
      return d;
    });
  }
  function logout() {
    var t = ls(LS.token);
    ls(LS.token, null);
    if (!t) return Promise.resolve();
    return fetch(CFG.url + "/auth/v1/logout", {
      method: "POST",
      headers: { "apikey": CFG.key, "Authorization": "Bearer " + t }
    }).catch(function () {});
  }

  /* ---------------- الطلاب ---------------- */
  function listStudents() {
    return rest("/rest/v1/students?select=id,name,class,section,active,created_at&order=name.asc");
  }
  function addStudent(name, cls, sec) {
    return rest("/rest/v1/students", {
      method: "POST", prefer: "return=representation",
      body: [{ name: name, "class": cls || CLASSES[0], section: sec || SECTIONS[0] }]
    }).then(function (d) { return d && d[0]; });
  }
  function updateStudent(id, patch) {
    return rest("/rest/v1/students?id=eq." + encodeURIComponent(id), {
      method: "PATCH", prefer: "return=representation", body: patch
    }).then(function (d) { return d && d[0]; });
  }
  function deleteStudent(id) {
    return rest("/rest/v1/students?id=eq." + encodeURIComponent(id), { method: "DELETE" });
  }
  function studentsPublic() {
    // تستخدمها صفحة الطالب: تقرأ الأسماء المتاحة للاختيار (RLS تسمح بالقراءة فقط)
    return rest("/rest/v1/students?select=id,name,class,section&active=eq.true&order=name.asc", { auth: false });
  }

  /* ---------------- النتائج ---------------- */
  function saveResult(r) {
    // return=minimal لأن الطالب (anon) لا يملك صلاحية قراءة جدول النتائج
    return rest("/rest/v1/results", {
      method: "POST", prefer: "return=minimal", auth: false,
      body: [r]
    });
  }
  function snapshots() {
    // يستخدمها المعلم: يجمع نتائج كل طالب من التخزين المحلي للجهاز
    return lsJson("qpt_snapshots") || [];
  }
  function recordSnapshot(row) {
    var all = snapshots();
    row.key = row.key || (row.unit + "-" + row.kind + "-" + row.date);
    var i = all.findIndex(function (x) { return x.key === row.key; });
    if (i >= 0) all[i] = row; else all.push(row);
    lsJson("qpt_snapshots", all.slice(-600));
    return all;
  }

  global.PF = {
    CFG: CFG, LS: LS, CLASSES: CLASSES, SECTIONS: SECTIONS,
    ls: ls, lsJson: lsJson,
    isTeacher: isTeacher, jwtRole: jwtRole,
    login: login, logout: logout,
    rest: rest,
    listStudents: listStudents, addStudent: addStudent,
    updateStudent: updateStudent, deleteStudent: deleteStudent,
    studentsPublic: studentsPublic,
    saveResult: saveResult,
    snapshots: snapshots, recordSnapshot: recordSnapshot,
    name: function () { return ls(LS.student) || ""; },
    setStudent: function (n) { ls(LS.student, n); },
    school: function (v) { return v === undefined ? (ls(LS.school) || "") : ls(LS.school, v); },
    klass: function () { return ls(LS.class) || CLASSES[0]; },
    section: function () { return ls(LS.section) || SECTIONS[0]; },
    setClass: function (c, s) { ls(LS.class, c || CLASSES[0]); ls(LS.section, s || SECTIONS[0]); },
    arNum: function (n) {
      return String(n).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; });
    }
  };
})(window);
