import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sheetHook = "https://script.google.com/macros/s/AKfycbw3aS7Oo1EQxCYNcoiulnnb9To3fZLwzPn9pJxin917fWLGlcNr1jACo_WDErk1jCEmjw/exec";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("chip page stays out of the index, nav, and llm files", () => {
  const chip = read("chip.html");
  const banned = [/seek discomfort/i, /\bworkshop\b/i, /soft skills/i, /\bcoaching\b/i];
  for (const re of banned) assert.equal(re.test(chip), false, re.source);
  const copy = chip
    .replace(/<!doctype html>/i, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  assert.equal(copy.includes("!"), false);
  assert.match(chip, /<meta name="robots" content="noindex">/);
  assert.equal(/you got the chip/i.test(chip), false);
  assert.equal(chip.includes('class="eyebrow"'), false);
  assert.match(chip, /Practice before it gets real\./);
  assert.match(chip, /<span>Bring the conversation you keep putting off\.<\/span><span>Run it with an actor who pushes back\.<\/span>/);
  assert.equal(chip.includes("Free."), false);
  assert.match(chip, /data-ol-film/);
  assert.match(chip, /data-film="openlab-practice-v5"/);
  assert.match(chip, /openlab-practice-desktop\.mp4/);
  assert.match(chip, /openlab-practice-mobile\.mp4/);
  assert.equal(/<track\b/i.test(chip), false);
  assert.match(chip, /Save my free Open Lab seat/);
  assert.match(chip, /data-cta-label="chip: book demo" data-cta-location="chip"[^>]*>Book a demo</);
  assert.match(chip, /Not for you\? Pass the chip to a manager who needs it\./);
  const seatBtn = chip.match(/<a[^>]*data-cta-label="chip: open lab seat"[^>]*>/)[0];
  const demoBtn = chip.match(/<a[^>]*data-cta-label="chip: book demo"[^>]*>/)[0];
  assert.match(seatBtn, /href="open-lab.html#register"/);
  assert.equal(seatBtn.includes("utm_"), false);
  assert.match(demoBtn, /href="demo.html"/);
  assert.equal(demoBtn.includes("target="), false);
  assert.equal(demoBtn.includes("calendar.app.google"), false);
  assert.equal(/20-minute/i.test(chip), false);
  assert.match(chip, /campaign_source: 'chip'/);
  assert.match(chip, /campaign_medium: 'qr'/);
  assert.match(chip, /campaign_name: 'poker-chip'/);
  assert.match(chip, /data-cta-label="chip: open lab seat"/);
  assert.match(chip, /data-cta-label="chip: book demo"/);
  assert.match(chip, /data-cta-location="chip"/);
  assert.match(read("assets/site.js"), /Where did you get your chip\?/);
  assert.equal(chip.includes('href="chip'), false);
  assert.equal(/nav[\s\S]*chip\.html/.test(chip), false);

  const listed = ["sitemap.xml", "llms.txt", "llms-full.txt", "robots.txt"];
  for (const file of listed) assert.equal(read(file).includes("/chip"), false, file);

  for (const file of fs.readdirSync(root).filter((name) => name.endsWith(".html") && name !== "chip.html")) {
    const html = read(file);
    assert.equal(html.includes("chip.html"), false, file);
    assert.equal(html.includes('href="/chip"'), false, file);
  }
  assert.equal(read("assets/site.js").includes(sheetHook), true);
});

function contentType(file) {
  const ext = path.extname(file);
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp"
  }[ext] || "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    let file = path.normalize(path.join(root, pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const html = file.endsWith(".html") ? file : file + ".html";
      if (fs.existsSync(html) && fs.statSync(html).isFile()) file = html;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "content-type": contentType(file), "cache-control": "no-store" });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.next = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (!msg.id || !this.pending.has(msg.id)) return;
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result || {});
    });
  }
  send(method, params, sessionId) {
    const id = ++this.next;
    const msg = { id, method, params: params || {} };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(msg));
    });
  }
}

const FETCH_STUB = `
window.__posts = [];
window.fetch = function (url, opts) {
  var body = "";
  try { body = opts && opts.body && opts.body.toString ? opts.body.toString() : ""; } catch (e) {}
  window.__posts.push({ url: String(url), body: body, mode: opts && opts.mode || "" });
  return Promise.resolve({ ok: true });
};
`;

async function launchChrome() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--remote-debugging-port=0",
    "--user-data-dir=/tmp/hts-chip-chrome"
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let buf = "";
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("chrome did not open a debug port")), 20000);
    chrome.stderr.on("data", (chunk) => {
      buf += chunk.toString();
      const match = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    chrome.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("chrome exited " + code + " " + buf));
    });
  });
  const version = await fetch("http://127.0.0.1:" + port + "/json/version").then((r) => r.json());
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  const cdp = new Cdp(ws);
  return {
    cdp,
    async close() {
      try { ws.close(); } catch (e) {}
      chrome.kill("SIGKILL");
    }
  };
}

async function openPage(cdp, url) {
  const { browserContextId } = await cdp.send("Target.createBrowserContext");
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: FETCH_STUB }, sessionId);
  await cdp.send("Page.navigate", { url }, sessionId);
  return { sessionId, browserContextId };
}

async function evaluate(cdp, sessionId, expression) {
  const out = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  }, sessionId);
  if (out.exceptionDetails) throw new Error(JSON.stringify(out.exceptionDetails));
  return out.result ? out.result.value : undefined;
}

async function waitFor(cdp, sessionId, expression, ms = 10000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < ms) {
    last = await evaluate(cdp, sessionId, expression);
    if (last) return last;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("timed out waiting for " + expression + " last=" + JSON.stringify(last));
}

async function submitRegistration(cdp, sessionId, where) {
  await waitFor(cdp, sessionId, `document.querySelector("dialog.reg") && document.querySelector("dialog.reg").open`);
  await evaluate(cdp, sessionId, `
    HTS.sheetHook = "http://127.0.0.1/stub-hook";
    document.querySelector("#reg-name").value = "Test Person";
    document.querySelector("#reg-email").value = "test.person@example.com";
    document.querySelector("#reg-conv").value = "telling my VP the date slipped";
    ${where == null ? "" : `document.querySelector("#reg-chip").value = ${JSON.stringify(where)};`}
    document.querySelector("dialog.reg form").requestSubmit();
    true
  `);
  await waitFor(cdp, sessionId, `window.__posts.some(function (p) { return p.url.indexOf("stub-hook") !== -1 && p.body.indexOf("name=Test") !== -1; })`);
  const posts = await evaluate(cdp, sessionId, `window.__posts`);
  const formPosts = posts.filter((p) => p.url.includes("stub-hook"));
  if (formPosts.length !== 1) throw new Error("registration posts " + JSON.stringify(posts));
  return { params: Object.fromEntries(new URLSearchParams(formPosts[0].body)), posts, formPosts };
}

const LAYER = `(function () {
  return Array.prototype.map.call(window.dataLayer || [], function (args) {
    if (!args || (args[0] !== "event" && args[0] !== "config")) return null;
    var params = args[2] || null;
    var copy = null;
    if (params && typeof params === "object") {
      copy = {};
      for (var k in params) {
        var v = params[k];
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") copy[k] = v;
      }
    }
    return { cmd: args[0], name: args[1], params: copy };
  }).filter(Boolean);
})()`;

async function layer(cdp, sessionId) {
  return evaluate(cdp, sessionId, LAYER);
}

async function eventsNamed(cdp, sessionId, name) {
  await waitFor(cdp, sessionId, `(function () {
    return Array.prototype.some.call(window.dataLayer || [], function (a) { return a && a[0] === "event" && a[1] === ${JSON.stringify(name)}; });
  })()`);
  return (await layer(cdp, sessionId)).filter((e) => e.name === name);
}

test("registration payload includes the chip field and never calls Apps Script", async (t) => {
  const server = await startServer();
  const origin = "http://127.0.0.1:" + server.address().port;
  const chrome = await launchChrome();
  t.after(async () => {
    await chrome.close();
    await new Promise((resolve) => server.close(resolve));
  });

  const chipVisit = await openPage(chrome.cdp, origin + "/open-lab?utm_source=chip&utm_medium=offline&utm_campaign=chip-openlab#register");
  const sent = await submitRegistration(chrome.cdp, chipVisit.sessionId, "the networking table");
  assert.equal(sent.formPosts.length, 1);
  assert.equal(sent.formPosts[0].url, "http://127.0.0.1/stub-hook");
  assert.equal(sent.posts.some((p) => p.url.includes("script.google.com")), false);
  assert.equal(sent.params.source, "chip");
  assert.equal(sent.params.chip_where, "the networking table");
  assert.match(sent.params.conversation, /telling my VP the date slipped/);
  assert.match(sent.params.conversation, /\[chip\] got it at: the networking table/);
  assert.equal(sent.params._subject, "Open Lab registration");
  const fieldShown = await evaluate(chrome.cdp, chipVisit.sessionId, `document.querySelector("[data-chip-field]").hidden === false && document.querySelector("#reg-chip").name === "chip_where" && document.querySelector("[data-chip-field] label").textContent === "Where did you get your chip?"`);
  assert.equal(fieldShown, true);
  const seatEvents = await eventsNamed(chrome.cdp, chipVisit.sessionId, "seat_saved");
  assert.equal(seatEvents.length, 1);
  assert.equal(seatEvents[0].params.source, "chip");
  const scanOnUtm = (await layer(chrome.cdp, chipVisit.sessionId)).filter((e) => e.name === "chip_scan");
  assert.equal(scanOnUtm.length, 1);
  assert.deepEqual(scanOnUtm[0].params, { source: "chip", medium: "qr", campaign: "poker-chip" });

  const blank = await evaluate(chrome.cdp, chipVisit.sessionId, `
    window.__posts = [];
    HTS.sheetHook = "http://127.0.0.1/stub-hook";
    document.querySelector("#reg-name").value = "Test Person";
    document.querySelector("#reg-email").value = "test.person@example.com";
    document.querySelector("#reg-conv").value = "telling my VP the date slipped";
    document.querySelector("#reg-chip").value = "   ";
    document.querySelector("dialog.reg form").requestSubmit();
    true
  `);
  assert.equal(blank, true);
  const blankBody = await waitFor(chrome.cdp, chipVisit.sessionId, `(window.__posts.find(function (p) { return p.body.indexOf("name=Test") !== -1; }) || {}).body || ""`);
  const blankParams = Object.fromEntries(new URLSearchParams(blankBody));
  assert.equal(blankParams.source, "chip");
  assert.equal(blankParams.chip_where, "");
  assert.match(blankParams.conversation, /\[chip\]$/);
  assert.equal(blankParams.conversation.includes("got it at:"), false);

  const plain = await openPage(chrome.cdp, origin + "/open-lab#register");
  const plainSent = await submitRegistration(chrome.cdp, plain.sessionId, null);
  assert.equal(plainSent.params.source, undefined);
  assert.equal(plainSent.params.chip_where, undefined);
  assert.equal(plainSent.params.conversation, "telling my VP the date slipped");
  assert.equal(plainSent.posts.some((p) => p.url.includes("script.google.com")), false);
  const fieldHidden = await evaluate(chrome.cdp, plain.sessionId, `document.querySelector("[data-chip-field]").hidden === true && document.querySelector("#reg-chip").name === ""`);
  assert.equal(fieldHidden, true);
  const plainSeat = await eventsNamed(chrome.cdp, plain.sessionId, "seat_saved");
  assert.equal(plainSeat.length, 1);
  assert.equal(plainSeat[0].params.source, undefined);
  assert.equal((await layer(chrome.cdp, plain.sessionId)).some((e) => e.name === "chip_scan"), false);

  const typed = await openPage(chrome.cdp, origin + "/chip");
  await waitFor(chrome.cdp, typed.sessionId, `document.querySelector("[data-cta-label='chip: open lab seat']")`);
  const doors = await evaluate(chrome.cdp, typed.sessionId, `({
    openLab: document.querySelector("[data-cta-label='chip: open lab seat']").getAttribute("href"),
    demo: document.querySelector("[data-cta-label='chip: book demo']").href,
    stored: sessionStorage.getItem("hts_utm_source"),
    bar: document.querySelector(".mbar") ? "yes" : "no"
  })`);
  assert.equal(doors.openLab, "open-lab.html#register");
  assert.equal(doors.demo, origin + "/demo.html");
  assert.equal(doors.stored, null);
  assert.equal(doors.bar, "no");
  const typedLayer = await layer(chrome.cdp, typed.sessionId);
  assert.equal(typedLayer.some((e) => e.name === "chip_scan"), false);
  const typedConfig = typedLayer.find((e) => e.cmd === "config" && e.name === "G-5YFXNQWRPW");
  assert.ok(typedConfig);
  assert.equal(typedConfig.params, null);
  const events = await evaluate(chrome.cdp, typed.sessionId, `
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (a) e.preventDefault();
    }, true);
    document.querySelector("[data-cta-label='chip: open lab seat']").click();
    document.querySelector("[data-cta-label='chip: book demo']").click();
    Array.prototype.map.call(window.dataLayer, function (args) {
      return { a: args[0], name: args[1], params: args[2] || null };
    }).filter(function (e) { return e.name === "cta_click"; });
  `);
  assert.deepEqual(events, [
    { a: "event", name: "cta_click", params: { label: "chip: open lab seat", location: "chip" } },
    { a: "event", name: "cta_click", params: { label: "chip: book demo", location: "chip" } }
  ]);

  const scanned = await openPage(chrome.cdp, origin + "/chip?s=qr");
  await waitFor(chrome.cdp, scanned.sessionId, `document.querySelector("[data-cta-label='chip: book demo']")`);
  await eventsNamed(chrome.cdp, scanned.sessionId, "chip_scan");
  const scanLayer = await layer(chrome.cdp, scanned.sessionId);
  const scanConfig = scanLayer.find((e) => e.cmd === "config" && e.name === "G-5YFXNQWRPW");
  const scanEvent = scanLayer.find((e) => e.name === "chip_scan");
  assert.ok(scanConfig && scanEvent);
  assert.ok(scanLayer.indexOf(scanConfig) < scanLayer.indexOf(scanEvent));
  assert.equal(scanConfig.params.campaign_source, "chip");
  assert.equal(scanConfig.params.campaign_medium, "qr");
  assert.equal(scanConfig.params.campaign_name, "poker-chip");
  assert.match(scanConfig.params.page_location, /[?&]utm_source=chip(&|$)/);
  assert.match(scanConfig.params.page_location, /[?&]utm_medium=qr(&|$)/);
  assert.match(scanConfig.params.page_location, /[?&]utm_campaign=poker-chip(&|$)/);
  assert.deepEqual(scanEvent.params, { source: "chip", medium: "qr", campaign: "poker-chip" });
  assert.equal(await evaluate(chrome.cdp, scanned.sessionId, `sessionStorage.getItem("hts_utm_source")`), "chip");

  await evaluate(chrome.cdp, scanned.sessionId, `document.querySelector("[data-cta-label='chip: book demo']").click()`);
  await waitFor(chrome.cdp, scanned.sessionId, `location.pathname === "/demo.html" && document.querySelector("h1") && document.querySelector("h1").textContent === "Book your demo"`);
  const booked = await evaluate(chrome.cdp, scanned.sessionId, `
    window.dispatchEvent(new MessageEvent("message", { origin: "https://calendar.google.com", data: "booking_confirmed" }));
    (function () {
      var hit = null;
      Array.prototype.forEach.call(window.dataLayer || [], function (a) {
        if (a && a[0] === "event" && a[1] === "demo_request") hit = { source: (a[2] && a[2].source) || "", page_path: a[2] && a[2].page_path };
      });
      return hit;
    })()
  `);
  assert.deepEqual(booked, { source: "chip", page_path: "demo.html" });
  assert.equal(await evaluate(chrome.cdp, scanned.sessionId, `sessionStorage.getItem("hts_utm_source")`), "chip");

  await chrome.cdp.send("Page.navigate", { url: origin + "/open-lab#register" }, scanned.sessionId);
  await waitFor(chrome.cdp, scanned.sessionId, `document.querySelector("dialog.reg") && document.querySelector("dialog.reg").open && document.querySelector("[data-chip-field]").hidden === false`);
  assert.equal((await layer(chrome.cdp, scanned.sessionId)).some((e) => e.name === "chip_scan"), false);
  const hopped = await submitRegistration(chrome.cdp, scanned.sessionId, "passed across the table");
  assert.equal(hopped.params.source, "chip");
  assert.equal(hopped.params.chip_where, "passed across the table");
  assert.match(hopped.params.conversation, /\[chip\] got it at: passed across the table/);
  assert.equal(hopped.posts.some((p) => p.url.includes("script.google.com")), false);
  const hoppedSeat = await eventsNamed(chrome.cdp, scanned.sessionId, "seat_saved");
  assert.equal(hoppedSeat.length, 1);
  assert.equal(hoppedSeat[0].params.source, "chip");

  const demoPlain = await openPage(chrome.cdp, origin + "/demo");
  await waitFor(chrome.cdp, demoPlain.sessionId, `document.querySelector("h1") && document.querySelector("h1").textContent === "Book your demo"`);
  const plainDemo = await evaluate(chrome.cdp, demoPlain.sessionId, `
    window.dispatchEvent(new MessageEvent("message", { origin: "https://calendar.google.com", data: "booking_confirmed" }));
    (function () {
      var hit = null;
      Array.prototype.forEach.call(window.dataLayer || [], function (a) {
        if (a && a[0] === "event" && a[1] === "demo_request") hit = a[2] || {};
      });
      return hit;
    })()
  `);
  assert.equal(plainDemo.page_path, "demo");
  assert.equal(plainDemo.source, undefined);
});
