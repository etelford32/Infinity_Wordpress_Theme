import test from 'node:test';
import assert from 'node:assert/strict';
import { build, failure, siteReport, unavailable } from '../ga4/report.mjs';
import { GoogleRequestError } from '../ga4/http.mjs';
import { sites, periods, options, response } from './fixtures/reports.mjs';

async function collect(request = async (_, __, ___, body) => response(body)) {
  return Object.fromEntries(await Promise.all(sites.map(async (s) => [s.key, await siteReport('SYNTHETIC', s, sites, periods, request)])));
}

test('a successful empty report remains a measured zero', async () => {
  const results = await collect(async (_, __, ___, body) => response(body, { empty: true }));
  const { md, json } = build(sites, results, options);
  assert.equal(json.status, 'complete'); assert.equal(json.headline.outcomes, 0);
  assert.equal(json.coverage.completeSites, 4); assert.equal(json.trafficTotals.current.activeUsers, 0);
  assert.match(md, /\*\*0 outcomes\*\*/); assert.doesNotMatch(md, /\| Unavailable|INCOMPLETE|## Unavailable/);
});

test('three failed properties never become zero outcomes or an all-sites subtotal', async () => {
  const results = await collect(async (_, __, url, body) => {
    if (!url.includes('/1:')) throw new GoogleRequestError('HTTP_ERROR', { status: 503, contentType: 'text/html', attempts: 3 });
    return response(body);
  });
  const { md, json } = build(sites, results, options);
  assert.equal(json.status, 'incomplete'); assert.equal(json.coverage.completeSites, 1);
  assert.equal(json.headline.outcomes, null); assert.equal(json.trafficTotals, null);
  assert.equal(json.sites.hub.current.activeUsers, 987); assert.equal(json.sites.physics.current, null);
  assert.equal(json.outcomes.find((r) => r.site === 'physics').count, null);
  assert.match(md.split('\n')[0], /INCOMPLETE \(1\/4 sites complete\)/);
  assert.match(md, /\| \*\*All sites\*\* \| Unavailable/);
  assert.match(md, /Total outcomes: Unavailable/);
  assert.ok(json.errors.some((e) => e.site === 'physics' && e.stage === 'traffic' && e.status === 503 && e.attempts === 3));
});

test('a failed referral query retains traffic and outcomes and makes arrival rates unavailable', async () => {
  const results = await collect(async (_, __, url, body) => {
    if (url.includes('/2:') && body.dimensions?.[0].name === 'sessionSource') throw new GoogleRequestError('HTTP_ERROR', { status: 403 });
    return response(body);
  });
  const { md, json } = build(sites, results, options);
  assert.equal(json.coverage.completeSites, 3); assert.equal(json.coverage.sections.traffic.available, 4);
  assert.equal(json.sites.physics.current.activeUsers, 987); assert.equal(json.trafficTotals.current.activeUsers, 3948);
  assert.ok(json.headline.outcomes > 0);
  const handoff = json.handoffs.find((r) => r.project === 'physics');
  assert.equal(handoff.arrived, null); assert.equal(handoff.outcomes, 321);
  assert.match(md, /Check the service account/);
  assert.ok(json.matrix.some((r) => r.to === 'physics' && r.sessions === null && r.outcomes === 321));
});

test('failed outcomes preserve referral traffic but do not invent zero conversions', async () => {
  const results = await collect(async (_, __, url, body) => {
    if (url.includes('/2:') && body.dimensions?.[0].name === 'eventName') throw new GoogleRequestError('REQUEST_TIMEOUT');
    return response(body);
  });
  const { json } = build(sites, results, options);
  assert.equal(json.headline.outcomes, null);
  assert.ok(json.matrix.some((r) => r.to === 'physics' && r.sessions === 1000 && r.outcomes === null));
  assert.ok(json.placements.some((r) => r.project === 'physics' && r.arrived === 1000 && r.outcomes === null));
});

test('hub outbound failure is incomplete and does not invent zero clicks or impressions', async () => {
  const results = await collect(async (_, __, ___, body) => {
    if (body.dimensions?.some((d) => d.name === 'customEvent:project')) throw new GoogleRequestError('HTTP_ERROR', { status: 400 });
    return response(body);
  });
  const { md, json } = build(sites, results, options);
  assert.equal(json.status, 'incomplete'); assert.equal(json.coverage.sections.outbound.available, 0);
  assert.equal(json.handoffs[0].clicks, null); assert.equal(json.handoffs[0].impressions, null);
  assert.ok(json.placements.every((r) => r.clicks === null));
  assert.match(md, /INCOMPLETE/);
});

test('all properties unavailable still produce an explicit failure report', () => {
  const results = Object.fromEntries(sites.map((s) => [s.key, unavailable(s, failure(new GoogleRequestError('HTTP_ERROR', { status: 401 }), 'authentication', s.propertyId))]));
  const { md, json } = build(sites, results, options);
  assert.equal(json.coverage.completeSites, 0); assert.equal(json.headline.outcomes, null);
  assert.match(md, /INCOMPLETE \(0\/4 sites complete\)/);
  assert.doesNotMatch(md, /Nothing in this period/);
});

test('malformed or truncated successful responses are unavailable, never empty success', async () => {
  for (const bad of [() => ({}), (body) => ({ ...response(body), rowCount: 99999 }),
    (body) => { const r = response(body); r.rows[0].metricValues[0].value = 'NaN'; return r; }]) {
    const results = await collect(async (_, __, ___, body) => bad(body));
    const { json } = build(sites, results, options);
    assert.equal(json.status, 'incomplete'); assert.equal(json.headline.outcomes, null);
    assert.ok(json.errors.every((e) => ['INVALID_REPORT', 'REPORT_TRUNCATED'].includes(e.code)));
  }
});

test('unexpected error bodies and credential-like messages do not enter reports', async () => {
  const results = await collect(async () => { throw new Error('Bearer PRIVATE_TOKEN_CANARY response PRIVATE_BODY_CANARY'); });
  const output = build(sites, results, options);
  assert.doesNotMatch(JSON.stringify(output), /PRIVATE_|Bearer/);
  assert.ok(output.json.errors.every((e) => e.code === 'QUERY_FAILED'));
});
