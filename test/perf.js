// The main run happens on every slider move, so it has an interactive budget.
const t = require("./harness.js");
const S = t.S;
const time = (label, fn) => {
  const a = process.hrtime.bigint(); fn(); const b = process.hrtime.bigint();
  console.log("  " + label.padEnd(36) + (Number(b - a) / 1e6).toFixed(1) + " ms");
};
console.log("--- timings ---");
time("simulate 5,000 + analyse", () => t.analyse(t.simulate(S, 5000, 7)));
time("simulate 5,000 fat tails + analyse", () => t.analyse(t.simulate(Object.assign({}, S, { fatTails: true }), 5000, 7)));
time("simulate 20,000 + analyse", () => t.analyse(t.simulate(S, 20000, 7)));
time("solveSafeSpend (1,000 paths)", () => t.solveSafeSpend(S, 90, 1000, 44));
time("sensitivity (16 x 2,000 paths)", () => t.sensitivity(S));
