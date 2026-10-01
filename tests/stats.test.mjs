// Unit tests for site/assets/js/stats.js. Expected values were computed with scipy and a Python implementation
// that is itself tested against statsmodels (see the Project-2 repository). Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { EXPECTED as E } from "./expected.mjs";

const require = createRequire(import.meta.url);
const S = require("../site/assets/js/stats.js");

const close = (actual, expected, rel = 1e-9, abs = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= Math.max(abs, rel * Math.abs(expected)), `${actual} vs ${expected}`);

test("normal CDF matches scipy across the range, including both tails", () => {
  for (const [x, p] of E.cdf) close(S.normalCdf(x), p, 1e-9, 1e-15);
});

test("normal survival function matches scipy and is accurate far in the tail", () => {
  for (const [x, p] of E.sf) close(S.normalSf(x), p, 1e-9, 1e-300);
});

test("normal quantile matches scipy and inverts the CDF", () => {
  for (const [p, z] of E.ppf) close(S.normalQuantile(p), z, 1e-9, 1e-9);
  for (const p of [0.001, 0.2, 0.7, 0.999]) close(S.normalCdf(S.normalQuantile(p)), p, 1e-9, 1e-12);
  assert.throws(() => S.normalQuantile(0));
  assert.throws(() => S.normalQuantile(1));
});

test("sample size per arm matches the tested Python implementation exactly", () => {
  for (const [p0, mde, alpha, power, n] of E.n) assert.equal(S.sampleSizePerArm(p0, mde, alpha, power), n);
});

test("power matches and rises with sample size", () => {
  for (const [p0, mde, n, alpha, pw] of E.power) close(S.powerForN(p0, mde, n, alpha), pw, 1e-9);
  assert.ok(S.powerForN(0.05, 0.01, 500) < S.powerForN(0.05, 0.01, 5000));
});

test("the planned sample size really delivers the target power", () => {
  for (const [p0, mde] of [[0.05, 0.01], [0.1, 0.02], [0.3, 0.05]]) {
    const n = S.sampleSizePerArm(p0, mde, 0.05, 0.8);
    const pw = S.powerForN(p0, mde, n, 0.05);
    assert.ok(pw >= 0.8 && pw < 0.805, `${pw}`);
  }
});

test("minimum detectable effect matches Python and round-trips through power", () => {
  for (const [p0, n, mde] of E.mde) {
    close(S.minimumDetectableEffect(p0, n), mde, 1e-6);
    close(S.powerForN(p0, mde, n), 0.8, 1e-4);
  }
});

test("two-proportion test matches the Python implementation", () => {
  for (const [xt, nt, xc, nc, diff, rel, z, p, lo, hi] of E.test) {
    const r = S.twoProportionTest(xt, nt, xc, nc);
    close(r.absoluteLift, diff, 1e-12, 1e-15);
    close(r.relativeLift, rel, 1e-12, 1e-15);
    close(r.z, z, 1e-9, 1e-12);
    close(r.pValue, p, 1e-8, 1e-12);
    close(r.ciLow, lo, 1e-9, 1e-12);
    close(r.ciHigh, hi, 1e-9, 1e-12);
  }
});

test("identical groups give z of 0, p of 1 and a symmetric interval", () => {
  const r = S.twoProportionTest(100, 1000, 100, 1000);
  assert.equal(r.z, 0);
  close(r.pValue, 1, 1e-12);
  close(r.ciLow, -r.ciHigh, 1e-12, 1e-15);
});

test("sample ratio mismatch matches scipy's chi-square test", () => {
  for (const [a, b, chi2, p] of E.srm) {
    const r = S.srmCheck(a, b);
    close(r.chi2, chi2, 1e-9, 1e-12);
    close(r.pValue, p, 1e-6, 1e-15);
  }
  assert.equal(S.srmCheck(5000, 5010).ok, true);
  assert.equal(S.srmCheck(5000, 5600).ok, false);
});
