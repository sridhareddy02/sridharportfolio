// Integrity checks for the published page: links resolve, claims stay within what is verified, and the
// numbers quoted for Project-4 match the evaluation report recorded with the demo.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const html = readFileSync(join(root, "index.html"), "utf8");
const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("every local link, script, image and stylesheet exists", () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:|mailto:|#|data:|__BASE_URL__)/.test(u));
  assert.ok(refs.length > 10);
  for (const ref of refs) {
    const path = ref.split(/[?#]/)[0];
    const target = path.endsWith("/") ? join(root, path, "index.html") : join(root, path);
    assert.ok(existsSync(target), `missing ${ref}`);
  }
});

test("every in-page anchor points at an id that exists", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(m[1]), `no element with id ${m[1]}`);
  for (const nav of html.matchAll(/data-nav="([^"]+)"/g)) assert.ok(ids.has(nav[1]), `nav target ${nav[1]} missing`);
});

test("images have alt text and dimensions", () => {
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    assert.match(tag, /\salt="[^"]{10,}"/, tag);
    assert.match(tag, /\swidth="\d+"/, tag);
    assert.match(tag, /\sheight="\d+"/, tag);
  }
});

test("only Procter & Gamble and Aspire TechnoLab appear as employers", () => {
  const orgs = [...html.matchAll(/<p class="org">([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  assert.equal(orgs.length, 3);
  for (const o of orgs) assert.match(o, /Procter|Aspire TechnoLab/);
  for (const banned of [/Heartland/i, /IU Dining/i, /Mercor/i, /Cognizant/i, /Capital One/i, /Knowledge Solutions/i, /\bTCS\b/]) {
    assert.doesNotMatch(text, banned);
  }
});

test("no phone number or street address is published", () => {
  assert.doesNotMatch(text, /\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/);
  assert.doesNotMatch(text, /Western Ave|Washington St|Jersey City|Seattle|\bApt\b/i);
});

test("no unverified tools or methods are claimed", () => {
  const banned = [/Snowflake/i, /Databricks/i, /Looker/i, /\bdbt\b/i, /Alteryx/i, /KNIME/i, /Marketo/i, /Braze/i, /PostHog/i, /Klaviyo/i, /TensorFlow/i,
    /XGBoost/i, /LSTM/i, /Optimizely/i, /Adobe Analytics/i, /Adobe Real-Time/i, /Marketing Mix/i, /\bMMM\b/, /computer vision/i, /HIPAA/i, /\bTableau Server\b/i];
  for (const b of banned) assert.doesNotMatch(text, b, `unverified claim matched ${b}`);
});

test("headline results are limited to the verified outcomes", () => {
  const counts = [...html.matchAll(/data-count="(\d+)"/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
  assert.deepEqual(counts, [18, 25, 28, 50, 65]);
});

test("the four projects link to their repositories", () => {
  for (const n of [1, 2, 3, 4]) assert.match(html, new RegExp(`https://github.com/sridhareddy02/Project-${n}"`));
});

test("the recorded demo is present and includes refusals", () => {
  const answers = JSON.parse(readFileSync(join(root, "copilot", "demo", "answers.json"), "utf8"));
  assert.ok(answers.length >= 20);
  const statuses = new Set(answers.map((a) => a.status));
  for (const s of ["ok", "refused", "clarify"]) assert.ok(statuses.has(s), `no ${s} answer recorded`);
  for (const a of answers.filter((x) => x.status === "ok" && x.plan?.intent !== "definition")) assert.equal(a.grounding.passed, true, a.question);
  assert.ok(existsSync(join(root, "copilot", "index.html")));
});

test("Project-4 numbers on the page match the recorded evaluation", () => {
  const ev = JSON.parse(readFileSync(join(root, "copilot", "demo", "eval.json"), "utf8"));
  assert.equal(ev.numbers.correct, ev.numbers.checked);
  assert.ok(text.includes(`${ev.grounding.numbers_traced} of ${ev.grounding.numbers_checked} numbers in ${ev.grounding.answers} answers`));
  assert.ok(text.includes(`${ev.numbers.correct} of ${ev.numbers.checked} matched an independent oracle`));
  assert.ok(text.includes(`all ${ev.events.length} injected events`));
  assert.equal(ev.events.filter((e) => e.found).length, ev.events.length);
  assert.ok(text.includes("82.5%"));
});

test("simulated work is labelled as simulated", () => {
  assert.match(text, /Nothing on this site is employer or customer data/);
  assert.equal((html.match(/chip lime">Simulated data/g) ?? []).length, 4);
});
