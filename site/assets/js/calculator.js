// A/B test toolkit: sample-size planning and a significance read-out, using Stats (tested against scipy).
(function () {
  var host = document.getElementById("toolkit");
  if (!host || !window.Stats) return;
  var S = window.Stats;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function $(id) { return document.getElementById(id); }
  function num(id) { return Number($(id).value); }
  function fmt(n, d) { return n.toLocaleString(undefined, { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pp(n, d) { return (n >= 0 ? "+" : "−") + Math.abs(n * 100).toFixed(d == null ? 2 : d); }

  function show(kind, message, nodes) {
    var err = host.querySelector('[data-err="' + kind + '"]');
    var out = host.querySelector('[data-result="' + kind + '"]');
    err.textContent = message || "";
    out.textContent = "";
    out.hidden = !!message;
    if (!message) nodes.forEach(function (n) { out.appendChild(n); });
  }

  // ---- Plan a test
  function plan() {
    var p0 = num("p-base") / 100, mde = num("p-mde") / 100, alpha = num("p-alpha"), power = num("p-power"), daily = num("p-daily");
    if (!(p0 > 0 && p0 < 1)) return show("plan", "Baseline conversion rate must be between 0 and 100%.");
    if (!(mde > 0)) return show("plan", "The smallest lift to detect must be above zero.");
    if (p0 + mde >= 1) return show("plan", "Baseline plus lift must stay below 100%.");
    if (!(daily >= 1)) return show("plan", "Eligible visitors per day must be at least 1.");

    var n = S.sampleSizePerArm(p0, mde, alpha, power);
    var days = Math.ceil((2 * n) / daily);
    var weeks = Math.ceil(days / 7);
    var big = el("div", "big", fmt(n));
    big.appendChild(el("small", null, "visitors per arm (" + fmt(2 * n) + " in total)"));
    show("plan", "", [
      big,
      el("p", null, "To detect " + (p0 * 100).toFixed(2) + "% → " + ((p0 + mde) * 100).toFixed(2) + "% (" + pp(mde) + " pp, " + ((mde / p0) * 100).toFixed(1) + "% relative) at " + fmt(alpha * 100) + "% significance and " + fmt(power * 100) + "% power."),
      el("p", "verdict", "At " + fmt(daily) + " visitors a day that takes about " + fmt(days) + " day" + (days === 1 ? "" : "s") + "; run it for " + fmt(weeks) + " full week" + (weeks === 1 ? "" : "s") + " to cover weekday effects."),
    ]);
  }

  // ---- Read a test
  function read() {
    var nc = num("r-nc"), xc = num("r-xc"), nt = num("r-nt"), xt = num("r-xt");
    var ok = [nc, xc, nt, xt].every(function (v) { return isFinite(v) && Math.floor(v) === v; });
    if (!ok) return show("read", "Enter whole numbers in every field.");
    if (nc < 1 || nt < 1) return show("read", "Each group needs at least one visitor.");
    if (xc < 0 || xt < 0) return show("read", "Conversions cannot be negative.");
    if (xc > nc || xt > nt) return show("read", "Conversions cannot exceed visitors.");

    var r = S.twoProportionTest(xt, nt, xc, nc, 0.05);
    var srm = S.srmCheck(nt, nc, 0.5);
    var big = el("div", "big", pp(r.absoluteLift) + " pp");
    big.appendChild(el("small", null, isFinite(r.relativeLift) ? (r.relativeLift >= 0 ? "+" : "−") + Math.abs(r.relativeLift * 100).toFixed(1) + "% relative" : "control rate is zero"));

    var significant = r.pValue < 0.05;
    var verdict = significant
      ? "Statistically significant at 5%: the variant " + (r.absoluteLift > 0 ? "beat" : "lost to") + " the control."
      : "Not significant at 5%: the interval includes zero, so this data cannot tell the variants apart.";
    var nodes = [
      big,
      el("p", null, "Control " + (r.rateControl * 100).toFixed(2) + "% (" + fmt(xc) + " of " + fmt(nc) + "), variant " + (r.rateTreatment * 100).toFixed(2) + "% (" + fmt(xt) + " of " + fmt(nt) + ")."),
      el("p", null, "95% interval for the lift: " + pp(r.ciLow) + " to " + pp(r.ciHigh) + " pp. p-value: " + (r.pValue < 0.0001 ? "< 0.0001" : r.pValue.toFixed(4)) + "."),
      el("p", "verdict", verdict),
      el("p", null, srm.ok
        ? "Split check: fine (p = " + (srm.pValue < 0.0001 ? "< 0.0001" : srm.pValue.toFixed(3)) + ")."
        : "Warning: the split is off the 50/50 plan (p = " + (srm.pValue < 0.0001 ? "< 0.0001" : srm.pValue.toFixed(4)) + "). A sample ratio mismatch means assignment or logging is broken; do not trust this result until it is explained."),
    ];
    show("read", "", nodes);
  }

  ["p-base", "p-mde", "p-alpha", "p-power", "p-daily"].forEach(function (id) { $(id).addEventListener("input", plan); });
  ["r-nc", "r-xc", "r-nt", "r-xt"].forEach(function (id) { $(id).addEventListener("input", read); });

  // Mode tabs
  var tabs = host.querySelectorAll("[data-mode]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        host.querySelector('[data-panel="' + t.getAttribute("data-mode") + '"]').hidden = !on;
      });
    });
  });

  plan();
  read();
})();
