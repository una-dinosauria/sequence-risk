// Checks the parts that are easy to get quietly wrong:
// the drawn return distribution, and reconstructing a path's returns.
const t = require("./harness.js");
const S = t.S;
const res = t.simulate(S, 5000, 7), an = t.analyse(res);
let bad = 0;
const ok = (name, cond, detail) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (detail ? "   " + detail : ""));
  if (!cond) bad++;
};

// 1. paths are ranked by how the lifetime ended, so the UI can fetch
//    "the 10th-percentile life" rather than merely the 10th-percentile number
const endOf = i => res.vals[an.N * res.nPaths + an.order[i]];
let monotone = true;
for (let i = 1; i < an.n; i++) if (endOf(i) < endOf(i - 1)) monotone = false;
ok("order[] ranks paths by ending wealth", monotone);

// 2. annual returns must be recoverable exactly from a trajectory, since the
//    cash flows are deterministic: balance, then flow, then market
const p = t.pickPath("p10", an);
const rets = t.pathReturns(res, p), traj = t.pathTrajectory(res, p);
const pre = res.pre, grossUp = 1 / (1 - t.clamp(S.retTax / 100, 0, 0.7));
let port = pre.startPort, maxErr = 0;
for (let y = 0; y < pre.N; y++) {
  const nf = pre.net[y];
  let mid = nf >= 0 ? port + nf : port - (-nf) * grossUp;
  if (mid <= 0) mid = 0;
  port = mid * (1 + rets[y]);
  if (!isFinite(rets[y])) { port = 0; continue; }
  maxErr = Math.max(maxErr, Math.abs(port - traj[y + 1]) / Math.max(1, traj[y + 1]));
}
ok("path returns replay the trajectory exactly", maxErr === 0, "max rel. error " + maxErr.toExponential(2));

// 3. sigma is entered as the SD of the return, not of its logarithm
let sum = 0, sq = 0, k = 0;
for (let pp = 0; pp < 600; pp++) {
  const r = t.pathReturns(res, pp);
  for (let y = 0; y < pre.N; y++) if (isFinite(r[y])) { sum += r[y]; sq += r[y] * r[y]; k++; }
}
const mu = sum / k * 100, sd = Math.sqrt(sq / k - (sum / k) ** 2) * 100;
const muTarget = S.realReturn - S.drag, sdTarget = S.vol;
ok("arithmetic mean matches the input", Math.abs(mu - muTarget) < 0.15,
  mu.toFixed(2) + "% vs " + muTarget.toFixed(2) + "%");
ok("standard deviation matches the input", Math.abs(sd - sdTarget) < 0.25,
  sd.toFixed(2) + "% vs " + sdTarget.toFixed(2) + "%");

// 4. a fixed seed must give a reproducible run
ok("same seed reproduces the run", t.simulate(S, 2000, 7).success === t.simulate(S, 2000, 7).success);

// 5. ruin should be monotone in spending
const lean = t.simulate(Object.assign({}, S, { spend: 90000 }), 2000, 7).success;
const rich = t.simulate(Object.assign({}, S, { spend: 400000 }), 2000, 7).success;
ok("spending more cannot improve the odds", rich <= lean, rich.toFixed(1) + "% vs " + lean.toFixed(1) + "%");

// 6. flexible spending: cuts only ever reduce withdrawals, so with common
//    random numbers they cannot make any lifetime end poorer
const F = Object.assign({}, S, { flex: true, youRetire: 50, pRetire: 50 });
const rigid = t.simulate(Object.assign({}, F, { flex: false }), 3000, 7), flexed = t.simulate(F, 3000, 7);
let poorer = 0;
for (let i = 0; i < rigid.vals.length; i++) if (flexed.vals[i] < rigid.vals[i] - 1e-6) poorer++;
ok("flexing never leaves a lifetime poorer", poorer === 0, poorer + " path-years poorer");
ok("flexing cannot lower the odds", flexed.success >= rigid.success,
  flexed.success.toFixed(1) + "% vs " + rigid.success.toFixed(1) + "%");
ok("successOnly agrees with simulate under flex",
  Math.abs(t.successOnly(F, 3000, 7) - flexed.success) < 1e-9);
const fan = t.analyse(flexed);
ok("no cut deeper than the setting", fan.flex.deepest[fan.n - 1] <= F.flexCut / 100 + 1e-12,
  (fan.flex.deepest[fan.n - 1] * 100).toFixed(1) + "% max");
ok("some lifetimes cut", fan.flex.ever > 0, fan.flex.ever.toFixed(1) + "% ever cut");
let noCutWorking = true;
for (let y = 0; y < flexed.N; y++) if (!flexed.pre.retired[y] && flexed.cutting[y] > 0) noCutWorking = false;
ok("no cuts before both retire", noCutWorking);

// 7. returns still replay exactly from a flexed trajectory
const fp = t.pickPath("fail", fan), fr = t.pathReturns(flexed, fp), ft = t.pathTrajectory(flexed, fp);
let fport = flexed.pre.startPort, ferr = 0;
for (let y = 0; y < flexed.N; y++) {
  const nf = flexed.pre.net[y] + flexed.cut[y * flexed.nPaths + fp];
  let mid = nf >= 0 ? fport + nf : fport - (-nf) * grossUp;
  if (mid <= 0) mid = 0;
  if (!isFinite(fr[y])) { fport = 0; continue; }
  fport = mid * (1 + fr[y]);
  ferr = Math.max(ferr, Math.abs(fport - ft[y + 1]) / Math.max(1, ft[y + 1]));
}
ok("flexed path returns replay the trajectory", ferr < 1e-12, "max rel. error " + ferr.toExponential(2));

console.log(bad ? "\n" + bad + " check(s) failed" : "\nall checks passed");
process.exit(bad ? 1 : 0);
