/* Homepage rewrite preview only. Loaded by preview/home-rewrite.html.
   Shared site.js is unchanged. This file adjusts the schedule, the phone
   bar, and the registration dialog to the rewrite, and drops GA4 events
   so a review visit cannot record session_video_play, session_video_complete,
   cta_click, or demo_request. */
(function () {
  window.htsEvent = function () {};

  if (typeof HTS === "undefined" || typeof HTS.renderSchedule !== "function") return;

  HTS.renderSchedule = function (el) {
    var n = parseInt(el.getAttribute("data-count") || HTS.openNight.show, 10);
    var dates = HTS.dates(n);
    if (!dates.length) {
      el.outerHTML = '<p class="dates-empty">New dates are coming soon. Email ' + HTS.email + ' to hear first.</p>';
      return;
    }
    el.innerHTML = dates.map(function (d, i) {
      var o = HTS.openNight;
      var list = HTS.hasInPerson(d.iso) ? [o.online, o.inPerson] : [o.online];
      var sess = list.map(function (s) {
        var ext = HTS.luma ? ' target="_blank" rel="noopener"' : "";
        return '<div class="session ' + (s === HTS.openNight.online ? "s-online" : "s-inperson") + '"><span class="fmt">' + s.label + '</span><span class="when">' + s.time + '</span><span class="where">' + s.where + '</span>' +
          '<a class="btn btn-hot" href="' + HTS.registerLink(d, s) + '"' + ext + ' data-session="' + HTS.fmtDate(d.date, true) + ' · ' + s.label + ' · ' + s.time + '" aria-label="Save a free Open Lab seat, ' + s.label + ', ' + HTS.fmtDate(d.date, true) + '">Save a free Open Lab seat</a></div>';
      }).join("");
      return '<li class="date' + (i === 0 ? " next" : "") + '"><div class="date-head">' + (i === 0 ? '<span class="date-tag">Next</span>' : "") +
        '<span class="date-day">' + HTS.fmtDate(d.date, true) + '</span><span class="date-sub">Free · 90 minutes</span></div><div class="sessions' + (list.length === 1 ? " one" : "") + '">' + sess + "</div></li>";
    }).join("");
  };

  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.querySelector(".mbar");
    if (bar) {
      var book = document.getElementById("book");
      bar.innerHTML = '<a class="btn btn-hot" href="#open-lab">Save a free Open Lab seat</a>' +
        (book
          ? '<a class="btn btn-ghost" href="#book">Book a 30-minute demo</a>'
          : '<a class="btn btn-ghost" href="../demo.html">Book a 30-minute demo</a>');
    }
    var heading = document.querySelector("dialog.reg .reg-h");
    if (heading) heading.textContent = "Save a free Open Lab seat";
    var eyebrow = document.querySelector("dialog.reg .eyebrow");
    if (eyebrow) eyebrow.remove();
  });
})();
