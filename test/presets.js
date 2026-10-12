// Presets are what-ifs over your own numbers: picking one must not discard
// your edits, edits made under a preset must survive leaving it, and the
// arrangement must survive a reload.
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
const load = () => { delete require.cache[require.resolve("./harness.js")]; return require("./harness.js"); };

let t = load();
let bad = 0;
const ok = (name, cond, detail) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (detail ? "   " + detail : ""));
  if (!cond) bad++;
};
const edit = (k, v) => { t.S[k] = v; t.onChange(); };

// your own numbers
edit("youAssets", 5085194);
edit("spend", 200000);
edit("youAge", 45);

t.applyPreset(6);   // tighten in bad years
ok("a preset keeps your numbers", t.S.youAssets === 5085194 && t.S.spend === 200000 && t.S.youAge === 45);
ok("a preset applies its own change", t.S.flex === true);

edit("vol", 20);
ok("an edit under a preset stays on screen", t.S.vol === 20 && t.S.flex === true && t.activePreset === 6);

t.applyPreset(0);   // my numbers
ok("leaving a preset removes only its change", t.S.flex === false);
ok("edits made under a preset survive leaving it", t.S.vol === 20 && t.S.spend === 200000);

t.applyPreset(5);   // rough century
t.applyPreset(6);   // straight to another preset
ok("switching presets does not stack them", t.S.realReturn === 5 && t.S.fatTails === false && t.S.flex === true,
  JSON.stringify([t.S.realReturn, t.S.fatTails, t.S.flex]));

t.applyPreset(2);   // stop today
ok("'Stop today' uses today's ages, not the example's", t.S.youRetire === 45 && t.S.pRetire === t.S.pAge);

t.applyPreset(1);   // both retire at 55
edit("youRetire", 57);
ok("editing a value the preset set makes the screen your numbers",
  t.activePreset === 0 && t.S.youRetire === 57 && t.S.pRetire === 55 && t.mine === null);

t.S.events.splice(0, 1);  // remove "Kids — the expensive years"
t.S.events.push({ on: true, name: "Sabbatical", age: 50, years: 1, amount: 80000, inflow: false });
t.onChange();
t.applyPreset(4);   // kids + upsize
const names = t.S.events.filter(e => e.on).map(e => e.name);
ok("'Kids + upsize' raises your spending rather than replacing it", t.S.spend === 222000, String(t.S.spend));
ok("'Kids + upsize' turns its events on by name and keeps yours",
  names.includes("Kids — the expensive years") && names.includes("University × 2") &&
  names.includes("Upsize the house") && names.includes("Sabbatical"), names.join(", "));

// reload while a preset is showing
edit("seed", 9);
t = load();
ok("a reload keeps the preset showing", t.activePreset === 4 && t.S.spend === 222000 && t.S.seed === 9);
t.applyPreset(0);
ok("…and can still take it off afterwards", t.S.spend === 200000 && t.S.seed === 9 &&
  t.S.events.filter(e => e.on).map(e => e.name).join() === "Sabbatical", JSON.stringify([t.S.spend, t.S.seed]));

console.log(bad ? "\n" + bad + " check(s) failed" : "\nall checks passed");
process.exit(bad ? 1 : 0);
