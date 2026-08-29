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

console.log(bad ? "\n" + bad + " check(s) failed" : "\nall checks passed");
process.exit(bad ? 1 : 0);
