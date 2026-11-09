#!/usr/bin/env node
/**
 * Cross-site GA4 rollup: elliottelford.com, Parker's Physics,
 * Explore the Universe 2175 and Telford Landscaping in one report.
 *
 * Each site reports into its own GA4 property. This signs in once as a
 * service account, finds every property from the measurement ids in
 * tools/ga4-sites.json, and joins them:
 *
 *   1. Per-site traffic, this period vs the one before
 *   2. Hand-offs: clicks out of elliottelford.com (project_click),
 *      sessions that arrived on each project from a sibling site, and
 *      the key events those visitors went on to complete
 *   3. Which placement on elliottelford.com sent them (utm_campaign)
 *   4. The full site-to-site referral matrix
 *
 * No npm install: Node 18+ only (built-in fetch and crypto).
 *
 * Auth, one of:
 *   --key path/to/service-account.json
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
 *   GA_SERVICE_ACCOUNT_KEY='{"client_email":...}'  (raw or base64, as on Vercel)
 * The service account needs Viewer on all four GA4 properties, and the
 * Google Analytics Data API + Admin API enabled in its Cloud project.
 *
 * Usage:
 *   node tools/ga4-rollup.mjs --key ~/keys/ga.json               # last 28 days
 *   node tools/ga4-rollup.mjs --key ~/keys/ga.json --days 7
 *   node tools/ga4-rollup.mjs --key ~/keys/ga.json --out report.md --json report.json
 *   node tools/ga4-rollup.mjs --key ~/keys/ga.json --discover    # list visible properties
 */

import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- args */

function parseArgs(argv) {
  const a = { days: 28, config: join(HERE, 'ga4-sites.json') };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i];
    if (k === '--key') a.key = next();
    else if (k === '--days') a.days = parseInt(next(), 10);
    else if (k === '--out') a.out = next();
    else if (k === '--json') a.json = next();
    else if (k === '--config') a.config = next();
    else if (k === '--discover') a.discover = true;
    else if (k === '-h' || k === '--help') a.help = true;
    else die(`Unknown option ${k}`);
  }
  if (!(a.days > 0 && a.days <= 365)) die('--days must be 1–365');
  return a;
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

/* ---------------------------------------------------------------- auth */

function loadAccount(keyPath) {
  let raw;
  const path = keyPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    try { raw = readFileSync(path.replace(/^~/, process.env.HOME || '~'), 'utf8'); }
    catch (e) { die(`Can't read key file ${path}: ${e.message}`); }
  } else if (process.env.GA_SERVICE_ACCOUNT_KEY) {
    raw = process.env.GA_SERVICE_ACCOUNT_KEY.trim();
    if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
  } else {
    die('No credentials. Pass --key path/to/service-account.json (see the top of this file).');
  }
  let acct;
  try { acct = JSON.parse(raw); } catch { die('The key is not valid JSON.'); }
  if (!acct.client_email || !acct.private_key) die('The key is missing client_email or private_key.');
  acct.private_key = acct.private_key.replace(/\\n/g, '\n');
  return acct;
}

const b64url = (s) => Buffer.from(s).toString('base64url');

async function getToken(acct) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: acct.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
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

async function api(token, method, url, body) {
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

/* ----------------------------------------------------- property lookup */

async function listStreams(token) {
  const out = [];
  let page = '';
  do {
    const d = await api(token, 'GET', `${ADMIN_API}/accountSummaries?pageSize=200${page ? `&pageToken=${page}` : ''}`);
    for (const acct of d.accountSummaries || []) {
      for (const p of acct.propertySummaries || []) {
        const s = await api(token, 'GET', `${ADMIN_API}/${p.property}/dataStreams?pageSize=200`);
        for (const st of s.dataStreams || []) {
          if (!st.webStreamData) continue;
          out.push({
            property: p.property.split('/')[1],
            propertyName: p.displayName,
            account: acct.displayName,
            measurementId: st.webStreamData.measurementId,
            uri: st.webStreamData.defaultUri || '',
          });
        }
      }
    }
    page = d.nextPageToken || '';
  } while (page);
  return out;
}

async function resolveSites(token, sites) {
  const needLookup = sites.some((s) => !s.propertyId);
  const streams = needLookup ? await listStreams(token) : [];
  return sites.map((s) => {
    if (s.propertyId) return s;
    const hit = streams.find((st) =>
      (s.measurementId && st.measurementId === s.measurementId) ||
      (!s.measurementId && st.uri.includes(s.domain)));
    if (!hit) {
      return { ...s, missing: `the service account can't see a GA4 stream for ${s.measurementId || s.domain}. Add it as Viewer on that property.` };
    }
    return { ...s, propertyId: hit.property, measurementId: hit.measurementId };
  });
}

/* ------------------------------------------------------------- reports */

function rows(report) {
  const dims = (report.dimensionHeaders || []).map((h) => h.name);
  const mets = (report.metricHeaders || []).map((h) => h.name);
  return (report.rows || []).map((r) => {
    const o = {};
    dims.forEach((d, i) => { o[d] = r.dimensionValues[i].value; });
    mets.forEach((m, i) => { o[m] = Number(r.metricValues[i].value); });
    return o;
  });
}

function ranges(days) {
  return [
    { startDate: `${days}daysAgo`, endDate: 'yesterday', name: 'current' },
    { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo`, name: 'previous' },
  ];
}

// Matches a session source to a sibling site: "elliottelford.com",
// "www.parkersphysics.com", "exploretheuniverse2175.com / referral"...
function siteForSource(sites, source) {
  const s = (source || '').toLowerCase();
  return sites.find((x) => s.includes(x.match));
}

async function siteReport(token, site, sites, days) {
  const run = (body) => api(token, 'POST', `${DATA_API}/properties/${site.propertyId}:runReport`, body);
  const out = { summary: { current: {}, previous: {} }, inbound: [], outbound: [], errors: [] };

  // 1. Traffic, both periods
  const summaryMetrics = ['activeUsers', 'sessions', 'engagedSessions', 'keyEvents'];
  const sum = rows(await run({
    dateRanges: ranges(days),
    metrics: summaryMetrics.map((name) => ({ name })),
  }));
  for (const r of sum) out.summary[r.dateRange || 'current'] = r;

  // 2. Sessions that arrived from a sibling site, by source + campaign
  const siblingFilter = {
    orGroup: {
      expressions: sites.filter((x) => x.key !== site.key).map((x) => ({
        filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'CONTAINS', value: x.match, caseSensitive: false } },
      })),
    },
  };
  out.inbound = rows(await run({
    dateRanges: [ranges(days)[0]],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionCampaignName' }],
    metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }, { name: 'keyEvents' }, { name: 'activeUsers' }],
    dimensionFilter: siblingFilter,
    limit: 500,
  })).map((r) => ({ ...r, from: siteForSource(sites, r.sessionSource)?.key || r.sessionSource }));

  // 3. On the hub only: clicks out to each project, by placement
  if (site.hub) {
    try {
      out.outbound = rows(await run({
        dateRanges: [ranges(days)[0]],
        dimensions: [{ name: 'eventName' }, { name: 'customEvent:project' }, { name: 'customEvent:placement' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['project_click', 'wishlist_click', 'project_impression'] } } },
        limit: 1000,
      }));
    } catch (e) {
      out.errors.push(`Outbound clicks: ${e.message} (are the "project" and "placement" custom dimensions set up on this property?)`);
    }
  }
  return out;
}

/* ------------------------------------------------------------ assemble */

const fmt = (n) => (n == null || Number.isNaN(n) ? '–' : Math.round(n).toLocaleString('en-US'));
const pct = (n) => (n == null || !Number.isFinite(n) ? '–' : `${(n * 100).toFixed(1)}%`);
function delta(cur, prev) {
  if (!prev) return cur ? 'new' : '–';
  const d = (cur - prev) / prev;
  return `${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%`;
}
function table(head, body) {
  if (!body.length) return '_No data in this period._\n';
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n';
}

function build(sites, results, days) {
  const by = Object.fromEntries(sites.map((s) => [s.key, s]));
  const live = sites.filter((s) => results[s.key]);
  const hub = sites.find((s) => s.hub);
  const md = [];
  const json = { generated: new Date().toISOString(), days, sites: {}, handoffs: [], matrix: [] };

  md.push(`# Cross-site GA4 rollup`);
  md.push(`Last ${days} complete days (to yesterday), compared with the ${days} days before. Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.\n`);

  // Per-site traffic
  md.push(`## Traffic by site`);
  const totals = { current: {}, previous: {} };
  const trafficRows = live.map((s) => {
    const { current: c = {}, previous: p = {} } = results[s.key].summary;
    json.sites[s.key] = { name: s.name, propertyId: s.propertyId, current: c, previous: p };
    for (const k of ['activeUsers', 'sessions', 'engagedSessions', 'keyEvents']) {
      totals.current[k] = (totals.current[k] || 0) + (c[k] || 0);
      totals.previous[k] = (totals.previous[k] || 0) + (p[k] || 0);
    }
    return [s.name, fmt(c.activeUsers), delta(c.activeUsers, p.activeUsers), fmt(c.sessions), delta(c.sessions, p.sessions), pct(c.sessions ? c.engagedSessions / c.sessions : null), fmt(c.keyEvents), delta(c.keyEvents, p.keyEvents)];
  });
  trafficRows.push(['**All sites**', fmt(totals.current.activeUsers), delta(totals.current.activeUsers, totals.previous.activeUsers), fmt(totals.current.sessions), delta(totals.current.sessions, totals.previous.sessions), pct(totals.current.engagedSessions / totals.current.sessions), fmt(totals.current.keyEvents), delta(totals.current.keyEvents, totals.previous.keyEvents)]);
  md.push(table(['Site', 'Users', 'Δ', 'Sessions', 'Δ', 'Engaged', 'Key events', 'Δ'], trafficRows));
  md.push(`_"All sites" users are summed across properties, so one person who visits two sites counts twice._\n`);

  // Hand-offs from the hub
  if (hub && results[hub.key]) {
    md.push(`## Hand-offs from ${hub.name}`);
    const out = results[hub.key].outbound;
    const handRows = [];
    for (const dest of live.filter((s) => !s.hub)) {
      const ev = (name) => out.filter((r) => r.eventName === name && r['customEvent:project'] === dest.key).reduce((a, r) => a + r.eventCount, 0);
      const seen = ev('project_impression');
      const clicks = ev('project_click');
      const arrivals = results[dest.key].inbound.filter((r) => r.from === hub.key);
      const sessions = arrivals.reduce((a, r) => a + r.sessions, 0);
      const engaged = arrivals.reduce((a, r) => a + r.engagedSessions, 0);
      const keyEv = arrivals.reduce((a, r) => a + r.keyEvents, 0);
      json.handoffs.push({ project: dest.key, impressions: seen, clicks, wishlistClicks: ev('wishlist_click'), arrivals: sessions, engagedArrivals: engaged, keyEvents: keyEv });
      handRows.push([dest.name, fmt(seen), fmt(clicks), seen ? pct(clicks / seen) : '–', fmt(sessions), clicks ? pct(sessions / clicks) : '–', fmt(engaged), fmt(keyEv)]);
    }
    md.push(table(['Project', 'Seen', 'Clicks', 'Click rate', 'Arrived', 'Arrival rate', 'Engaged', 'Key events there'], handRows));
    md.push(`- **Seen / Clicks** are measured on ${hub.name} (\`project_impression\` / \`project_click\`). **Arrived** is sessions on the project's own property whose source is ${hub.match}.`);
    md.push(`- Steam wishlists happen on Steam, so ETU's "Key events there" only counts what visitors did on exploretheuniverse2175.com. Wishlist clicks: ${fmt(json.handoffs.find((h) => h.project === 'etu')?.wishlistClicks)}. Actual wishlists are in Steamworks → UTM report.`);
    md.push(`- An arrival rate well under 100% is normal (ad blockers, back-button bounces, consent). A sudden drop usually means a broken link or lost UTM tags.\n`);
    for (const e of results[hub.key].errors) md.push(`> ⚠ ${e}\n`);

    // Which placement sent the traffic
    md.push(`### Which placement sent them`);
    const place = {};
    for (const r of out.filter((r) => r.eventName === 'project_click')) {
      const k = `${r['customEvent:placement']}|${r['customEvent:project']}`;
      place[k] = place[k] || { placement: r['customEvent:placement'], project: r['customEvent:project'], clicks: 0, arrivals: 0, keyEvents: 0 };
      place[k].clicks += r.eventCount;
    }
    for (const dest of live.filter((s) => !s.hub)) {
      for (const r of results[dest.key].inbound.filter((r) => r.from === hub.key)) {
        const campaign = r.sessionCampaignName && !r.sessionCampaignName.startsWith('(') ? r.sessionCampaignName : '(no utm_campaign)';
        const k = `${campaign}|${dest.key}`;
        place[k] = place[k] || { placement: campaign, project: dest.key, clicks: 0, arrivals: 0, keyEvents: 0 };
        place[k].arrivals += r.sessions;
        place[k].keyEvents += r.keyEvents;
      }
    }
    const placeRows = Object.values(place).sort((a, b) => b.clicks + b.arrivals - (a.clicks + a.arrivals));
    json.placements = placeRows;
    md.push(table(['Placement', 'Project', 'Clicks', 'Arrived', 'Key events there'],
      placeRows.map((r) => [`\`${r.placement}\``, by[r.project]?.name || r.project, fmt(r.clicks), fmt(r.arrivals), fmt(r.keyEvents)])));
    md.push(`_Placements match where the link carried utm_campaign (the projects page does; most older links don't yet), so unmatched clicks and arrivals show on separate rows._\n`);
  }

  // Full matrix
  md.push(`## Site-to-site referrals`);
  const mRows = [];
  for (const dest of live) {
    const agg = {};
    for (const r of results[dest.key].inbound) {
      if (r.from === dest.key) continue;
      agg[r.from] = agg[r.from] || { sessions: 0, engaged: 0, keyEvents: 0 };
      agg[r.from].sessions += r.sessions;
      agg[r.from].engaged += r.engagedSessions;
      agg[r.from].keyEvents += r.keyEvents;
    }
    for (const [from, v] of Object.entries(agg)) {
      json.matrix.push({ from, to: dest.key, ...v });
      mRows.push([by[from]?.name || from, dest.name, fmt(v.sessions), pct(v.engaged / v.sessions), fmt(v.keyEvents)]);
    }
  }
  md.push(table(['From', 'To', 'Sessions', 'Engaged', 'Key events'], mRows.sort((a, b) => Number(b[2].replace(/,/g, '')) - Number(a[2].replace(/,/g, '')))));

  const missing = sites.filter((s) => s.missing || s.failed);
  if (missing.length) {
    md.push(`## Not included`);
    for (const s of missing) md.push(`- **${s.name}**: ${s.missing || s.failed}`);
    md.push('');
  }
  return { md: md.join('\n'), json };
}

/* ---------------------------------------------------------------- main */

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(0);
}

const acct = loadAccount(args.key);
const token = await getToken(acct);

if (args.discover) {
  const streams = await listStreams(token);
  if (!streams.length) die(`${acct.client_email} can't see any GA4 properties yet. Add it as Viewer in each property's Admin → Property access management.`);
  console.log(table(['Property id', 'Property', 'Account', 'Measurement id', 'URL'], streams.map((s) => [s.property, s.propertyName, s.account, s.measurementId, s.uri])));
  process.exit(0);
}

let config;
try { config = JSON.parse(readFileSync(args.config, 'utf8')); }
catch (e) { die(`Can't read ${args.config}: ${e.message}`); }

const sites = await resolveSites(token, config.sites);
const results = {};
await Promise.all(sites.filter((s) => !s.missing).map(async (s) => {
  try { results[s.key] = await siteReport(token, s, sites, args.days); }
  catch (e) { s.failed = e.status === 403 ? `no access (${acct.client_email} needs Viewer on property ${s.propertyId})` : e.message; }
}));

const { md, json } = build(sites, results, args.days);
if (args.out) writeFileSync(args.out, md);
if (args.json) writeFileSync(args.json, JSON.stringify(json, null, 2));
if (!args.out) console.log(md);
else console.log(`Wrote ${args.out}${args.json ? ` and ${args.json}` : ''}`);
