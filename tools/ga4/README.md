# GA4 report reliability

Run the network-free tests with Node 22 (the scheduled runner's version):

```sh
node --test tools/tests/*.test.mjs
```

## Requests

Google responses must have a successful HTTP status and a JSON content type
before parsing. Errors preserve only a code, HTTP status, MIME type and attempt
count; response bodies, tokens and arbitrary remote error messages are excluded.
Report requests use a 15-second timeout including body reads, at most three
attempts and a 45-second total budget. Retries use exponential backoff with jitter
and honor `Retry-After`. If that delay exceeds the remaining budget, the request
fails without an early retry.

Transient HTTP 408/429/500/502/503/504, network errors, timeouts, and invalid
successful JSON responses can be retried for safe reads. The OAuth token exchange,
GETs and Data API `runReport` POSTs are safe to retry. Admin configuration writes
are never automatically retried. Permanent 400/401/403 responses fail immediately.

## Completeness and delivery

Traffic, referral, outcome and hub-outbound queries succeed or fail independently.
A failed section is `null`, not an empty result. A successful empty report remains
zero. Invalid or truncated report responses are unavailable rather than quietly
counted as zero or presented as complete.

Markdown lists all configured sites. Incomplete reports put `INCOMPLETE` and site
coverage in the title/email subject, include section coverage and safe error
details, and label missing values `Unavailable`. JSON adds `status`, `coverage`,
`errors` and `trafficTotals`. Cross-site totals are null when their required
sections are missing. Consumers must handle null values instead of coercing them
to zero. A site is complete only if all its applicable sections succeeded.

CLI exit codes:

- `0`: complete report.
- `2`: incomplete report; requested Markdown/JSON files are still written,
  including when every property or Google authentication failed.
- `1`: fatal setup error, such as missing credentials or invalid configuration;
  no report is guaranteed.

The workflow separates generation, delivery and a final status check. It attempts
to email any generated incomplete report, attempts the weekly report even if the
daily one was incomplete, and then fails the job if a requested report was
incomplete or not delivered. All report files remain in the runner's temporary
directory. Neither real report contents nor report artifacts are published in
this public repository's Actions logs.

The tests use synthetic data and intercepted fetch calls. They never query GA,
edit configuration, send real mail, or require credentials. This change does not
alter event instrumentation, Steam click classification, scheduling, property
IDs, or historical date selection.
