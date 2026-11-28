export const sites = [
  { key: 'hub', name: 'Example hub', match: 'hub.example', propertyId: '1', hub: true, outcomes: ['project_click', 'sign_up'] },
  ...['physics', 'game', 'landscaping'].map((key, i) => ({ key, name: key, match: `${key}.example`, propertyId: String(i + 2), outcomes: ['sign_up'] })),
];
export const current = { startDate: '1daysAgo', endDate: 'yesterday', name: 'current' };
export const previous = { startDate: '8daysAgo', endDate: '8daysAgo', name: 'previous' };
export const periods = { current, previous, both: [current, previous] };
export const options = { days: 1, compare: 'lastweek', period: { cur: 'Thu, Nov 12', prev: 'Thu, Nov 5' }, generated: '2026-11-13T14:21:00Z' };

export function response(body, { empty = false } = {}) {
  const dims = [...(body.dimensions || []).map((d) => d.name), ...(body.dateRanges.length > 1 ? ['dateRange'] : [])];
  const metrics = body.metrics.map((m) => m.name);
  const makeRow = (date) => ({
    dimensionValues: dims.map((d) => ({ value: ({ dateRange: date, eventName: 'sign_up', sessionSource: 'hub.example', sessionCampaignName: 'home', sessionSourceMedium: 'hub.example / referral', landingPage: '/article', 'customEvent:project': 'physics', 'customEvent:placement': 'home' })[d] })),
    metricValues: metrics.map((m) => ({ value: String(({ activeUsers: 987, sessions: 1000, engagedSessions: 500, newUsers: 700, screenPageViews: 1500, userEngagementDuration: 32000, eventCount: 321 })[m]) })),
  });
  return { dimensionHeaders: dims.map((name) => ({ name })), metricHeaders: metrics.map((name) => ({ name })),
    rows: empty ? [] : body.dateRanges.map((d) => makeRow(d.name)) };
}
