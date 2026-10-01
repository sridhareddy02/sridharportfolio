/* Small statistics library for the A/B test tools: normal distribution, sample size, power and tests.
   Works in the browser (window.Stats) and in Node (require / import) so it can be unit tested. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Stats = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var SQRT_2PI = Math.sqrt(2 * Math.PI);

  function pdf(x) {
    return Math.exp(-0.5 * x * x) / SQRT_2PI;
  }

  // Upper tail Q(x) = P(Z > x) for x >= 0.
  function upperTail(x) {
    if (x < 3) {
      // Phi(x) = 1/2 + pdf(x) * sum_{k>=0} x^(2k+1) / (1*3*5*...*(2k+1))
      var sum = x, term = x, n = 0;
      while (Math.abs(term) > 1e-17 * Math.abs(sum) && n < 500) {
        n += 1;
        term *= (x * x) / (2 * n + 1);
        sum += term;
      }
      return 0.5 - pdf(x) * sum;
    }
    // Continued fraction: Q(x) = pdf(x) / (x + 1/(x + 2/(x + 3/(x + ...))))
    var f = 0;
    for (var k = 300; k >= 1; k--) f = k / (x + f);
    return pdf(x) / (x + f);
  }

  function normalCdf(x) {
    return x >= 0 ? 1 - upperTail(x) : upperTail(-x);
  }

  function normalSf(x) {
    return x >= 0 ? upperTail(x) : 1 - upperTail(-x);
  }

  // Inverse of the normal CDF by bisection on the upper tail (accurate to about 1e-13).
  function normalQuantile(p) {
    if (!(p > 0 && p < 1)) throw new RangeError("p must be between 0 and 1");
    if (p === 0.5) return 0;
    if (p > 0.5) return -normalQuantile(1 - p);
    var lo = 0, hi = 40;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (upperTail(mid) > p) lo = mid;
      else hi = mid;
    }
    return -(lo + hi) / 2;
  }

  // Users needed in each arm to detect an absolute lift `mde` over baseline `p0` (two-sided z test).
  function sampleSizePerArm(p0, mde, alpha, power) {
    alpha = alpha == null ? 0.05 : alpha;
    power = power == null ? 0.8 : power;
    var p1 = p0 + mde, pbar = (p0 + p1) / 2;
    var za = normalQuantile(1 - alpha / 2), zb = normalQuantile(power);
    var num = za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(p0 * (1 - p0) + p1 * (1 - p1));
    return Math.ceil((num * num) / (mde * mde));
  }

  function powerForN(p0, mde, nPerArm, alpha) {
    alpha = alpha == null ? 0.05 : alpha;
    var p1 = p0 + mde;
    var seAlt = Math.sqrt((p0 * (1 - p0)) / nPerArm + (p1 * (1 - p1)) / nPerArm);
    var pbar = (p0 + p1) / 2;
    var seNull = Math.sqrt((2 * pbar * (1 - pbar)) / nPerArm);
    var za = normalQuantile(1 - alpha / 2);
    return normalSf((za * seNull - mde) / seAlt) + normalCdf((-za * seNull - mde) / seAlt);
  }

  // Smallest absolute lift detectable with `nPerArm` users per arm.
  function minimumDetectableEffect(p0, nPerArm, alpha, power) {
    power = power == null ? 0.8 : power;
    var lo = 1e-6, hi = 1 - p0 - 1e-6;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      if (powerForN(p0, mid, nPerArm, alpha) < power) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  // Two-proportion test: pooled standard error for the p-value, unpooled for the interval.
  function twoProportionTest(xT, nT, xC, nC, alpha) {
    alpha = alpha == null ? 0.05 : alpha;
    var pT = xT / nT, pC = xC / nC, diff = pT - pC;
    var pooled = (xT + xC) / (nT + nC);
    var sePooled = Math.sqrt(pooled * (1 - pooled) * (1 / nT + 1 / nC));
    var z = sePooled > 0 ? diff / sePooled : 0;
    var se = Math.sqrt((pT * (1 - pT)) / nT + (pC * (1 - pC)) / nC);
    var crit = normalQuantile(1 - alpha / 2);
    return {
      rateTreatment: pT,
      rateControl: pC,
      absoluteLift: diff,
      relativeLift: pC > 0 ? diff / pC : NaN,
      z: z,
      pValue: 2 * normalSf(Math.abs(z)),
      ciLow: diff - crit * se,
      ciHigh: diff + crit * se,
    };
  }

  // Sample ratio mismatch: chi-square test (1 degree of freedom) of the observed split against the plan.
  function srmCheck(nTreatment, nControl, expectedTreatmentShare) {
    var share = expectedTreatmentShare == null ? 0.5 : expectedTreatmentShare;
    var total = nTreatment + nControl;
    var eT = total * share, eC = total * (1 - share);
    var chi2 = Math.pow(nTreatment - eT, 2) / eT + Math.pow(nControl - eC, 2) / eC;
    var p = 2 * normalSf(Math.sqrt(chi2));
    return { chi2: chi2, pValue: p, ok: p > 0.001 };
  }

  return {
    normalCdf: normalCdf,
    normalSf: normalSf,
    normalQuantile: normalQuantile,
    sampleSizePerArm: sampleSizePerArm,
    powerForN: powerForN,
    minimumDetectableEffect: minimumDetectableEffect,
    twoProportionTest: twoProportionTest,
    srmCheck: srmCheck,
  };
});
