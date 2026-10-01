# Sridhar Reddy: portfolio

A dashboard-style personal site for a marketing and data analyst. Plain HTML, CSS and JavaScript (no build step), deployed to GitHub Pages by GitHub Actions.

**What is on it**

* A KPI strip built only from verified outcomes: 18% retention, 28% campaign ROI, 65% less manual effort, 25% lead-generation efficiency, 50+ KPIs tracked.
* Experience (tabs with keyboard control), education, skills.
* Five projects. Three are practice projects on simulated data, each in its own repository with tests and stated limitations:
  * [Project-1](https://github.com/sridhareddy02/Project-1): marketing attribution and ROI lab
  * [Project-2](https://github.com/sridhareddy02/Project-2): customer lifecycle and experimentation lab
  * [Project-3](https://github.com/sridhareddy02/Project-3): marketing data pipeline with quality gates
* **Attribution explorer:** plots real output from Project 1's simulation so a visitor can switch between six attribution models and see how far each lands from the known truth.
* **A/B test toolkit:** plan a test (sample size and duration) or read one (lift, interval, p-value, sample-ratio check). The statistics library (`site/assets/js/stats.js`) is unit tested against scipy reference values.
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

## Test

```bash
node --test "tests/*.test.mjs"   # normal CDF and quantile, sample size, power, MDE, z test, sample-ratio check
```

Expected values in `tests/expected.mjs` come from scipy and from the Python implementation in Project 2 (itself tested against statsmodels).

## Notes

* Projects marked **Simulated data** use synthetic data with known answers. Nothing on the site is employer or customer data.
* Phone number and street address are deliberately not published.
