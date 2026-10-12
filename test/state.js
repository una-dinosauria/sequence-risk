// Shared links and saved state are untrusted input: a crafted #s= link must not
// be able to put markup into the page, and once read it must leave the URL so
// later edits survive a reload.
const encode = o => Buffer.from(JSON.stringify(o)).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const evil = '<img src=x onerror=alert(1)>';
const replaced = [];
global.location = {
  hash: "#s=" + encode({
    youRetire: evil, flexCut: evil, fatTails: "yes", spend: 1e12, youAge: 41.6, paths: "3000",
    events: [{ on: true, name: evil, age: "<b>", years: 999, amount: -5, inflow: 1 }, "junk", null]
  }),
  href: "file:///x/index.html#s=…"
};
global.history = { replaceState: (a, b, url) => replaced.push(url) };

const t = require("./harness.js");
const S = t.S;
let bad = 0;
const ok = (name, cond, detail) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (detail ? "   " + detail : ""));
  if (!cond) bad++;
};

ok("markup in a numeric field falls back to the default", S.youRetire === 60 && S.flexCut === 20,
  JSON.stringify([S.youRetire, S.flexCut]));
ok("toggles accept only true", S.fatTails === false);
ok("numbers are clamped to the control's range", S.spend === 600000, String(S.spend));
ok("integer fields are rounded", S.youAge === 42, String(S.youAge));
ok("numeric strings are read as numbers", S.paths === 3000, JSON.stringify(S.paths));
const ev = S.events;
ok("non-object events are dropped", ev.length === 1, ev.length + " event(s)");
ok("event fields are coerced and clamped",
  ev[0].age === 65 && ev[0].years === 60 && ev[0].amount === 0 && ev[0].inflow === false && ev[0].on === true,
  JSON.stringify(ev[0]));
ok("event names stay plain strings", typeof ev[0].name === "string");

const html = ["verdictNote", "tiles", "traceNote", "cashflow"]
  .map(id => document.getElementById(id).innerHTML).join("");
ok("no injected markup reaches the page", !html.includes("onerror"));

ok("the link is cleared from the address bar once read",
  replaced.length === 1 && replaced[0] === "file:///x/index.html", JSON.stringify(replaced));

const empty = t.merge(null);
ok("a non-object state falls back to the defaults", empty.youAge === 40 && empty.events.length === 5);

console.log(bad ? "\n" + bad + " check(s) failed" : "\nall checks passed");
process.exit(bad ? 1 : 0);
