/** Bounded JSON requests. Error metadata never contains bodies or credentials. */
import { setTimeout as sleep } from 'node:timers/promises';

const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const JSON_TYPE = /^application\/(?:[\w.-]+\+)?json$/i;

export class GoogleRequestError extends Error {
  constructor(code, { status = null, contentType = null, attempts = 1 } = {}) {
    super(`${code}${status === null ? '' : ` (HTTP ${status})`}`);
    this.name = 'GoogleRequestError';
    this.code = code;
    this.status = status;
    this.contentType = contentType;
    this.attempts = attempts;
  }
}

function retryAfterMs(value, now) {
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(value)) return Number(value) * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

/**
 * Retry is opt-in: never repeat a configuration write after an uncertain result.
 * The 45-second total budget includes response bodies and Retry-After waits.
 * Dependencies can be supplied for deterministic, network-free failure tests.
 */
export async function requestJson(url, init, {
  retry = false,
  timeoutMs = 15_000,
  budgetMs = 45_000,
  maxAttempts = 3,
  fetchImpl = globalThis.fetch,
  wait = sleep,
  now = Date.now,
  random = Math.random,
} = {}) {
  const deadline = now() + budgetMs;
  const attempts = retry ? maxAttempts : 1;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (lastError && now() >= deadline) throw lastError;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, Math.min(timeoutMs, deadline - now())));
    let error;
    let delay = 0;
    let transient = false;
    let status = null;
    let contentType = null;
    try {
      const res = await fetchImpl(url, { ...init, signal: controller.signal });
      status = res.status;
      // Keep only a MIME type, never arbitrary header text in reports/logs.
      const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      contentType = /^[\w.+-]+\/[\w.+-]+$/.test(type) ? type : 'unknown';
      delay = retryAfterMs(res.headers.get('retry-after'), now());
      if (!res.ok) {
        transient = TRANSIENT_STATUS.has(status);
        await res.body?.cancel().catch(() => {});
        throw new GoogleRequestError('HTTP_ERROR', { status, contentType });
      }
      if (!JSON_TYPE.test(type)) {
        transient = true;
        await res.body?.cancel().catch(() => {});
        throw new GoogleRequestError('NON_JSON_RESPONSE', { status, contentType });
      }
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new GoogleRequestError('INVALID_JSON', { status, contentType }); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new GoogleRequestError('INVALID_JSON_RESPONSE', { status, contentType });
      }
      return data;
    } catch (e) {
      error = e instanceof GoogleRequestError ? e : new GoogleRequestError(
        controller.signal.aborted ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR', { status, contentType });
      error.attempts = attempt;
      transient ||= ['REQUEST_TIMEOUT', 'NETWORK_ERROR', 'INVALID_JSON', 'INVALID_JSON_RESPONSE'].includes(error.code);
    } finally {
      clearTimeout(timer);
    }
    if (!retry || !transient || attempt === attempts) throw error;
    lastError = error;
    delay = Math.max(delay, 1000 * 2 ** (attempt - 1) + Math.floor(random() * 250));
    // Do not retry early when Retry-After exceeds the remaining budget.
    if (now() + delay >= deadline) throw error;
    await wait(delay);
  }
}
