/**
 * Shared Google sign-in for the GA4 tools: a service account's JSON key
 * signs a JWT, Google swaps it for an access token. Node 18+, no deps.
 *
 * The key comes from, in order: --key <path>, GOOGLE_APPLICATION_CREDENTIALS
 * (a path), or GA_SERVICE_ACCOUNT_KEY (the JSON itself, raw or base64 —
 * what GitHub Actions and Vercel secrets hold).
 */

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
export const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
export const SCOPE_READ = 'https://www.googleapis.com/auth/analytics.readonly';
export const SCOPE_EDIT = 'https://www.googleapis.com/auth/analytics.edit';

export function die(msg) {
  console.error(msg);
  process.exit(1);
}

export function loadAccount(keyPath) {
  let raw;
  const path = keyPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    try { raw = readFileSync(path.replace(/^~/, process.env.HOME || '~'), 'utf8'); }
    catch (e) { die(`Can't read key file ${path}: ${e.message}`); }
  } else if (process.env.GA_SERVICE_ACCOUNT_KEY) {
    raw = process.env.GA_SERVICE_ACCOUNT_KEY.trim();
    if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
  } else {
    die('No credentials. Pass --key path/to/service-account.json, or set GA_SERVICE_ACCOUNT_KEY.');
  }
  let acct;
  try { acct = JSON.parse(raw); } catch { die('The key is not valid JSON.'); }
  if (!acct.client_email || !acct.private_key) die('The key is missing client_email or private_key.');
  acct.private_key = acct.private_key.replace(/\\n/g, '\n');
  return acct;
}

const b64url = (s) => Buffer.from(s).toString('base64url');

export async function getToken(acct, scope = SCOPE_READ) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: acct.client_email, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${head}.${claims}`);
  const assertion = `${head}.${claims}.${b64url(signer.sign(acct.private_key))}`;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) die(`Google sign-in failed: ${data.error_description || data.error || res.status}`);
  return data.access_token;
}

export async function api(token, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Every page of an Admin API list call. */
export async function listAll(token, path, key) {
  const out = [];
  let page = '';
  do {
    const sep = path.includes('?') ? '&' : '?';
    const d = await api(token, 'GET', `${ADMIN_API}${path}${sep}pageSize=200${page ? `&pageToken=${page}` : ''}`);
    out.push(...(d[key] || []));
    page = d.nextPageToken || '';
  } while (page);
  return out;
}

/** Flags shared by the GA4 tools. */
export function parseArgs(argv, spec) {
  const a = { ...spec.defaults };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '-h' || k === '--help') { a.help = true; continue; }
    const opt = spec.options[k];
    if (!opt) die(`Unknown option ${k} (try --help)`);
    a[opt.name] = opt.flag ? true : argv[++i];
  }
  return a;
}
