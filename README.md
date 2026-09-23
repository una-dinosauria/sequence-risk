# Sequence Risk

A Monte Carlo retirement simulator for a two-person household, as a single
self-contained HTML file. Move any assumption and 5,000 simulated lifetimes
redraw in about 40 ms.

Open `index.html` in a browser. No build step, no dependencies, no
network calls — the only external request is a Google Fonts stylesheet.

## What it does

Every year of every lifetime gets its own drawn return, so the spread you see is
sequence-of-returns risk rather than an average projection. The page shows:

- a **wealth fan** — 5th/10th/25th/50th/75th/90th/95th percentile bands of liquid
  wealth by age, on a log or linear scale, with the share of scenarios out of
  money on a strip beneath it
- **trace one lifetime** — overlay a single simulated path (earliest ruin, a
  typical failure, bottom tenth, median, lucky, random, or step through by
  outcome) with its own year-by-year returns, which is where you actually see
  whether ruin came from a bad decade or a bad ordering
- **ending-wealth distribution** at the end of the plan
- a **sensitivity tornado** — the shift in survival odds from moving one
  assumption at a time, using common random numbers so the differences measure
  the assumption rather than the noise

## The model

Real (inflation-adjusted) dollars throughout, so nothing needs mental deflating.

- **Returns** are lognormal around the arithmetic mean you enter, at the standard
  deviation you enter. Volatility is converted to the lognormal's log scale, so
  σ means the SD of the return itself. Optional Student-t (ν = 5) shocks for fat
  tails; draws are clipped at ±6σ because `exp(σt)` has no finite mean. Years are
  independent — no momentum, no mean reversion, no regime switching.
- **Tax while working** is federal plus Ontario, including the Ontario surtax,
  the health premium and CPP/EI, on employment income. It ignores RRSP
  deductions and dividend/capital-gains treatment, so take-home is understated
  for anyone contributing to registered accounts.
- **Tax in retirement** is a single blended rate on withdrawals, not an
  account-by-account TFSA/RRSP/taxable model. The crudest number in the model,
  which is why it appears on the tornado.
- **The mortgage** amortizes month by month at one rate to renewal and another
  after. The payment is nominal, so inflation erodes it in real terms — the only
  place inflation is used.
- **CPP and OAS** are indexed and adjusted for starting early or late. OAS is off
  by default, since the recovery tax is likely to claw back most of it at high
  drawdown.
- **Home equity sits outside the portfolio**, because the fan tracks what pays
  the bills. Converting the house to spendable money goes in as a *money in*
  life event.
- **Cash flows move at the start of the year**, returns apply after — mildly
  conservative on withdrawals.

- **Flexible spending** (off by default) lets retirees cut back in bad markets.
  Each lifetime tracks its own market index against its previous high. Once both
  are retired, a fall past the *start* threshold (default 10%) begins trimming
  lifestyle spending. The cut deepens in a straight line to the *deepest cut*
  (default 20%) at the second threshold (default 35%), and eases as the market
  recovers. The mortgage and life events are never cut, and each year's cut is
  set from where the market stood at the start of that year. Because flexing
  inflates the survival odds, the page also reports the price of those odds:
  spending given up, years spent cutting, and the deepest cut. It also draws the
  share of lifetimes cutting beneath the fan.

## Tests

```
node test/model.js    # distributional and invariance checks
node test/smoke.js    # tax, cash-flow plan, and one full run
node test/perf.js     # timings against the interactive budget
```

`test/harness.js` extracts the page's script and runs it against a DOM stub, so
the tests exercise the shipped file rather than a copy.

## Licence

MIT.

## Your own numbers stay yours

The defaults are a generic illustrative household, not anyone's real position.
Edit the sliders and the page remembers your figures in `localStorage`, on your
device only.

**Copy a link holding these numbers** encodes the whole scenario into the URL
fragment (the part after `#`). Browsers never send a fragment to the server, so
such a link is readable only by whoever holds it — bookmark it to keep a
scenario, or send it to a partner or planner. Nothing is uploaded, and the app
makes no network calls of its own.

Not investment, tax or legal advice. Rates and benefit amounts are 2026
approximations and should be checked against actual statements.
