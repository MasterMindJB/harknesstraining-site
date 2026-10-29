/* ============================================================
   HARKNESS TRAINING SOLUTIONS — SITE CONFIG
   Every external link and the Open Lab schedule live here.
   Paste a link between the quotes and save; nothing else to edit.
   ============================================================ */
var HTS = {
  // Luma calendar or event page for Open Lab registration.
  // Empty = "Save a seat" buttons open an email to hello@ instead.
  luma: "",

  // Google Calendar appointment schedule (demo; set to 20 minutes in Google Calendar).
  demoBooking: "https://calendar.app.google/77uHPkoSyX5W1MKw6",

  // Optional: the long "Embed" URL from Google Calendar appointment
  // schedules (ends in ?gv=true). Empty = the demo page shows a button.
  demoEmbed: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3EdYHwfuEEwZ0ZN2ZwWxwG23qJciAb7PH6grsOXrHDO4EazEDlNWmb66nxCWDYFcECcO7CaWjk?gv=true",

  // Formspree form ID (the part after formspree.io/f/). Empty = forms
  // open an email to hello@ with the details filled in.
  formspree: "",

  // Google Apps Script web app URL (ends in /exec). When set, every form
  // adds a row to the Harkness Google Sheet and emails hello@.
  sheetHook: "https://script.google.com/macros/s/AKfycbw3aS7Oo1EQxCYNcoiulnnb9To3fZLwzPn9pJxin917fWLGlcNr1jACo_WDErk1jCEmjw/exec",

  // Team rate: % off Kickoff, Pilot and Full Program (never Practice Lab)
  // once a team reaches `min` people. Above `max`, the site invites a quote.
  teamRate: { min: 15, max: 20, off: 0.10 },

  // Social profiles. Empty = icon stays hidden.
  social: { linkedin: "", youtube: "https://www.youtube.com/@harknesstraining", x: "https://x.com/harknesstrainin" },

  email: "hello@harknesstraining.com",
  phone: "(310) 896-5379",

  // Open Lab: every 3 weeks from the first date, two sessions each day.
  openNight: {
    first: "2026-10-29",        // a Thursday
    everyWeeks: 3,
    show: 4,                    // how many upcoming dates to list
    skip: ["2026-12-31"],       // dates to drop (holiday week)
    online:   { label: "Online",    time: "12:00–1:30 PM PT", where: "Link sent after registration" },
    inPerson: { label: "In person", time: "6:00–7:30 PM PT",  where: "El Segundo · details sent after registration" },
    // In person: the first Open Lab of each month, starting from this date.
    // Every other Open Lab is online only.
    inPersonFrom: "2026-12-01"
  }
};

/* ---------------- schedule ---------------- */
HTS.dates = function (count) {
  var o = HTS.openNight, out = [], d = new Date(o.first + "T12:00:00");
  var today = new Date(); today.setHours(0, 0, 0, 0);
  for (var i = 0; out.length < count && i < 60; i++) {
    var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    var end = new Date(iso + "T23:59:00");
    if (end >= today && o.skip.indexOf(iso) === -1) out.push({ iso: iso, date: new Date(d) });
    d.setDate(d.getDate() + 7 * o.everyWeeks);
  }
  return out;
};
HTS.fmtDate = function (d, long) {
  return d.toLocaleDateString("en-US", { weekday: long ? "long" : "short", month: "short", day: "numeric" });
};
HTS.registerLink = function (d, s) {
  if (HTS.luma) return HTS.luma;
  return "#register";
  var subj = "Open Lab seat: " + HTS.fmtDate(d.date, true) + " (" + s.label.toLowerCase() + ", " + s.time + ")";
  var body = "Name:\nCompany:\nRole:\nThe conversation I want to practice:\nIs your manager or a leader coming to watch?\n";
  return "mailto:" + HTS.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
};
/* in person: the first scheduled Open Lab of each month, from inPersonFrom on */
HTS.hasInPerson = function (iso) {
  var o = HTS.openNight;
  if (!o.inPersonFrom || iso < o.inPersonFrom) return false;
  var d = new Date(o.first + "T12:00:00");
  for (var i = 0; i < 120; i++) {
    var x = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    if (x.slice(0, 7) === iso.slice(0, 7) && o.skip.indexOf(x) === -1) return x === iso;
    if (x > iso) return false;
    d.setDate(d.getDate() + 7 * o.everyWeeks);
  }
  return false;
};
HTS.renderSchedule = function (el) {
  var n = parseInt(el.getAttribute("data-count") || HTS.openNight.show, 10);
  var dates = HTS.dates(n);
  if (!dates.length) { el.outerHTML = '<p class="dates-empty">New dates are coming soon. Email ' + HTS.email + ' to hear first.</p>'; return; }
  el.innerHTML = dates.map(function (d, i) {
    var o = HTS.openNight;
    var list = HTS.hasInPerson(d.iso) ? [o.online, o.inPerson] : [o.online];
    var sess = list.map(function (s) {
      var ext = HTS.luma ? ' target="_blank" rel="noopener"' : "";
      return '<div class="session ' + (s === HTS.openNight.online ? "s-online" : "s-inperson") + '"><span class="fmt">' + s.label + '</span><span class="when">' + s.time + '</span><span class="where">' + s.where + '</span>' +
        '<a class="btn btn-hot" href="' + HTS.registerLink(d, s) + '"' + ext + ' data-session="' + HTS.fmtDate(d.date, true) + ' · ' + s.label + ' · ' + s.time + '" aria-label="Save a seat, ' + s.label + ', ' + HTS.fmtDate(d.date, true) + '">Save a seat</a></div>';
    }).join("");
    return '<li class="date' + (i === 0 ? " next" : "") + '"><div class="date-head">' + (i === 0 ? '<span class="date-tag">Next</span>' : "") +
      '<span class="date-day">' + HTS.fmtDate(d.date, false) + '</span></div><div class="sessions' + (list.length === 1 ? " one" : "") + '">' + sess + "</div></li>";
  }).join("");
};

/* ---------------- forms (Formspree, or email fallback) ---------------- */
HTS.sendForm = function (form, extra) {
  var status = form.querySelector(".form-status");
  var data = {};
  Array.prototype.forEach.call(form.elements, function (f) {
    if (!f.name) return;
    if (f.type === "checkbox") { data[f.name] = f.checked ? "yes" : "no"; return; }
    if (f.type === "radio") { if (f.checked) data[f.name] = f.value; return; }
    data[f.name] = f.value.trim();
  });
  for (var k in (extra || {})) data[k] = extra[k];
  if (!HTS.formspree && !HTS.sheetHook) {
    var lines = Object.keys(data).filter(function (k) { return k.charAt(0) !== "_"; }).map(function (k) { return k + ": " + data[k]; });
    location.href = "mailto:" + HTS.email + "?subject=" + encodeURIComponent(data._subject || "Website message") + "&body=" + encodeURIComponent(lines.join("\n"));
    status.textContent = "Your email app should open with this filled in. If it doesn't, write to " + HTS.email + ".";
    status.className = "form-status";
    return;
  }
  status.textContent = "Sending…"; status.className = "form-status";
  function done() {
    status.textContent = form.getAttribute("data-ok") || "Sent. We'll reply within one business day.";
    if (!document.getElementById("book")) {
      var nx = document.createElement("span");
      nx.innerHTML = ' Want to talk sooner? <a href="demo.html">Pick a time for a demo</a>.';
      status.appendChild(nx);
    }
    status.className = "form-status ok"; form.reset();
  }
  function fail() {
    status.textContent = "That didn't go through. Please email " + HTS.email + " instead.";
    status.className = "form-status err";
  }
  if (HTS.sheetHook) {
    data._page = location.pathname.replace(/^\//, "") || "home";
    fetch(HTS.sheetHook, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) }).then(done).catch(fail);
    return;
  }
  fetch("https://formspree.io/f/" + HTS.formspree, {
    method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data)
  }).then(function (r) { if (!r.ok) throw new Error(); done(); }).catch(fail);
};

/* required fields: name and a real-looking email before anything sends */
HTS.checkForm = function (form) {
  var first = null;
  form.querySelectorAll("[required]").forEach(function (el) {
    var v = (el.value || "").trim();
    var good = v !== "" && (el.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    el.setAttribute("aria-invalid", good ? "false" : "true");
    if (!good && !first) first = el;
    if (!el.dataset.checkWired) {
      el.dataset.checkWired = "1";
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") el.setAttribute("aria-invalid", "false"); });
    }
  });
  if (!first) return true;
  var st = form.querySelector(".form-status");
  if (st) { st.textContent = first.type === "email" ? "Please add a valid work email." : "Please add your name and work email."; st.className = "form-status err"; }
  first.focus();
  return false;
};

/* ---------------- wire up every page ---------------- */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-demo]").forEach(function (a) { a.href = HTS.demoBooking; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("[data-email]").forEach(function (e) { e.textContent = HTS.email; });
  document.querySelectorAll("[data-phone]").forEach(function (e) { e.textContent = HTS.phone; });
  document.querySelectorAll("[data-schedule]").forEach(HTS.renderSchedule);
  document.querySelectorAll("[data-next-date]").forEach(function (e) {
    var d = HTS.dates(1)[0];
    e.textContent = d ? HTS.fmtDate(d.date, true) : "coming soon";
  });

  /* top bar: shadow once scrolled, current tab kept in view on phones */
  var bar = document.querySelector(".topbar"), tabs = document.querySelector(".tabs");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  /* land at the top of every new page; clicking the current page's tab or the logo scrolls back to top */
  var nav0 = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (!location.hash && !(nav0 && nav0.type === "back_forward")) window.scrollTo(0, 0);
  document.querySelectorAll('.tab[aria-current], .topbar a.mark[href="#top"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" });
      if (location.hash) try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
    });
  });
  var cur = tabs && tabs.querySelector("[aria-current]");
  if (cur && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = cur.offsetLeft - (tabs.clientWidth - cur.offsetWidth) / 2;

  /* home page: highlight the tab for the section on screen */
  if (tabs && "IntersectionObserver" in window) {
    var links = {};
    tabs.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var ids = Object.keys(links).filter(function (id) { return document.getElementById(id); });
    if (ids.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var a = links[e.target.id];
          if (e.isIntersecting) { tabs.querySelectorAll(".active").forEach(function (x) { x.classList.remove("active"); }); a.classList.add("active"); }
          else a.classList.remove("active");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      ids.forEach(function (id) { io.observe(document.getElementById(id)); });
    }
  }

  /* home: training → practice → performance, follows hover, focus and tap */
  document.querySelectorAll("[data-stages]").forEach(function (box) {
    var btns = box.querySelectorAll(".st"), ind = box.querySelector(".st-ind"), panel = box.querySelector(".st-panel");
    function pick(b) {
      btns.forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      var we = b.classList.contains("we");
      ind.style.width = b.offsetWidth + "px"; ind.style.transform = "translateX(" + b.offsetLeft + "px)";
      ind.classList.toggle("we", we);
      panel.innerHTML = '<span class="st-tag' + (we ? " we" : "") + '">' + b.dataset.tag + "</span><p>" + b.dataset.text + "</p>";
      panel.classList.remove("fade"); void panel.offsetWidth; panel.classList.add("fade");
    }
    btns.forEach(function (b) {
      b.addEventListener("mouseenter", function () { pick(b); });
      b.addEventListener("focus", function () { pick(b); });
      b.addEventListener("click", function () { pick(b); });
    });
    pick(btns[0]);
    window.addEventListener("resize", function () { var sel = box.querySelector('.st[aria-selected="true"]'); if (sel) pick(sel); });
  });

  /* arriving from another page with #section: land exactly on it once fonts and dates have rendered */
  if (location.hash.length > 1) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) {
      var settle = function () { target.scrollIntoView({ block: "start" }); };
      requestAnimationFrame(settle);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(settle); });
      window.addEventListener("load", function () { requestAnimationFrame(settle); }, { once: true });
    }
  }

  /* on the home page, links to home sections jump in place instead of reloading */
  if (document.getElementById("programs")) {
    document.querySelectorAll('a[href^="index.html#"]').forEach(function (a) { a.setAttribute("href", a.getAttribute("href").slice(10)); });
  }

  /* pricing: "Email this estimate" opens the form right below, prefilled with the live numbers */
  var openEst = document.querySelector("[data-open-estimate]"), estForm = document.getElementById("estimate");
  if (openEst && estForm) {
    function reveal() {
      estForm.hidden = false; openEst.setAttribute("aria-expanded", "true");
      estForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(function () { var f = estForm.querySelector("input:not([type=hidden])"); if (f) f.focus({ preventScroll: true }); }, 350);
    }
    openEst.addEventListener("click", reveal);
    if (location.hash === "#estimate") reveal();
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#estimate"]');
      if (a) { e.preventDefault(); reveal(); }
    });
    window.addEventListener("hashchange", function () { if (location.hash === "#estimate") reveal(); });
    estForm.htsExtra = function () {
      var rows = document.querySelectorAll(".vpath li"), lines = [];
      rows.forEach(function (li) {
        var name = li.querySelector("b").childNodes[0].textContent.trim(), tot = li.querySelector(".tot");
        lines.push(name + ": " + (tot ? tot.textContent.trim() : ""));
      });
      var n = document.getElementById("tally-n").value;
      var tr = +n >= HTS.teamRate.min ? "\nTeam rate: " + Math.round(HTS.teamRate.off * 100) + "% off Kickoff, Pilot and Full Program (included above)" : "";
      return { _subject: "Pricing estimate for " + n + " people", estimate: "Founding rates for " + n + " people\n" + lines.join("\n") + tr };
    };
  }

  /* home: per-person tally for the pricing path */
  document.querySelectorAll("[data-tally]").forEach(function (box) {
    var inp = box.querySelector("input"), tots = box.querySelectorAll("[data-pp]");
    function money(v) { return "$" + Math.round(v).toLocaleString("en-US"); }
    function draw() {
      var n = Math.max(1, Math.min(200, parseInt(inp.value, 10) || 1));
      var team = n >= HTS.teamRate.min, off = team ? HTS.teamRate.off : 0;
      tots.forEach(function (t) {
        var d = t.hasAttribute("data-disc") && team;
        t.textContent = money(n * +t.dataset.pp * (d ? 1 - off : 1)) + (t.dataset.suffix || "");
        t.classList.toggle("disc-on", d);
        t.classList.remove("tick"); void t.offsetWidth; t.classList.add("tick");
      });
      var full = box.querySelector("[data-full]"), sv = box.querySelector("[data-save]"), nn = box.querySelector("[data-n]");
      if (full && sv) { sv.textContent = money(n * (+full.dataset.next - +full.dataset.pp * (1 - off))) + " less"; nn.textContent = n === 1 ? "1 person" : n + " people"; }
      var note = box.querySelector("[data-team-note]");
      if (note) {
        var t = HTS.teamRate, pct = Math.round(t.off * 100) + "%";
        if (n > t.max) note.innerHTML = "<b>Team rate applied:</b> " + pct + " off Kickoff, Pilot and Full Program. Over " + t.max + " people? <a href=\"custom.html\">Ask us for a cohort quote</a>.";
        else if (team) note.innerHTML = "<b>Team rate unlocked:</b> " + pct + " off Kickoff, Pilot and Full Program for teams of " + t.min + "–" + t.max + ".";
        else if (n >= t.min - 5) note.innerHTML = "Add " + (t.min - n) + " more " + (t.min - n === 1 ? "person" : "people") + " to unlock the team rate: " + pct + " off Kickoff, Pilot and Full Program.";
        else note.innerHTML = "";
        note.hidden = !note.innerHTML;
        note.classList.toggle("on", team);
      }
      document.querySelectorAll(".est-lead [data-n]").forEach(function (e) { e.textContent = n === 1 ? "1 person" : n + " people"; });
    }
    box.querySelectorAll("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () { inp.value = Math.max(1, Math.min(200, (parseInt(inp.value, 10) || 1) + +b.dataset.step)); draw(); });
    });
    inp.addEventListener("input", function () { if (inp.value !== "") draw(); });
    inp.addEventListener("change", function () { inp.value = Math.max(1, Math.min(200, parseInt(inp.value, 10) || 1)); draw(); });
    draw();
  });

  /* How it works: light the steps in order, then react to hover, focus and tap */
  document.querySelectorAll("[data-flow]").forEach(function (flow) {
    var cards = flow.querySelectorAll("li[data-step]");
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var byStep = {}; cards.forEach(function (c) { byStep[c.dataset.step] = c; });

    // 1 · prompt that types itself
    var tt = flow.querySelector(".typer-t");
    var asks = ["Telling my VP the date slipped", "Asking for two more engineers", "Saying no to a senior engineer", "My first performance review", "Asking him to stay late, again", "Pushing back on the customer"];
    if (tt && !still) {
      var ai = 0, ci = asks[0].length, dir = -1;
      setInterval(function () {
        var w = asks[ai];
        ci += dir; tt.textContent = w.slice(0, Math.max(0, ci));
        if (dir < 0 && ci <= 0) { ai = (ai + 1) % asks.length; dir = 1; }
        else if (dir > 0 && ci >= asks[ai].length) { dir = 0; setTimeout(function () { dir = -1; }, 1600); }
      }, 55);
    }

    // 2 · pushback bubble cycles while the card is active
    var actor = byStep.actor, pb = actor && actor.querySelector(".pb-pop"), pbT = null, pbI = 0;
    var lines = ["“Why am I only hearing about this now?”", "“That's not what you said last week.”", "“So what are you actually asking me?”", "“…”"];
    function pbOn() { if (!actor) return; actor.classList.add("show-pb"); if (still || pbT) return; pbT = setInterval(function () { pbI = (pbI + 1) % lines.length; pb.textContent = lines[pbI]; }, 1600); }
    function pbOff() { if (!actor) return; actor.classList.remove("show-pb"); clearInterval(pbT); pbT = null; }

    // 3 · each beat lights up its sentence in the ask
    var beats = flow.querySelectorAll(".quad em"), marks = flow.querySelectorAll(".story-p mark"), sp = flow.querySelector(".story-p");
    function beat(i) {
      beats.forEach(function (o) { o.classList.toggle("sel", +o.dataset.b === i); });
      marks.forEach(function (m) { m.classList.toggle("on", +m.dataset.b === i); });
      if (sp) sp.classList.toggle("focusing", i >= 0);
    }
    beats.forEach(function (q) {
      var i = +q.dataset.b;
      q.addEventListener("mouseenter", function () { beat(i); }); q.addEventListener("focus", function () { beat(i); });
      q.addEventListener("click", function (e) { e.stopPropagation(); beat(i); });
    });
    marks.forEach(function (m) { m.addEventListener("mouseenter", function () { beat(+m.dataset.b); }); });
    var story = byStep.story;
    if (story) story.addEventListener("mouseleave", function () { beat(-1); });

    // 4 · flip card
    var again = byStep.again;
    function flip(on) { if (again) again.classList.toggle("flipped", on); }

    // hover, focus and tap on each card
    cards.forEach(function (c) {
      c.addEventListener("mouseenter", function () { c.classList.add("focus"); if (c === actor) pbOn(); if (c === again) flip(true); });
      c.addEventListener("mouseleave", function () { c.classList.remove("focus"); if (c === actor) pbOff(); if (c === again) flip(false); });
      c.addEventListener("focus", function () { if (c === actor) pbOn(); if (c === again) flip(true); });
      c.addEventListener("blur", function () { if (c === actor) pbOff(); if (c === again) flip(false); });
      c.addEventListener("click", function () {
        if (c === actor) { actor.classList.contains("show-pb") ? pbOff() : pbOn(); }
        if (c === again) flip(!again.classList.contains("flipped"));
      });
    });

    // light up in order when the section scrolls into view
    function play() {
      flow.classList.add("played"); flow.style.setProperty("--p", 1);
      cards.forEach(function (c, i) { setTimeout(function () { c.classList.add("lit"); }, still ? 0 : 280 * i); });
      if (!still) {
        setTimeout(function () { pbOn(); setTimeout(pbOff, 2600); }, 600);
        setTimeout(function () { flip(true); setTimeout(function () { flip(false); }, 2200); }, 1300);
      }
    }
    if (still || !("IntersectionObserver" in window)) { play(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(flow);
  });

  /* Custom: scenario picker. Each tap previews the actor's opening line and adds the conversation to the request. */
  var sc = document.querySelector(".sc");
  if (sc) {
    var chipsEl = sc.querySelectorAll(".sc-chip"), msg = document.getElementById("cu-msg");
    var who = sc.querySelector("[data-sc-who]"), line = sc.querySelector("[data-sc-line]"), goal = sc.querySelector("[data-sc-goal]");
    var count = sc.querySelector("[data-sc-count]"), prev = sc.querySelector(".sc-preview");
    var custom = "";
    function preview(c) {
      who.textContent = c.dataset.who; line.textContent = "\u201C" + c.dataset.line + "\u201D"; goal.textContent = c.dataset.goal;
      prev.classList.remove("swap"); void prev.offsetWidth; prev.classList.add("swap");
    }
    function sync() {
      var picked = Array.prototype.filter.call(chipsEl, function (c) { return c.getAttribute("aria-pressed") === "true"; });
      count.textContent = picked.length ? picked.length + (picked.length === 1 ? " conversation" : " conversations") + " added to your request" : "Tap a conversation to add it";
      if (msg) {
        var listed = picked.map(function (c) { return "\u2022 " + c.textContent.trim(); }).join("\n");
        msg.value = listed + (listed && custom ? "\n\n" : "") + custom;
      }
    }
    chipsEl.forEach(function (c) {
      c.addEventListener("mouseenter", function () { preview(c); });
      c.addEventListener("focus", function () { preview(c); });
      c.addEventListener("click", function () {
        c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
        preview(c); sync();
      });
    });
    if (msg) msg.addEventListener("input", function () {
      custom = msg.value.split("\n").filter(function (l) { return l.indexOf("\u2022 ") !== 0; }).join("\n").replace(/^\n+/, "");
    });
  }

  /* the belief: underline "great storyteller" once it scrolls into view */
  document.querySelectorAll(".creed").forEach(function (c) {
    if (!("IntersectionObserver" in window)) { c.classList.add("seen"); return; }
    var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { c.classList.add("seen"); o.disconnect(); } }, { threshold: 0.5 });
    o.observe(c);
  });

  /* rotating reason: width locked to the longest word so nothing else moves */
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".rot[data-words]").forEach(function (el) {
    var words = el.dataset.words.split("|"), i = 0, inner = el.firstElementChild;
    function lock() {
      var probe = document.createElement("span"); probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
      el.appendChild(probe); var w = 0;
      words.forEach(function (x) { probe.textContent = x + "."; w = Math.max(w, probe.getBoundingClientRect().width); });
      el.removeChild(probe); el.style.width = Math.ceil(w) + "px";
    }
    lock(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(lock);
    window.addEventListener("resize", lock);
    if (reduce) return;
    setInterval(function () {
      i = (i + 1) % words.length; inner.className = "out";
      setTimeout(function () { inner.textContent = words[i] + "."; inner.className = "in"; }, 200);
    }, 1050);
  });

  /* phone bar: the next step stays under the thumb once you scroll past the hero */
  (function () {
    var onEvents = !!document.getElementById("open-lab");
    var bar = document.createElement("nav");
    bar.className = "mbar"; bar.setAttribute("aria-label", "Next step");
    bar.innerHTML = '<a class="btn btn-hot" href="' + (onEvents ? "#open-lab" : "index.html#open-lab") + '">Save a seat</a>' +
                    (document.getElementById("book") ? '<a class="btn btn-blue" href="#book">Pick a time</a>' : '<a class="btn btn-blue" href="demo.html">Book a demo</a>');
    document.body.appendChild(bar);
    function check() {
      var foot = Array.prototype.filter.call(document.querySelectorAll("footer"), function (f) { return f.offsetParent !== null; })[0];
      var past = window.scrollY > 480;
      var nearFoot = foot && foot.getBoundingClientRect().top < window.innerHeight - 40;
      bar.classList.toggle("up", past && !nearFoot);
    }
    window.addEventListener("scroll", check, { passive: true }); check();
  })();

  /* social icons: show the ones with a link */
  document.querySelectorAll("[data-social]").forEach(function (a) {
    var u = HTS.social && HTS.social[a.dataset.social];
    if (u) { a.href = u; a.hidden = false; } else { a.hidden = true; }
  });

  /* Save a seat without leaving the page (used until a Luma link is set) */
  if (!HTS.luma) {
    var dlg = document.createElement("dialog");
    dlg.className = "reg";
    dlg.innerHTML =
      '<form class="form" data-hts data-ok="You\'re in. We\'ll email the details within a day." novalidate>' +
      '<button type="button" class="reg-x" aria-label="Close">×</button>' +
      '<p class="eyebrow">Save a seat · free</p><h3 class="reg-h">Open Lab</h3><p class="reg-when" data-reg-when></p>' +
      '<input type="hidden" name="_subject" value="Open Lab registration"><input type="hidden" name="session" data-reg-session>' +
      '<div class="row"><div class="field"><label for="reg-name">Name</label><input id="reg-name" name="name" autocomplete="name" required></div>' +
      '<div class="field"><label for="reg-email">Work email</label><input id="reg-email" name="email" type="email" autocomplete="email" required></div></div>' +
      '<div class="row"><div class="field"><label for="reg-co">Company</label><input id="reg-co" name="company" autocomplete="organization"></div>' +
      '<div class="field"><label for="reg-role">Role</label><input id="reg-role" name="role" autocomplete="organization-title"></div></div>' +
      '<div class="field"><label for="reg-conv">What conversation do you want to practice?</label><textarea id="reg-conv" name="conversation" placeholder="Keep it general. For example: telling my VP the date slipped."></textarea></div>' +
      '<label class="reg-watch"><input type="checkbox" name="watch_only" value="yes"> I\'d rather watch this time</label>' +
      '<button class="btn btn-hot" type="submit">Save my seat</button><p class="form-status" role="status" aria-live="polite"></p></form>';
    document.body.appendChild(dlg);
    dlg.querySelector(".reg-x").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#register"]');
      if (!a) return;
      e.preventDefault();
      var sess = a.dataset.session || "";
      dlg.querySelector("[data-reg-when]").textContent = sess;
      dlg.querySelector("[data-reg-session]").value = sess;
      var st = dlg.querySelector(".form-status"); st.textContent = ""; st.className = "form-status";
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      setTimeout(function () { dlg.querySelector("#reg-name").focus(); }, 50);
    });
  }

  var copy = document.getElementById("copy-email");
  if (copy) copy.addEventListener("click", function () {
    var btn = this, el = document.getElementById("email");
    function sel() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected"; }
    try { navigator.clipboard.writeText(el.textContent).then(function () { btn.textContent = "Copied"; }, sel); } catch (e) { sel(); }
  });

  document.querySelectorAll("form[data-hts]").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!HTS.checkForm(f)) return;
      HTS.sendForm(f, typeof f.htsExtra === "function" ? f.htsExtra() : null);
    });
  });
});

/* rev 23: Kickoff request prefill + share */
(function () {
  document.addEventListener("click", function (e) {
    var k = e.target.closest && e.target.closest("[data-kickoff]");
    if (k) {
      var n = document.getElementById("tally-n"), m = document.getElementById("webs-msg");
      if (m) {
        var c = n ? parseInt(n.value, 10) || 1 : 1;
        m.value = "We'd like to start with a Kickoff for " + c + (c === 1 ? " person" : " people") + ". Please send available dates.";
        setTimeout(function () { var f = document.getElementById("webs-name"); if (f) f.focus({ preventScroll: true }); }, 600);
      }
    }
    var s = e.target.closest && e.target.closest("[data-share]");
    if (s && navigator.share && matchMedia("(pointer:coarse)").matches) {
      e.preventDefault();
      navigator.share({ title: "Harkness Training Solutions", text: "Live practice for hard conversations, with a trained actor.", url: "https://harknesstraining.com" }).catch(function () {});
    }
  });
})();

/* rev 27: Listen buttons appear only once the recording file exists */
(function () {
  var playing = null;
  document.querySelectorAll(".listen[data-audio]").forEach(function (b) {
    var a = new Audio(); a.preload = "metadata";
    a.addEventListener("loadedmetadata", function () { b.hidden = false; });
    a.addEventListener("ended", function () { b.classList.remove("on"); playing = null; });
    a.src = b.getAttribute("data-audio");
    b.addEventListener("click", function () {
      if (playing && playing !== a) { playing.pause(); document.querySelectorAll(".listen.on").forEach(function (x) { x.classList.remove("on"); }); }
      if (a.paused) { a.play(); b.classList.add("on"); playing = a; } else { a.pause(); b.classList.remove("on"); playing = null; }
    });
  });
})();

/* rev 28: recording players */
(function () {
  function init() {
  var cur = null;
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  document.querySelectorAll("[data-player]").forEach(function (card) {
    var au = card.querySelector("audio"), btn = card.querySelector(".play"), wf = card.querySelector(".wf"), tm = card.querySelector(".tm");
    var label = btn.getAttribute("aria-label"), total = tm.textContent;
    au.src = au.getAttribute("data-src");
    var bars = wf.getAttribute("data-peaks").split(",").map(function (v) {
      var b = document.createElement("b"); b.style.height = v + "%"; wf.appendChild(b); return b;
    });
    function paint() {
      var f = au.duration ? au.currentTime / au.duration : 0, k = Math.round(f * bars.length);
      bars.forEach(function (b, i) { b.classList.toggle("p", i < k); });
      wf.setAttribute("aria-valuenow", Math.round(f * 100));
      tm.textContent = au.currentTime > 0 && !au.ended ? fmt(au.currentTime) : (au.duration ? fmt(au.duration) : total);
    }
    function stop() { btn.classList.remove("on"); btn.setAttribute("aria-label", label); }
    au.addEventListener("timeupdate", paint);
    au.addEventListener("loadedmetadata", paint);
    au.addEventListener("pause", stop);
    au.addEventListener("ended", function () { stop(); au.currentTime = 0; paint(); });
    au.addEventListener("play", function () { btn.classList.add("on"); btn.setAttribute("aria-label", label.replace("Play", "Pause")); });
    btn.addEventListener("click", function () {
      if (cur && cur !== au) cur.pause();
      if (au.paused) { cur = au; au.play(); } else au.pause();
    });
    function seek(f) { if (!au.duration) return; au.currentTime = Math.min(au.duration, Math.max(0, f * au.duration)); paint(); }
    wf.addEventListener("click", function (e) {
      var r = wf.getBoundingClientRect(); seek((e.clientX - r.left) / r.width);
      if (au.paused) { if (cur && cur !== au) cur.pause(); cur = au; au.play(); }
    });
    wf.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); au.currentTime += e.key === "ArrowRight" ? 3 : -3; paint(); }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); btn.click(); }
    });
  });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* rev 32: tapping anywhere on a Take card plays or pauses it */
(function () {
  function init() {
    document.querySelectorAll("[data-player]").forEach(function (card) {
      var btn = card.querySelector(".play"), au = card.querySelector("audio");
      au.addEventListener("play", function () { card.classList.add("is-playing"); });
      au.addEventListener("pause", function () { card.classList.remove("is-playing"); });
      card.addEventListener("click", function (e) {
        if (e.target.closest(".play, .wf, a, button")) return;
        if (window.getSelection && String(window.getSelection()).length) return;
        btn.click();
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* rev 39: pricing opens on hover (or tap); send-to-manager menu that works without a mail app */
(function () {
  function init() {
    document.querySelectorAll("[data-tally]").forEach(function (box) {
      var cue = box.querySelector(".tally-cue"), t = null;
      if (!box.querySelector(".tally-body")) return;
      box.classList.add("collapsible");
      function open() { box.classList.add("open"); if (cue) cue.setAttribute("aria-expanded", "true"); }
      function close() { box.classList.remove("open"); if (cue) cue.setAttribute("aria-expanded", "false"); }
      var canHover = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
      // Hover opens it. It stays open after that, so the buttons below never jump while you move to them.
      var manual = false;
      if (canHover) box.addEventListener("mouseenter", function () { if (!manual) t = setTimeout(open, 120); });
      if (canHover) box.addEventListener("mouseleave", function () { clearTimeout(t); });
      if (cue) cue.addEventListener("click", function (e) { e.stopPropagation(); clearTimeout(t); manual = true; box.classList.contains("open") ? close() : open(); });
      box.querySelector(".tally-head").addEventListener("click", function (e) { if (!e.target.closest(".tally-cue")) open(); });
      box.addEventListener("focusin", function (e) { if (!e.target.closest(".tally-cue")) open(); });
      var inp = box.querySelector("input"); if (inp) inp.addEventListener("input", open);
      if (location.hash === "#programs" || location.hash === "#estimate") open();
    });

    var btn = document.querySelector("[data-share-menu]");
    if (!btn) return;
    var menu = document.getElementById("share-menu"), note = document.querySelector(".share-note");
    var subj = "Worth a look: Harkness Training";
    var body = "Harkness Training runs live practice for hard conversations, with a professional actor who pushes back. Free Open Lab every three weeks: https://harknesstraining.com";
    var enc = encodeURIComponent;
    var links = {
      gmail: "https://mail.google.com/mail/?view=cm&fs=1&su=" + enc(subj) + "&body=" + enc(body),
      outlook: "https://outlook.office.com/mail/deeplink/compose?subject=" + enc(subj) + "&body=" + enc(body),
      mailto: "mailto:?subject=" + enc(subj) + "&body=" + enc(body)
    };
    menu.querySelectorAll("a[data-share-to]").forEach(function (a) { a.href = links[a.dataset.shareTo]; });
    function show(on) { menu.hidden = !on; btn.setAttribute("aria-expanded", on ? "true" : "false"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (navigator.share && matchMedia("(pointer:coarse)").matches) {
        navigator.share({ title: subj, text: body.replace(/: https:\/\/harknesstraining\.com$/, "."), url: "https://harknesstraining.com" }).catch(function () {});
        return;
      }
      show(menu.hidden);
    });
    menu.addEventListener("click", function (e) {
      var it = e.target.closest("[data-share-to]"); if (!it) return;
      if (it.dataset.shareTo === "copy") {
        var done = function () { note.textContent = "Link copied. Paste it into a message to your manager."; };
        var fail = function () { note.textContent = "Copy this link: https://harknesstraining.com"; };
        try { navigator.clipboard.writeText(subj + "\n\n" + body).then(done, fail); } catch (_) { fail(); }
      }
      show(false);
    });
    document.addEventListener("click", function (e) { if (!menu.hidden && !e.target.closest(".share-wrap")) show(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { show(false); btn.focus(); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
