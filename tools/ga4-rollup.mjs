#!/usr/bin/env node
/**
 * Cross-site GA4 rollup: elliottelford.com, Parker's Physics,
 * Explore the Universe 2175 and Telford Landscaping in one report.
 *
 * Each site reports into its own GA4 property (tools/ga4-sites.json).
 * This signs in once as a service account and joins them:
 *
 *   1. Outcomes on every site — leads, sign-ups, wishlist clicks — and
 *      how many came from a sibling site
 *   2. Traffic per site against the comparison period
 *   3. Hand-offs: impressions and clicks on elliottelford.com, then
 *      arrivals and outcomes on each project's own property
 *   4. Which placement on elliottelford.com sent them (utm_campaign)
 *   5. The full site-to-site referral matrix
 *
 * Outcomes are counted from each site's "outcomes" list in the config,
 * so they show up whether or not they are marked as key events yet.
 *
 * Node 18+, no npm install. Auth: --key <service-account.json>, or the
 * GA_SERVICE_ACCOUNT_KEY / GOOGLE_APPLICATION_CREDENTIALS env vars. The
 * account needs Viewer on all four properties.
 *
 *   node tools/ga4-rollup.mjs --key ~/.config/ga/ga-reporting.json              # last 28 days
 *   node tools/ga4-rollup.mjs --key ... --days 1 --compare lastweek             # daily
 *   node tools/ga4-rollup.mjs --key ... --days 7 --out rollup.md --json rollup.json
 *   node tools/ga4-rollup.mjs --key ... --discover                              # list properties
 *
 * --compare previous (default) compares with the N days before;
 * --compare lastweek compares with the same days one week earlier, which
 * keeps a daily report from comparing a Sunday with a Saturday.
 * Exit codes: 0 complete, 2 incomplete (report still written), 1 fatal setup error.
 * JSON uses null for unavailable metrics and includes coverage + safe errors.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { die, getToken, listAll, loadAccount, parseArgs } from './ga4/google.mjs';
import { GoogleRequestError } from './ga4/http.mjs';
import { build, failure, siteReport, table, unavailable } from './ga4/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- args */

const args = parseArgs(process.argv.slice(2), {
  defaults: { days: '28', compare: 'previous', config: join(HERE, 'ga4-sites.json'), tz: 'America/Los_Angeles' },
  options: {
    '--key': { name: 'key' },
    '--days': { name: 'days' },
    '--compare': { name: 'compare' },
    '--out': { name: 'out' },
    '--json': { name: 'json' },
    '--config': { name: 'config' },
    '--title': { name: 'title' },
    '--tz': { name: 'tz' },
    '--discover': { name: 'discover', flag: true },
  },
});
if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(0);
}
const DAYS = parseInt(args.days, 10);
if (!(DAYS > 0 && DAYS <= 365)) die('--days must be 1–365');
if (!['previous', 'lastweek'].includes(args.compare)) die('--compare must be previous or lastweek');
if (args.compare === 'lastweek' && DAYS > 7) die('--compare lastweek only works for --days 7 or fewer');

/* ----------------------------------------------------------- periods */

function ranges() {
  const current = { startDate: `${DAYS}daysAgo`, endDate: 'yesterday', name: 'current' };
  const previous = args.compare === 'lastweek'
    ? { startDate: `${DAYS + 7}daysAgo`, endDate: '8daysAgo', name: 'previous' }
    : { startDate: `${DAYS * 2}daysAgo`, endDate: `${DAYS + 1}daysAgo`, name: 'previous' };
  return { current, previous, both: [current, previous] };
}

// Human labels for the periods, in the properties' time zone
function dayLabel(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 864e5);
  return d.toLocaleDateString('en-US', { timeZone: args.tz, weekday: 'short', month: 'short', day: 'numeric' });
}
function periodLabel() {
  const cur = DAYS === 1 ? dayLabel(1) : `${dayLabel(DAYS)} – ${dayLabel(1)}`;
  const prevEnd = args.compare === 'lastweek' ? 8 : DAYS + 1;
  const prevStart = args.compare === 'lastweek' ? DAYS + 7 : DAYS * 2;
  const prev = prevStart === prevEnd ? dayLabel(prevEnd) : `${dayLabel(prevStart)} – ${dayLabel(prevEnd)}`;
  return { cur, prev };
}

/* ----------------------------------------------------- property lookup */

async function listStreams(token) {
  const out = [];
  for (const acct of await listAll(token, '/accountSummaries', 'accountSummaries')) {
    for (const p of acct.propertySummaries || []) {
      for (const st of await listAll(token, `/${p.property}/dataStreams`, 'dataStreams')) {
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
  return out;
}

async function resolveSites(token, sites) {
  let streams = [], discoveryError;
  if (sites.some((s) => !s.propertyId)) {
    try { streams = await listStreams(token); }
    catch (e) { discoveryError = e; }
  }
  return sites.map((s) => {
    if (s.propertyId) return { ...s };
    if (discoveryError) return { ...s, missing: failure(discoveryError, 'property lookup', null) };
    const hit = streams.find((st) =>
      (s.measurementId && st.measurementId === s.measurementId) ||
      (!s.measurementId && st.uri.includes(s.domain)));
    if (!hit) return { ...s, missing: failure(new GoogleRequestError('PROPERTY_NOT_FOUND'), 'property lookup', null) };
    return { ...s, propertyId: hit.property };
  });
}

/* ---------------------------------------------------------------- main */

let config;
if (!args.discover) {
  try { config = JSON.parse(readFileSync(args.config, 'utf8')); }
  catch { die('Cannot read the site configuration.'); }
  if (!Array.isArray(config.sites) || !config.sites.length) die('The site configuration must contain at least one site.');
}
const acct = loadAccount(args.key);
let token, authError;
try { token = await getToken(acct); }
catch (error) { authError = error; }

if (args.discover) {
  if (authError) die(`Google sign-in failed: ${failure(authError, 'authentication', null).code}`);
  const streams = await listStreams(token);
  if (!streams.length) die('The service account cannot see any GA4 properties. Add it as Viewer in Property access management.');
  console.log(table(['Property id', 'Property', 'Account', 'Measurement id', 'URL'], streams.map((s) => [s.property, s.propertyName, s.account, s.measurementId, s.uri])));
  process.exit(0);
}

const sites = authError ? config.sites : await resolveSites(token, config.sites);
const results = {};
await Promise.all(sites.map(async (site) => {
  if (authError || site.missing) {
    results[site.key] = unavailable(site, site.missing || failure(authError, 'authentication', site.propertyId));
  } else {
    results[site.key] = await siteReport(token, site, sites, ranges());
  }
}));

const { md, json } = build(sites, results, {
  days: DAYS, compare: args.compare, period: periodLabel(), title: args.title,
});
if (args.out) writeFileSync(args.out, md);
if (args.json) writeFileSync(args.json, JSON.stringify(json, null, 2));
if (!args.out) console.log(md);
else console.log(`Report written (${json.status}).`);
if (json.status !== 'complete') process.exitCode = 2;
