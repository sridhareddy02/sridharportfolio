# Sridhar Reddy: portfolio

A dashboard-style personal site for a marketing and data analyst. Plain HTML, CSS and JavaScript (no build step), deployed to GitHub Pages by GitHub Actions.

**What is on it**

* A KPI strip built only from verified outcomes: 18% retention, 28% campaign ROI, 65% less manual effort, 25% lead-generation efficiency, 50+ KPIs tracked.
* Experience (tabs with keyboard control), education, skills.
* **A profile section** that pairs each strength (attribution, experimentation, customer analytics, data quality, BI and KPI governance, applied AI) with the work it comes from at P&G, Aspire TechnoLab, FADS and AURA, and with a project you can open. Only verified outcomes are used.
* Six projects. Four are practice projects on simulated data, each in its own repository with tests and stated limitations:
  * [Project-1](https://github.com/sridhareddy02/Project-1): marketing attribution and ROI lab
  * [Project-2](https://github.com/sridhareddy02/Project-2): customer lifecycle and experimentation lab
  * [Project-3](https://github.com/sridhareddy02/Project-3): marketing data pipeline with quality gates
  * [Project-4](https://github.com/sridhareddy02/Project-4): Marketing Copilot, a governed natural-language analytics assistant (FastAPI, SQL, React) whose answers are checked against the data
* **Attribution explorer:** plots real output from Project 1's simulation so a visitor can switch between six attribution models and see how far each lands from the known truth.
* **A/B test toolkit:** plan a test (sample size and duration) or read one (lift, interval, p-value, sample-ratio check). The statistics library (`site/assets/js/stats.js`) is unit tested against scipy reference values.
* **Ask the copilot:** `site/copilot/` is the Project-4 React app built in recorded-demo mode and embedded in the Playground. It replays 25 answers recorded from the real engine (including refusals), so it needs no server.
* Light and dark themes, a side rail on desktop and a bottom tab bar on phones, reduced-motion support, and full content with JavaScript turned off.

## Deploy

1. In the repository go to **Settings > Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/pages.yml` publishes only `site/`, fills in the real site URL, writes `sitemap.xml` and `robots.txt`, and stamps scripts and styles with the commit id so browsers never serve a stale copy.

The site lives at `https://sridhareddy02.github.io/sridharportfolio/`. All links are relative, so it also works at a root domain.

## Edit

* Page: `site/index.html`
* Colours and layout: tokens at the top of `site/assets/css/style.css`
* Contact settings: `site/assets/js/config.js`
* Attribution explorer data: the JSON in `<script id="attribution-data">` in `index.html` (exported from Project 1's `reports/results.json`)

Preview locally: `python3 -m http.server -d site 8000`

## Updating the embedded demo

In the Project-4 repository: `python -m mktg_copilot eval && python -m mktg_copilot export-demo`, then `cd frontend && npm run build:demo`, and copy `frontend/dist-demo/` to `site/copilot/` here. `tests/site.test.mjs` fails if the numbers quoted on the page no longer match the evaluation report shipped with the demo.

## Test

```bash
node --test "tests/*.test.mjs"   # statistics library, plus site integrity: links and anchors, verified-claims-only, no private details, Project-4 numbers match its evaluation
```

Expected values in `tests/expected.mjs` come from scipy and from the Python implementation in Project 2 (itself tested against statsmodels).

## Notes

* Projects marked **Simulated data** use synthetic data with known answers. Nothing on the site is employer or customer data.
* Phone number and street address are deliberately not published.
