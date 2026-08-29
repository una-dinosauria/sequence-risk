// Minimal DOM stub so the artifact's script can be exercised under node.
// The page is a single self-contained HTML file; this extracts its <script>
// block, runs it against fake elements, and exposes the internals for testing.
const fs = require("fs");
const path = require("path");

class El {
  constructor(tag){ this.tagName = tag; this.children = []; this.style = {}; this.dataset = {};
    this.attrs = {}; this.clientWidth = 980; this.offsetWidth = 180; this._html = ""; this._t = ""; }
  setAttribute(k, v){ this.attrs[k] = v; }
  getAttribute(k){ return this.attrs[k]; }
  appendChild(c){ this.children.push(c); return c; }
  insertBefore(c){ this.children.push(c); return c; }
  remove(){}
  addEventListener(){}
  querySelectorAll(){ return []; }
  querySelector(){ return new El("div"); }
  getBoundingClientRect(){ return { left:0, top:0, width:980, height:440 }; }
  closest(){ return null; }
  set innerHTML(v){ this._html = v; }  get innerHTML(){ return this._html; }
  set textContent(v){ this._t = v; }   get textContent(){ return this._t; }
  set htmlFor(v){}                     get htmlFor(){ return ""; }
}

const ids = {};
global.document = {
  getElementById: id => (ids[id] = ids[id] || new El("div")),
  createElement: t => new El(t),
  createElementNS: (ns, t) => new El(t),
  querySelector: () => new El("div"),
  querySelectorAll: () => []
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = { performance: { now: () => Date.now() } };
global.ResizeObserver = undefined;

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1].replace(
  "})();\n",
  "globalThis.__t={simulate,analyse,precompute,afterTaxIncome,mortgageSchedule,logParams," +
  "solveSafeSpend,sensitivity,money,pathTrajectory,pathReturns,pickPath,clamp,get S(){return S}};\n})();\n"
);
eval(src);
module.exports = globalThis.__t;
