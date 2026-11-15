import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, GoogleRequestError } from '../ga4/http.mjs';
import { api, DATA_API, ADMIN_API } from '../ga4/google.mjs';

const url = `${DATA_API}/properties/123:runReport`;
const html = (status = 503, headers = {}) => new Response('<!DOCTYPE html>PRIVATE_BODY_CANARY', { status, headers: { 'content-type': 'text/html', ...headers } });
function harness(responses) {
  let time = Date.parse('2026-11-15T12:00:00Z'), calls = 0;
  const delays = [];
  return {
    options: {
      retry: true, now: () => time, random: () => 0,
      wait: async (ms) => { delays.push(ms); time += ms; },
      fetchImpl: async () => { const value = responses[Math.min(calls++, responses.length - 1)]; return value(); },
    },
    calls: () => calls, delays,
  };
}

test('HTML 503 is retried and a later JSON response is returned', async () => {
  const h = harness([() => html(), () => Response.json({ rows: [] })]);
  assert.deepEqual(await requestJson(url, {}, h.options), { rows: [] });
  assert.equal(h.calls(), 2);
  assert.deepEqual(h.delays, [1000]);
});

test('persistent HTML failure preserves safe status and bounded attempts', async () => {
  const h = harness([() => html()]);
  await assert.rejects(requestJson(url, {}, h.options), (e) => {
    assert.ok(e instanceof GoogleRequestError);
    assert.equal(e.status, 503); assert.equal(e.contentType, 'text/html'); assert.equal(e.attempts, 3);
    assert.doesNotMatch(e.message + JSON.stringify(e), /PRIVATE_BODY_CANARY|Bearer/);
    return true;
  });
  assert.equal(h.calls(), 3); assert.deepEqual(h.delays, [1000, 2000]);
});

test('permanent 400/401/403 errors are not retried or mistaken for JSON errors', async () => {
  for (const status of [400, 401, 403]) {
    const h = harness([() => html(status)]);
    await assert.rejects(requestJson(url, {}, h.options), (e) => e.status === status && e.code === 'HTTP_ERROR');
    assert.equal(h.calls(), 1); assert.deepEqual(h.delays, []);
  }
});

test('Retry-After seconds and HTTP dates are respected', async () => {
  for (const value of ['7', 'Sun, 15 Nov 2026 12:00:07 GMT']) {
    const h = harness([() => html(429, { 'retry-after': value }), () => Response.json({ ok: true })]);
    await requestJson(url, {}, h.options);
    assert.deepEqual(h.delays, [7000]);
  }
});

test('Retry-After beyond the budget stops instead of retrying early', async () => {
  const h = harness([() => html(429, { 'retry-after': '120' })]);
  await assert.rejects(requestJson(url, {}, h.options), (e) => e.status === 429);
  assert.equal(h.calls(), 1); assert.deepEqual(h.delays, []);
});

test('a delayed retry wait cannot start a request after the total budget expires', async () => {
  let time = 0, calls = 0;
  await assert.rejects(requestJson(url, {}, {
    retry: true, budgetMs: 5000, now: () => time, random: () => 0,
    wait: async () => { time = 5001; },
    fetchImpl: async () => { calls++; return html(); },
  }), (e) => e.status === 503 && e.attempts === 1);
  assert.equal(calls, 1);
});

test('network errors, malformed JSON and HTML 200 recover on safe reads', async () => {
  for (const first of [
    () => { throw new TypeError('PRIVATE_NETWORK_CANARY'); },
    () => new Response('{PRIVATE_JSON_CANARY', { headers: { 'content-type': 'application/json' } }),
    () => html(200),
  ]) {
    const h = harness([first, () => Response.json({ ok: true })]);
    assert.deepEqual(await requestJson(url, {}, h.options), { ok: true });
    assert.equal(h.calls(), 2);
  }
});

test('timeout aborts a stalled request and retries only within the attempt limit', async () => {
  let calls = 0;
  await assert.rejects(requestJson(url, {}, {
    retry: true, timeoutMs: 5, maxAttempts: 2, wait: async () => {},
    fetchImpl: async (_, { signal }) => {
      calls++;
      return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    },
  }), (e) => e.code === 'REQUEST_TIMEOUT' && e.attempts === 2);
  assert.equal(calls, 2);
});

test('timeout includes reading the response body', async () => {
  await assert.rejects(requestJson(url, {}, {
    timeoutMs: 5,
    fetchImpl: async (_, { signal }) => new Response(new ReadableStream({
      start(controller) { signal.addEventListener('abort', () => controller.error(signal.reason), { once: true }); },
    }), { headers: { 'content-type': 'application/json' } }),
  }), (e) => e.code === 'REQUEST_TIMEOUT' && e.status === 200);
});

test('Admin writes are never retried, including when callers request retry', async () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    const h = harness([() => html()]);
    await assert.rejects(api('SYNTHETIC_TOKEN', method, `${ADMIN_API}/properties/123/keyEvents`, {}, h.options));
    assert.equal(h.calls(), 1);
  }
});

test('report POSTs and Admin GETs can recover', async () => {
  for (const [method, target] of [['POST', url], ['GET', `${ADMIN_API}/accountSummaries`]]) {
    const h = harness([() => html(), () => Response.json({ ok: true })]);
    assert.deepEqual(await api('SYNTHETIC_TOKEN', method, target, {}, h.options), { ok: true });
    assert.equal(h.calls(), 2);
  }
});
