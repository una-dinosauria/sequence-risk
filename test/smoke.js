// End-to-end sanity: taxes, the deterministic cash-flow plan, and one full run.
const t = require("./harness.js");
const S = t.S;

console.log("--- Ontario tax on employment income ---");
[500000, 300000, 150000].forEach(g =>
  console.log("  gross", String(g).padStart(7), "-> take-home", String(Math.round(t.afterTaxIncome(g))).padStart(7),
    " effective", ((1 - t.afterTaxIncome(g) / g) * 100).toFixed(1) + "%"));

const pre = t.precompute(S);
console.log("\n--- deterministic plan ---");
console.log("  horizon", pre.N, "years   starting portfolio", t.money(pre.startPort));
console.log("  mortgage year 1:", Math.round(pre.sched[0].paid), "paid,", Math.round(pre.sched[0].balEnd), "left");
console.log("  mortgage clears in year", pre.sched.findIndex(x => x.balEnd <= 0.02) + 1);
console.log("  this year: income", t.money(pre.income[0]), "outflow", t.money(pre.outflow[0]),
  "net", t.money(pre.net[0]));

const lp = t.logParams(S);
console.log("\n--- return parameters ---");
console.log("  median compound growth", ((Math.exp(lp.muLog) - 1) * 100).toFixed(2) + "%",
  " (from", (S.realReturn - S.drag).toFixed(2) + "% arithmetic)");

const res = t.simulate(S, 5000, 7), an = t.analyse(res);
console.log("\n--- 5,000 lifetimes ---");
console.log("  survived", res.success.toFixed(2) + "%   failed", an.failList.length);
[0, 13, 25, 40, an.N].forEach(y => console.log("   age", String(S.youAge + y).padStart(3),
  " P5", t.money(an.bands[0][y]).padStart(8), " median", t.money(an.bands[3][y]).padStart(8),
  " P95", t.money(an.bands[6][y]).padStart(8), " ruin", an.ruin[y].toFixed(1) + "%"));
console.log("  safe spending at 90% odds:", t.money(t.solveSafeSpend(S, 90, 800, 44)));
